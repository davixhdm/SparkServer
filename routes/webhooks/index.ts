import { Router } from 'express';
import stripeWebhook from './stripeWebhook';
import mpesaWebhook from './mpesaWebhook';

const router = Router();

router.use('/stripe', stripeWebhook);
router.use('/mpesa', mpesaWebhook);

export default router;