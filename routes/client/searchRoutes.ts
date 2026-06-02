import { Router } from 'express';
import * as searchController from '../../controllers/client/searchController';
import { authMiddleware } from '../../middleware/client/authMiddleware';
import { searchLimiter } from '../../middleware/client/rateLimiterMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', searchLimiter, searchController.globalSearch);
router.get('/ai', searchController.aiSearch);

export default router;