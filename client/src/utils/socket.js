import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});

export const connectSocket = (sessionId) => {
  if (!socket.connected) {
    socket.connect();
    socket.emit('join_session', sessionId);
    console.log('🔌 Connected to proctoring socket, joined session:', sessionId);
  }
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
