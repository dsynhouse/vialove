import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';

const BASE = import.meta.env.VITE_API_URL ?? undefined;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BASE, { withCredentials: true, autoConnect: true });
  }
  return socket;
}

/** Joins the given bond's realtime room for the lifetime of the component, and wires event handlers. */
export function useBondSocket(bondId: string | undefined, handlers: Record<string, (payload: unknown) => void>) {
  useEffect(() => {
    if (!bondId) return;
    const s = getSocket();
    s.emit('bond:join', bondId);

    for (const [event, handler] of Object.entries(handlers)) {
      s.on(event, handler);
    }

    return () => {
      for (const [event, handler] of Object.entries(handlers)) {
        s.off(event, handler);
      }
      s.emit('bond:leave', bondId);
    };
    // Intentionally only depends on bondId — handlers is expected to be a fresh
    // object per render, and re-subscribing on every render would thrash the room.
  }, [bondId]);
}
