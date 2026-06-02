import { Request, Response, NextFunction } from 'express';
import * as authService from '../../services/client/authService';
import { sendSuccess, sendCreated, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Send OTP to phone number
// @route   POST /api/v1/auth/send-otp
// @access  Public
export async function sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone } = req.body;
    const result = await authService.sendOtp(phone);
    sendSuccess(res, result.message);
  } catch (error: any) {
    logger.error('Send OTP error', { error: error.message });
    sendError(res, error.message, error.statusCode || 500);
  }
}

// @desc    Verify OTP and login/register
// @route   POST /api/v1/auth/verify-otp
// @access  Public
export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone, otp, deviceInfo } = req.body;
    const result = await authService.verifyOtpAndLogin(phone, otp, deviceInfo);
    sendSuccess(res, result.isNewUser ? 'Account created successfully' : 'Login successful', result);
  } catch (error: any) {
    logger.error('Verify OTP error', { error: error.message });
    sendError(res, error.message, error.statusCode || 400);
  }
}

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Public
export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    sendSuccess(res, 'Token refreshed', result);
  } catch (error: any) {
    logger.error('Refresh token error', { error: error.message });
    sendError(res, error.message, error.statusCode || 401);
  }
}

// @desc    Logout current device
// @route   POST /api/v1/auth/logout
// @access  Private
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken, deviceId } = req.body;
    await authService.logout(req.user!.userId, refreshToken, deviceId);
    sendSuccess(res, 'Logged out successfully');
  } catch (error: any) {
    logger.error('Logout error', { error: error.message });
    sendError(res, error.message, 500);
  }
}

// @desc    Logout all devices
// @route   POST /api/v1/auth/logout-all
// @access  Private
export async function logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.logoutAllDevices(req.user!.userId);
    sendSuccess(res, 'Logged out from all devices');
  } catch (error: any) {
    logger.error('Logout all error', { error: error.message });
    sendError(res, error.message, 500);
  }
}