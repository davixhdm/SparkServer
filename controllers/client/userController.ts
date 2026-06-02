import { Request, Response, NextFunction } from 'express';
import * as userService from '../../services/client/userService';
import { sendSuccess, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Get current user profile
// @route   GET /api/v1/users/me
// @access  Private
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserById(req.user!.userId);
    sendSuccess(res, 'Profile fetched', user);
  } catch (error: any) {
    logger.error('Get me error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get user by ID
// @route   GET /api/v1/users/:userId
// @access  Private
export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserById(req.params.userId);
    sendSuccess(res, 'User fetched', user);
  } catch (error: any) {
    logger.error('Get user error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get user by phone
// @route   GET /api/v1/users/phone/:phone
// @access  Private
export async function getUserByPhone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserByPhone(req.params.phone);
    if (!user) { sendNotFound(res, 'User not found'); return; }
    sendSuccess(res, 'User fetched', user);
  } catch (error: any) {
    logger.error('Get user by phone error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get user by username
// @route   GET /api/v1/users/username/:username
// @access  Private
export async function getUserByUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserByUsername(req.params.username);
    if (!user) { sendNotFound(res, 'User not found'); return; }
    sendSuccess(res, 'User fetched', user);
  } catch (error: any) {
    logger.error('Get user by username error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update profile
// @route   PATCH /api/v1/users/me
// @access  Private
export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.updateProfile(req.user!.userId, req.body);
    sendSuccess(res, 'Profile updated', user);
  } catch (error: any) {
    logger.error('Update profile error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update privacy settings
// @route   PATCH /api/v1/users/me/privacy
// @access  Private
export async function updatePrivacy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const privacy = await userService.updatePrivacySettings(req.user!.userId, req.body);
    sendSuccess(res, 'Privacy settings updated', privacy);
  } catch (error: any) {
    logger.error('Update privacy error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get user sessions
// @route   GET /api/v1/users/me/sessions
// @access  Private
export async function getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessions = await userService.getUserSessions(req.user!.userId);
    sendSuccess(res, 'Sessions fetched', sessions);
  } catch (error: any) {
    logger.error('Get sessions error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Logout a specific session
// @route   DELETE /api/v1/users/me/sessions/:sessionId
// @access  Private
export async function logoutSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.logoutSession(req.user!.userId, req.params.sessionId);
    sendSuccess(res, 'Session terminated');
  } catch (error: any) {
    logger.error('Logout session error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Soft delete account
// @route   DELETE /api/v1/users/me
// @access  Private
export async function deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.deleteAccount(req.user!.userId);
    sendSuccess(res, 'Account deleted');
  } catch (error: any) {
    logger.error('Delete account error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Permanently delete account and all data
// @route   DELETE /api/v1/users/me/permanent
// @access  Private
export async function permanentlyDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.permanentlyDeleteUser(req.user!.userId);
    sendSuccess(res, 'Account and all data permanently deleted');
  } catch (error: any) {
    logger.error('Permanent delete error', { error: error.message });
    sendNotFound(res, error.message);
  }
}