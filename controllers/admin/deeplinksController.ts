import { Request, Response, NextFunction } from 'express';
import * as deeplinksService from '../../services/admin/deeplinksService';
import { sendSuccess, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Get all deep links
// @route   GET /api/v1/admin/deeplinks
// @access  Private/Admin
export async function getDeepLinks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const platform = req.query.platform as string;
    const links = await deeplinksService.getDeepLinks(platform);
    sendSuccess(res, 'Deep links fetched', links);
  } catch (error: any) {
    logger.error('Admin get deep links error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Create deep link
// @route   POST /api/v1/admin/deeplinks
// @access  Private/Admin
export async function createDeepLink(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const link = await deeplinksService.createDeepLink(req.body);
    sendSuccess(res, 'Deep link created', link);
  } catch (error: any) {
    logger.error('Admin create deep link error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update deep link
// @route   PATCH /api/v1/admin/deeplinks/:deepLinkId
// @access  Private/Admin
export async function updateDeepLink(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const link = await deeplinksService.updateDeepLink(req.params.deepLinkId, req.body);
    sendSuccess(res, 'Deep link updated', link);
  } catch (error: any) {
    logger.error('Admin update deep link error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Delete deep link
// @route   DELETE /api/v1/admin/deeplinks/:deepLinkId
// @access  Private/Admin
export async function deleteDeepLink(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deeplinksService.deleteDeepLink(req.params.deepLinkId);
    sendSuccess(res, 'Deep link deleted');
  } catch (error: any) {
    logger.error('Admin delete deep link error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Toggle deep link
// @route   PATCH /api/v1/admin/deeplinks/:deepLinkId/toggle
// @access  Private/Admin
export async function toggleDeepLink(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const link = await deeplinksService.toggleDeepLink(req.params.deepLinkId, req.body.isActive);
    sendSuccess(res, 'Deep link toggled', link);
  } catch (error: any) {
    logger.error('Admin toggle deep link error', { error: error.message });
    sendNotFound(res, error.message);
  }
}