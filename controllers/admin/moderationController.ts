import { Request, Response, NextFunction } from 'express';
import * as moderationService from '../../services/admin/moderationService';
import { sendSuccess, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Get flagged messages
// @route   GET /api/v1/admin/moderation/messages
// @access  Private/Admin
export async function getFlaggedMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await moderationService.getFlaggedMessages(page, limit);
    sendSuccess(res, 'Flagged messages fetched', result);
  } catch (error: any) {
    logger.error('Admin flagged messages error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Remove content
// @route   DELETE /api/v1/admin/moderation/content/:contentId
// @access  Private/Admin
export async function removeContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { contentType, reason } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    await moderationService.removeContent(req.admin!.adminId, contentType, req.params.contentId, reason, ipAddress);
    sendSuccess(res, 'Content removed');
  } catch (error: any) {
    logger.error('Admin remove content error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Bulk remove user content
// @route   DELETE /api/v1/admin/moderation/users/:userId/content
// @access  Private/Admin
export async function bulkRemoveContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    await moderationService.bulkRemoveUserContent(req.admin!.adminId, req.params.userId, ipAddress);
    sendSuccess(res, 'User content removed');
  } catch (error: any) {
    logger.error('Admin bulk remove error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Warn user
// @route   POST /api/v1/admin/moderation/users/:userId/warn
// @access  Private/Admin
export async function warnUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, message, severity, reportId } = req.body;
    const warning = await moderationService.warnUser(req.admin!.adminId, req.params.userId, type, message, severity, reportId);
    sendSuccess(res, 'Warning issued', warning);
  } catch (error: any) {
    logger.error('Admin warn user error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get moderation logs
// @route   GET /api/v1/admin/moderation/logs
// @access  Private/Admin
export async function getModerationLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const adminId = req.query.adminId as string;
    const result = await moderationService.getModerationLogs(page, limit, adminId);
    sendSuccess(res, 'Moderation logs fetched', result);
  } catch (error: any) {
    logger.error('Admin moderation logs error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get blocked words
// @route   GET /api/v1/admin/moderation/blocked-words
// @access  Private/Admin
export async function getBlockedWords(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const words = await moderationService.getBlockedWords();
    sendSuccess(res, 'Blocked words fetched', words);
  } catch (error: any) {
    logger.error('Admin blocked words error', { error: error.message });
    sendSuccess(res, 'Fetch failed', []);
  }
}

// @desc    Add blocked word
// @route   POST /api/v1/admin/moderation/blocked-words
// @access  Private/Admin
export async function addBlockedWord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await moderationService.addBlockedWord(req.body.word);
    sendSuccess(res, 'Blocked word added');
  } catch (error: any) {
    logger.error('Admin add blocked word error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Remove blocked word
// @route   DELETE /api/v1/admin/moderation/blocked-words/:word
// @access  Private/Admin
export async function removeBlockedWord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await moderationService.removeBlockedWord(req.params.word);
    sendSuccess(res, 'Blocked word removed');
  } catch (error: any) {
    logger.error('Admin remove blocked word error', { error: error.message });
    sendNotFound(res, error.message);
  }
}