import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export function useSocket(userId) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // Connect once
    if (!socketInstance) {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      socketInstance = io(url, { transports: ['websocket'] });
    }
    socketRef.current = socketInstance;

    // Register this user
    const registerUser = () => {
      socketInstance.emit('user_connected', userId);
    };

    if (socketInstance.connected) {
      registerUser();
    }
    
    socketInstance.on('connect', registerUser);

    return () => {
      // Clean up the event listener, but keep socket alive
      socketInstance.off('connect', registerUser);
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
