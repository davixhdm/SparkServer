import { Request, Response, NextFunction } from 'express';
import Legal from '../../models/admin/Legal';
import { sendSuccess, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Get published legal document (public)
// @route   GET /api/v1/legal/:type
// @access  Public
export async function getPublishedLegal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const type = req.params.type;

    if (!['terms', 'privacy', 'cookies', 'ads_preferences'].includes(type)) {
      sendNotFound(res, 'Document not found');
      return;
    }

    const doc = await Legal.findOne({ type, isPublished: true })
      .select('type title content version publishedAt')
      .lean();

    if (!doc) {
      sendNotFound(res, 'Document not available');
      return;
    }

    sendSuccess(res, 'Document fetched', doc);
  } catch (error: any) {
    logger.error('Get public legal error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get all published legal documents
// @route   GET /api/v1/legal
// @access  Public
export async function getAllPublishedLegal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const docs = await Legal.find({ isPublished: true })
      .select('type title version publishedAt isPublished')
      .lean();

    sendSuccess(res, 'Documents fetched', docs);
  } catch (error: any) {
    logger.error('Get all public legal error', { error: error.message });
    sendSuccess(res, 'Documents unavailable', []);
  }
}