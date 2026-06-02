import { Request, Response, NextFunction } from 'express';
import * as systemBackupService from '../../services/admin/systemBackupService';
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Create system backup
// @route   POST /api/v1/admin/backups
// @access  Private/Admin
export async function createSystemBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const backup = await systemBackupService.createSystemBackup(req.admin!.adminId, {
      backupType: req.body.backupType,
      collections: req.body.collections,
      includesMedia: req.body.includesMedia,
      compressionType: req.body.compressionType,
      ipAddress,
    });
    sendCreated(res, 'System backup created', backup);
  } catch (error: any) {
    logger.error('Admin create backup error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

// @desc    Get backup history
// @route   GET /api/v1/admin/backups
// @access  Private/Admin
export async function getBackupHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await systemBackupService.getBackupHistory(page, limit);
    sendSuccess(res, 'Backup history fetched', result);
  } catch (error: any) {
    logger.error('Admin get backups error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get backup by ID
// @route   GET /api/v1/admin/backups/:backupId
// @access  Private/Admin
export async function getBackupById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const backup = await systemBackupService.getBackupById(req.params.backupId);
    sendSuccess(res, 'Backup fetched', backup);
  } catch (error: any) {
    logger.error('Admin get backup error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Delete backup
// @route   DELETE /api/v1/admin/backups/:backupId
// @access  Private/Admin
export async function deleteBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await systemBackupService.deleteBackup(req.params.backupId);
    sendSuccess(res, 'Backup deleted');
  } catch (error: any) {
    logger.error('Admin delete backup error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Restore from backup
// @route   POST /api/v1/admin/backups/:backupId/restore
// @access  Private/Admin
export async function restoreFromBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await systemBackupService.restoreFromBackup(
      req.params.backupId,
      req.admin!.adminId,
      {
        collections: req.body.collections,
        dryRun: req.body.dryRun,
      },
    );
    sendSuccess(res, 'Restore completed', result);
  } catch (error: any) {
    logger.error('Admin restore backup error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}