import { Router } from 'express';
import * as privacyController from '../../controllers/client/privacyController';
import { authMiddleware } from '../../middleware/client/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', privacyController.getPrivacy);
router.patch('/', privacyController.updatePrivacy);
router.post('/ghost-mode', privacyController.toggleGhostMode);
router.post('/freeze-last-seen', privacyController.freezeLastSeen);
router.post('/unfreeze-last-seen', privacyController.unfreezeLastSeen);
router.post('/profiles', privacyController.savePrivacyProfile);
router.post('/profiles/apply', privacyController.applyPrivacyProfile);
router.delete('/profiles/:profileName', privacyController.deletePrivacyProfile);
router.get('/contact/:contactId', privacyController.getPerContactPrivacy);

export default router;