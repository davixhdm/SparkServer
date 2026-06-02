import Settings from '../../models/admin/Settings';
import AiConfig from '../../models/admin/AiConfig';
import SoundPack from '../../models/admin/SoundPack';
import DeepLink from '../../models/client/DeepLink';
import { refreshSettings } from '../../config/settings';
import { logger } from '../../utils/logger';
import { NotFoundError } from '../../utils/errors';
import axios from 'axios';

export async function getSettings(): Promise<any> {
  const settings = await Settings.findOne().lean();
  if (!settings) {
    return Settings.create({});
  }
  return settings;
}

export async function updateSettings(updates: Record<string, any>): Promise<any> {
  const settings = await Settings.findOneAndUpdate(
    {},
    { $set: updates },
    { new: true, upsert: true },
  );
  try { await refreshSettings(); } catch {}
  return settings;
}

export async function updateCurrencyAndConvert(newCurrency: string): Promise<any> {
  const settings = await Settings.findOne();
  if (!settings) throw new Error('Settings not found');

  if (!['USD', 'KES', 'EUR', 'GBP'].includes(newCurrency)) {
    throw new Error('Invalid currency. Use: USD, KES, EUR, GBP');
  }

  let rates: Record<string, number> = {
    USD: 1,
    KES: 130,
    EUR: 0.92,
    GBP: 0.79,
  };

  try {
    const response = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 5000 });
    if (response.data?.rates) {
      rates = {
        USD: 1,
        KES: response.data.rates.KES || 130,
        EUR: response.data.rates.EUR || 0.92,
        GBP: response.data.rates.GBP || 0.79,
      };
    }
  } catch {
    logger.warn('Exchange rate API failed — using fallback rates');
  }

  const rate = rates[newCurrency] || 1;

  settings.planCurrency = newCurrency;
  settings.exchangeRates = {
    USD: 1,
    KES: rates.KES,
    EUR: rates.EUR,
    GBP: rates.GBP,
    lastUpdated: new Date(),
  };

  await settings.save();

  const symbol = getCurrencySymbol(newCurrency);

  return {
    currency: newCurrency,
    symbol,
    rate,
    convertedPrices: {
      monthly: parseFloat((settings.planMonthlyPrice * rate).toFixed(2)),
      yearly: parseFloat((settings.planYearlyPrice * rate).toFixed(2)),
      permanent: parseFloat((settings.planPermanentPrice * rate).toFixed(2)),
    },
    exchangeRates: settings.exchangeRates,
  };
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    KES: 'KSh',
    EUR: '€',
    GBP: '£',
  };
  return symbols[currency] || '$';
}

export function convertPrice(amountUSD: number, targetCurrency: string): { amount: number; symbol: string; formatted: string } {
  const rates: Record<string, number> = { USD: 1, KES: 130, EUR: 0.92, GBP: 0.79 };
  const rate = rates[targetCurrency] || 1;
  const converted = parseFloat((amountUSD * rate).toFixed(2));
  const symbol = getCurrencySymbol(targetCurrency);

  return {
    amount: converted,
    symbol,
    formatted: `${symbol} ${converted.toLocaleString()}`,
  };
}

export async function getAiConfig(): Promise<any> {
  const config = await AiConfig.findOne().lean();
  if (!config) return AiConfig.create({});
  return config;
}

export async function updateAiConfig(updates: Record<string, any>): Promise<any> {
  return AiConfig.findOneAndUpdate({}, { $set: updates }, { new: true, upsert: true });
}

export async function getSoundPacks(): Promise<any[]> {
  return SoundPack.find().sort({ downloads: -1 }).lean();
}

export async function createSoundPack(data: { name: string; description?: string; author?: string; coverImage?: string; sounds: Array<{ name: string; fileUrl: string; category: string; duration?: number; fileSize?: number }> }): Promise<any> {
  return SoundPack.create(data);
}

export async function updateSoundPack(packId: string, updates: Record<string, any>): Promise<any> {
  const pack = await SoundPack.findByIdAndUpdate(packId, updates, { new: true });
  if (!pack) throw new NotFoundError('Sound pack not found');
  return pack;
}

export async function deleteSoundPack(packId: string): Promise<void> {
  const pack = await SoundPack.findByIdAndDelete(packId);
  if (!pack) throw new NotFoundError('Sound pack not found');
}

export async function toggleSoundPackActive(packId: string, isActive: boolean): Promise<any> {
  const pack = await SoundPack.findByIdAndUpdate(packId, { isActive }, { new: true });
  if (!pack) throw new NotFoundError('Sound pack not found');
  return pack;
}