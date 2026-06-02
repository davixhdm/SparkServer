import { Request, Response, NextFunction } from 'express';
import Legal from '../../models/admin/Legal';
import ModerationLog from '../../models/admin/ModerationLog';
import { sendSuccess, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Get all legal documents
// @route   GET /api/v1/admin/legal
// @access  Private/Admin
export async function getAllLegal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const docs = await Legal.find().select('-history').lean();
    sendSuccess(res, 'Legal documents fetched', docs);
  } catch (error: any) {
    logger.error('Get legal docs error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get single legal document
// @route   GET /api/v1/admin/legal/:type
// @access  Private/Admin
export async function getLegal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const doc = await Legal.findOne({ type: req.params.type }).lean();
    if (!doc) {
      sendNotFound(res, 'Document not found');
      return;
    }
    sendSuccess(res, 'Document fetched', doc);
  } catch (error: any) {
    logger.error('Get legal doc error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Create or update legal document
// @route   PUT /api/v1/admin/legal/:type
// @access  Private/Admin
export async function saveLegal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, content, isPublished, notes } = req.body;
    const type = req.params.type;

    if (!['terms', 'privacy', 'cookies', 'ads_preferences'].includes(type)) {
      sendNotFound(res, 'Invalid document type');
      return;
    }

    let doc = await Legal.findOne({ type });

    if (doc) {
      // Save current version to history
      doc.history.push({
        version: doc.version,
        content: doc.content,
        editedBy: doc.lastEditedBy,
        editedAt: new Date(),
        notes: notes || 'Updated',
      });

      doc.version += 1;
      doc.content = content;
      doc.title = title;
      doc.lastEditedBy = req.admin!.adminId as any;

      if (isPublished && !doc.isPublished) {
        doc.isPublished = true;
        doc.publishedAt = new Date();
      } else if (isPublished === false) {
        doc.isPublished = false;
      }

      await doc.save();
    } else {
      doc = await Legal.create({
        type,
        title,
        content,
        version: 1,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
        lastEditedBy: req.admin!.adminId,
      });
    }

    await ModerationLog.create({
      adminId: req.admin!.adminId,
      action: 'content_removed',
      targetType: 'user',
      targetId: req.admin!.adminId,
      details: `Legal document updated: ${type} v${doc.version}`,
    });

    sendSuccess(res, 'Document saved', doc);
  } catch (error: any) {
    logger.error('Save legal doc error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get version history
// @route   GET /api/v1/admin/legal/:type/history
// @access  Private/Admin
export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const doc = await Legal.findOne({ type: req.params.type })
      .select('history')
      .populate('history.editedBy', 'displayName email')
      .lean();

    if (!doc) {
      sendNotFound(res, 'Document not found');
      return;
    }
    sendSuccess(res, 'Version history fetched', doc.history);
  } catch (error: any) {
    logger.error('Get legal history error', { error: error.message });
    sendNotFound(res, error.message);
  }
}