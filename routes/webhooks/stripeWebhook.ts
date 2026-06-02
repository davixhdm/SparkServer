import { Router, Request, Response } from 'express';
import { verifyWebhookSignature, retrieveSession } from '../../services/external/stripeService';
import { processStripeWebhook } from '../../services/client/paymentService';
import { logger } from '../../utils/logger';

const router = Router();

// @desc    Stripe webhook handler
// @route   POST /api/v1/webhooks/stripe
// @access  Public (Stripe signature verified)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    const event = await verifyWebhookSignature(
      req.body,
      signature,
    );

    if (!event) {
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        if (session.client_reference_id && session.id) {
          await processStripeWebhook(
            session.id,
            session.payment_intent as string,
            session.client_reference_id,
          );
          logger.info('Stripe payment processed', {
            userId: session.client_reference_id,
            sessionId: session.id,
          });
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as any;
        logger.info('Stripe session expired', { sessionId: session.id });
        break;
      }

      default:
        logger.debug(`Unhandled Stripe event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    logger.error('Stripe webhook error', { error: error.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;