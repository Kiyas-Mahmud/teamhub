'use client';

import { useEffect } from 'react';
import { socket } from '@/lib/socket';

export function useSocketSubscribe(event, handler) {
  useEffect(() => {
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [event, handler]);
}
