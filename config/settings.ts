import { getRedisClient } from './db';
import SettingsModel from '../models/admin/Settings';

interface AppSettings {
  hdmAiUrl: string;
  hdmAiKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  mpesaConsumerKey: string;
  mpesaConsumerSecret: string;
  mpesaPasskey: string;
  mpesaShortcode: string;
  mpesaReceivePhone: string;
  mpesaPaybillNumber: string;
  mpesaTillNumber: string;
  planMonthlyPrice: number;
  planYearlyPrice: number;
  planPermanentPrice: number;
  planCurrency: string;
  paymentMethods: {
    stripe: boolean;
    mpesaStkPush: boolean;
    mpesaSendMoney: boolean;
    mpesaPaybill: boolean;
    mpesaTill: boolean;
    paypal: boolean;
  };
  deeplinks: {
    sparkToVibe: Record<string, string>;
    vibeToSpark: Record<string, string>;
  };
}

let cachedSettings: AppSettings | null = null;
const CACHE_KEY = 'spark:app:settings';
const CACHE_TTL = 3600;

const defaultSettings: AppSettings = {
  hdmAiUrl: 'https://hdmai-server.onrender.com/api/v1',
  hdmAiKey: '',
  stripeSecretKey: '',
  stripeWebhookSecret: '',
  mpesaConsumerKey: '',
  mpesaConsumerSecret: '',
  mpesaPasskey: '',
  mpesaShortcode: '174379',
  mpesaReceivePhone: '0712345678',
  mpesaPaybillNumber: '247247',
  mpesaTillNumber: '123456',
  planMonthlyPrice: 4.99,
  planYearlyPrice: 39.99,
  planPermanentPrice: 99.99,
  planCurrency: 'USD',
  paymentMethods: {
    stripe: true,
    mpesaStkPush: true,
    mpesaSendMoney: true,
    mpesaPaybill: true,
    mpesaTill: true,
    paypal: false,
  },
  deeplinks: {
    sparkToVibe: {
      viewVibeProfile: 'vibe://profile?user={phone}',
      postMessageToVibe: 'vibe://create/post?text={content}&from=spark',
      sparkStatusToVibeStory: 'vibe://create/story?media={url}&from=spark',
      viewVibePost: 'vibe://post?id={postId}',
      openVibeExplore: 'vibe://explore',
    },
    vibeToSpark: {
      messageOnSpark: 'spark://chat/new?user={phone}',
      sharePostToSpark: 'spark://share?type=post&id={id}&from=vibe',
      shareReelToSpark: 'spark://share?type=reel&id={id}&from=vibe',
      shareMarketplaceToSpark: 'spark://share?type=listing&id={id}&from=vibe',
      inviteViaSpark: 'spark://broadcast?text={message}',
    },
  },
};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const redis = getRedisClient();
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      cachedSettings = JSON.parse(cached);
      return cachedSettings as AppSettings;
    }
  } catch {
    // Redis unavailable, fetch from MongoDB
  }

  try {
    const dbSettings = await SettingsModel.findOne().lean();
    if (dbSettings) {
      const settings: AppSettings = {
        hdmAiUrl: dbSettings.hdmAiUrl || defaultSettings.hdmAiUrl,
        hdmAiKey: dbSettings.hdmAiKey || defaultSettings.hdmAiKey,
        stripeSecretKey: dbSettings.stripeSecretKey || defaultSettings.stripeSecretKey,
        stripeWebhookSecret: dbSettings.stripeWebhookSecret || defaultSettings.stripeWebhookSecret,
        mpesaConsumerKey: dbSettings.mpesaConsumerKey || defaultSettings.mpesaConsumerKey,
        mpesaConsumerSecret: dbSettings.mpesaConsumerSecret || defaultSettings.mpesaConsumerSecret,
        mpesaPasskey: dbSettings.mpesaPasskey || defaultSettings.mpesaPasskey,
        mpesaShortcode: dbSettings.mpesaShortcode || defaultSettings.mpesaShortcode,
        mpesaReceivePhone: dbSettings.mpesaReceivePhone || defaultSettings.mpesaReceivePhone,
        mpesaPaybillNumber: dbSettings.mpesaPaybillNumber || defaultSettings.mpesaPaybillNumber,
        mpesaTillNumber: dbSettings.mpesaTillNumber || defaultSettings.mpesaTillNumber,
        planMonthlyPrice: dbSettings.planMonthlyPrice ?? defaultSettings.planMonthlyPrice,
        planYearlyPrice: dbSettings.planYearlyPrice ?? defaultSettings.planYearlyPrice,
        planPermanentPrice: dbSettings.planPermanentPrice ?? defaultSettings.planPermanentPrice,
        planCurrency: dbSettings.planCurrency || defaultSettings.planCurrency,
        paymentMethods: {
          stripe: dbSettings.paymentMethods?.stripe ?? defaultSettings.paymentMethods.stripe,
          mpesaStkPush:
            dbSettings.paymentMethods?.mpesaStkPush ?? defaultSettings.paymentMethods.mpesaStkPush,
          mpesaSendMoney:
            dbSettings.paymentMethods?.mpesaSendMoney ??
            defaultSettings.paymentMethods.mpesaSendMoney,
          mpesaPaybill:
            dbSettings.paymentMethods?.mpesaPaybill ?? defaultSettings.paymentMethods.mpesaPaybill,
          mpesaTill:
            dbSettings.paymentMethods?.mpesaTill ?? defaultSettings.paymentMethods.mpesaTill,
          paypal: dbSettings.paymentMethods?.paypal ?? defaultSettings.paymentMethods.paypal,
        },
        deeplinks: {
          sparkToVibe: dbSettings.deeplinks?.sparkToVibe || defaultSettings.deeplinks.sparkToVibe,
          vibeToSpark: dbSettings.deeplinks?.vibeToSpark || defaultSettings.deeplinks.vibeToSpark,
        },
      };

      try {
        const redis = getRedisClient();
        await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(settings));
      } catch {
        // Redis cache set failed, continue with DB settings
      }

      cachedSettings = settings;
      return settings;
    }
  } catch {
    // MongoDB unavailable, use defaults
  }

  cachedSettings = defaultSettings;
  return defaultSettings;
}

export function getSettings(): AppSettings {
  if (!cachedSettings) {
    return defaultSettings;
  }
  return cachedSettings;
}

export function getSettingsSync(): AppSettings {
  return cachedSettings || defaultSettings;
}

export async function refreshSettings(): Promise<AppSettings> {
  cachedSettings = null;
  try {
    const redis = getRedisClient();
    await redis.del(CACHE_KEY);
  } catch {
    // Redis unavailable
  }
  return loadSettings();
}

export default { loadSettings, getSettings, getSettingsSync, refreshSettings };