import { io } from 'socket.io-client';

// Use empty string to default to window.location (current host)
// In production, might be different if hosted separately, but custom server runs both.
const URL = process.env.NEXT_PUBLIC_SOCKET_URL || ''; // SAFE:
export const SOCKET_CHAT_ENABLED = (process.env.NEXT_PUBLIC_ENABLE_SOCKET_CHAT === 'true' || process.env.NEXT_PUBLIC_E2E_MODE === 'true'); // SAFE: Feature toggle

export const socket = io(URL, {
    path: '/api/socket/io',
    autoConnect: false,
    withCredentials: true, // Send cookies
});
