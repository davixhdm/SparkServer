import { Router } from 'express';
import * as userController from '../../controllers/client/userController';
import { authMiddleware } from '../../middleware/client/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/me', userController.getMe);
router.patch('/me', userController.updateProfile);
router.patch('/me/privacy', userController.updatePrivacy);
router.get('/me/sessions', userController.getSessions);
router.delete('/me/sessions/:sessionId', userController.logoutSession);
router.delete('/me', userController.deleteAccount);
router.delete('/me/permanent', userController.permanentlyDelete);
router.get('/:userId', userController.getUserById);
router.get('/phone/:phone', userController.getUserByPhone);
router.get('/username/:username', userController.getUserByUsername);

export default router;