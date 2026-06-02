import { Request, Response, NextFunction } from 'express';
import * as deeplinkService from '../../services/client/deeplinkService';
import { sendSuccess } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Resolve deep link
// @route   GET /api/v1/deeplinks/resolve
// @access  Private
export async function resolveDeepLink(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { platform, name, ...params } = req.query;
    const url = await deeplinkService.resolveDeepLink(
      platform as 'spark' | 'vibe',
      name as string,
      params as Record<string, string>,
    );
    sendSuccess(res, 'Deep link resolved', { url });
  } catch (error: any) {
    logger.error('Resolve deep link error', { error: error.message });
    sendSuccess(res, 'Resolution failed', { url: null });
  }
}

// @desc    Get all deep links
// @route   GET /api/v1/deeplinks
// @access  Private
export async function getDeepLinks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const platform = req.query.platform as string;
    const links = await deeplinkService.getDeepLinks(platform);
    sendSuccess(res, 'Deep links fetched', links);
  } catch (error: any) {
    logger.error('Get deep links error', { error: error.message });
    sendSuccess(res, 'Fetch failed', []);
  }
}

// @desc    Get Spark to Vibe links
// @route   GET /api/v1/deeplinks/spark-to-vibe
// @access  Private
export async function getSparkToVibeLinks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const links = deeplinkService.getSparkToVibeLinks();
    sendSuccess(res, 'Links fetched', links);
  } catch (error: any) {
    logger.error('Get Spark to Vibe links error', { error: error.message });
    sendSuccess(res, 'Fetch failed', {});
  }
}