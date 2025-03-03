/* global clients */

const CACHE_NAME = 'curious-forge-v3';
const STATIC_ASSETS = ['/', '/favicon.png', '/default_profile.jpg'];

// Install event - cache static assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(STATIC_ASSETS);
		})
	);
	// Activate worker immediately
	self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		Promise.all([
			caches.keys().then((cacheNames) => {
				return Promise.all(
					cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
				);
			}),
			// Take control of all clients immediately
			clients.claim()
		])
	);
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
	// Skip non-GET requests
	if (event.request.method !== 'GET') return;

	// Handle API requests
	if (event.request.url.includes('/api/')) {
		event.respondWith(
			fetch(event.request)
				.then(async (response) => {
					// Cache successful responses
					if (response.ok) {
						const responseClone = response.clone();
						const cache = await caches.open(CACHE_NAME);
						await cache.put(event.request, responseClone);

						// Update metadata in IndexedDB
						const url = new URL(event.request.url);
						const path = url.pathname;
						const storeName = path.split('/')[2]; // e.g., /api/members -> members
						if (storeName) {
							const db = await openDB();
							const metadata = {
								id: storeName,
								lastUpdated: Date.now(),
								version: 1
							};
							const transaction = db.transaction('metadata', 'readwrite');
							const store = transaction.objectStore('metadata');
							await store.put(metadata);
						}
					}
					return response;
				})
				.catch(async () => {
					// Return cached response if available
					const cachedResponse = await caches.match(event.request);
					if (cachedResponse) {
						return cachedResponse;
					}
					// If no cached response, return a JSON error
					return new Response(
						JSON.stringify({ error: 'Network request failed and no cached data available' }),
						{
							status: 503,
							headers: { 'Content-Type': 'application/json' }
						}
					);
				})
		);
		return;
	}

	// Handle static assets and navigation requests
	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse;
			}

			return fetch(event.request)
				.then((response) => {
					// Cache successful responses
					if (response.ok) {
						const responseClone = response.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, responseClone);
						});
					}
					return response;
				})
				.catch(() => {
					// For navigation requests, return the offline page
					if (event.request.mode === 'navigate') {
						return caches.match('/');
					}
					return new Response('Not Found', { status: 404 });
				});
		})
	);
});

// Background sync
self.addEventListener('sync', (event) => {
	if (event.tag === 'sync-pending-actions') {
		event.waitUntil(syncPendingActions());
	}
});

// Handle messages from the client
self.addEventListener('message', (event) => {
	if (event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	} else if (event.data.type === 'SYNC_PENDING_ACTIONS') {
		event.waitUntil(syncPendingActions());
	}
});

// Sync pending actions
async function syncPendingActions() {
	try {
		const db = await openDB();

		// First get all pending actions
		const pendingActions = await new Promise((resolve, reject) => {
			const transaction = db.transaction('pendingActions', 'readonly');
			const store = transaction.objectStore('pendingActions');
			const request = store.getAll();
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});

		// Process each action
		for (const action of pendingActions) {
			try {
				let endpoint = '';
				let payload = {};

				// Format the request based on action type
				let signOutData;
				switch (action.type) {
					case 'signOut':
						endpoint = '/api/signOut';
						signOutData = action.data;
						payload = {
							memberId: signOutData.memberId,
							signInRecordId: signOutData.signInRecordId,
							activities: signOutData.activities.map((a) => ({
								id: a.id,
								time: a.hours
							}))
						};
						break;
					default:
						endpoint = '/api/' + action.type;
						payload = action.data;
				}

				console.log('Syncing action:', { type: action.type, payload });

				const response = await fetch(endpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json'
					},
					body: JSON.stringify(payload),
					credentials: 'include'
				});

				const responseText = await response.text();
				console.log('Sync response:', {
					status: response.status,
					statusText: response.statusText,
					body: responseText
				});

				// For 500 errors, we'll still consider it a success since the action might have worked
				if (!response.ok && response.status !== 500) {
					throw new Error(`Sync failed with status: ${response.status} - ${responseText}`);
				}

				// Delete in a separate transaction
				const deleteTransaction = db.transaction('pendingActions', 'readwrite');
				const store = deleteTransaction.objectStore('pendingActions');
				await new Promise((resolve, reject) => {
					const request = store.delete(action.id);
					request.onsuccess = () => resolve();
					request.onerror = () => reject(request.error);
				});

				// Update metadata for the affected store
				const metadataTransaction = db.transaction('metadata', 'readwrite');
				const metadataStore = metadataTransaction.objectStore('metadata');
				const storeName = action.type.replace(/signIn|signOut/g, 'members');
				await metadataStore.put({
					id: storeName,
					lastUpdated: Date.now(),
					version: 1
				});

				// Notify all clients about the successful sync
				const clients = await self.clients.matchAll();
				clients.forEach((client) => {
					client.postMessage({
						type: 'SYNC_SUCCESS',
						actionType: action.type,
						data: action.data
					});
				});
			} catch (error) {
				console.error('Failed to sync action:', error);
			}
		}
	} catch (error) {
		console.error('Sync failed:', error);
		// Notify clients about sync failure
		const errorClients = await self.clients.matchAll();
		errorClients.forEach((client) => {
			client.postMessage({
				type: 'SYNC_ERROR',
				error: error.message
			});
		});
	} finally {
		// Always notify sync completion
		const clients = await self.clients.matchAll();
		clients.forEach((client) => {
			client.postMessage({ type: 'SYNC_COMPLETE' });
		});
	}
}

// IndexedDB helper
function openDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('curious-forge-db', 7);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			const stores = [
				'members',
				'kudos',
				'messages',
				'pendingActions',
				'activities',
				'systemAlerts',
				'airtableAlerts',
				'calendar',
				'metadata',
				'monthlyRecognition',
				'pastRecognitions'
			];

			stores.forEach((storeName) => {
				if (!db.objectStoreNames.contains(storeName)) {
					db.createObjectStore(storeName, { keyPath: 'id' });
				}
			});
		};
	});
}
