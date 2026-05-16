import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { config } from './index';
import { logger } from './logger';
import { verifyToken } from '../utils/jwt.util';
import { connectionTracker } from '../services/monitoring/connection-tracker.service';
import { activityLogger } from '../services/monitoring/activity-log.service';

let io: Server | null = null;

const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin || config.env !== 'production') return true;
  if (config.frontend.allowedOrigins.includes(origin.replace(/\/+$/, ''))) return true;

  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.expo.dev')
      || hostname.endsWith('.exp.direct')
      || hostname.endsWith('.devtunnels.ms')
      || hostname.endsWith('.ngrok.io')
      || hostname.endsWith('.ngrok-free.app')
      || hostname.endsWith('.trycloudflare.com')
      || hostname === 'localhost'
      || hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

const getTokenFromHandshake = (authToken: unknown, header: unknown): string | null => {
  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken.trim();
  }

  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.split(' ')[1] ?? null;
  }

  return null;
};

export const initSocketServer = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: (origin, callback) => {
        callback(null, isAllowedOrigin(origin));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    const origin = socket.handshake.headers.origin ?? null;
    const transport = socket.conn.transport.name;

    logger.info({
      logType: 'socket',
      event: 'connect',
      socketId: socket.id,
      origin,
      transport,
    });

    const connectActivity = activityLogger.log({
      type: 'socket_connect',
      sessionId: null,
      userId: null,
      deviceInfo: null,
      metadata: {
        socketId: socket.id,
        origin,
        transport,
      },
    });
    broadcastToAdmins('activity:new', connectActivity);

    socket.on('admin:join', () => {
      const token = getTokenFromHandshake(
        socket.handshake.auth?.token,
        socket.handshake.headers.authorization,
      );

      if (!token) {
        socket.emit('admin:error', { message: 'Authentication required' });
        return;
      }

      try {
        const payload = verifyToken(token);

        if (payload.roleName !== 'admin') {
          socket.emit('admin:error', { message: 'Admin permission required' });
          return;
        }

        socket.join('admin:dashboard');
        socket.emit('stats:update', activityLogger.getStats());
      } catch {
        socket.emit('admin:error', { message: 'Invalid or expired token' });
      }
    });

    socket.on('device:heartbeat', (data: { sessionId?: string }) => {
      if (!data.sessionId) return;

      const isFirstRegistration = socket.data.sessionId !== data.sessionId;
      const currentTransport = socket.conn.transport.name;

      connectionTracker.touch(data.sessionId, {
        source: 'socket',
        socketId: socket.id,
        origin,
        transport: currentTransport,
      });
      socket.data.sessionId = data.sessionId;

      if (isFirstRegistration) {
        logger.info({
          logType: 'socket',
          event: 'device_registered',
          socketId: socket.id,
          sessionId: data.sessionId,
          origin,
          transport: currentTransport,
        });

        const activity = activityLogger.log({
          type: 'socket_device_registered',
          sessionId: data.sessionId,
          userId: null,
          deviceInfo: null,
          metadata: {
            socketId: socket.id,
            origin,
            transport: currentTransport,
          },
        });
        broadcastToAdmins('activity:new', activity);
      }

      broadcastToAdmins('stats:update', activityLogger.getStats());
    });

    socket.on('device:end', (data: { sessionId?: string }) => {
      if (!data.sessionId) return;

      connectionTracker.untrack(data.sessionId);
      broadcastToAdmins('stats:update', activityLogger.getStats());
    });

    socket.conn.on('upgrade', () => {
      logger.info({
        logType: 'socket',
        event: 'transport_upgrade',
        socketId: socket.id,
        sessionId: socket.data.sessionId ?? null,
        transport: socket.conn.transport.name,
      });
      broadcastToAdmins('stats:update', activityLogger.getStats());
    });

    socket.on('disconnect', (reason) => {
      logger.info({
        logType: 'socket',
        event: 'disconnect',
        socketId: socket.id,
        sessionId: socket.data.sessionId ?? null,
        reason,
      });

      if (socket.data.sessionId) {
        connectionTracker.untrack(socket.data.sessionId);
        const activity = activityLogger.log({
          type: 'socket_disconnect',
          sessionId: socket.data.sessionId,
          userId: null,
          deviceInfo: null,
          metadata: {
            socketId: socket.id,
            origin,
            reason,
          },
        });
        broadcastToAdmins('activity:new', activity);
        broadcastToAdmins('stats:update', activityLogger.getStats());
      }
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io server has not been initialized');
  }

  return io;
};

export const broadcastToAdmins = (event: string, data: unknown): void => {
  io?.to('admin:dashboard').emit(event, data);
};
