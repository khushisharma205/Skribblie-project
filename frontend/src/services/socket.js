import { io } from 'socket.io-client';

console.log("VITE_SOCKET_URL =", import.meta.env.VITE_SOCKET_URL);
console.log("MODE =", import.meta.env.MODE);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});