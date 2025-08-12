// Service Worker for The Curious Forge Member Engagement App
const CACHE_NAME = 'curious-forge-cache-v2';
const OFFLINE_URL = '/';

// Allow service worker to work in development mode
self.addEventListener('install', (event) => {
	console.log('Service Worker installing...');
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				// Only cache essential files that actually exist
				return cache.addAll([OFFLINE_URL]).catch((error) => {
					console.warn('Failed to cache some resources:', error);
					// Continue installation even if caching fails
				});
			})
			.catch((error) => {
				console.warn('Cache initialization failed:', error);
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
	console.log('[Service Worker] Sync event received with tag:', event.tag);
	if (event.tag === 'sync-pending-actions') {
		console.log('[Service Worker] Background sync triggered for pending actions');
		event.waitUntil(syncPendingActions());
	} else {
		console.log('[Service Worker] Unknown sync tag:', event.tag);
	}
});

// Handle messages from clients
self.addEventListener('message', (event) => {
	console.log('[Service Worker] Message received from client:', event.data);
	if (event.data && event.data.type === 'SYNC_PENDING_ACTIONS') {
		console.log('[Service Worker] Sync message received from client, starting sync...');
		event.waitUntil(syncPendingActions());
	} else {
		console.log('[Service Worker] Unknown message type:', event.data?.type);
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

// Sync lock to prevent concurrent processing
let isSyncing = false;
let syncPromise = null;

// Function to sync pending actions with the server
async function syncPendingActions() {
	try {
		// Check if sync is already in progress
		if (isSyncing) {
			console.log('[Service Worker] Sync already in progress, waiting for completion...');
			if (syncPromise) {
				await syncPromise;
			}
			return;
		}

		// Create a promise for this sync operation
		syncPromise = doSync();
		return await syncPromise;
	} catch (error) {
		console.error('Error in syncPendingActions:', error);
		throw error;
	} finally {
		syncPromise = null;
	}
}

async function doSync() {
	try {
		isSyncing = true;
		console.log('[Service Worker] syncPendingActions() called');

		// Notify client that sync is starting
		self.clients.matchAll().then((clients) => {
			console.log('[Service Worker] Notifying', clients.length, 'clients that sync is starting');
			clients.forEach((client) => {
				client.postMessage({ type: 'SYNC_START' });
			});
		});

		// Open IndexedDB
		console.log('[Service Worker] Opening IndexedDB...');
		const db = await openDatabase();
		console.log('[Service Worker] Database opened successfully');

		// Atomically get and remove all pending actions to prevent duplicate processing
		const pendingActions = await getAndRemoveAllPendingActions(db);
		console.log('[Service Worker] Retrieved and removed pending actions:', pendingActions);

		if (pendingActions.length === 0) {
			console.log('No pending actions to sync');
			// Still notify success even if no actions to sync
			self.clients.matchAll().then((clients) => {
				clients.forEach((client) => {
					client.postMessage({ type: 'SYNC_SUCCESS', actionsProcessed: 0 });
				});
			});
			return;
		}

		console.log(`Syncing ${pendingActions.length} pending actions`);

		let successCount = 0;
		let failureCount = 0;
		const failedActions = [];

		// Process each pending action
		for (const action of pendingActions) {
			try {
				console.log(`[Service Worker] About to process action:`, action);
				await processAction(action);
				successCount++;
				console.log(`Successfully processed ${action.type} action ${action.id}`);
			} catch (error) {
				console.error(`Failed to process action ${action.id}:`, error);
				console.error(`[Service Worker] Action that failed:`, action);
				failureCount++;

				// Increment retry count
				action.retryCount = (action.retryCount || 0) + 1;

				// Only re-add if under max retries
				if (action.retryCount < 3) {
					failedActions.push(action);
				} else {
					console.warn(`Discarding action ${action.id} after ${action.retryCount} failed attempts`);
				}
			}
		}

		// Re-add failed actions that are under the retry limit
		if (failedActions.length > 0) {
			console.log(`Re-adding ${failedActions.length} failed actions for retry`);
			await addPendingActionsBack(db, failedActions);
		}

		console.log(`Sync completed: ${successCount} successful, ${failureCount} failed`);

		// Notify client that sync is complete
		self.clients.matchAll().then((clients) => {
			clients.forEach((client) => {
				client.postMessage({
					type: 'SYNC_SUCCESS',
					actionsProcessed: successCount,
					failures: failureCount
				});
			});
		});
	} catch (error) {
		console.error('Error syncing pending actions:', error);
		// Notify client of sync failure
		self.clients.matchAll().then((clients) => {
			clients.forEach((client) => {
				client.postMessage({
					type: 'SYNC_ERROR',
					error: error.message
				});
			});
		});
	} finally {
		// Always release the sync lock
		isSyncing = false;
		console.log('[Service Worker] Sync lock released');
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

// Helper function to atomically get and remove all pending actions
function getAndRemoveAllPendingActions(db) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction('pendingActions', 'readwrite');
		const store = transaction.objectStore('pendingActions');

		// First get all actions
		const getAllRequest = store.getAll();

		getAllRequest.onsuccess = () => {
			const actions = getAllRequest.result;

			if (actions.length === 0) {
				resolve([]);
				return;
			}

			// Then clear the store in the same transaction
			const clearRequest = store.clear();

			clearRequest.onsuccess = () => {
				console.log(`[Service Worker] Atomically retrieved and removed ${actions.length} actions`);
				resolve(actions);
			};

			clearRequest.onerror = () => reject(clearRequest.error);
		};

		getAllRequest.onerror = () => reject(getAllRequest.error);
	});
}

// Helper function to add failed actions back for retry
function addPendingActionsBack(db, actions) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction('pendingActions', 'readwrite');
		const store = transaction.objectStore('pendingActions');

		let completed = 0;
		let failed = false;

		if (actions.length === 0) {
			resolve();
			return;
		}

		actions.forEach((action) => {
			const request = store.put(action);

			request.onsuccess = () => {
				completed++;
				if (completed === actions.length && !failed) {
					resolve();
				}
			};

			request.onerror = () => {
				if (!failed) {
					failed = true;
					reject(request.error);
				}
			};
		});
	});
}

// Helper function to get all pending actions (kept for compatibility)
function getAllPendingActions(db) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction('pendingActions', 'readonly');
		const store = transaction.objectStore('pendingActions');
		const request = store.getAll();

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

// Helper function to remove a pending action (kept for compatibility)
function removePendingAction(db, id) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction('pendingActions', 'readwrite');
		const store = transaction.objectStore('pendingActions');
		const request = store.delete(id);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

// Helper function to update a pending action (kept for compatibility)
function updatePendingAction(db, action) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction('pendingActions', 'readwrite');
		const store = transaction.objectStore('pendingActions');
		const request = store.put(action);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

// Helper function to process an action
async function processAction(action) {
	let endpoint;
	let method = 'POST';
	let body;

	console.log('[Service Worker] Processing action:', action.type, 'with data:', action.data);

	switch (action.type) {
		case 'signIn':
			endpoint = '/api/signIn';
			body = {
				memberId: action.data.memberId,
				memberTypeId: action.data.memberTypeId
			};
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

	console.log('[Service Worker] Making API call to:', endpoint, 'with body:', body);

	const response = await fetch(endpoint, {
		method,
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	console.log('[Service Worker] API response status:', response.status, response.statusText);

	if (!response.ok) {
		const errorText = await response.text();
		console.error('[Service Worker] API error response:', errorText);
		throw new Error(`Failed to process ${action.type} action: ${response.statusText}`);
	}

	return response.json();
}
