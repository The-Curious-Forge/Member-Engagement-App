export default function getSignedInDuration(signInTime: string): number {
  const signInDate = new Date(signInTime);
  const now = new Date();
  const durationInMinutes = Math.floor(
    (now.getTime() - signInDate.getTime()) / (1000 * 60)
  );
  return Math.max(durationInMinutes, 1); // Ensure the duration is at least 1 minute
}

// Helper function to format duration
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
