import { Request, Response, NextFunction } from 'express';
import Admin from '../../models/admin/Admin';
import { generateAdminAccessToken, generateAdminRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { sendSuccess, sendUnauthorized, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Admin login
// @route   POST /api/v1/admin/auth/login
// @access  Public
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      sendUnauthorized(res, 'Email and password required');
      return;
    }

    const admin = await Admin.findOne({ email, isActive: true }).select('+password');
    if (!admin) {
      sendUnauthorized(res, 'Invalid credentials');
      return;
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      sendUnauthorized(res, 'Invalid credentials');
      return;
    }

    const tokenPayload = {
      adminId: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    };

    const accessToken = generateAdminAccessToken(tokenPayload);
    const refreshToken = generateAdminRefreshToken(tokenPayload);

    admin.lastLogin = new Date();
    admin.lastIp = req.ip || req.socket.remoteAddress || '';
    admin.refreshToken = refreshToken;
    await admin.save();

    sendSuccess(res, 'Login successful', {
      admin: {
        adminId: admin._id,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    logger.error('Admin login error', { error: error.message });
    sendError(res, 'Login failed', 500);
  }
}

// @desc    Admin refresh token
// @route   POST /api/v1/admin/auth/refresh
// @access  Public
export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      sendUnauthorized(res, 'Refresh token required');
      return;
    }

    const decoded = verifyRefreshToken(refreshToken) as any;
    const admin = await Admin.findById(decoded.adminId).select('+refreshToken');

    if (!admin || !admin.isActive || admin.refreshToken !== refreshToken) {
      sendUnauthorized(res, 'Invalid refresh token');
      return;
    }

    const tokenPayload = {
      adminId: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    };

    const newAccessToken = generateAdminAccessToken(tokenPayload);
    const newRefreshToken = generateAdminRefreshToken(tokenPayload);

    admin.refreshToken = newRefreshToken;
    await admin.save();

    sendSuccess(res, 'Token refreshed', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    sendUnauthorized(res, 'Invalid or expired refresh token');
  }
}

// @desc    Admin logout
// @route   POST /api/v1/admin/auth/logout
// @access  Private/Admin
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await Admin.findByIdAndUpdate(req.admin!.adminId, { refreshToken: '' });
    sendSuccess(res, 'Logged out');
  } catch (error: any) {
    sendError(res, 'Logout failed', 500);
  }
}