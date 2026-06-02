import PendingActivation from '../../models/client/PendingActivation';
import Payment from '../../models/client/Payment';
import User from '../../models/client/User';
import ModerationLog from '../../models/admin/ModerationLog';
import { sendBlueTickActivatedEmail, sendBlueTickActivatedSms } from '../external/brevoService';
import { logger } from '../../utils/logger';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import env from '../../config/env';

export async function getPendingActivations(
  page: number = 1,
  limit: number = 20,
): Promise<any> {
  const skip = (page - 1) * limit;

  const activations = await PendingActivation.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'displayName phone email avatar')
    .populate('paymentId')
    .lean();

  const total = await PendingActivation.countDocuments({ status: 'pending' });

  return { activations, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function approveActivation(
  activationId: string,
  adminId: string,
  ipAddress?: string,
): Promise<any> {
  const activation = await PendingActivation.findById(activationId);
  if (!activation) throw new NotFoundError('Activation not found');
  if (activation.status !== 'pending') throw new BadRequestError('Activation already processed');

  const user = await User.findById(activation.userId);
  if (!user) throw new NotFoundError('User not found');

  // Calculate expiry
  let expiresAt: Date | null = null;
  if (activation.plan === 'monthly') {
    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  } else if (activation.plan === 'yearly') {
    expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  }

  // Update activation
  activation.status = 'approved';
  activation.reviewedBy = adminId;
  activation.reviewedAt = new Date();
  await activation.save();

  // Update user
  user.isHdmVerified = true;
  user.hdmVerifiedPlan = activation.plan;
  user.hdmVerifiedExpiresAt = expiresAt;
  await user.save();

  // Update payment
  await Payment.findByIdAndUpdate(activation.paymentId, {
    status: 'completed',
    completedAt: new Date(),
  });

  // Send notifications
  if (user.email) {
    sendBlueTickActivatedEmail(user.email, user.displayName, activation.plan, expiresAt).catch(() => {});
  }
  sendBlueTickActivatedSms(user.phone).catch(() => {});

  // Log
  await ModerationLog.create({
    adminId,
    action: 'verification_granted',
    targetType: 'user',
    targetId: user._id,
    details: `Plan: ${activation.plan}, Amount: ${activation.amount} ${activation.currency}`,
    ipAddress: ipAddress || '',
  });

  return { activation, user: user.toJSON() };
}

export async function rejectActivation(
  activationId: string,
  adminId: string,
  reason: string,
  ipAddress?: string,
): Promise<any> {
  const activation = await PendingActivation.findById(activationId);
  if (!activation) throw new NotFoundError('Activation not found');
  if (activation.status !== 'pending') throw new BadRequestError('Activation already processed');

  activation.status = 'rejected';
  activation.reviewedBy = adminId;
  activation.reviewedAt = new Date();
  activation.rejectionReason = reason;
  await activation.save();

  await Payment.findByIdAndUpdate(activation.paymentId, {
    status: 'cancelled',
  });

  await ModerationLog.create({
    adminId,
    action: 'verification_revoked',
    targetType: 'user',
    targetId: activation.userId,
    details: `Rejected: ${reason}`,
    ipAddress: ipAddress || '',
  });

  return activation;
}

export async function revokeVerification(
  userId: string,
  adminId: string,
  reason: string,
): Promise<any> {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  user.isHdmVerified = false;
  user.hdmVerifiedPlan = null;
  user.hdmVerifiedExpiresAt = null;
  await user.save();

  await ModerationLog.create({
    adminId,
    action: 'verification_revoked',
    targetType: 'user',
    targetId: userId,
    details: reason,
  });

  return user.toJSON();
}

export async function getPaymentStats(): Promise<any> {
  const stats = await Payment.aggregate([
    {
      $match: { status: 'completed' },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalPayments: { $sum: 1 },
        averageAmount: { $avg: '$amount' },
      },
    },
  ]);

  const byMethod = await Payment.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        revenue: { $sum: '$amount' },
      },
    },
  ]);

  const byPlan = await Payment.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$plan',
        count: { $sum: 1 },
        revenue: { $sum: '$amount' },
      },
    },
  ]);

  return {
    summary: stats[0] || { totalRevenue: 0, totalPayments: 0, averageAmount: 0 },
    byMethod,
    byPlan,
  };
}

export async function getAllPayments(
  page: number = 1,
  limit: number = 20,
  filters?: { status?: string; plan?: string; paymentMethod?: string },
): Promise<any> {
  const skip = (page - 1) * limit;
  const query: any = {};

  if (filters?.status) query.status = filters.status;
  if (filters?.plan) query.plan = filters.plan;
  if (filters?.paymentMethod) query.paymentMethod = filters.paymentMethod;

  const payments = await Payment.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'displayName phone email')
    .lean();

  const total = await Payment.countDocuments(query);

  return { payments, total, page, limit, totalPages: Math.ceil(total / limit) };
}