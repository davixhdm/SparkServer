import User from '../../models/client/User';
import Session from '../../models/client/Session';
import Contact from '../../models/client/Contact';
import { generateOtp, storeOtp, verifyOtp } from '../../utils/otp';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import { sendOtpSms, sendVerificationEmail } from '../external/brevoService';
import { formatPhone, generateShortId } from '../../utils/helpers';
import { logger } from '../../utils/logger';
import env from '../../config/env';
import { BadRequestError, UnauthorizedError, ConflictError } from '../../utils/errors';

export async function sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
  try {
    const formattedPhone = formatPhone(phone);
    const otp = generateOtp();
    await storeOtp(formattedPhone, otp);

    const smsSent = await sendOtpSms(formattedPhone, otp);

    if (!smsSent && env.NODE_ENV === 'production') {
      throw new Error('Failed to send OTP SMS');
    }

    logger.info(`OTP sent to ${formattedPhone}${env.NODE_ENV !== 'production' ? `: ${otp}` : ''}`);

    return { success: true, message: 'OTP sent successfully' };
  } catch (error: any) {
    logger.error('Send OTP failed', { error: error.message });
    throw new Error('Failed to send OTP. Please try again.');
  }
}

export async function verifyOtpAndLogin(
  phone: string,
  otp: string,
  deviceInfo: any = {},
): Promise<{ user: any; accessToken: string; refreshToken: string; isNewUser: boolean }> {
  const formattedPhone = formatPhone(phone);

  const isValid = await verifyOtp(formattedPhone, otp);
  if (!isValid) {
    throw new BadRequestError('Invalid or expired OTP');
  }

  let user = await User.findOne({ phone: formattedPhone, isDeleted: false });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = await User.create({
      phone: formattedPhone,
      displayName: `User${formattedPhone.slice(-4)}`,
      isPhoneVerified: true,
    });

    await Contact.create({
      userId: user._id,
      contactPhone: formattedPhone,
      contactName: user.displayName,
      isOnSpark: true,
      isSynced: true,
    });
  }

  if (!user.isPhoneVerified) {
    user.isPhoneVerified = true;
    await user.save();
  }

  const tokenPayload = {
    userId: user._id.toString(),
    phone: user.phone,
    email: user.email,
    role: 'user',
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  const sessionCount = await Session.countDocuments({
    userId: user._id,
    isActive: true,
  });

  if (sessionCount >= env.SESSION_MAX_DEVICES) {
    await Session.findOneAndUpdate(
      { userId: user._id, isActive: true },
      { isActive: false, loggedOutAt: new Date() },
      { sort: { lastActivity: 1 } },
    );
  }

  await Session.create({
    userId: user._id,
    token: accessToken,
    refreshToken,
    deviceInfo: {
      deviceId: deviceInfo.deviceId || generateShortId(),
      deviceName: deviceInfo.deviceName || 'Unknown Device',
      deviceType: deviceInfo.deviceType || 'unknown',
      os: deviceInfo.os || 'unknown',
      browser: deviceInfo.browser || 'unknown',
      ip: deviceInfo.ip || '',
      location: deviceInfo.location || '',
    },
    lastActivity: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const userObj = user.toJSON();

  return { user: userObj, accessToken, refreshToken, isNewUser };
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    const session = await Session.findOne({
      userId: decoded.userId,
      refreshToken,
      isActive: true,
    });

    if (!session) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.isDeleted) {
      throw new UnauthorizedError('User not found');
    }

    const tokenPayload = {
      userId: user._id.toString(),
      phone: user.phone,
      email: user.email,
      role: 'user',
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    session.token = newAccessToken;
    session.refreshToken = newRefreshToken;
    session.lastActivity = new Date();
    await session.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error: any) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

export async function logout(
  userId: string,
  refreshToken?: string,
  deviceId?: string,
): Promise<void> {
  if (deviceId) {
    await Session.updateMany(
      { userId, 'deviceInfo.deviceId': deviceId, isActive: true },
      { isActive: false, loggedOutAt: new Date() },
    );
  } else if (refreshToken) {
    await Session.findOneAndUpdate(
      { userId, refreshToken, isActive: true },
      { isActive: false, loggedOutAt: new Date() },
    );
  } else {
    await Session.updateMany(
      { userId, isActive: true },
      { isActive: false, loggedOutAt: new Date() },
    );
  }
}

export async function logoutAllDevices(userId: string): Promise<void> {
  await Session.updateMany(
    { userId, isActive: true },
    { isActive: false, loggedOutAt: new Date() },
  );
}