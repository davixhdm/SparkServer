import Stripe from 'stripe';
import { getSettings } from '../../config/settings';
import env from '../../config/env';
import { logger } from '../../utils/logger';

function getStripe(): Stripe | null {
  try {
    const settings = getSettings();
    const secretKey = settings.stripeSecretKey || env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      logger.warn('Stripe secret key not configured');
      return null;
    }

    return new Stripe(secretKey, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
  } catch {
    return null;
  }
}

export async function createCheckoutSession(
  userId: string,
  plan: 'monthly' | 'yearly' | 'permanent',
  successUrl: string,
  cancelUrl: string,
): Promise<{ url: string | null; sessionId: string | null }> {
  const stripe = getStripe();
  if (!stripe) return { url: null, sessionId: null };

  try {
    const priceMap: Record<string, string> = {
      monthly: env.PLAN_MONTHLY_PRICE.toString(),
      yearly: env.PLAN_YEARLY_PRICE.toString(),
      permanent: env.PLAN_PERMANENT_PRICE.toString(),
    };

    const nameMap: Record<string, string> = {
      monthly: 'HDM Verified — Monthly',
      yearly: 'HDM Verified — Yearly',
      permanent: 'HDM Verified — Permanent',
    };

    const priceInCents = Math.round(parseFloat(priceMap[plan]) * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: undefined,
      client_reference_id: userId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price_data: {
            currency: (env.PLAN_CURRENCY || 'usd').toLowerCase(),
            product_data: {
              name: nameMap[plan],
              description: `HDM Verified Blue Tick — ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        plan,
        platform: 'spark',
      },
    });

    return { url: session.url, sessionId: session.id };
  } catch (error: any) {
    logger.error('Stripe checkout session creation failed', { error: error.message });
    return { url: null, sessionId: null };
  }
}

export async function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
): Promise<Stripe.Event | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    const settings = getSettings();
    const webhookSecret = settings.stripeWebhookSecret || env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('Stripe webhook secret not configured');
      return null;
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error: any) {
    logger.error('Stripe webhook verification failed', { error: error.message });
    return null;
  }
}

export async function retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error: any) {
    logger.error('Stripe session retrieval failed', { sessionId, error: error.message });
    return null;
  }
}