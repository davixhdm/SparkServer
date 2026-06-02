import { Request, Response, NextFunction } from 'express';
import Settings from '../../models/admin/Settings';
import { sendSuccess } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Get public settings (rates, methods, currency)
// @route   GET /api/v1/settings/public
// @access  Public
export async function getPublicSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await Settings.findOne().lean();
    if (!settings) {
      sendSuccess(res, 'Settings not available', {});
      return;
    }

    const symbols: Record<string, string> = { USD: '$', KES: 'KSh', EUR: '€', GBP: '£' };

    sendSuccess(res, 'Settings fetched', {
      planCurrency: settings.planCurrency || 'USD',
      currencySymbol: symbols[settings.planCurrency] || '$',
      planMonthlyPrice: settings.planMonthlyPrice,
      planYearlyPrice: settings.planYearlyPrice,
      planPermanentPrice: settings.planPermanentPrice,
      exchangeRates: settings.exchangeRates,
      paymentMethods: settings.paymentMethods,
      mpesaReceivePhone: settings.mpesaReceivePhone,
      mpesaPaybillNumber: settings.mpesaPaybillNumber,
      mpesaTillNumber: settings.mpesaTillNumber,
    });
  } catch (error: any) {
    logger.error('Get public settings error', { error: error.message });
    sendSuccess(res, 'Settings unavailable', {});
  }
}