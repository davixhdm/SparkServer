import { Request, Response, NextFunction } from 'express';
import * as paymentsService from '../../services/admin/paymentsService';
import { sendSuccess, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Get pending activations
// @route   GET /api/v1/admin/payments/activations
// @access  Private/Admin
export async function getPendingActivations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await paymentsService.getPendingActivations(page, limit);
    sendSuccess(res, 'Pending activations fetched', result);
  } catch (error: any) {
    logger.error('Admin activations error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Approve activation
// @route   PATCH /api/v1/admin/payments/activations/:activationId/approve
// @access  Private/Admin
export async function approveActivation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await paymentsService.approveActivation(req.params.activationId, req.admin!.adminId, ipAddress);
    sendSuccess(res, 'Activation approved — blue tick active', result);
  } catch (error: any) {
    logger.error('Admin approve activation error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Reject activation
// @route   PATCH /api/v1/admin/payments/activations/:activationId/reject
// @access  Private/Admin
export async function rejectActivation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await paymentsService.rejectActivation(req.params.activationId, req.admin!.adminId, req.body.reason, ipAddress);
    sendSuccess(res, 'Activation rejected', result);
  } catch (error: any) {
    logger.error('Admin reject activation error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Revoke verification
// @route   POST /api/v1/admin/payments/revoke/:userId
// @access  Private/Admin
export async function revokeVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await paymentsService.revokeVerification(req.params.userId, req.admin!.adminId, req.body.reason);
    sendSuccess(res, 'Verification revoked', result);
  } catch (error: any) {
    logger.error('Admin revoke verification error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get payment stats
// @route   GET /api/v1/admin/payments/stats
// @access  Private/Admin
export async function getPaymentStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await paymentsService.getPaymentStats();
    sendSuccess(res, 'Payment stats fetched', stats);
  } catch (error: any) {
    logger.error('Admin payment stats error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get all payments
// @route   GET /api/v1/admin/payments
// @access  Private/Admin
export async function getAllPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      status: req.query.status as string,
      plan: req.query.plan as string,
      paymentMethod: req.query.paymentMethod as string,
    };
    const result = await paymentsService.getAllPayments(page, limit, filters);
    sendSuccess(res, 'Payments fetched', result);
  } catch (error: any) {
    logger.error('Admin get payments error', { error: error.message });
    sendNotFound(res, error.message);
  }
}