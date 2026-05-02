import { io } from 'socket.io-client';

// No URL → connects to current origin. Next.js rewrites in next.config.js
// proxy /socket.io/* to the API service so the WebSocket stays first-party.
export const socket = io({
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
