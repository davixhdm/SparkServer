import { Request, Response, NextFunction } from 'express';
import * as searchService from '../../services/client/searchService';
import { sendSuccess } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Global search
// @route   GET /api/v1/search
// @access  Private
export async function globalSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, type } = req.query;
    const results = await searchService.globalSearch(req.user!.userId, q as string, type as string);
    sendSuccess(res, 'Search results', results);
  } catch (error: any) {
    logger.error('Global search error', { error: error.message });
    sendSuccess(res, 'Search completed', { contacts: [], messages: [], groups: [] });
  }
}

// @desc    AI semantic search
// @route   GET /api/v1/search/ai
// @access  Private
export async function aiSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q } = req.query;
    const results = await searchService.aiSearch(req.user!.userId, q as string);
    sendSuccess(res, 'AI search results', results);
  } catch (error: any) {
    logger.error('AI search error', { error: error.message });
    sendSuccess(res, 'AI search unavailable', null);
  }
}