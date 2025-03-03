import { writable, derived, type Writable } from 'svelte/store';
import { offlineStorage, STORES } from '../lib/offline';

// Types
interface MemberType {
	id: string;
	group: string;
	sortingOrder: number;
}

export interface Activity {
	id: string;
	activity: string;
}

export interface Member {
	id: string;
	name: string;
	memberTypes: MemberType[];
	currentMemberType?: MemberType;
	totalHours: number;
	totalPoints: number;
	weeklyStreak: number;
	forgeLevel: string;
	memberBio: string;
	headshot: string;
	topActivities: string[];
	isActive: boolean;
	signInTime?: Date;
	currentArea?: string;
	messages: Message[];
	kudosGiven: Kudos[];
	kudosReceived: Kudos[];
	signInRecordId?: string;
}

export interface MonthlyRecognition {
	id: string;
	month: string;
	memberOfTheMonth: {
		id: string;
		name: string;
		headshot: string;
	};
	recognitionReason: string;
	projectOfTheMonth: string;
	projectDescription: string;
	projectPhotos: string[];
	projectMembers: Array<{
		id: string;
		name: string;
		headshot: string;
	}>;
}

export interface Kudos {
	id: string;
	from: Array<{ id: string; name: string }>;
	to: Array<{ id: string; name: string }>;
	message: string;
	date: string;
}

export interface Message {
	id: string;
	member: string[];
	content: string;
	timestamp: Date;
	messageDate: string;
	toStaff: boolean;
	read: boolean;
	important: boolean;
	attachment?: string;
	qrLink?: string;
}

export interface SystemAlert {
	id: string;
	type: 'info' | 'success' | 'warning' | 'error';
	message: string;
	timestamp: Date;
}

export interface AirtableAlert {
	id: string;
	type: 'info' | 'warning';
	content: string;
	message?: string; // For backward compatibility
	timestamp: Date;
	expirationDate: Date | null;
	attachment?: string;
	qrLink?: string;
}

interface GoogleCalendarEvent {
	id?: string;
	summary?: string;
	description?: string;
	start: {
		dateTime?: string;
		date?: string;
	};
	end: {
		dateTime?: string;
		date?: string;
	};
}

export interface CalendarEvent {
	id: string;
	summary: string;
	description?: string;
	start: {
		dateTime?: string;
		date?: string;
	};
	end: {
		dateTime?: string;
		date?: string;
	};
}

// Create stores
export const calendarEvents: Writable<CalendarEvent[]> = writable([]);
export const members: Writable<Member[]> = writable([]);
export const kudos: Writable<Kudos[]> = writable([]);
export const messages: Writable<Message[]> = writable([]);
export const systemAlerts: Writable<SystemAlert[]> = writable([]);
export const airtableAlerts: Writable<AirtableAlert[]> = writable([]);
export const activities: Writable<Activity[]> = writable([]);
export const monthlyRecognition: Writable<MonthlyRecognition | null> = writable(null);
export const pastMonthlyRecognitions: Writable<MonthlyRecognition[]> = writable([]);
export const mentors: Writable<import('./mentorsStore').Mentor[]> = writable([]);

// Derived stores
export const activeMembers = derived(members, ($members) => $members.filter((m) => m.isActive));
export const activeMemberCount = derived(activeMembers, ($activeMembers) => $activeMembers.length);
export const activeAirtableAlerts = derived(airtableAlerts, ($alerts) => {
	const now = new Date();
	return $alerts
		.filter((alert) => !alert.expirationDate || new Date(alert.expirationDate) > now)
		.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
});

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response, errorMessage: string): Promise<T> {
	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: errorMessage }));
		throw new Error(error.message || errorMessage);
	}
	return response.json();
}

// Helper function to handle errors
function handleError(error: unknown, defaultMessage: string): string {
	if (error instanceof Error) {
		return error.message;
	}
	return defaultMessage;
}

// API sync functions
async function fetchAllMembers(forceSync = false) {
	try {
		// Check if we should use cached data
		if (!forceSync && (!navigator.onLine || !(await offlineStorage.isStale(STORES.members)))) {
			console.log('Using cached member data...');
			const cachedMembers = await offlineStorage.getAll(STORES.members);
			if (cachedMembers.length > 0) {
				members.set(cachedMembers);
				return cachedMembers;
			}
		}

		if (navigator.onLine) {
			console.log(forceSync ? 'Force syncing members from API...' : 'Fetching members from API...');
			const response = await fetch('/api/members/allData');
			const memberData = await handleApiResponse<Member[]>(response, 'Failed to fetch members');
			console.log('Received members:', memberData.length);

			// Transform data to match our interface
			const transformedMembers = memberData.map((member) => ({
				...member,
				messages: member.messages || [],
				kudosGiven: member.kudosGiven || [],
				kudosReceived: member.kudosReceived || [],
				isActive: false, // Default to not active
				signInTime: member.signInTime ? new Date(member.signInTime) : undefined,
				topActivities: Array.isArray(member.topActivities) ? member.topActivities : [],
				memberTypes: Array.isArray(member.memberTypes) ? member.memberTypes : []
			}));

			// Store in IndexedDB and update metadata
			await Promise.all([
				...transformedMembers.map((member) => offlineStorage.store(STORES.members, member)),
				offlineStorage.updateMetadata(STORES.members)
			]);

			console.log('Transformed members:', transformedMembers.length);
			members.set(transformedMembers);

			// Now fetch active members to update their status
			await updateActiveMembers();

			return transformedMembers;
		}
		throw new Error('No cached member data available and offline');
	} catch (error: unknown) {
		const message = handleError(error, 'Failed to fetch member data');
		console.error('Error fetching members:', message);
		systemAlertActions.add('error', message);
		return [];
	}
}

async function updateActiveMembers() {
	try {
		if (navigator.onLine) {
			console.log('Fetching active members from API...');
			const response = await fetch('/api/members/signedInMembers');
			const data = await handleApiResponse<{ signedInMembers: Member[] }>(
				response,
				'Failed to fetch active members'
			);
			console.log('Received active members:', data.signedInMembers.length);

			// Update the active status and current info for signed-in members
			members.update((currentMembers) => {
				const updatedMembers = currentMembers.map((member) => {
					const activeMember = data.signedInMembers.find((m) => m.id === member.id);
					if (activeMember) {
						const updatedMember = {
							...member,
							isActive: true,
							signInTime: activeMember.signInTime ? new Date(activeMember.signInTime) : undefined,
							currentArea: activeMember.currentArea,
							currentMemberType: activeMember.currentMemberType,
							signInRecordId: activeMember.signInRecordId
						};
						// Update in IndexedDB
						offlineStorage.store(STORES.members, updatedMember).catch(console.error);
						return updatedMember;
					}
					// If member is not in active list, ensure they're marked inactive
					const inactiveMember = { ...member, isActive: false };
					offlineStorage.store(STORES.members, inactiveMember).catch(console.error);
					return inactiveMember;
				});
				return updatedMembers;
			});
		} else {
			console.log('Offline: Using cached member status...');
			// When offline, rely on the cached member data which includes active status
			const cachedMembers = await offlineStorage.getAll(STORES.members);
			if (cachedMembers.length > 0) {
				members.set(cachedMembers);
			}
		}
	} catch (error: unknown) {
		const message = handleError(error, 'Failed to fetch active member data');
		console.error('Error fetching active members:', message);
		systemAlertActions.add('error', message);
	}
}

async function fetchKudos(forceSync = false) {
	try {
		// Check if we should use cached data
		if (!forceSync && (!navigator.onLine || !(await offlineStorage.isStale(STORES.kudos)))) {
			console.log('Using cached kudos data...');
			const cachedKudos = await offlineStorage.getAll(STORES.kudos);
			if (cachedKudos.length > 0) {
				kudos.set(cachedKudos);
				return cachedKudos;
			}
		}

		if (navigator.onLine) {
			console.log(forceSync ? 'Force syncing kudos from API...' : 'Fetching kudos from API...');
			const response = await fetch('/api/kudos');
			const data = await handleApiResponse<{ kudos: Kudos[] }>(response, 'Failed to fetch kudos');
			console.log('Received kudos:', data.kudos.length);

			// Store in IndexedDB and update metadata
			await Promise.all([
				...data.kudos.map((k) => offlineStorage.store(STORES.kudos, k)),
				offlineStorage.updateMetadata(STORES.kudos)
			]);

			kudos.set(data.kudos);
			return data.kudos;
		}
		throw new Error('No cached kudos data available and offline');
	} catch (error: unknown) {
		const message = handleError(error, 'Failed to fetch kudos data');
		console.error('Error fetching kudos:', message);
		systemAlertActions.add('error', message);
		return [];
	}
}

async function fetchCalendarEvents(forceSync = false) {
	try {
		// Check if we should use cached data
		if (!forceSync && (!navigator.onLine || !(await offlineStorage.isStale(STORES.calendar)))) {
			console.log('Using cached calendar events...');
			const cachedEvents = await offlineStorage.getAll(STORES.calendar);
			if (cachedEvents.length > 0) {
				calendarEvents.set(cachedEvents);
				return cachedEvents;
			}
		}

		if (navigator.onLine) {
			console.log('Fetching calendar events from API...');
			const response = await fetch('/api/calendar/events');
			const data = await handleApiResponse<{ events: GoogleCalendarEvent[] }>(
				response,
				'Failed to fetch calendar events'
			);
			console.log('Received calendar events:', data.events.length);

			// Transform events to ensure they have required fields
			const transformedEvents: CalendarEvent[] = data.events
				.filter((event) => event.id && event.summary)
				.map((event) => ({
					id: event.id!,
					summary: event.summary!,
					description: event.description,
					start: event.start,
					end: event.end
				}));

			// Store in IndexedDB and update metadata
			await Promise.all([
				...transformedEvents.map((event) => offlineStorage.store(STORES.calendar, event)),
				offlineStorage.updateMetadata(STORES.calendar)
			]);

			calendarEvents.set(transformedEvents);
			return transformedEvents;
		}
		throw new Error('No cached calendar events available and offline');
	} catch (error: unknown) {
		const message = handleError(error, 'Failed to fetch calendar events');
		console.error('Error fetching calendar events:', message);
		systemAlertActions.add('error', message);
		return [];
	}
}

async function fetchAlerts(forceSync = false) {
	try {
		// Check if we should use cached data
		if (
			!forceSync &&
			(!navigator.onLine ||
				!(await offlineStorage.isStale(STORES.airtableAlerts)) ||
				!(await offlineStorage.isStale(STORES.systemAlerts)))
		) {
			console.log('Using cached alerts data...');
			const cachedAirtableAlerts = await offlineStorage.getAll(STORES.airtableAlerts);
			const cachedSystemAlerts = await offlineStorage.getAll(STORES.systemAlerts);
			if (cachedAirtableAlerts.length > 0) {
				airtableAlerts.set(cachedAirtableAlerts);
			}
			if (cachedSystemAlerts.length > 0) {
				systemAlerts.set(cachedSystemAlerts);
			}
			return { airtableAlerts: cachedAirtableAlerts, systemAlerts: cachedSystemAlerts };
		}

		if (navigator.onLine) {
			console.log('Fetching alerts from API...');
			const response = await fetch('/api/alerts');
			const data = await handleApiResponse<{
				alerts: Array<{
					id: string;
					type: 'info' | 'success' | 'warning' | 'error';
					content: string;
					messageDate: string;
					expirationDate: string | null;
					source: 'airtable' | 'system';
					attachment?: string;
					qrLink?: string;
				}>;
			}>(response, 'Failed to fetch alerts');
			console.log('Received alerts:', data.alerts.length);

			// Separate alerts by source
			const airtableAlertsData = data.alerts
				.filter((alert) => alert.source === 'airtable')
				.map((alert) => ({
					id: alert.id,
					type: alert.type as AirtableAlert['type'],
					content: alert.content,
					timestamp: new Date(alert.messageDate),
					expirationDate: alert.expirationDate ? new Date(alert.expirationDate) : null,
					attachment: alert.attachment,
					qrLink: alert.qrLink
				}));

			const systemAlertsData = data.alerts
				.filter((alert) => alert.source === 'system')
				.map((alert) => ({
					id: alert.id,
					type: alert.type as SystemAlert['type'],
					message: alert.content,
					timestamp: new Date(alert.messageDate)
				}));

			// Store in IndexedDB and update metadata
			await Promise.all([
				...airtableAlertsData.map((alert) => offlineStorage.store(STORES.airtableAlerts, alert)),
				...systemAlertsData.map((alert) => offlineStorage.store(STORES.systemAlerts, alert)),
				offlineStorage.updateMetadata(STORES.airtableAlerts),
				offlineStorage.updateMetadata(STORES.systemAlerts)
			]);

			airtableAlerts.set(airtableAlertsData);
			systemAlerts.set(systemAlertsData);
			return { airtableAlerts: airtableAlertsData, systemAlerts: systemAlertsData };
		}
		throw new Error('No cached alerts data available and offline');
	} catch (error: unknown) {
		const message = handleError(error, 'Failed to fetch alerts data');
		console.error('Error fetching alerts:', message);
		systemAlertActions.add('error', message);
		return { airtableAlerts: [], systemAlerts: [] };
	}
}

async function fetchMessages(forceSync = false) {
	try {
		// Check if we should use cached data
		if (!forceSync && (!navigator.onLine || !(await offlineStorage.isStale(STORES.messages)))) {
			console.log('Using cached messages data...');
			const cachedMessages = await offlineStorage.getAll(STORES.messages);
			if (cachedMessages.length > 0) {
				messages.set(cachedMessages);
				return cachedMessages;
			}
		}

		if (navigator.onLine) {
			console.log(
				forceSync ? 'Force syncing messages from API...' : 'Fetching messages from API...'
			);
			const response = await fetch('/api/messages');
			const data = await handleApiResponse<{ messages: Message[] }>(
				response,
				'Failed to fetch messages'
			);
			console.log('Received messages:', data.messages.length);

			// Store in IndexedDB and update metadata
			await Promise.all([
				...data.messages.map((m) => offlineStorage.store(STORES.messages, m)),
				offlineStorage.updateMetadata(STORES.messages)
			]);

			messages.set(data.messages);
			return data.messages;
		}
		throw new Error('No cached messages data available and offline');
	} catch (error: unknown) {
		const message = handleError(error, 'Failed to fetch messages data');
		console.error('Error fetching messages:', message);
		systemAlertActions.add('error', message);
		return [];
	}
}

async function fetchPastMonthlyRecognitions(forceSync = false) {
	try {
		if (
			!forceSync &&
			(!navigator.onLine || !(await offlineStorage.isStale(STORES.pastRecognitions)))
		) {
			console.log('Using cached past recognition data...');
			const cachedRecognitions = await offlineStorage.getAll(STORES.pastRecognitions);
			if (cachedRecognitions.length > 0) {
				pastMonthlyRecognitions.set(cachedRecognitions);
				return cachedRecognitions;
			}
		}

		if (navigator.onLine) {
			console.log('Fetching past monthly recognitions from API...');
			const recognitions: MonthlyRecognition[] = [];
			const now = new Date();
			const maxMonths = 36; // Look back up to 3 years
			let consecutiveEmptyMonths = 0;

			for (let i = 0; i < maxMonths && consecutiveEmptyMonths < 3; i++) {
				const currentDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
				const month = currentDate.toISOString().slice(0, 7);
				console.log('Fetching recognition for month:', month);

				try {
					const response = await fetch(`/api/members/monthlyRecognition/${month}`);
					const data = await handleApiResponse<MonthlyRecognition[]>(
						response,
						'Failed to fetch recognition'
					);

					if (data && data.length > 0) {
						recognitions.push(data[0]);
						consecutiveEmptyMonths = 0;
					} else {
						consecutiveEmptyMonths++;
					}
				} catch (error) {
					console.error('Error fetching recognition for month:', month, error);
					break;
				}
			}

			// Sort recognitions by date (newest first)
			recognitions.sort((a, b) => {
				const [yearA, monthA] = a.month.split('-').map(Number);
				const [yearB, monthB] = b.month.split('-').map(Number);
				return yearB !== yearA ? yearB - yearA : monthB - monthA;
			});

			// Store in IndexedDB and update metadata
			await Promise.all([
				...recognitions.map((r) => offlineStorage.store(STORES.pastRecognitions, r)),
				offlineStorage.updateMetadata(STORES.pastRecognitions)
			]);

			pastMonthlyRecognitions.set(recognitions);
			return recognitions;
		}
		throw new Error('No past recognition data available and offline');
	} catch (error: unknown) {
		const message = handleError(error, 'Failed to fetch past recognition data');
		console.error('Error fetching past recognitions:', message);
		systemAlertActions.add('error', message);
		return [];
	}
}

async function fetchMonthlyRecognition(forceSync = false) {
	try {
		// Check if we should use cached data
		if (
			!forceSync &&
			(!navigator.onLine || !(await offlineStorage.isStale(STORES.monthlyRecognition)))
		) {
			console.log('Using cached monthly recognition data...');
			const cachedRecognition = await offlineStorage.getAll(STORES.monthlyRecognition);
			if (cachedRecognition.length > 0) {
				monthlyRecognition.set(cachedRecognition[0]);
				return cachedRecognition[0];
			}
		}

		if (navigator.onLine) {
			console.log('Fetching monthly recognition from API...');
			const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
			const response = await fetch(`/api/members/monthlyRecognition/${currentMonth}`);
			console.log(
				'Fetching monthly recognition from:',
				`/api/members/monthlyRecognition/${currentMonth}`
			);
			const data = await handleApiResponse<MonthlyRecognition[]>(
				response,
				'Failed to fetch monthly recognition'
			);

			if (data && data.length > 0) {
				const recognition = data[0];
				// Store in IndexedDB and update metadata
				await Promise.all([
					offlineStorage.store(STORES.monthlyRecognition, recognition),
					offlineStorage.updateMetadata(STORES.monthlyRecognition)
				]);

				monthlyRecognition.set(recognition);
				return recognition;
			}
			monthlyRecognition.set(null);
			return null;
		}
		throw new Error('No monthly recognition data available and offline');
	} catch (error: unknown) {
		const message = handleError(error, 'Failed to fetch monthly recognition data');
		console.error('Error fetching monthly recognition:', message);
		systemAlertActions.add('error', message);
		return null;
	}
}

async function fetchMentors(forceSync = false) {
	try {
		// Check if we should use cached data
		if (!forceSync && (!navigator.onLine || !(await offlineStorage.isStale(STORES.mentors)))) {
			console.log('Using cached mentors data...');
			const cachedMentors = await offlineStorage.getAll(STORES.mentors);
			if (cachedMentors.length > 0) {
				mentors.set(cachedMentors);
				return cachedMentors;
			}
		}

		if (navigator.onLine) {
			console.log(forceSync ? 'Force syncing mentors from API...' : 'Fetching mentors from API...');
			const response = await fetch('/api/mentors');
			const data = await handleApiResponse<import('./mentorsStore').Mentor[]>(
				response,
				'Failed to fetch mentors'
			);
			console.log('Received mentors:', data.length);

			// Store in IndexedDB and update metadata
			await Promise.all([
				...data.map((m) => offlineStorage.store(STORES.mentors, m)),
				offlineStorage.updateMetadata(STORES.mentors)
			]);

			mentors.set(data);
			return data;
		}
		throw new Error('No cached mentors data available and offline');
	} catch (error: unknown) {
		const message = handleError(error, 'Failed to fetch mentors data');
		console.error('Error fetching mentors:', message);
		systemAlertActions.add('error', message);
		return [];
	}
}

async function fetchActivities(forceSync = false) {
	try {
		// Check if we should use cached data
		if (!forceSync && (!navigator.onLine || !(await offlineStorage.isStale(STORES.activities)))) {
			console.log('Using cached activities data...');
			const cachedActivities = await offlineStorage.getAll(STORES.activities);
			if (cachedActivities.length > 0) {
				activities.set(cachedActivities);
				return cachedActivities;
			}
		}

		if (navigator.onLine) {
			console.log('Fetching activities from API...');
			const response = await fetch('/api/activities');
			const data = await handleApiResponse<{ activities: Activity[] }>(
				response,
				'Failed to fetch activities'
			);
			console.log('Received activities:', data.activities.length);

			// Store in IndexedDB and update metadata
			await Promise.all([
				...data.activities.map((a) => offlineStorage.store(STORES.activities, a)),
				offlineStorage.updateMetadata(STORES.activities)
			]);

			activities.set(data.activities);
			return data.activities;
		}
		throw new Error('No cached activities data available and offline');
	} catch (error: unknown) {
		const message = handleError(error, 'Failed to fetch activities data');
		console.error('Error fetching activities:', message);
		systemAlertActions.add('error', message);
		return [];
	}
}

// Store actions
const memberActions = {
	signIn: async (memberId: string) => {
		members.update((currentMembers) => {
			const updatedMembers = currentMembers.map((m) =>
				m.id === memberId
					? {
							...m,
							isActive: true,
							signInTime: new Date()
						}
					: m
			);
			// Update IndexedDB
			const updatedMember = updatedMembers.find((m) => m.id === memberId);
			if (updatedMember) {
				offlineStorage.store(STORES.members, updatedMember).catch(console.error);
			}
			return updatedMembers;
		});
	},

	signOut: async (memberId: string) => {
		members.update((currentMembers) => {
			const updatedMembers = currentMembers.map((m) =>
				m.id === memberId
					? {
							...m,
							isActive: false,
							signInTime: undefined,
							currentArea: undefined,
							currentMemberType: undefined
						}
					: m
			);
			// Update IndexedDB
			const updatedMember = updatedMembers.find((m) => m.id === memberId);
			if (updatedMember) {
				offlineStorage.store(STORES.members, updatedMember).catch(console.error);
			}
			return updatedMembers;
		});
	},

	updateArea: async (memberId: string, area: string) => {
		members.update((currentMembers) => {
			const updatedMembers = currentMembers.map((m) =>
				m.id === memberId ? { ...m, currentArea: area } : m
			);
			// Update IndexedDB
			const updatedMember = updatedMembers.find((m) => m.id === memberId);
			if (updatedMember) {
				offlineStorage.store(STORES.members, updatedMember).catch(console.error);
			}
			return updatedMembers;
		});
	}
};

const kudosActions = {
	add: async (newKudos: Omit<Kudos, 'id' | 'date'>) => {
		const kudosEntry = {
			...newKudos,
			id: crypto.randomUUID(),
			date: new Date().toISOString()
		};
		kudos.update((k) => [kudosEntry, ...k]);
		// Update IndexedDB
		await offlineStorage.store(STORES.kudos, kudosEntry);
	}
};

const messageActions = {
	send: async (newMessage: Omit<Message, 'id' | 'timestamp'>) => {
		const messageEntry = {
			...newMessage,
			id: crypto.randomUUID(),
			timestamp: new Date()
		};
		messages.update((m) => [messageEntry, ...m]);
		// Update IndexedDB
		await offlineStorage.store(STORES.messages, messageEntry);
	},

	markAsRead: async (messageId: string, messageData: Message) => {
		// Convert ISO string timestamp to Date object
		const processedMessage = {
			...messageData,
			timestamp: new Date(messageData.timestamp),
			read: true
		};

		console.log('Marking message as read:', processedMessage);

		// Update messages store
		messages.update((currentMessages) => {
			const updatedMessages = currentMessages.map((msg) =>
				msg.id === messageId ? processedMessage : msg
			);
			// Update IndexedDB
			const updatedMessage = updatedMessages.find((m) => m.id === messageId);
			if (updatedMessage) {
				offlineStorage.store(STORES.messages, updatedMessage).catch(console.error);
			}
			return updatedMessages;
		});

		// Update members store
		members.update((currentMembers) => {
			const updatedMembers = currentMembers.map((member) => {
				if (!member.messages.some((msg) => msg.id === messageId)) {
					return member;
				}

				const updatedMessages = member.messages.map((msg) =>
					msg.id === messageId ? processedMessage : msg
				);

				// Sort messages: unread first, then by timestamp
				const sortedMessages = [...updatedMessages].sort((a, b) => {
					if (!a.read && b.read) return -1;
					if (a.read && !b.read) return 1;
					return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
				});

				const updatedMember = {
					...member,
					messages: sortedMessages
				};

				// Update IndexedDB
				offlineStorage.store(STORES.members, updatedMember).catch(console.error);

				return updatedMember;
			});
			return updatedMembers;
		});
	}
};

const systemAlertActions = {
	add: async (type: SystemAlert['type'], message: string) => {
		const newAlert = {
			id: crypto.randomUUID(),
			type,
			message,
			timestamp: new Date()
		};
		systemAlerts.update((a) => [newAlert, ...a]);
		// Update IndexedDB
		await offlineStorage.store(STORES.systemAlerts, newAlert);
	},

	remove: async (id: string) => {
		systemAlerts.update((a) => {
			const filteredAlerts = a.filter((alert) => alert.id !== id);
			// Update IndexedDB
			offlineStorage.delete(STORES.systemAlerts, id).catch(console.error);
			return filteredAlerts;
		});
	},

	clear: async () => {
		systemAlerts.set([]);
		// Clear alerts in IndexedDB
		await offlineStorage.clear(STORES.systemAlerts);
	}
};

const airtableAlertActions = {
	add: async (type: AirtableAlert['type'], content: string, expirationDate: Date | null = null) => {
		const newAlert = {
			id: crypto.randomUUID(),
			type,
			content,
			timestamp: new Date(),
			expirationDate
		};
		airtableAlerts.update((a) => [newAlert, ...a]);
		// Update IndexedDB
		await offlineStorage.store(STORES.airtableAlerts, newAlert);
	},

	remove: async (id: string) => {
		airtableAlerts.update((a) => {
			const filteredAlerts = a.filter((alert) => alert.id !== id);
			// Update IndexedDB
			offlineStorage.delete(STORES.airtableAlerts, id).catch(console.error);
			return filteredAlerts;
		});
	},

	clear: async () => {
		airtableAlerts.set([]);
		// Clear alerts in IndexedDB
		await offlineStorage.clear(STORES.airtableAlerts);
	}
};

// Sync function
async function syncStores(forceSync = false) {
	console.log('Starting store sync...');

	// Override cache check if force sync
	if (forceSync) {
		console.log('Force sync requested - bypassing cache check');
		await Promise.all([
			offlineStorage.updateMetadata(STORES.members),
			offlineStorage.updateMetadata(STORES.kudos),
			offlineStorage.updateMetadata(STORES.messages),
			offlineStorage.updateMetadata(STORES.activities),
			offlineStorage.updateMetadata(STORES.systemAlerts),
			offlineStorage.updateMetadata(STORES.airtableAlerts),
			offlineStorage.updateMetadata(STORES.calendar),
			offlineStorage.updateMetadata(STORES.pastRecognitions),
			offlineStorage.updateMetadata(STORES.mentors)
		]);
	}
	const results = await Promise.allSettled([
		fetchAllMembers(forceSync),
		fetchKudos(forceSync),
		fetchMessages(forceSync),
		fetchActivities(forceSync),
		fetchAlerts(forceSync),
		fetchCalendarEvents(forceSync),
		fetchMonthlyRecognition(forceSync),
		fetchPastMonthlyRecognitions(forceSync),
		fetchMentors(forceSync)
	]);

	// Log results
	results.forEach((result, index) => {
		const operation = [
			'members',
			'kudos',
			'messages',
			'activities',
			'alerts',
			'calendar',
			'monthly recognition',
			'past recognition',
			'mentors'
		][index];
		if (result.status === 'fulfilled') {
			console.log(`Successfully synced ${operation}`);
		} else {
			console.error(`Failed to sync ${operation}:`, result.reason);
		}
	});

	console.log('Store sync complete');
}

// Export functions and actions
export {
	syncStores,
	fetchCalendarEvents,
	fetchMonthlyRecognition,
	fetchPastMonthlyRecognitions,
	fetchMentors,
	memberActions,
	kudosActions,
	messageActions,
	systemAlertActions,
	airtableAlertActions
};
