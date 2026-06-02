import Payment from '../../models/client/Payment';
import PendingActivation from '../../models/client/PendingActivation';
import User from '../../models/client/User';
import { createCheckoutSession } from '../external/stripeService';
import { stkPush } from '../external/mpesaService';
import { getSettings } from '../../config/settings';
import { sendBlueTickActivatedSms, sendBlueTickActivatedEmail } from '../external/brevoService';
import { logger } from '../../utils/logger';
import env from '../../config/env';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export async function initiatePayment(
  userId: string,
  plan: 'monthly' | 'yearly' | 'permanent',
  paymentMethod: string,
  options?: { phone?: string; transactionRef?: string },
): Promise<any> {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) throw new NotFoundError('User not found');

  const settings = getSettings();
  const planPrice = settings[`plan${plan.charAt(0).toUpperCase() + plan.slice(1)}Price` as keyof typeof settings] as number || env[`PLAN_${plan.toUpperCase()}_PRICE` as keyof typeof env] as number;

  // Create payment record
  const payment = await Payment.create({
    userId,
    plan,
    amount: planPrice,
    currency: settings.planCurrency || env.PLAN_CURRENCY,
    paymentMethod,
    status: 'pending',
  });

  let paymentUrl: string | null = null;
  let paymentDetails: any = {};

  if (paymentMethod === 'stripe') {
    const result = await createCheckoutSession(
      userId,
      plan,
      `${env.CLIENT_URL}/payment/success?paymentId=${payment._id}`,
      `${env.CLIENT_URL}/payment/cancel?paymentId=${payment._id}`,
    );
    paymentUrl = result.url;
    payment.stripeSessionId = result.sessionId || '';
    paymentDetails = { stripeSessionId: result.sessionId };
  } else if (paymentMethod === 'mpesa_stk_push') {
    if (!options?.phone) throw new BadRequestError('Phone number required for M-Pesa');
    const result = await stkPush(
      options.phone,
      planPrice,
      `SPARK-${payment._id.toString().slice(-8)}`,
      'HDM Verified',
    );
    payment.mpesaPhone = options.phone;
    payment.mpesaReference = result.checkoutRequestId;
    paymentDetails = {
      mpesaPhone: options.phone,
      mpesaReference: result.checkoutRequestId,
      merchantRequestId: result.merchantRequestId,
    };

    if (result.success) {
      // Auto-confirm for STK push when callback confirms
      payment.status = 'pending';
    }
  } else if (['mpesa_send_money', 'mpesa_paybill', 'mpesa_till'].includes(paymentMethod)) {
    if (options?.phone) payment.mpesaPhone = options.phone;
    if (options?.transactionRef) payment.mpesaReference = options.transactionRef;
    paymentDetails = {
      mpesaPhone: options?.phone || '',
      transactionReference: options?.transactionRef || '',
    };
  }

  await payment.save();

  // Create pending activation
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours for manual methods

  await PendingActivation.create({
    userId,
    paymentId: payment._id,
    plan,
    amount: planPrice,
    currency: settings.planCurrency || env.PLAN_CURRENCY,
    paymentMethod,
    paymentConfirmed: paymentMethod === 'stripe' || paymentMethod === 'mpesa_stk_push',
    paymentConfirmedBy: null,
    paymentDetails,
    status: 'pending',
    expiresAt,
  });

  return { payment, paymentUrl, paymentDetails };
}

export async function confirmManualPayment(
  activationId: string,
  userId: string,
  transactionReference?: string,
): Promise<any> {
  const activation = await PendingActivation.findOne({
    _id: activationId,
    userId,
    status: 'pending',
  });

  if (!activation) throw new NotFoundError('Pending activation not found');
  if (activation.expiresAt < new Date()) throw new BadRequestError('Payment window has expired');

  if (transactionReference) {
    activation.paymentDetails.transactionReference = transactionReference;
    await activation.save();
  }

  return activation;
}

export async function getActivationStatus(userId: string): Promise<any> {
  const activations = await PendingActivation.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return activations;
}

export async function getPaymentHistory(userId: string, page: number = 1, limit: number = 20): Promise<any> {
  const skip = (page - 1) * limit;

  const payments = await Payment.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Payment.countDocuments({ userId });

  return { payments, total, page, limit, hasMore: skip + limit < total };
}

export async function processStripeWebhook(
  sessionId: string,
  paymentIntentId: string,
  userId: string,
): Promise<void> {
  const payment = await Payment.findOne({ stripeSessionId: sessionId });
  if (!payment) return;

  payment.status = 'completed';
  payment.stripePaymentIntentId = paymentIntentId;
  payment.completedAt = new Date();
  await payment.save();

  await PendingActivation.findOneAndUpdate(
    { paymentId: payment._id },
    {
      paymentConfirmed: true,
      paymentConfirmedBy: 'stripe_webhook',
    },
  );
}

export async function processMpesaCallback(
  checkoutRequestId: string,
  resultCode: number,
  resultDesc: string,
  mpesaReceiptNumber?: string,
): Promise<void> {
  const payment = await Payment.findOne({ mpesaReference: checkoutRequestId });
  if (!payment) return;

  if (resultCode === 0) {
    payment.status = 'completed';
    payment.completedAt = new Date();
    if (mpesaReceiptNumber) payment.transactionId = mpesaReceiptNumber;
    await payment.save();

    await PendingActivation.findOneAndUpdate(
      { paymentId: payment._id },
      {
        paymentConfirmed: true,
        paymentConfirmedBy: 'mpesa_callback',
      },
    );
  } else {
    payment.status = 'failed';
    payment.gatewayResponse = { resultCode, resultDesc };
    await payment.save();
  }
}