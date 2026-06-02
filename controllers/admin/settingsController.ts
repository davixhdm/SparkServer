import { Request, Response, NextFunction } from 'express';
import * as settingsService from '../../services/admin/settingsService';
import { sendSuccess, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Get all settings
// @route   GET /api/v1/admin/settings
// @access  Private/Admin
export async function getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await settingsService.getSettings();
    sendSuccess(res, 'Settings fetched', settings);
  } catch (error: any) {
    logger.error('Admin get settings error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update settings
// @route   PATCH /api/v1/admin/settings
// @access  Private/Admin
export async function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await settingsService.updateSettings(req.body);
    sendSuccess(res, 'Settings updated', settings);
  } catch (error: any) {
    logger.error('Admin update settings error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update currency
// @route   PATCH /api/v1/admin/settings/currency
// @access  Private/Admin
export async function updateCurrency(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { currency } = req.body;
    const result = await settingsService.updateCurrencyAndConvert(currency);
    sendSuccess(res, `Currency changed to ${currency}`, result);
  } catch (error: any) {
    logger.error('Update currency error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get AI config
// @route   GET /api/v1/admin/settings/ai
// @access  Private/Admin
export async function getAiConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = await settingsService.getAiConfig();
    sendSuccess(res, 'AI config fetched', config);
  } catch (error: any) {
    logger.error('Admin AI config error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update AI config
// @route   PATCH /api/v1/admin/settings/ai
// @access  Private/Admin
export async function updateAiConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = await settingsService.updateAiConfig(req.body);
    sendSuccess(res, 'AI config updated', config);
  } catch (error: any) {
    logger.error('Admin update AI config error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get sound packs
// @route   GET /api/v1/admin/settings/sound-packs
// @access  Private/Admin
export async function getSoundPacks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const packs = await settingsService.getSoundPacks();
    sendSuccess(res, 'Sound packs fetched', packs);
  } catch (error: any) {
    logger.error('Admin sound packs error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Create sound pack
// @route   POST /api/v1/admin/settings/sound-packs
// @access  Private/Admin
export async function createSoundPack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pack = await settingsService.createSoundPack(req.body);
    sendSuccess(res, 'Sound pack created', pack);
  } catch (error: any) {
    logger.error('Admin create sound pack error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update sound pack
// @route   PATCH /api/v1/admin/settings/sound-packs/:packId
// @access  Private/Admin
export async function updateSoundPack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pack = await settingsService.updateSoundPack(req.params.packId, req.body);
    sendSuccess(res, 'Sound pack updated', pack);
  } catch (error: any) {
    logger.error('Admin update sound pack error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Delete sound pack
// @route   DELETE /api/v1/admin/settings/sound-packs/:packId
// @access  Private/Admin
export async function deleteSoundPack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await settingsService.deleteSoundPack(req.params.packId);
    sendSuccess(res, 'Sound pack deleted');
  } catch (error: any) {
    logger.error('Admin delete sound pack error', { error: error.message });
    sendNotFound(res, error.message);
  }
}