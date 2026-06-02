import { Router } from 'express';
import * as contactController from '../../controllers/client/contactController';
import { authMiddleware } from '../../middleware/client/authMiddleware';

const router = Router();
router.use(authMiddleware);

router.get('/', contactController.getContacts);
router.post('/sync', contactController.syncContacts);
router.get('/search', contactController.searchContacts);
router.get('/blocked', contactController.getBlockedContacts);
router.get('/favorites', contactController.getFavoriteContacts);
router.get('/:contactId', contactController.getContactInfo);
router.patch('/:contactId/block', contactController.blockContact);
router.patch('/:contactId/unblock', contactController.unblockContact);
router.patch('/:contactId/favorite', contactController.addFavorite);
router.patch('/:contactId/unfavorite', contactController.removeFavorite);

export default router;