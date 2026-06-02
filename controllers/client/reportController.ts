import { Request, Response, NextFunction } from 'express';
import Report from '../../models/admin/Report';
import { sendSuccess, sendCreated, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Create a report
// @route   POST /api/v1/reports
// @access  Private
export async function createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { targetType, targetId, reason, description, anonymous } = req.body;

    if (!targetType || !targetId || !reason) {
      sendNotFound(res, 'targetType, targetId, and reason are required');
      return;
    }

    const validTypes = ['message', 'status', 'profile', 'group'];
    const validReasons = ['spam', 'harassment', 'nudity', 'violence', 'hate_speech', 'other'];

    if (!validTypes.includes(targetType)) {
      sendNotFound(res, `Invalid targetType. Must be one of: ${validTypes.join(', ')}`);
      return;
    }

    if (!validReasons.includes(reason)) {
      sendNotFound(res, `Invalid reason. Must be one of: ${validReasons.join(', ')}`);
      return;
    }

    const report = await Report.create({
      reporterId: req.user!.userId,
      targetType,
      targetId,
      reason,
      description: description || '',
      isAnonymous: anonymous || false,
      status: 'submitted',
    });

    sendCreated(res, 'Report submitted', report);
  } catch (error: any) {
    logger.error('Create report error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get user's own reports
// @route   GET /api/v1/reports
// @access  Private
export async function getMyReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reports = await Report.find({ reporterId: req.user!.userId })
      .sort({ createdAt: -1 })
      .select('targetType reason status createdAt resolution');
    sendSuccess(res, 'Reports fetched', reports);
  } catch (error: any) {
    logger.error('Get my reports error', { error: error.message });
    sendNotFound(res, error.message);
  }
}