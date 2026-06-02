import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../../services/client/notificationService';
import { sendSuccess, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Get user notifications
// @route   GET /api/v1/notifications
// @access  Private
export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const unreadOnly = req.query.unreadOnly === 'true';
    const result = await notificationService.getUserNotifications(req.user!.userId, page, limit, unreadOnly);
    sendSuccess(res, 'Notifications fetched', result);
  } catch (error: any) {
    logger.error('Get notifications error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Mark notification as read
// @route   PATCH /api/v1/notifications/:notificationId/read
// @access  Private
export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.markAsRead(req.params.notificationId, req.user!.userId);
    sendSuccess(res, 'Notification marked as read');
  } catch (error: any) {
    logger.error('Mark as read error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Mark all notifications as read
// @route   PATCH /api/v1/notifications/read-all
// @access  Private
export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.markAllAsRead(req.user!.userId);
    sendSuccess(res, 'All notifications marked as read');
  } catch (error: any) {
    logger.error('Mark all as read error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:notificationId
// @access  Private
export async function deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.deleteNotification(req.params.notificationId, req.user!.userId);
    sendSuccess(res, 'Notification deleted');
  } catch (error: any) {
    logger.error('Delete notification error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Delete all notifications
// @route   DELETE /api/v1/notifications
// @access  Private
export async function deleteAllNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.deleteAllNotifications(req.user!.userId);
    sendSuccess(res, 'All notifications deleted');
  } catch (error: any) {
    logger.error('Delete all notifications error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get unread count
// @route   GET /api/v1/notifications/unread-count
// @access  Private
export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    sendSuccess(res, 'Unread count fetched', { count });
  } catch (error: any) {
    logger.error('Get unread count error', { error: error.message });
    sendNotFound(res, error.message);
  }
}