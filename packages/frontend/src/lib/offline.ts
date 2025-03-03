// Types for stored data
import type {
	Member,
	Kudos,
	Message,
	Activity,
	SystemAlert,
	AirtableAlert,
	CalendarEvent,
	MonthlyRecognition
} from '../stores/appStore';
import { generateId } from '../utils/idUtils';

// Service Worker types
interface SyncManager {
	register(tag: string): Promise<void>;
	getTags(): Promise<string[]>;
}

interface SignInData {
	memberId: string;
	timestamp: Date;
}

interface SignOutData {
	memberId: string;
	signInRecordId: string;
	activities: Array<{
		id: string;
		hours: number;
		points: number;
	}>;
	totalHours: number;
	totalPoints: number;
	timestamp: Date;
}

interface KudosData {
	from: Array<{ id: string; name: string }>;
	to: Array<{ id: string; name: string }>;
	message: string;
}

interface MessageData {
	member: string[];
	content: string;
	toStaff: boolean;
}

interface PendingAction {
	id: string;
	type: 'signIn' | 'signOut' | 'kudos' | 'message';
	data: SignInData | SignOutData | KudosData | MessageData;
	timestamp: Date;
}

interface StoreMetadata {
	id: string;
	lastUpdated: number;
	version: number;
}

// IndexedDB configuration
const DB_NAME = 'curious-forge-db';
const DB_VERSION = 8; // Increased version for mentors store
export const STORES = {
	members: 'members',
	kudos: 'kudos',
	messages: 'messages',
	pendingActions: 'pendingActions',
	activities: 'activities',
	systemAlerts: 'systemAlerts',
	airtableAlerts: 'airtableAlerts',
	calendar: 'calendar',
	metadata: 'metadata',
	monthlyRecognition: 'monthlyRecognition',
	pastRecognitions: 'pastRecognitions',
	mentors: 'mentors'
} as const;

type StoreNames = (typeof STORES)[keyof typeof STORES];

import { browser } from '$app/environment';

// Cache for database connection
let dbCache: IDBDatabase | null = null;

// Initialize IndexedDB
async function initDB(): Promise<IDBDatabase | null> {
	if (!browser) return null;

	// Return cached connection if available
	if (dbCache) return dbCache;

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			dbCache = request.result;
			resolve(request.result);
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			// Create all object stores
			Object.values(STORES).forEach((storeName) => {
				if (!db.objectStoreNames.contains(storeName)) {
					if (storeName === STORES.metadata) {
						db.createObjectStore(storeName, { keyPath: 'id' });
					} else {
						db.createObjectStore(storeName, { keyPath: 'id' });
					}
				}
			});
		};
	});
}

// Service Worker registration
export async function registerServiceWorker() {
	if ('serviceWorker' in navigator) {
		try {
			const registration = await navigator.serviceWorker.register('/service-worker.js');
			console.log('ServiceWorker registration successful');
			return registration;
		} catch (error) {
			console.error('ServiceWorker registration failed:', error);
			throw error;
		}
	}
	throw new Error('ServiceWorker not supported');
}

type StoredDataType<T extends StoreNames> = T extends 'members'
	? Member
	: T extends 'kudos'
		? Kudos
		: T extends 'messages'
			? Message
			: T extends 'pendingActions'
				? PendingAction
				: T extends 'activities'
					? Activity
					: T extends 'systemAlerts'
						? SystemAlert
						: T extends 'airtableAlerts'
							? AirtableAlert
							: T extends 'calendar'
								? CalendarEvent
								: T extends 'monthlyRecognition'
									? MonthlyRecognition
									: T extends 'pastRecognitions'
										? MonthlyRecognition
										: T extends 'mentors'
											? import('../stores/mentorsStore').Mentor
											: T extends 'metadata'
												? StoreMetadata
												: never;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Database operations
export const offlineStorage = {
	async getMetadata(storeName: StoreNames): Promise<StoreMetadata | null> {
		const db = await initDB();
		if (!db) return null;

		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORES.metadata, 'readonly');
			const store = transaction.objectStore(STORES.metadata);
			const request = store.get(storeName);

			request.onsuccess = () => resolve(request.result || null);
			request.onerror = () => reject(request.error);
		});
	},

	async updateMetadata(storeName: StoreNames) {
		const db = await initDB();
		if (!db) return;

		const metadata: StoreMetadata = {
			id: storeName,
			lastUpdated: Date.now(),
			version: 1
		};

		const transaction = db.transaction(STORES.metadata, 'readwrite');
		const store = transaction.objectStore(STORES.metadata);
		await store.put(metadata);
	},

	async isStale(storeName: StoreNames): Promise<boolean> {
		const metadata = await this.getMetadata(storeName);
		if (!metadata) return true;

		return Date.now() - metadata.lastUpdated > CACHE_TTL;
	},

	async store<T extends StoreNames>(storeName: T, data: StoredDataType<T>) {
		const db = await initDB();
		if (!db) return null;

		return new Promise((resolve, reject) => {
			const transaction = db.transaction(storeName, 'readwrite');
			const store = transaction.objectStore(storeName);
			const request = store.put(data);

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	},

	async get<T extends StoreNames>(
		storeName: T,
		id: string
	): Promise<StoredDataType<T> | undefined | null> {
		const db = await initDB();
		if (!db) return null;

		return new Promise((resolve, reject) => {
			const transaction = db.transaction(storeName, 'readonly');
			const store = transaction.objectStore(storeName);
			const request = store.get(id);

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	},

	async getAll<T extends StoreNames>(storeName: T): Promise<StoredDataType<T>[]> {
		const db = await initDB();
		if (!db) return [];

		return new Promise((resolve, reject) => {
			const transaction = db.transaction(storeName, 'readonly');
			const store = transaction.objectStore(storeName);
			const request = store.getAll();

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	},

	async delete(storeName: StoreNames, id: string) {
		const db = await initDB();
		if (!db) return null;

		return new Promise((resolve, reject) => {
			const transaction = db.transaction(storeName, 'readwrite');
			const store = transaction.objectStore(storeName);
			const request = store.delete(id);

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	},

	async clear(storeName: StoreNames) {
		const db = await initDB();
		if (!db) return null;

		return new Promise((resolve, reject) => {
			const transaction = db.transaction(storeName, 'readwrite');
			const store = transaction.objectStore(storeName);
			const request = store.clear();

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}
};

// Pending actions management
export const pendingActions = {
	async add(action: Omit<PendingAction, 'id' | 'timestamp'>) {
		const pendingAction: PendingAction = {
			...action,
			id: generateId(),
			timestamp: new Date()
		};
		await offlineStorage.store(STORES.pendingActions, pendingAction);

		// Request background sync
		try {
			const registration = await navigator.serviceWorker.ready;
			const syncManager = (registration as ServiceWorkerRegistration & { sync?: SyncManager }).sync;

			if (syncManager) {
				await syncManager.register('sync-pending-actions');
			} else {
				// Fallback for browsers that don't support background sync
				const handleOnline = async () => {
					const pendingActions = await offlineStorage.getAll(STORES.pendingActions);
					if (pendingActions.length > 0) {
						// Send message to service worker to sync
						registration.active?.postMessage({
							type: 'SYNC_PENDING_ACTIONS'
						});
					}
				};

				window.addEventListener('online', handleOnline);

				// Also try to sync immediately if we're already online
				if (navigator.onLine) {
					handleOnline();
				}
			}
		} catch (error) {
			console.error('Failed to register sync:', error);
		}

		return pendingAction;
	},

	async getAll() {
		return offlineStorage.getAll(STORES.pendingActions);
	},

	async remove(id: string) {
		return offlineStorage.delete(STORES.pendingActions, id);
	},

	async clear() {
		return offlineStorage.clear(STORES.pendingActions);
	}
};

export type { PendingAction, SignInData, SignOutData, KudosData, MessageData, StoreMetadata };
