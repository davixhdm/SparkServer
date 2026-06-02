import { Router } from 'express';
import * as deeplinkController from '../../controllers/client/deeplinkController';
import { authMiddleware } from '../../middleware/client/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/resolve', deeplinkController.resolveDeepLink);
router.get('/', deeplinkController.getDeepLinks);
router.get('/spark-to-vibe', deeplinkController.getSparkToVibeLinks);

export default router;