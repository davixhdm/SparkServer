import { Request, Response, NextFunction } from 'express';
import { verifyAdminAccessToken } from '../../utils/jwt';
import { sendUnauthorized } from '../../utils/response';
import { logger } from '../../utils/logger';
import Admin from '../../models/admin/Admin';

export async function adminAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'Admin token required');
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      sendUnauthorized(res, 'Invalid token format');
      return;
    }

    const decoded = verifyAdminAccessToken(token);

    const admin = await Admin.findById(decoded.adminId).select('-password -refreshToken');

    if (!admin || !admin.isActive) {
      sendUnauthorized(res, 'Admin account not found or inactive');
      return;
    }

    req.admin = {
      adminId: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    };

    next();
  } catch (error: any) {
    if (error.message === 'Admin token expired') {
      sendUnauthorized(res, 'Admin token expired');
      return;
    }
    logger.error('Admin auth middleware error', { error: error.message });
    sendUnauthorized(res, 'Invalid admin token');
  }
}