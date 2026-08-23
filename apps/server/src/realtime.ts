import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import cookie from 'cookie';
import { and, eq } from 'drizzle-orm';
import { env } from './lib/env.js';
import { COOKIE_NAME, verifyToken } from './lib/auth.js';
import { db } from './db/client.js';
import { bondMembers } from './db/schema.js';

let io: Server | null = null;

export function initRealtime(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });

  io.on('connection', (socket: Socket) => {
    const rawCookies = socket.handshake.headers.cookie;
    const token = rawCookies ? cookie.parse(rawCookies)[COOKIE_NAME] : undefined;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      socket.disconnect(true);
      return;
    }
    socket.data.userId = payload.userId;

    socket.on('bond:join', (bondId: string) => {
      if (typeof bondId !== 'string') return;
      const membership = db
        .select()
        .from(bondMembers)
        .where(and(eq(bondMembers.bondId, bondId), eq(bondMembers.userId, socket.data.userId)))
        .get();
      if (membership) {
        socket.join(`bond:${bondId}`);
      }
    });

    socket.on('bond:leave', (bondId: string) => {
      if (typeof bondId === 'string') socket.leave(`bond:${bondId}`);
    });
  });

  return io;
}

export function emitToBond(bondId: string, event: string, payload: unknown) {
  io?.to(`bond:${bondId}`).emit(event, payload);
}
