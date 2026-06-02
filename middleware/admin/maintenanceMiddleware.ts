import { Request, Response, NextFunction } from 'express';
import Settings from '../../models/admin/Settings';
import { sendError } from '../../utils/response';
import { logger } from '../../utils/logger';

let maintenanceCache: { isMaintenance: boolean; message: string; lastCheck: number } = {
  isMaintenance: false,
  message: 'Spark is under maintenance. We will be back shortly.',
  lastCheck: 0,
};

const CACHE_TTL = 30000;

export async function maintenanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Skip for admin routes
    if (req.path.startsWith('/api/v1/admin')) {
      return next();
    }

    // Skip for health check
    if (req.path === '/api/v1/health' || req.path === '/health') {
      return next();
    }

    const now = Date.now();

    // Refresh cache if expired
    if (now - maintenanceCache.lastCheck > CACHE_TTL) {
      try {
        const settings = await Settings.findOne().select('isMaintenanceMode maintenanceMessage').lean();

        maintenanceCache = {
          isMaintenance: settings?.isMaintenanceMode || false,
          message: settings?.maintenanceMessage || 'Spark is under maintenance. We will be back shortly.',
          lastCheck: now,
        };
      } catch {
        // If DB is down, use cached value or allow through
        if (maintenanceCache.lastCheck === 0) {
          return next();
        }
      }
    }

    if (maintenanceCache.isMaintenance) {
      sendError(res, maintenanceCache.message, 503);
      return;
    }

    next();
  } catch (error: any) {
    logger.error('Maintenance middleware error', { error: error.message });
    next();
  }
}

export async function checkMaintenanceMode(): Promise<boolean> {
  try {
    const settings = await Settings.findOne().select('isMaintenanceMode').lean();
    return settings?.isMaintenanceMode || false;
  } catch {
    return false;
  }
}

export async function setMaintenanceMode(enabled: boolean, message?: string): Promise<void> {
  const update: any = { isMaintenanceMode: enabled };
  if (message) {
    update.maintenanceMessage = message;
  }

  await Settings.findOneAndUpdate({}, update, { upsert: true, new: true });

  maintenanceCache = {
    isMaintenance: enabled,
    message: message || maintenanceCache.message,
    lastCheck: Date.now(),
  };
}

export function getMaintenanceStatus(): { isMaintenance: boolean; message: string } {
  return {
    isMaintenance: maintenanceCache.isMaintenance,
    message: maintenanceCache.message,
  };
}