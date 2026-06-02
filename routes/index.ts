import { Router } from 'express';
import clientRoutes from './client/index';
import adminRoutes from './admin/index';
import webhookRoutes from './webhooks/index';

const router = Router();

router.use('/v1', clientRoutes);
router.use('/v1/admin', adminRoutes);
router.use('/v1/webhooks', webhookRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Spark server is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;