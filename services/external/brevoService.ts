import axios from 'axios';
import env from '../../config/env';
import { logger } from '../../utils/logger';

const BREVO_API_URL = 'https://api.brevo.com/v3';

const brevoClient = axios.create({
  baseURL: BREVO_API_URL,
  headers: {
    'api-key': env.BREVO_API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  attachments?: Array<{
    name: string;
    content: string;
    contentType?: string;
  }>;
}

interface SmsOptions {
  to: string;
  content: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId: string }> {
  if (!env.BREVO) {
    logger.warn('Brevo is disabled — email not sent', { to: options.to, subject: options.subject });
    return { success: false, messageId: '' };
  }

  if (!env.BREVO_API_KEY) {
    logger.warn('Brevo API key not configured — email not sent');
    return { success: false, messageId: '' };
  }

  try {
    const response = await brevoClient.post('/smtp/email', {
      sender: {
        name: env.BREVO_SENDER_NAME,
        email: env.BREVO_SENDER_EMAIL,
      },
      to: [
        {
          email: options.to,
          name: options.toName || options.to,
        },
      ],
      subject: options.subject,
      htmlContent: options.htmlContent,
      textContent: options.textContent || '',
      attachment: options.attachments || [],
    });

    logger.info('Email sent successfully', { to: options.to, messageId: response.data.messageId });
    return { success: true, messageId: response.data.messageId };
  } catch (error: any) {
    logger.error('Failed to send email', {
      to: options.to,
      error: error.response?.data || error.message,
    });
    return { success: false, messageId: '' };
  }
}

export async function sendSms(options: SmsOptions): Promise<{ success: boolean; messageId: string }> {
  if (!env.BREVO) {
    logger.warn('Brevo is disabled — SMS not sent', { to: options.to });
    return { success: false, messageId: '' };
  }

  if (!env.BREVO_API_KEY) {
    logger.warn('Brevo API key not configured — SMS not sent');
    return { success: false, messageId: '' };
  }

  try {
    const response = await brevoClient.post('/transactionalSMS/sms', {
      sender: env.BREVO_SMS_SENDER,
      recipient: options.to,
      content: options.content,
    });

    logger.info('SMS sent successfully', { to: options.to, messageId: response.data.messageId });
    return { success: true, messageId: response.data.messageId };
  } catch (error: any) {
    logger.error('Failed to send SMS', {
      to: options.to,
      error: error.response?.data || error.message,
    });
    return { success: false, messageId: '' };
  }
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  otp: string,
): Promise<boolean> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1A73E8; margin: 0;">Spark</h1>
        <p style="color: #666; font-size: 14px;">Powered by HDM</p>
      </div>
      <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; text-align: center;">
        <h2 style="color: #333; margin-top: 0;">Verify Your Email</h2>
        <p style="color: #555; font-size: 16px;">Hello ${name},</p>
        <p style="color: #555; font-size: 16px;">Use the code below to verify your email address:</p>
        <div style="background: #1A73E8; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px 30px; border-radius: 8px; display: inline-block; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #999; font-size: 13px;">This code expires in ${env.OTP_EXPIRE_MINUTES} minutes.</p>
        <p style="color: #999; font-size: 13px;">If you didn't request this, please ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">Spark Messenger — HDM Family</p>
        <p style="color: #999; font-size: 12px;">Secure. Private. Yours.</p>
      </div>
    </div>
  `;

  const result = await sendEmail({
    to: email,
    toName: name,
    subject: `Spark — Verify Your Email (${otp})`,
    htmlContent,
  });

  return result.success;
}

export async function sendOtpSms(phone: string, otp: string): Promise<boolean> {
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  const result = await sendSms({
    to: formattedPhone,
    content: `${otp} is your Spark verification code. Valid for ${env.OTP_EXPIRE_MINUTES} minutes. Powered by HDM.`,
  });

  return result.success;
}

export async function sendBlueTickActivatedEmail(
  email: string,
  name: string,
  plan: string,
  expiresAt: Date | null,
): Promise<boolean> {
  const expiryText = expiresAt
    ? `Your blue tick is active until ${expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`
    : 'Your blue tick is permanent and will never expire.';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1A73E8; margin: 0;">Spark</h1>
        <p style="color: #666; font-size: 14px;">Powered by HDM</p>
      </div>
      <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
        <h2 style="color: #1A73E8; margin-top: 0;">HDM Verified Activated!</h2>
        <p style="color: #555; font-size: 16px;">Congratulations ${name},</p>
        <p style="color: #555; font-size: 16px;">Your HDM Verified blue tick is now active on your Spark profile.</p>
        <div style="background: white; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #333; margin: 5px 0;"><strong>Plan:</strong> ${plan.charAt(0).toUpperCase() + plan.slice(1)}</p>
          <p style="color: #333; margin: 5px 0;">${expiryText}</p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">Spark Messenger — HDM Family</p>
      </div>
    </div>
  `;

  const result = await sendEmail({
    to: email,
    toName: name,
    subject: 'Spark — HDM Verified Blue Tick Activated! ✅',
    htmlContent,
  });

  return result.success;
}

export async function sendBlueTickActivatedSms(phone: string): Promise<boolean> {
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  const result = await sendSms({
    to: formattedPhone,
    content: '✅ HDM Verified activated! Your blue tick is now visible on your Spark profile. Powered by HDM.',
  });

  return result.success;
}

export async function sendBlueTickExpiryWarning(
  email: string,
  name: string,
  daysLeft: number,
): Promise<boolean> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1A73E8; margin: 0;">Spark</h1>
        <p style="color: #666; font-size: 14px;">Powered by HDM</p>
      </div>
      <div style="background: #fff3cd; border-radius: 12px; padding: 30px; text-align: center; border: 1px solid #ffc107;">
        <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <h2 style="color: #856404; margin-top: 0;">HDM Verified Expiring Soon</h2>
        <p style="color: #555; font-size: 16px;">Hello ${name},</p>
        <p style="color: #555; font-size: 16px;">Your HDM Verified blue tick will expire in <strong>${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>.</p>
        <p style="color: #555; font-size: 16px;">Renew now to keep your verification badge active.</p>
        <a href="${env.CLIENT_URL}/settings/verification" style="display: inline-block; background: #1A73E8; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; margin-top: 15px; font-weight: bold;">Renew Now</a>
      </div>
    </div>
  `;

  const result = await sendEmail({
    to: email,
    toName: name,
    subject: `Spark — HDM Verified Expires in ${daysLeft} Day${daysLeft > 1 ? 's' : ''}`,
    htmlContent,
  });

  return result.success;
}