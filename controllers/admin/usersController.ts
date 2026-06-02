import { Request, Response, NextFunction } from 'express';
import * as usersService from '../../services/admin/usersService';
import * as userService from '../../services/client/userService';
import { sendSuccess, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      search: req.query.search as string,
      isHdmVerified: req.query.isHdmVerified ? req.query.isHdmVerified === 'true' : undefined,
      isDeleted: req.query.isDeleted ? req.query.isDeleted === 'true' : undefined,
      status: req.query.status as string,
    };
    const result = await usersService.getAllUsers(page, limit, filters);
    sendSuccess(res, 'Users fetched', result);
  } catch (error: any) {
    logger.error('Admin get users error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get user detail
// @route   GET /api/v1/admin/users/:userId
// @access  Private/Admin
export async function getUserDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.getUserDetail(req.params.userId);
    sendSuccess(res, 'User detail fetched', user);
  } catch (error: any) {
    logger.error('Admin get user detail error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Ban user
// @route   POST /api/v1/admin/users/:userId/ban
// @access  Private/Admin
export async function banUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, reason, durationDays } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const ban = await usersService.banUser(req.admin!.adminId, req.params.userId, type, reason, durationDays, ipAddress);
    sendSuccess(res, 'User banned', ban);
  } catch (error: any) {
    logger.error('Admin ban user error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Unban user
// @route   POST /api/v1/admin/users/:userId/unban
// @access  Private/Admin
export async function unbanUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    await usersService.unbanUser(req.admin!.adminId, req.params.userId, req.body.reason, ipAddress);
    sendSuccess(res, 'User unbanned');
  } catch (error: any) {
    logger.error('Admin unban user error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Force logout user
// @route   POST /api/v1/admin/users/:userId/force-logout
// @access  Private/Admin
export async function forceLogout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await usersService.forceLogout(req.params.userId, req.admin!.adminId);
    sendSuccess(res, 'User force logged out');
  } catch (error: any) {
    logger.error('Admin force logout error', { error: error.message });
    sendNotFound(res, error.message);
  }
}
// @desc    Permanently delete user (admin)
// @route   DELETE /api/v1/admin/users/:userId/permanent
// @access  Private/Admin
export async function permanentlyDeleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.permanentlyDeleteUser(req.params.userId);
    sendSuccess(res, 'User permanently deleted');
  } catch (error: any) {
    logger.error('Admin permanent delete error', { error: error.message });
    sendNotFound(res, error.message);
  }
}