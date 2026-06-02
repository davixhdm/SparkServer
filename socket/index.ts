// socket/index.ts
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import env from '../config/env';
import {
  handleConnection,
  handleDisconnection,
} from './handlers/connectionHandler';
import { handleMessage, handleMessageRead, handleMessageDelivered } from './handlers/messageHandler';
import { handleTyping } from './handlers/typingHandler';
import { handlePresenceUpdate } from './handlers/presenceHandler';
import {
  handleCallSignal,
  handleCallAnswer,
  handleCallEnd,
  handleCallDecline,
  handleWebRTCSignal,
} from './handlers/callHandler';
import { handleJoinGroup, handleLeaveGroup } from './handlers/groupHandler';
import { joinUserRooms, leaveUserRooms } from './rooms';

let io: Server | null = null;

// Keep-alive interval (send ping every 25 seconds)
const KEEP_ALIVE_INTERVAL = 25000;

export function initializeSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGINS,
      credentials: true,
    },
    pingInterval: env.WS_PING_INTERVAL || 25000,
    pingTimeout: env.WS_PING_TIMEOUT || 20000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    // Connection state recovery
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyAccessToken(token as string);
      socket.userId = decoded.userId;
      socket.phone = decoded.phone;
      socket.displayName = decoded.displayName || decoded.phone;
      socket.isGhostMode = false;
      socket.lastPing = Date.now();
      next();
    } catch (error: any) {
      logger.warn('Socket auth failed', { error: error.message });
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    logger.info(`Socket connected: ${socket.userId} (${socket.id})`);

    // Set up keep-alive ping for this socket
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping', { timestamp: Date.now() });
        socket.lastPing = Date.now();
      }
    }, KEEP_ALIVE_INTERVAL);

    // Handle pong response
    socket.on('pong', (data) => {
      socket.lastPing = Date.now();
      const latency = Date.now() - data.timestamp;
      logger.debug(`Socket latency: ${latency}ms for ${socket.userId}`);
    });

    await joinUserRooms(socket);
    await handleConnection(socket, io);

    // Existing event handlers...
    socket.on('message:send', (data) => handleMessage(socket, io!, data));
    socket.on('message:read', (data) => handleMessageRead(socket, io!, data));
    socket.on('message:delivered', (data) => handleMessageDelivered(socket, io!, data));
    socket.on('typing:start', (data) => handleTyping(socket, io!, data, true));
    socket.on('typing:stop', (data) => handleTyping(socket, io!, data, false));
    socket.on('presence:update', (data) => handlePresenceUpdate(socket, io!, data));
    socket.on('call:signal', (data) => handleCallSignal(socket, io!, data));
    socket.on('call:answer', (data) => handleCallAnswer(socket, io!, data));
    socket.on('call:end', (data) => handleCallEnd(socket, io!, data));
    socket.on('call:decline', (data) => handleCallDecline(socket, io!, data));
    socket.on('call:webrtc-signal', (data) => handleWebRTCSignal(socket, io!, data));
    socket.on('group:join', (data) => handleJoinGroup(socket, io!, data));
    socket.on('group:leave', (data) => handleLeaveGroup(socket, io!, data));

    // Manual keep-alive from client
    socket.on('keep-alive', () => {
      socket.emit('keep-alive-ack', { timestamp: Date.now() });
    });

    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${socket.userId} (${socket.id})`);
      clearInterval(pingInterval);
      await handleDisconnection(socket, io!);
      await leaveUserRooms(socket);
    });
  });

  // Server-wide keep-alive to check stale connections
  const serverKeepAlive = setInterval(() => {
    if (!io) return;
    const now = Date.now();
    io.sockets.sockets.forEach((socket) => {
      if (socket.lastPing && now - socket.lastPing > 60000) {
        logger.warn(`Closing stale connection for ${socket.userId}`);
        socket.disconnect(true);
      }
    });
  }, 30000);

  logger.info('Socket.io initialized with keep-alive');
  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}