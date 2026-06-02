import { Request, Response, NextFunction } from 'express';
import { getSettingsSync } from '../../config/settings';
import { sendError } from '../../utils/response';

export function settingsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const settings = getSettingsSync();

    if (settings.isMaintenanceMode && req.path !== '/api/v1/admin') {
      sendError(res, settings.maintenanceMessage || 'Service temporarily unavailable', 503);
      return;
    }

    (req as any).appSettings = settings;
    next();
  } catch (error) {
    next();
  }
}

declare global {
  namespace Express {
    interface Request {
      appSettings?: any;
    }
  }
}