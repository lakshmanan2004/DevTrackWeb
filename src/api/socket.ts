import { io, Socket } from 'socket.io-client';
import { API_BASE, getToken } from './client';

let socket: Socket | null = null;
const listeners = new Map<string, Set<(payload: any) => void>>();

export function getSocket(): Socket | null {
  return socket;
}

let heartbeatTimer: any = null;

export function connectSocket(): Socket | null {
  const token = getToken();
  if (!token) return null;
  if (socket?.connected) return socket;

  socket = io(API_BASE || '/', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 2000
  });

  // fan out all server events to local subscribers
  socket.onAny((event: string, payload: any) => {
    const set = listeners.get(event);
    if (set) set.forEach((fn) => fn(payload));
  });

  // developer presence heartbeat
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    if (socket?.connected) socket.emit('presence:heartbeat');
  }, 30000);
  socket.on('connect', () => socket?.emit('presence:heartbeat'));

  return socket;
}

export function disconnectSocket() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  socket?.disconnect();
  socket = null;
}

export function onSocketEvent(event: string, fn: (payload: any) => void): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(fn);
  return () => {
    listeners.get(event)?.delete(fn);
  };
}

// Reactive connection state for LIVE badges.
import { useEffect, useState } from 'react';

export function useSocketConnected(): boolean {
  const [connected, setConnected] = useState(!!socket?.connected);

  useEffect(() => {
    const s = socket;
    if (!s) return;
    const on = () => setConnected(true);
    const off = () => setConnected(false);
    s.on('connect', on);
    s.on('disconnect', off);
    setConnected(s.connected);
    return () => {
      s.off('connect', on);
      s.off('disconnect', off);
    };
  }, []);

  return connected;
}
