import { Router } from 'express';
import * as reportController from '../../controllers/client/reportController';
import { authMiddleware } from '../../middleware/client/authMiddleware';

const router = Router();
router.use(authMiddleware);

router.get('/', reportController.getMyReports);
router.post('/', reportController.createReport);

export default router;