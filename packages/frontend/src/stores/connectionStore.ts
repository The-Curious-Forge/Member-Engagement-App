import { writable, derived } from 'svelte/store';
import { pendingActions } from '../lib/offline';
import { connected } from './socket';
import { browser } from '$app/environment';

// Service Worker types
interface SyncManager {
	register(tag: string): Promise<void>;
	getTags(): Promise<string[]>;
}

export const isOnline = writable(false);
export const isSyncing = writable(false);
export const pendingActionsCount = writable(0);

// Subscribe to socket connection status
if (browser) {
	// Initialize with browser's online status
	isOnline.set(navigator.onLine);

	// Listen for browser online/offline events
	window.addEventListener('online', async () => {
		console.log('[Connection Store] Browser online');
		isOnline.set(true);

		// Check for pending actions and trigger sync if any exist
		const actions = await pendingActions.getAll();
		console.log('[Connection Store] Found', actions.length, 'pending actions:', actions);
		if (actions.length > 0) {
			console.log('[Connection Store] Found pending actions, checking sync capabilities...');
			try {
				const registration = await navigator.serviceWorker.ready;
				const syncManager = (registration as ServiceWorkerRegistration & { sync?: SyncManager })
					.sync;

				// Only manually trigger sync if background sync is NOT supported
				// If background sync is supported, it will be triggered automatically
				if (!syncManager) {
					console.log(
						'[Connection Store] Background sync not supported, manually triggering sync via message'
					);
					if (registration.active) {
						registration.active.postMessage({
							type: 'SYNC_PENDING_ACTIONS'
						});
						console.log('[Connection Store] Manual sync message sent');
					} else {
						console.error('[Connection Store] No active service worker found');
					}
				} else {
					console.log(
						'[Connection Store] Background sync supported, sync will be triggered automatically'
					);
				}
			} catch (error) {
				console.error('[Connection Store] Failed to check sync capabilities:', error);
			}
		}
	});

	window.addEventListener('offline', () => {
		console.log('[Connection Store] Browser offline');
		isOnline.set(false);
		isSyncing.set(false);
	});

	// Subscribe to socket connection
	connected.subscribe((isConnected) => {
		console.log('[Connection Store] Socket connection state:', isConnected);
		// Only update online state if browser is online
		if (navigator.onLine) {
			isOnline.set(isConnected);
		}
		if (!isConnected) {
			console.log('[Connection Store] Socket disconnected, stopping sync');
			isSyncing.set(false);
		}
	});

	// Listen for service worker messages
	navigator.serviceWorker?.addEventListener('message', (event) => {
		console.log('[Connection Store] Service worker message:', event.data);
		if (event.data.type === 'SYNC_SUCCESS') {
			console.log('[Connection Store] Sync completed, processed:', event.data.actionsProcessed);
			checkPendingActions();
			isSyncing.set(false);

			// Trigger data refresh if any actions were processed
			if (event.data.actionsProcessed > 0) {
				console.log('[Connection Store] Triggering data refresh after sync');
				// Import and call syncStores to refresh all data
				import('../stores/appStore').then(({ syncStores }) => {
					syncStores(true); // Force sync to get latest data from server
				});
			}
		} else if (event.data.type === 'SYNC_START') {
			console.log('[Connection Store] Sync started');
			isSyncing.set(true);
		} else if (event.data.type === 'SYNC_ERROR') {
			console.error('[Connection Store] Sync error:', event.data.error);
			isSyncing.set(false);
			checkPendingActions();
		}
	});

	// Debug subscriptions
	isOnline.subscribe((value) => {
		console.log('[Connection Store] Online state:', value);
	});

	isSyncing.subscribe((value) => {
		console.log('[Connection Store] Syncing state:', value);
	});
}

// Listen for sync completion
if (browser) {
	navigator.serviceWorker?.addEventListener('message', (event) => {
		if (event.data.type === 'SYNC_SUCCESS') {
			isSyncing.set(false);
		}
	});
}

// Derived store for connection status message
export const connectionStatus = derived(
	[isOnline, isSyncing, pendingActionsCount],
	([$isOnline, $isSyncing, $pendingActionsCount]) => {
		if (!$isOnline) {
			return {
				message: `Offline (${$pendingActionsCount} pending actions)`,
				type: 'warning'
			};
		}
		if ($isSyncing) {
			return {
				message: 'Syncing...',
				type: 'info'
			};
		}
		return {
			message: 'Online',
			type: 'success'
		};
	}
);

// Check for pending actions
async function checkPendingActions() {
	const actions = await pendingActions.getAll();
	pendingActionsCount.set(actions.length);
}

// Initial check
checkPendingActions();
