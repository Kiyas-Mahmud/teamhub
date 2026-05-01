import cookie from 'cookie';
import { Server } from 'socket.io';
import { prisma } from '../lib/prisma.js';
import { verifyAccess } from '../lib/jwt.js';

let io;

const presenceMap = new Map();

function roomKey(workspaceId) {
  return `workspace:${workspaceId}`;
}

function userRoomKey(userId) {
  return `user:${userId}`;
}

function getWorkspacePresence(workspaceId) {
  if (!presenceMap.has(workspaceId)) {
    presenceMap.set(workspaceId, new Set());
  }

  return presenceMap.get(workspaceId);
}

function addPresence(workspaceId, userId) {
  getWorkspacePresence(workspaceId).add(userId);
}

function removePresence(workspaceId, userId) {
  const set = presenceMap.get(workspaceId);

  if (!set) {
    return;
  }

  set.delete(userId);

  if (set.size === 0) {
    presenceMap.delete(workspaceId);
  }
}

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || '');
      const payload = verifyAccess(cookies.accessToken);
      socket.userId = payload.sub;
      socket.join(userRoomKey(socket.userId));
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('workspace:join', async (workspaceId) => {
      const membership = await prisma.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId: socket.userId,
            workspaceId,
          },
        },
        select: {
          role: true,
        },
      });

      if (!membership) {
        return;
      }

      socket.join(roomKey(workspaceId));
      addPresence(workspaceId, socket.userId);
      io.to(roomKey(workspaceId)).emit('presence:list', {
        users: Array.from(getWorkspacePresence(workspaceId)),
      });
      io.to(roomKey(workspaceId)).emit('presence:online', { userId: socket.userId });
    });

    socket.on('workspace:leave', (workspaceId) => {
      socket.leave(roomKey(workspaceId));
      removePresence(workspaceId, socket.userId);
      io.to(roomKey(workspaceId)).emit('presence:offline', { userId: socket.userId });
    });

    socket.on('presence:heartbeat', (workspaceId) => {
      addPresence(workspaceId, socket.userId);
    });

    socket.on('disconnect', () => {
      for (const [workspaceId, set] of presenceMap.entries()) {
        if (set.has(socket.userId)) {
          removePresence(workspaceId, socket.userId);
          io.to(roomKey(workspaceId)).emit('presence:offline', { userId: socket.userId });
        }
      }
    });
  });

  return io;
}

export function emitToWorkspace(workspaceId, event, payload) {
  if (!io) {
    return;
  }

  io.to(roomKey(workspaceId)).emit(event, payload);
}

export function emitToUser(userId, event, payload) {
  if (!io) {
    return;
  }

  io.to(userRoomKey(userId)).emit(event, payload);
}
