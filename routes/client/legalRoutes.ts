import { Router } from 'express';
import * as legalController from '../../controllers/client/legalController';

const router = Router();

router.get('/', legalController.getAllPublishedLegal);
router.get('/:type', legalController.getPublishedLegal);

export default router;