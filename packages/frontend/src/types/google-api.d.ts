declare namespace gapi {
	interface ClientConfig {
		apiKey: string;
		discoveryDocs: string[];
	}

	interface Calendar {
		events: {
			list: (params: {
				calendarId: string;
				timeMin: string;
				maxResults: number;
				singleEvents: boolean;
				orderBy: string;
			}) => Promise<{
				result: {
					items: CalendarEvent[];
				};
			}>;
		};
		calendars: {
			get: (params: { calendarId: string }) => Promise<{
				result: {
					id: string;
					summary: string;
					description?: string;
					timeZone: string;
					accessRole: string;
				};
			}>;
		};
		calendarList: {
			list: () => Promise<{
				result: {
					items: Array<{
						id: string;
						summary: string;
						description?: string;
						accessRole: string;
					}>;
				};
			}>;
		};
	}

	interface Client {
		init: (config: ClientConfig) => Promise<void>;
		calendar: Calendar;
	}

	const client: Client;
	function load(api: string, callback: () => void): void;
}

interface CalendarEvent {
	start: {
		dateTime?: string;
		date?: string;
	};
	end: {
		dateTime?: string;
		date?: string;
	};
	summary: string;
	description?: string;
	location?: string;
}

interface Window {
	gapi: typeof gapi;
}
