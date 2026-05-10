import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export function useSocket(userId) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // Connect once
    if (!socketInstance) {
      socketInstance = io('http://localhost:5000', { transports: ['websocket'] });
    }
    socketRef.current = socketInstance;

    // Register this user
    socketInstance.emit('user_connected', userId);

    return () => {
      // Don't disconnect on component unmount — keep alive while logged in
    };
  }, [userId]);

  return socketRef;
}

export function getSocket() {
  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
