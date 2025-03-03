import type { CalendarEvent } from '../stores/appStore';

function formatTime(dateTimeStr: string): string {
	return new Date(dateTimeStr).toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});
}

function extractHashtags(text: string | undefined): string[] {
	if (!text) return [];
	const hashtagRegex = /#([\w-]+)/g;
	const matches = text.match(hashtagRegex) || [];
	return matches.map((tag) => {
		const tagText = tag.slice(1);
		return tagText.charAt(0).toUpperCase() + tagText.slice(1);
	});
}

export function getStudioStatus(event: CalendarEvent): { message: string; status: string } | null {
	if (!event.description) return null;

	const tags = extractHashtags(event.description);
	const studios = tags.filter(
		(tag) => !['available', 'partial', 'unavailable'].includes(tag.toLowerCase())
	);

	if (studios.length === 0) return null;

	let status = '';
	if (event.description.includes('#available')) {
		status = 'available';
	} else if (event.description.includes('#partial')) {
		status = 'partially available';
	} else if (event.description.includes('#unavailable')) {
		status = 'unavailable';
	} else {
		return null;
	}

	const studioList =
		studios.length > 1
			? `${studios.slice(0, -1).join(', ')} and ${studios[studios.length - 1]}`
			: studios[0];

	const startTime = formatTime(event.start.dateTime || '');
	const endTime = formatTime(event.end.dateTime || '');

	return {
		message: `${studioList} ${studios.length > 1 ? 'are' : 'is'} ${status} from ${startTime} to ${endTime}`,
		status: `studio is ${status}` // For CSS matching
	};
}
