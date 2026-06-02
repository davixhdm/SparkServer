import { Router } from 'express';
import * as uploadController from '../../controllers/client/uploadController';
import { authMiddleware } from '../../middleware/client/authMiddleware';
import { uploadSingle } from '../../middleware/client/uploadMiddleware';

const router = Router();

router.use(authMiddleware);
router.post('/', uploadSingle, uploadController.uploadMedia);

export default router;