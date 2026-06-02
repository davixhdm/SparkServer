import { Router, Request, Response } from 'express';
import { processMpesaCallback } from '../../services/client/paymentService';
import { logger } from '../../utils/logger';

const router = Router();

// @desc    M-Pesa STK Push callback
// @route   POST /api/v1/webhooks/mpesa/callback
// @access  Public (Safaricom IPs)
router.post('/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
    logger.info('M-Pesa callback received', { body: JSON.stringify(body).substring(0, 500) });

    const stkCallback = body?.Body?.stkCallback;

    if (!stkCallback) {
      res.json({ ResultCode: 1, ResultDesc: 'Invalid callback payload' });
      return;
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
    } = stkCallback;

    const mpesaReceiptNumber =
      stkCallback.CallbackMetadata?.Item?.find(
        (item: any) => item.Name === 'MpesaReceiptNumber',
      )?.Value || undefined;

    await processMpesaCallback(
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      mpesaReceiptNumber,
    );

    // Always respond success to Safaricom
    res.json({ ResultCode: 0, ResultDesc: 'Callback processed successfully' });
  } catch (error: any) {
    logger.error('M-Pesa webhook error', { error: error.message });
    res.json({ ResultCode: 0, ResultDesc: 'Callback received' });
  }
});

// @desc    M-Pesa confirmation URL (GET)
// @route   GET /api/v1/webhooks/mpesa/confirmation
// @access  Public
router.get('/confirmation', (_req: Request, res: Response): void => {
  res.json({ ResultCode: 0, ResultDesc: 'Confirmation endpoint active' });
});

// @desc    M-Pesa validation URL (GET)
// @route   GET /api/v1/webhooks/mpesa/validation
// @access  Public
router.get('/validation', (_req: Request, res: Response): void => {
  res.json({ ResultCode: 0, ResultDesc: 'Validation endpoint active' });
});

export default router;