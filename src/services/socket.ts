import { io, Socket } from 'socket.io-client';
import { TableRoom } from '../types/lobby';
import { UserProfile } from '../types/user';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
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
