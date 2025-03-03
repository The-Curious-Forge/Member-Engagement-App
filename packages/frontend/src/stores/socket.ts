import { writable } from 'svelte/store';
import { io, Socket } from 'socket.io-client';

// Create a writable store for the socket instance
const socket = writable<Socket | null>(null);

// Create a writable store for connection status with initial value false
const connected = writable(false);

// Track connection attempts
let connectionAttempts = 0;
const MAX_ATTEMPTS = 3;

// Keep track of the current socket instance outside the store
let currentSocketInstance: Socket | null = null;

// Initialize socket connection
export function initSocket(url: string) {
	// If we already have a socket instance and it's connected, reuse it
	if (currentSocketInstance?.connected) {
		console.log('Reusing existing socket connection');
		socket.set(currentSocketInstance);
		connected.set(true);
		return currentSocketInstance;
	}

	// Close any existing socket
	if (currentSocketInstance) {
		console.log('Closing existing socket connection');
		currentSocketInstance.close();
		currentSocketInstance = null;
		socket.set(null);
		connected.set(false);
	}

	console.log('Initializing new socket connection to:', url);
	connectionAttempts = 0;

	const socketInstance = io(url, {
		reconnection: true,
		reconnectionDelay: 1000,
		reconnectionDelayMax: 5000,
		reconnectionAttempts: Infinity,
		transports: ['websocket', 'polling'],
		autoConnect: false, // We'll connect manually after setting up handlers
		forceNew: true,
		timeout: 5000
	});

	// Set up event handlers before connecting
	socketInstance.on('connect', () => {
		console.log('Socket connected successfully');
		console.log('Socket ID:', socketInstance.id);
		console.log('Transport:', socketInstance.io.engine.transport.name);
		connectionAttempts = 0;
		connected.set(true);
	});

	socketInstance.on('connect_error', (error) => {
		console.error('Socket connection error:', error);
		console.log('Current transport:', socketInstance.io.engine.transport.name);
		console.log('Connection URL:', url);
		connected.set(false);

		connectionAttempts++;
		if (connectionAttempts >= MAX_ATTEMPTS) {
			console.log('Max connection attempts reached');
			socketInstance.disconnect();
		}
	});

	socketInstance.on('disconnect', (reason) => {
		console.log('Socket disconnected:', reason);
		console.log('Was connected:', socketInstance.connected);
		connected.set(false);

		// If the disconnection wasn't intentional and we haven't reached max attempts
		if (
			(reason === 'io server disconnect' || reason === 'transport close') &&
			connectionAttempts < MAX_ATTEMPTS
		) {
			console.log('Attempting to reconnect...');
			socketInstance.connect();
		}
	});

	socketInstance.on('reconnect', (attemptNumber) => {
		console.log('Socket reconnected after', attemptNumber, 'attempts');
		connectionAttempts = 0;
		connected.set(true);
	});

	socketInstance.on('reconnect_attempt', (attemptNumber) => {
		console.log('Reconnection attempt', attemptNumber);
		if (attemptNumber >= MAX_ATTEMPTS) {
			console.log('Max reconnection attempts reached');
			socketInstance.disconnect();
		}
	});

	socketInstance.on('reconnect_error', (error) => {
		console.error('Socket reconnection error:', error);
		connected.set(false);
	});

	socketInstance.on('error', (error: Error) => {
		console.error('Socket error:', error);
		connected.set(false);
	});

	// Store the instance
	currentSocketInstance = socketInstance;
	socket.set(socketInstance);

	// Now connect
	console.log('Initiating socket connection...');
	socketInstance.connect();

	return socketInstance;
}

// Cleanup function
export function closeSocket() {
	if (currentSocketInstance) {
		console.log('Closing socket connection');
		currentSocketInstance.close();
		currentSocketInstance = null;
	}
	socket.set(null);
	connected.set(false);
	connectionAttempts = 0;
}

// Export a function to check connection status
export function isConnected(): boolean {
	return currentSocketInstance?.connected ?? false;
}

// Export a function to get current connection attempts
export function getConnectionAttempts(): number {
	return connectionAttempts;
}

// Handle HMR
if (import.meta.hot) {
	import.meta.hot.accept(() => {
		console.log('HMR update for socket store');
		// Keep the existing socket connection
	});

	import.meta.hot.dispose(() => {
		console.log('HMR dispose for socket store');
		// Don't close the socket on HMR updates
	});
}

export { socket, connected };
