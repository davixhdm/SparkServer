import { Request, Response, NextFunction } from 'express';
import * as statusService from '../../services/client/statusService';
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest } from '../../utils/response';
import { logger } from '../../utils/logger';

export async function createStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = await statusService.createStatus(req.user!.userId, req.body);
    sendCreated(res, 'Status created', status);
  } catch (error: any) {
    logger.error('Create status error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function getStatusFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const feed = await statusService.getStatusFeed(req.user!.userId);
    sendSuccess(res, 'Status feed fetched', feed);
  } catch (error: any) {
    logger.error('Get status feed error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

export async function viewStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await statusService.viewStatus(req.params.statusId, req.user!.userId);
    sendSuccess(res, 'Status viewed', result);
  } catch (error: any) {
    logger.error('View status error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

export async function getStatusViewers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const viewers = await statusService.getStatusViewers(req.params.statusId, req.user!.userId);
    sendSuccess(res, 'Status viewers fetched', viewers);
  } catch (error: any) {
    logger.error('Get status viewers error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

export async function reactToStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = await statusService.reactToStatus(req.params.statusId, req.user!.userId, req.body.emoji);
    sendSuccess(res, 'Reaction added', status);
  } catch (error: any) {
    logger.error('React status error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

export async function replyToStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = await statusService.replyToStatus(req.params.statusId, req.user!.userId, req.body.message);
    sendSuccess(res, 'Reply sent', status);
  } catch (error: any) {
    logger.error('Reply status error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

export async function deleteStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await statusService.deleteStatus(req.params.statusId, req.user!.userId);
    sendSuccess(res, 'Status deleted');
  } catch (error: any) {
    logger.error('Delete status error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

export async function muteUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await statusService.muteUserStatus(req.user!.userId, req.params.userId);
    sendSuccess(res, 'Status muted');
  } catch (error: any) {
    logger.error('Mute status error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

export async function unmuteUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await statusService.unmuteUserStatus(req.user!.userId, req.params.userId);
    sendSuccess(res, 'Status unmuted');
  } catch (error: any) {
    logger.error('Unmute status error', { error: error.message });
    sendNotFound(res, error.message);
  }
}