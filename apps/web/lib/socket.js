import { io } from 'socket.io-client';

export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket'],
});

let connected = false;

export function ensureSocket() {
  if (connected) {
    return;
  }

  connected = true;
  socket.connect();
}

export function disconnectSocket() {
  connected = false;
  socket.disconnect();
}
