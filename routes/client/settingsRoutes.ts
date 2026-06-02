import { Router } from 'express';
import * as settingsController from '../../controllers/client/settingsController';

const router = Router();

router.get('/public', settingsController.getPublicSettings);

export default router;