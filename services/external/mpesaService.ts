import axios from 'axios';
import { getSettings } from '../../config/settings';
import env from '../../config/env';
import { logger } from '../../utils/logger';

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
}

function getMpesaConfig(): MpesaConfig {
  const settings = getSettings();
  return {
    consumerKey: settings.mpesaConsumerKey || env.MPESA_CONSUMER_KEY,
    consumerSecret: settings.mpesaConsumerSecret || env.MPESA_CONSUMER_SECRET,
    passkey: settings.mpesaPasskey || env.MPESA_PASSKEY,
    shortcode: settings.mpesaShortcode || env.MPESA_SHORTCODE,
  };
}

function getBaseUrl(): string {
  return env.NODE_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
}

async function getAccessToken(): Promise<string | null> {
  const config = getMpesaConfig();
  if (!config.consumerKey || !config.consumerSecret) {
    logger.warn('M-Pesa credentials not configured');
    return null;
  }

  try {
    const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');

    const response = await axios.get(
      `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        timeout: 10000,
      },
    );

    return response.data.access_token;
  } catch (error: any) {
    logger.error('M-Pesa access token generation failed', { error: error.message });
    return null;
  }
}

function generatePassword(shortcode: string, passkey: string): string {
  const timestamp = getTimestamp();
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export async function stkPush(
  phone: string,
  amount: number,
  accountReference: string,
  description: string,
): Promise<{
  success: boolean;
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string;
}> {
  const config = getMpesaConfig();
  const token = await getAccessToken();

  if (!token) {
    return {
      success: false,
      merchantRequestId: '',
      checkoutRequestId: '',
      responseCode: '1',
      responseDescription: 'Failed to get access token',
    };
  }

  try {
    const formattedPhone = phone.startsWith('254') ? phone : `254${phone.replace(/^0+/, '').replace('+', '')}`;
    const password = generatePassword(config.shortcode, config.passkey);

    const payload = {
      BusinessShortCode: config.shortcode,
      Password: password,
      Timestamp: getTimestamp(),
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: config.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${env.APP_URL}/api/v1/webhooks/mpesa/callback`,
      AccountReference: accountReference.substring(0, 12),
      TransactionDesc: description.substring(0, 13),
    };

    const response = await axios.post(
      `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    );

    return {
      success: response.data.ResponseCode === '0',
      merchantRequestId: response.data.MerchantRequestID || '',
      checkoutRequestId: response.data.CheckoutRequestID || '',
      responseCode: response.data.ResponseCode || '',
      responseDescription: response.data.ResponseDescription || '',
    };
  } catch (error: any) {
    logger.error('M-Pesa STK push failed', { error: error.response?.data || error.message });
    return {
      success: false,
      merchantRequestId: '',
      checkoutRequestId: '',
      responseCode: '1',
      responseDescription: error.response?.data?.errorMessage || error.message,
    };
  }
}

export async function queryStkStatus(checkoutRequestId: string): Promise<any> {
  const config = getMpesaConfig();
  const token = await getAccessToken();

  if (!token) return null;

  try {
    const password = generatePassword(config.shortcode, config.passkey);

    const payload = {
      BusinessShortCode: config.shortcode,
      Password: password,
      Timestamp: getTimestamp(),
      CheckoutRequestID: checkoutRequestId,
    };

    const response = await axios.post(
      `${getBaseUrl()}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      },
    );

    return response.data;
  } catch (error: any) {
    logger.error('M-Pesa STK status query failed', { error: error.message });
    return null;
  }
}