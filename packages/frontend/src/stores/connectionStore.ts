import { writable, derived } from 'svelte/store';
import { pendingActions } from '../lib/offline';
import { connected } from './socket';
import { browser } from '$app/environment';

export const isOnline = writable(false);
export const isSyncing = writable(false);
export const pendingActionsCount = writable(0);

// Subscribe to socket connection status
if (browser) {
	// Initialize with browser's online status
	isOnline.set(navigator.onLine);

	// Listen for browser online/offline events
	window.addEventListener('online', () => {
		console.log('[Connection Store] Browser online');
		isOnline.set(true);
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
			console.log('[Connection Store] Sync completed');
			checkPendingActions();
			isSyncing.set(false);
		} else if (event.data.type === 'SYNC_START') {
			console.log('[Connection Store] Sync started');
			isSyncing.set(true);
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
