import { Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  phone?: string;
  displayName?: string;
}

export function socketAuth(socket: Socket, next: (err?: Error) => void): void {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = verifyAccessToken(token as string);

    (socket as AuthenticatedSocket).userId = decoded.userId;
    (socket as AuthenticatedSocket).phone = decoded.phone;
    (socket as AuthenticatedSocket).displayName = decoded.displayName || decoded.phone;

    next();
  } catch (error: any) {
    next(new Error('Invalid or expired token'));
  }
}