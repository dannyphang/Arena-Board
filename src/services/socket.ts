import { io, Socket } from 'socket.io-client';
import { TableRoom } from '../types/lobby';
import { UserProfile } from '../types/user';

let socket: Socket | null = null;

/**
 * Returns the backend URL for API and WebSockets:
 * - On Vercel: Set VITE_BACKEND_URL=https://your-backend.onrender.com
 * - In Local / AI Studio: Automatically falls back to same-origin window.location.origin
 */
export function getBackendUrl(): string {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SERVER_URL);
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.replace(/\/+$/, ''); // Strip trailing slash
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
}

export function getSocket(): Socket {
  if (!socket) {
    const backendUrl = getBackendUrl();
    socket = io(backendUrl || '', {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Connected to ArenaBoard real-time server with ID:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from real-time server');
    });
  }
  return socket;
}

export function registerSocketUser(user: UserProfile) {
  const s = getSocket();
  if (s.connected) {
    s.emit('user:register', user);
  } else {
    s.once('connect', () => {
      s.emit('user:register', user);
    });
  }
}
