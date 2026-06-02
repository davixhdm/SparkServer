import { Request, Response, NextFunction } from 'express';
import * as messageService from '../../services/client/messageService';
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Send message
// @route   POST /api/v1/messages
// @access  Private
export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { chatId, content, messageType, replyTo, media, mediaUrl, thumbnailUrl, fileSize, fileName, mimeType } = req.body;
    const message = await messageService.sendMessage(req.user!.userId, chatId, content, messageType, {
      replyTo, media, mediaUrl, thumbnailUrl, fileSize, fileName, mimeType,
    });
    sendCreated(res, 'Message sent', message);
  } catch (error: any) {
    logger.error('Send message error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

// @desc    Get messages in chat
// @route   GET /api/v1/messages/:chatId
// @access  Private
export async function getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await messageService.getMessages(req.params.chatId, req.user!.userId, page, limit);
    sendSuccess(res, 'Messages fetched', result);
  } catch (error: any) {
    logger.error('Get messages error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Edit message
// @route   PATCH /api/v1/messages/:messageId
// @access  Private
export async function editMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const message = await messageService.editMessage(req.params.messageId, req.user!.userId, req.body.content);
    sendSuccess(res, 'Message edited', message);
  } catch (error: any) {
    logger.error('Edit message error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

// @desc    Delete message
// @route   DELETE /api/v1/messages/:messageId
// @access  Private
export async function deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deleteForEveryone = req.query.forEveryone === 'true';
    await messageService.deleteMessage(req.params.messageId, req.user!.userId, deleteForEveryone);
    sendSuccess(res, 'Message deleted');
  } catch (error: any) {
    logger.error('Delete message error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

// @desc    Forward message
// @route   POST /api/v1/messages/:messageId/forward
// @access  Private
export async function forwardMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const messages = await messageService.forwardMessage(req.params.messageId, req.user!.userId, req.body.targetChatIds);
    sendCreated(res, 'Message forwarded', messages);
  } catch (error: any) {
    logger.error('Forward message error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

// @desc    React to message
// @route   POST /api/v1/messages/:messageId/react
// @access  Private
export async function reactToMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const message = await messageService.reactToMessage(req.params.messageId, req.user!.userId, req.body.emoji);
    sendSuccess(res, 'Reaction updated', message);
  } catch (error: any) {
    logger.error('React message error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Star/unstar message
// @route   PATCH /api/v1/messages/:messageId/star
// @access  Private
export async function starMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await messageService.starMessage(req.params.messageId, req.user!.userId, req.body.star);
    sendSuccess(res, req.body.star ? 'Message starred' : 'Message unstarred');
  } catch (error: any) {
    logger.error('Star message error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get starred messages
// @route   GET /api/v1/messages/starred
// @access  Private
export async function getStarredMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const messages = await messageService.getStarredMessages(req.user!.userId);
    sendSuccess(res, 'Starred messages fetched', messages);
  } catch (error: any) {
    logger.error('Get starred messages error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Search messages
// @route   GET /api/v1/messages/search
// @access  Private
export async function searchMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, chatId } = req.query;
    const messages = await messageService.searchMessages(req.user!.userId, q as string, chatId as string);
    sendSuccess(res, 'Search results', messages);
  } catch (error: any) {
    logger.error('Search messages error', { error: error.message });
    sendNotFound(res, error.message);
  }
}