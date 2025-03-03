import { memberActions, systemAlertActions, syncStores } from '../stores/appStore';
import { socket } from '../stores/socket';
import { pendingActions, type PendingAction } from '../lib/offline';
import { isSyncing, pendingActionsCount } from '../stores/connectionStore';

export async function signIn(memberId: string, memberTypeId: string) {
	try {
		const response = await fetch('/api/signIn', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				memberId,
				memberTypeId
			})
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || 'Failed to sign in');
		}

		// Store update will happen via socket event
		return true;
	} catch (error) {
		console.error('Sign in error:', error);
		systemAlertActions.add(
			'error',
			error instanceof Error ? error.message : 'Failed to sign in. Please try again.'
		);
		return false;
	}
}

export async function signOut(
	memberId: string,
	signInRecordId: string,
	activities: Array<{ id: string; time: number }>
) {
	try {
		// Update UI immediately
		memberActions.signOut(memberId);

		// Try to make the API call
		try {
			if (!navigator.onLine) {
				throw new TypeError('Offline');
			}

			isSyncing.set(true);
			const response = await fetch('/api/signOut', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					signInRecordId,
					activities,
					memberId
				})
			});

			if (!response.ok) {
				throw new Error('Failed to sign out');
			}

			return true;
		} catch (apiError) {
			// If offline or API error, queue the action
			if (!navigator.onLine || apiError instanceof TypeError) {
				const action: Omit<PendingAction, 'id' | 'timestamp'> = {
					type: 'signOut' as const,
					data: {
						memberId,
						signInRecordId,
						activities: activities.map((a) => ({
							id: a.id,
							hours: a.time,
							points: 0 // Points will be calculated server-side
						})),
						totalHours: activities.reduce((sum, a) => sum + a.time, 0),
						totalPoints: 0, // Points will be calculated server-side
						timestamp: new Date()
					}
				};

				await pendingActions.add(action);
				const allPending = await pendingActions.getAll();
				pendingActionsCount.set(allPending.length);

				systemAlertActions.add(
					'info',
					'You are offline. Sign out will be processed when connection is restored.'
				);

				return true;
			}

			// If it's not an offline error, rethrow
			throw apiError;
		} finally {
			isSyncing.set(false);
		}
	} catch (error) {
		console.error('Sign out error:', error);
		systemAlertActions.add(
			'error',
			error instanceof Error ? error.message : 'Failed to sign out. Please try again.'
		);

		// Revert UI state on error
		await syncStores();
		return false;
	}
}

// Set up socket event handlers
socket.subscribe((socketInstance) => {
	if (socketInstance) {
		// Handle sign-in updates
		socketInstance.on('signInUpdate', (data: { id: string }) => {
			memberActions.signIn(data.id);
		});

		// Handle sign-out updates
		socketInstance.on('signOutUpdate', (data: { signInRecordId: string; memberId: string }) => {
			memberActions.signOut(data.memberId);
		});
	}
});
