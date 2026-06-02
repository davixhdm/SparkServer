import { Request, Response, NextFunction } from 'express';
import * as reportsService from '../../services/admin/reportsService';
import { sendSuccess, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Get all reports
// @route   GET /api/v1/admin/reports
// @access  Private/Admin
export async function getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      status: req.query.status as string,
      targetType: req.query.targetType as string,
      reason: req.query.reason as string,
    };
    const result = await reportsService.getReports(page, limit, filters);
    sendSuccess(res, 'Reports fetched', result);
  } catch (error: any) {
    logger.error('Admin get reports error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get report detail
// @route   GET /api/v1/admin/reports/:reportId
// @access  Private/Admin
export async function getReportDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await reportsService.getReportDetail(req.params.reportId);
    sendSuccess(res, 'Report detail fetched', report);
  } catch (error: any) {
    logger.error('Admin get report detail error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Assign report
// @route   PATCH /api/v1/admin/reports/:reportId/assign
// @access  Private/Admin
export async function assignReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await reportsService.assignReport(req.params.reportId, req.admin!.adminId);
    sendSuccess(res, 'Report assigned', report);
  } catch (error: any) {
    logger.error('Admin assign report error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Resolve report
// @route   PATCH /api/v1/admin/reports/:reportId/resolve
// @access  Private/Admin
export async function resolveReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { resolution, actionTaken } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const report = await reportsService.resolveReport(req.params.reportId, req.admin!.adminId, resolution, actionTaken, ipAddress);
    sendSuccess(res, 'Report resolved', report);
  } catch (error: any) {
    logger.error('Admin resolve report error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Dismiss report
// @route   PATCH /api/v1/admin/reports/:reportId/dismiss
// @access  Private/Admin
export async function dismissReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await reportsService.dismissReport(req.params.reportId, req.admin!.adminId, req.body.reason);
    sendSuccess(res, 'Report dismissed', report);
  } catch (error: any) {
    logger.error('Admin dismiss report error', { error: error.message });
    sendNotFound(res, error.message);
  }
}