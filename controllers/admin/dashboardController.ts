import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../../services/admin/dashboardService';
import { sendSuccess } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Get dashboard stats
// @route   GET /api/v1/admin/dashboard
// @access  Private/Admin
export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await dashboardService.getDashboardStats();
    sendSuccess(res, 'Dashboard stats fetched', stats);
  } catch (error: any) {
    logger.error('Admin dashboard error', { error: error.message });
    sendSuccess(res, 'Stats unavailable', { overview: {}, charts: {} });
  }
}

// @desc    Get recent activity
// @route   GET /api/v1/admin/dashboard/activity
// @access  Private/Admin
export async function getRecentActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const activity = await dashboardService.getRecentActivity(limit);
    sendSuccess(res, 'Recent activity fetched', activity);
  } catch (error: any) {
    logger.error('Admin activity error', { error: error.message });
    sendSuccess(res, 'Activity unavailable', {});
  }
}