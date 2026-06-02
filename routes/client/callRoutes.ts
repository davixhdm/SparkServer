import { Router } from 'express';
import * as callController from '../../controllers/client/callController';
import { authMiddleware } from '../../middleware/client/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/history', callController.getCallHistory);
router.post('/initiate', callController.initiateCall);
router.post('/group', callController.initiateGroupCall);
router.patch('/:callId', callController.updateCallStatus);
router.delete('/:callId', callController.deleteCallRecord);

export default router;