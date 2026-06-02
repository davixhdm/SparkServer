import { Request, Response, NextFunction } from 'express';
import * as paymentService from '../../services/client/paymentService';
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Initiate payment
// @route   POST /api/v1/payments/initiate
// @access  Private
export async function initiatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { plan, paymentMethod, phone, transactionRef } = req.body;
    const result = await paymentService.initiatePayment(req.user!.userId, plan, paymentMethod, { phone, transactionRef });
    sendCreated(res, 'Payment initiated', result);
  } catch (error: any) {
    logger.error('Initiate payment error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

// @desc    Confirm manual payment
// @route   POST /api/v1/payments/confirm
// @access  Private
export async function confirmManualPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { activationId, transactionReference } = req.body;
    const result = await paymentService.confirmManualPayment(activationId, req.user!.userId, transactionReference);
    sendSuccess(res, 'Payment confirmation submitted', result);
  } catch (error: any) {
    logger.error('Confirm payment error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

// @desc    Get activation status
// @route   GET /api/v1/payments/activations
// @access  Private
export async function getActivationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const activations = await paymentService.getActivationStatus(req.user!.userId);
    sendSuccess(res, 'Activation status fetched', activations);
  } catch (error: any) {
    logger.error('Get activation status error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get payment history
// @route   GET /api/v1/payments/history
// @access  Private
export async function getPaymentHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await paymentService.getPaymentHistory(req.user!.userId, page, limit);
    sendSuccess(res, 'Payment history fetched', result);
  } catch (error: any) {
    logger.error('Get payment history error', { error: error.message });
    sendNotFound(res, error.message);
  }
}