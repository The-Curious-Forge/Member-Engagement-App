// Service Worker for The Curious Forge Member Engagement App
const CACHE_NAME = 'curious-forge-cache-v1';
const OFFLINE_URL = '/';

// Allow service worker to work in development mode
self.addEventListener('install', (event) => {
	console.log('Service Worker installing...');
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll([OFFLINE_URL, '/favicon.png', '/default_profile.jpg']);
		})
	);
});

self.addEventListener('activate', (event) => {
	console.log('Service Worker activating...');
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
			);
		})
	);
});

// Handle background sync
self.addEventListener('sync', (event) => {
	if (event.tag === 'sync-pending-actions') {
		console.log('Background sync triggered');
		event.waitUntil(syncPendingActions());
	}
});

// Handle messages from clients
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SYNC_PENDING_ACTIONS') {
		console.log('Sync message received from client');
		event.waitUntil(syncPendingActions());
	}
});

// Network-first strategy for API requests
self.addEventListener('fetch', (event) => {
	// Skip cross-origin requests
	if (!event.request.url.startsWith(self.location.origin)) {
		return;
	}

	// Handle API requests
	if (event.request.url.includes('/api/')) {
		event.respondWith(
			fetch(event.request)
				.then((response) => {
					// Clone the response to store in cache
					const responseToCache = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseToCache);
					});
					return response;
				})
				.catch(() => {
					// If network fails, try to serve from cache
					return caches.match(event.request);
				})
		);
		return;
	}

	// For non-API requests, try cache first, then network
	event.respondWith(
		caches
			.match(event.request)
			.then((response) => {
				return (
					response ||
					fetch(event.request).then((fetchResponse) => {
						// Clone the response before using it
						const responseToCache = fetchResponse.clone();
						// Store in cache
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, responseToCache);
						});
						return fetchResponse;
					})
				);
			})
			.catch(() => {
				// If both cache and network fail, show offline page
				if (event.request.mode === 'navigate') {
					return caches.match(OFFLINE_URL);
				}
				return null;
			})
	);
});

// Function to sync pending actions with the server
async function syncPendingActions() {
	try {
		// Open IndexedDB
		const db = await openDatabase();
		const pendingActions = await getAllPendingActions(db);

		if (pendingActions.length === 0) {
			console.log('No pending actions to sync');
			return;
		}

		console.log(`Syncing ${pendingActions.length} pending actions`);

		// Process each pending action
		for (const action of pendingActions) {
			try {
				await processAction(action);
				await removePendingAction(db, action.id);
			} catch (error) {
				console.error(`Failed to process action ${action.id}:`, error);
			}
		}
	} catch (error) {
		console.error('Error syncing pending actions:', error);
	}
}

// Helper function to open IndexedDB
function openDatabase() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('curious-forge-db', 8);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			if (!db.objectStoreNames.contains('pendingActions')) {
				db.createObjectStore('pendingActions', { keyPath: 'id' });
			}
		};
	});
}

// Helper function to get all pending actions
function getAllPendingActions(db) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction('pendingActions', 'readonly');
		const store = transaction.objectStore('pendingActions');
		const request = store.getAll();

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

// Helper function to remove a pending action
function removePendingAction(db, id) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction('pendingActions', 'readwrite');
		const store = transaction.objectStore('pendingActions');
		const request = store.delete(id);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

// Helper function to process an action
async function processAction(action) {
	let endpoint;
	let method = 'POST';
	let body;

	switch (action.type) {
		case 'signIn':
			endpoint = '/api/signIn';
			body = { memberId: action.data.memberId };
			break;
		case 'signOut':
			endpoint = '/api/signOut';
			body = action.data;
			break;
		case 'kudos':
			endpoint = '/api/kudos';
			body = action.data;
			break;
		case 'message':
			endpoint = '/api/messages';
			body = action.data;
			break;
		default:
			throw new Error(`Unknown action type: ${action.type}`);
	}

	const response = await fetch(endpoint, {
		method,
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		throw new Error(`Failed to process ${action.type} action: ${response.statusText}`);
	}

	return response.json();
}
