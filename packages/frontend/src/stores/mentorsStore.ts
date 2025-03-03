import { writable } from 'svelte/store';

export interface Mentor {
	id: string;
	mentorId: string;
	name: string;
	headshot: string;
	expertise: string;
	available: boolean;
	email: string;
	phone: string;
}

function createMentorsStore() {
	const { subscribe, set } = writable<Mentor[]>([]);

	return {
		subscribe,

		// Fetch all mentors from the API
		async fetchMentors() {
			try {
				const response = await fetch('/api/mentors');
				if (!response.ok) {
					throw new Error('Failed to fetch mentors');
				}
				const mentors = await response.json();
				set(mentors);
			} catch (error) {
				console.error('Error fetching mentors:', error);
				set([]);
			}
		},

		// Get a single mentor by ID
		async getMentorById(id: string) {
			try {
				const response = await fetch(`/api/mentors/${id}`);
				if (!response.ok) {
					throw new Error('Failed to fetch mentor');
				}
				return await response.json();
			} catch (error) {
				console.error('Error fetching mentor:', error);
				return null;
			}
		},

		// Reset the store
		reset() {
			set([]);
		}
	};
}

export const mentorsStore = createMentorsStore();
