import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
// Strip /api if present for socket connection
const SOCKET_URL = API_URL.replace(/\/api$/, '');

const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});

export const connectSocket = (sessionId) => {
  if (!socket.connected) {
    socket.connect();
  }
  // Always emit join even if already connected (for joining multiple rooms)
  socket.emit('join_session', sessionId);
  console.log('🔌 Requesting to join proctoring session room:', sessionId);
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log('🔌 Disconnected from proctoring socket');
  }
};

export const emitProctoringAlert = (sessionId, type, details) => {
  if (socket.connected) {
    socket.emit('proctoring_alert', {
      sessionId,
      type,
      details,
    });
  }
};

export default socket;
