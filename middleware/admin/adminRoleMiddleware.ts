import { Request, Response, NextFunction } from 'express';
import { sendForbidden } from '../../utils/response';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      sendForbidden(res, 'Admin access required');
      return;
    }

    if (!roles.includes(req.admin.role)) {
      sendForbidden(res, `This action requires one of these roles: ${roles.join(', ')}`);
      return;
    }

    next();
  };
}

export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.admin || req.admin.role !== 'super_admin') {
    sendForbidden(res, 'Super admin access required');
    return;
  }
  next();
}

export function requireAdminOrAbove(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.admin || !['super_admin', 'admin'].includes(req.admin.role)) {
    sendForbidden(res, 'Admin access required');
    return;
  }
  next();
}

export function requireModeratorOrAbove(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.admin || !['super_admin', 'admin', 'moderator'].includes(req.admin.role)) {
    sendForbidden(res, 'Moderator access required');
    return;
  }
  next();
}