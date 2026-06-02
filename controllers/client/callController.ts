import { Request, Response, NextFunction } from 'express';
import * as callService from '../../services/client/callService';
import { sendSuccess, sendCreated, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Initiate call
// @route   POST /api/v1/calls/initiate
// @access  Private
export async function initiateCall(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { receiverId, callType } = req.body;
    const result = await callService.initiateCall(req.user!.userId, receiverId, callType);
    sendCreated(res, 'Call initiated', result);
  } catch (error: any) {
    logger.error('Initiate call error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Initiate group call
// @route   POST /api/v1/calls/group
// @access  Private
export async function initiateGroupCall(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { chatId, callType } = req.body;
    const result = await callService.initiateGroupCall(req.user!.userId, chatId, callType);
    sendCreated(res, 'Group call initiated', result);
  } catch (error: any) {
    logger.error('Initiate group call error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update call status
// @route   PATCH /api/v1/calls/:callId
// @access  Private
export async function updateCallStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, duration } = req.body;
    const call = await callService.updateCallStatus(req.params.callId, status, req.user!.userId, duration);
    sendSuccess(res, 'Call status updated', call);
  } catch (error: any) {
    logger.error('Update call status error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get call history
// @route   GET /api/v1/calls/history
// @access  Private
export async function getCallHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await callService.getCallHistory(req.user!.userId, page, limit);
    sendSuccess(res, 'Call history fetched', result);
  } catch (error: any) {
    logger.error('Get call history error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Delete call record
// @route   DELETE /api/v1/calls/:callId
// @access  Private
export async function deleteCallRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await callService.deleteCallRecord(req.params.callId, req.user!.userId);
    sendSuccess(res, 'Call record deleted');
  } catch (error: any) {
    logger.error('Delete call error', { error: error.message });
    sendNotFound(res, error.message);
  }
}