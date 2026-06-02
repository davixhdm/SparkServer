import { Request, Response, NextFunction } from 'express';
import * as backupService from '../../services/client/backupService';
import { sendSuccess, sendCreated, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Create backup
// @route   POST /api/v1/backups
// @access  Private
export async function createBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const backup = await backupService.createBackup(req.user!.userId, req.body);
    sendCreated(res, 'Backup initiated', backup);
  } catch (error: any) {
    logger.error('Create backup error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get user backups
// @route   GET /api/v1/backups
// @access  Private
export async function getBackups(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const backups = await backupService.getUserBackups(req.user!.userId);
    sendSuccess(res, 'Backups fetched', backups);
  } catch (error: any) {
    logger.error('Get backups error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get backup by ID
// @route   GET /api/v1/backups/:backupId
// @access  Private
export async function getBackupById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const backup = await backupService.getBackupById(req.params.backupId, req.user!.userId);
    sendSuccess(res, 'Backup fetched', backup);
  } catch (error: any) {
    logger.error('Get backup error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Delete backup
// @route   DELETE /api/v1/backups/:backupId
// @access  Private
export async function deleteBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await backupService.deleteBackup(req.params.backupId, req.user!.userId);
    sendSuccess(res, 'Backup deleted');
  } catch (error: any) {
    logger.error('Delete backup error', { error: error.message });
    sendNotFound(res, error.message);
  }
}