import { Request, Response, NextFunction } from 'express';
import AiConfig from '../../models/admin/AiConfig';
import { sendSuccess, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Get AI configuration
// @route   GET /api/v1/admin/ai/config
// @access  Private/Admin
export async function getAiConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let config = await AiConfig.findOne().lean();
    if (!config) {
      config = await AiConfig.create({});
    }
    sendSuccess(res, 'AI config fetched', config);
  } catch (error: any) {
    logger.error('Admin get AI config error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update AI configuration
// @route   PATCH /api/v1/admin/ai/config
// @access  Private/Admin
export async function updateAiConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = await AiConfig.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true },
    );
    sendSuccess(res, 'AI config updated', config);
  } catch (error: any) {
    logger.error('Admin update AI config error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Toggle AI feature
// @route   PATCH /api/v1/admin/ai/config/features/:featureName
// @access  Private/Admin
export async function toggleAiFeature(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { featureName } = req.params;
    const { enabled } = req.body;

    const config = await AiConfig.findOne();
    if (!config) {
      sendNotFound(res, 'AI config not found');
      return;
    }

    const features = config.features as any;
    if (features[featureName] === undefined) {
      sendNotFound(res, `Feature "${featureName}" not found`);
      return;
    }

    features[featureName] = enabled;
    await config.save();

    sendSuccess(res, `Feature "${featureName}" ${enabled ? 'enabled' : 'disabled'}`, config);
  } catch (error: any) {
    logger.error('Admin toggle AI feature error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update AI thresholds
// @route   PATCH /api/v1/admin/ai/config/thresholds
// @access  Private/Admin
export async function updateAiThresholds(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = await AiConfig.findOneAndUpdate(
      {},
      { $set: { thresholds: req.body } },
      { new: true, upsert: true },
    );
    sendSuccess(res, 'AI thresholds updated', config);
  } catch (error: any) {
    logger.error('Admin update AI thresholds error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update AI rate limits
// @route   PATCH /api/v1/admin/ai/config/rate-limits
// @access  Private/Admin
export async function updateAiRateLimits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = await AiConfig.findOneAndUpdate(
      {},
      { $set: { rateLimits: req.body } },
      { new: true, upsert: true },
    );
    sendSuccess(res, 'AI rate limits updated', config);
  } catch (error: any) {
    logger.error('Admin update AI rate limits error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update auto-moderation rules
// @route   PATCH /api/v1/admin/ai/config/auto-moderation
// @access  Private/Admin
export async function updateAutoModeration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = await AiConfig.findOneAndUpdate(
      {},
      { $set: { autoModeration: req.body } },
      { new: true, upsert: true },
    );
    sendSuccess(res, 'Auto-moderation rules updated', config);
  } catch (error: any) {
    logger.error('Admin update auto-moderation error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update AI language settings
// @route   PATCH /api/v1/admin/ai/config/languages
// @access  Private/Admin
export async function updateAiLanguages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = await AiConfig.findOneAndUpdate(
      {},
      { $set: { languages: req.body } },
      { new: true, upsert: true },
    );
    sendSuccess(res, 'AI language settings updated', config);
  } catch (error: any) {
    logger.error('Admin update AI languages error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update AI logging settings
// @route   PATCH /api/v1/admin/ai/config/logging
// @access  Private/Admin
export async function updateAiLogging(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = await AiConfig.findOneAndUpdate(
      {},
      { $set: { logging: req.body } },
      { new: true, upsert: true },
    );
    sendSuccess(res, 'AI logging settings updated', config);
  } catch (error: any) {
    logger.error('Admin update AI logging error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Reset AI config to defaults
// @route   POST /api/v1/admin/ai/config/reset
// @access  Private/Admin
export async function resetAiConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await AiConfig.deleteMany({});
    const config = await AiConfig.create({});
    sendSuccess(res, 'AI config reset to defaults', config);
  } catch (error: any) {
    logger.error('Admin reset AI config error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get AI feature statuses (summary)
// @route   GET /api/v1/admin/ai/config/features
// @access  Private/Admin
export async function getAiFeatureStatuses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = await AiConfig.findOne().select('features isEnabled').lean();
    if (!config) {
      sendNotFound(res, 'AI config not found');
      return;
    }
    sendSuccess(res, 'AI feature statuses', {
      isEnabled: config.isEnabled,
      features: config.features,
    });
  } catch (error: any) {
    logger.error('Admin get AI feature statuses error', { error: error.message });
    sendNotFound(res, error.message);
  }
}