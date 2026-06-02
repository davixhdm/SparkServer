import { Request, Response, NextFunction } from 'express';
import * as privacyService from '../../services/client/privacyService';
import { sendSuccess, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Get privacy settings
// @route   GET /api/v1/privacy
// @access  Private
export async function getPrivacy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await privacyService.getPrivacySettings(req.user!.userId);
    sendSuccess(res, 'Privacy settings fetched', settings);
  } catch (error: any) {
    logger.error('Get privacy error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update privacy settings
// @route   PATCH /api/v1/privacy
// @access  Private
export async function updatePrivacy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const privacy = await privacyService.updatePrivacy(req.user!.userId, req.body);
    sendSuccess(res, 'Privacy updated', privacy);
  } catch (error: any) {
    logger.error('Update privacy error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Toggle ghost mode
// @route   POST /api/v1/privacy/ghost-mode
// @access  Private
export async function toggleGhostMode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ghostMode = await privacyService.toggleGhostMode(req.user!.userId);
    sendSuccess(res, `Ghost mode ${ghostMode ? 'enabled' : 'disabled'}`, { ghostMode });
  } catch (error: any) {
    logger.error('Toggle ghost mode error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Freeze last seen
// @route   POST /api/v1/privacy/freeze-last-seen
// @access  Private
export async function freezeLastSeen(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await privacyService.freezeLastSeen(req.user!.userId);
    sendSuccess(res, 'Last seen frozen');
  } catch (error: any) {
    logger.error('Freeze last seen error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Unfreeze last seen
// @route   POST /api/v1/privacy/unfreeze-last-seen
// @access  Private
export async function unfreezeLastSeen(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await privacyService.unfreezeLastSeen(req.user!.userId);
    sendSuccess(res, 'Last seen unfrozen');
  } catch (error: any) {
    logger.error('Unfreeze last seen error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Save privacy profile
// @route   POST /api/v1/privacy/profiles
// @access  Private
export async function savePrivacyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profiles = await privacyService.savePrivacyProfile(req.user!.userId, req.body.name, req.body.config);
    sendSuccess(res, 'Privacy profile saved', profiles);
  } catch (error: any) {
    logger.error('Save privacy profile error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Apply privacy profile
// @route   POST /api/v1/privacy/profiles/apply
// @access  Private
export async function applyPrivacyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const privacy = await privacyService.applyPrivacyProfile(req.user!.userId, req.body.profileName);
    sendSuccess(res, 'Privacy profile applied', privacy);
  } catch (error: any) {
    logger.error('Apply privacy profile error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Delete privacy profile
// @route   DELETE /api/v1/privacy/profiles/:profileName
// @access  Private
export async function deletePrivacyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await privacyService.deletePrivacyProfile(req.user!.userId, req.params.profileName);
    sendSuccess(res, 'Privacy profile deleted');
  } catch (error: any) {
    logger.error('Delete privacy profile error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get per-contact privacy
// @route   GET /api/v1/privacy/contact/:contactId
// @access  Private
export async function getPerContactPrivacy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const privacy = await privacyService.getPerContactPrivacy(req.user!.userId, req.params.contactId);
    sendSuccess(res, 'Contact privacy fetched', privacy);
  } catch (error: any) {
    logger.error('Get per-contact privacy error', { error: error.message });
    sendNotFound(res, error.message);
  }
}