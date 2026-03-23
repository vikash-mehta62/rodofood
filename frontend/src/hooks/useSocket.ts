'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

let socket: Socket | null = null;

export const useSocket = () => {
  const { user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
        transports: ['websocket'],
      });
    }

    socketRef.current = socket;

    // Join appropriate room
    if (user.role === 'customer') {
      socket.emit('join_user', user._id);
    }

    return () => {
      // Don't disconnect on unmount - keep persistent connection
    };
  }, [user]);

  return socketRef.current;
};

export const getSocket = () => socket;
