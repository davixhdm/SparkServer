import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../utils/jwt';
import { sendUnauthorized } from '../../utils/response';
import { logger } from '../../utils/logger';
import User from '../../models/client/User';
import Ban from '../../models/admin/Ban';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      sendUnauthorized(res, 'Invalid token format');
      return;
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select('-password');

    if (!user || user.isDeleted) {
      sendUnauthorized(res, 'User not found');
      return;
    }

    const activeBan = await Ban.findOne({
      userId: user._id,
      isActive: true,
      $or: [
        { expiresAt: { $gt: new Date() } },
        { type: 'permanent' },
      ],
    });

    if (activeBan) {
      sendUnauthorized(
        res,
        `Account ${activeBan.type === 'permanent' ? 'permanently banned' : 'suspended'}. Reason: ${activeBan.reason}`,
      );
      return;
    }

    req.user = {
      userId: user._id.toString(),
      phone: user.phone,
      email: user.email,
      role: 'user',
    };

    next();
  } catch (error: any) {
    if (error.message === 'Token expired') {
      sendUnauthorized(res, 'Token expired');
      return;
    }
    logger.error('Auth middleware error', { error: error.message });
    sendUnauthorized(res, 'Invalid token');
  }
}

export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');

    if (user && !user.isDeleted) {
      req.user = {
        userId: user._id.toString(),
        phone: user.phone,
        email: user.email,
        role: 'user',
      };
    }

    next();
  } catch {
    next();
  }
}