import {
	memberActions,
	systemAlertActions,
	syncStores,
	members,
	type Member
} from '../stores/appStore';
import { socket } from '../stores/socket';
import { pendingActions, type PendingAction, offlineStorage, STORES } from '../lib/offline';
import { isSyncing, pendingActionsCount } from '../stores/connectionStore';

// Extract MemberType from Member interface
type MemberType = Member['currentMemberType'];

// Interface for socket sign-in update data
interface SignInUpdateData {
	id: string;
	signInRecordId?: string;
	signInTime?: string;
	currentMemberType?: MemberType;
	currentArea?: string;
}

export async function signIn(memberId: string, memberTypeId: string) {
	try {
		// Update UI immediately
		memberActions.signIn(memberId);

		// Try to make the API call
		try {
			if (!navigator.onLine) {
				console.log('[Sign In] Detected offline, will queue action');
				throw new TypeError('Offline');
			}

			isSyncing.set(true);
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

			return true;
		} catch (apiError) {
			// If offline or API error, queue the action
			console.log('[Sign In] Caught error:', apiError, 'navigator.onLine:', navigator.onLine);
			if (!navigator.onLine || apiError instanceof TypeError) {
				console.log('[Sign In] Queuing offline action for member:', memberId);
				const action: Omit<PendingAction, 'id' | 'timestamp'> = {
					type: 'signIn' as const,
					data: {
						memberId,
						memberTypeId,
						timestamp: new Date()
					}
				};

				console.log('[Sign In] Action to queue:', action);
				await pendingActions.add(action);
				const allPending = await pendingActions.getAll();
				console.log('[Sign In] Total pending actions:', allPending.length, allPending);
				pendingActionsCount.set(allPending.length);

				systemAlertActions.add(
					'info',
					'You are offline. Sign in will be processed when connection is restored.'
				);

				return true;
			}

			// If it's not an offline error, rethrow
			throw apiError;
		} finally {
			isSyncing.set(false);
		}
	} catch (error) {
		console.error('Sign in error:', error);
		systemAlertActions.add(
			'error',
			error instanceof Error ? error.message : 'Failed to sign in. Please try again.'
		);

		// Revert UI state on error
		await syncStores();
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
				console.log('[Sign Out] Detected offline, will queue action');
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
			console.log('[Sign Out] Caught error:', apiError, 'navigator.onLine:', navigator.onLine);
			if (!navigator.onLine || apiError instanceof TypeError) {
				console.log('[Sign Out] Queuing offline action for member:', memberId);
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

				console.log('[Sign Out] Action to queue:', action);
				await pendingActions.add(action);
				const allPending = await pendingActions.getAll();
				console.log('[Sign Out] Total pending actions:', allPending.length, allPending);
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
		// Handle sign-in updates - receive full member object with signInRecordId
		socketInstance.on('signInUpdate', (memberData: SignInUpdateData) => {
			console.log('[Socket] Sign-in update received:', memberData);
			// Update member store with full sign-in data
			members.update((currentMembers) => {
				const updatedMembers = currentMembers.map((m) =>
					m.id === memberData.id
						? {
								...m,
								isActive: true,
								signInTime: memberData.signInTime ? new Date(memberData.signInTime) : new Date(),
								signInRecordId: memberData.signInRecordId,
								currentMemberType: memberData.currentMemberType,
								currentArea: memberData.currentArea
							}
						: m
				);
				// Update IndexedDB for the specific member
				for (const member of updatedMembers) {
					if (member.id === memberData.id) {
						offlineStorage.store(STORES.members, member).catch(console.error);
						break;
					}
				}
				return updatedMembers;
			});
		});

		// Handle sign-out updates
		socketInstance.on('signOutUpdate', (data: { signInRecordId: string; memberId: string }) => {
			console.log('[Socket] Sign-out update received:', data);
			memberActions.signOut(data.memberId);
		});
	}
});
