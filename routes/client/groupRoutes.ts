import { Router } from 'express';
import * as groupController from '../../controllers/client/groupController';
import { authMiddleware } from '../../middleware/client/authMiddleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

// Core Routes
router.get('/', groupController.getUserGroups);
router.post('/', groupController.createGroup);
router.get('/:groupId', groupController.getGroupById);
router.patch('/:groupId', groupController.updateGroup);

// Member Management
router.post('/:groupId/members', groupController.addMembers);
router.delete('/:groupId/members/:memberId', groupController.removeMember);
router.post('/:groupId/leave', groupController.leaveGroup);

// Admin Management
router.patch('/:groupId/admins/:memberId', groupController.toggleAdmin);

// Invite System
router.post('/:groupId/invite-link', groupController.generateInviteLink);
router.post('/join/:code', groupController.joinViaInvite);

// Settings
router.get('/:groupId/settings', groupController.getGroupSettings);
router.patch('/:groupId/privacy', groupController.updatePrivacySettings);
router.patch('/:groupId/permissions', groupController.updatePermissions);
router.patch('/:groupId/security', groupController.updateSecuritySettings);
router.patch('/:groupId/mute', groupController.toggleMute);

// Media
router.get('/:chatId/media', groupController.getGroupMedia);
router.post('/:groupId/icon', upload.single('icon'), groupController.uploadGroupIcon);

export default router;