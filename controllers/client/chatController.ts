import { Request, Response, NextFunction } from 'express';
import * as chatService from '../../services/client/chatService';
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest } from '../../utils/response';
import { logger } from '../../utils/logger';

export async function getChats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await chatService.getUserChats(req.user!.userId);
    sendSuccess(res, 'Chats fetched', result);
  } catch (error: any) { logger.error('Get chats error', { error: error.message }); sendNotFound(res, error.message); }
}

export async function getChatById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const chat = await chatService.getChatById(req.params.chatId, req.user!.userId);
    sendSuccess(res, 'Chat fetched', chat);
  } catch (error: any) { logger.error('Get chat error', { error: error.message }); sendNotFound(res, error.message); }
}

export async function createDirectChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const chat = await chatService.createDirectChat(req.user!.userId, req.body.participantId);
    sendCreated(res, 'Chat created', chat);
  } catch (error: any) { logger.error('Create chat error', { error: error.message }); sendBadRequest(res, error.message); }
}

export async function archiveChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await chatService.archiveChat(req.params.chatId, req.user!.userId);
    sendSuccess(res, 'Chat archived');
  } catch (error: any) { logger.error('Archive chat error', { error: error.message }); sendNotFound(res, error.message); }
}

export async function unarchiveChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await chatService.unarchiveChat(req.params.chatId, req.user!.userId);
    sendSuccess(res, 'Chat unarchived');
  } catch (error: any) { logger.error('Unarchive chat error', { error: error.message }); sendNotFound(res, error.message); }
}

export async function clearChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await chatService.clearChat(req.params.chatId, req.user!.userId);
    sendSuccess(res, 'Chat cleared');
  } catch (error: any) { logger.error('Clear chat error', { error: error.message }); sendNotFound(res, error.message); }
}

export async function deleteChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await chatService.deleteChat(req.params.chatId, req.user!.userId);
    sendSuccess(res, 'Chat deleted');
  } catch (error: any) { logger.error('Delete chat error', { error: error.message }); sendNotFound(res, error.message); }
}

export async function updateWallpaper(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await chatService.updateChatWallpaper(req.params.chatId, req.user!.userId, req.body.wallpaper);
    sendSuccess(res, 'Wallpaper updated');
  } catch (error: any) { logger.error('Update wallpaper error', { error: error.message }); sendNotFound(res, error.message); }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await chatService.markAllAsRead(req.user!.userId);
    sendSuccess(res, 'All chats marked as read');
  } catch (error: any) { logger.error('Mark all read error', { error: error.message }); sendNotFound(res, error.message); }
}

export async function bulkChatAction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { chatIds, action } = req.body;
    const result = await chatService.bulkAction(req.user!.userId, chatIds, action);
    sendSuccess(res, `Bulk ${action} completed`, result);
  } catch (error: any) { logger.error('Bulk action error', { error: error.message }); sendNotFound(res, error.message); }
}

export async function getTotalUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const total = await chatService.getTotalUnreadCount(req.user!.userId);
    sendSuccess(res, 'Total unread count', { total });
  } catch (error: any) {
    logger.error('Get total unread count error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function markChatAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { unreadCount } = await chatService.markChatAsRead(req.params.chatId, req.user!.userId);
    sendSuccess(res, 'Chat marked as read', { unreadCount });
  } catch (error: any) {
    logger.error('Mark chat as read error', { error: error.message });
    sendNotFound(res, error.message);
  }
}