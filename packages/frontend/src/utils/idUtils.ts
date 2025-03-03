/**
 * Generates a UUID using crypto.randomUUID() if available,
 * otherwise falls back to a timestamp-based ID
 */
export function generateId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}

	// Fallback implementation
	return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
