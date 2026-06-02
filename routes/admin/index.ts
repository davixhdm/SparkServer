import { Router } from 'express';
import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import usersRoutes from './usersRoutes';
import reportsRoutes from './reportsRoutes';
import ticketsRoutes from './ticketsRoutes';
import moderationRoutes from './moderationRoutes';
import paymentsRoutes from './paymentsRoutes';
import settingsRoutes from './settingsRoutes';
import deeplinksRoutes from './deeplinksRoutes';
import backupRoutes from './backupRoutes';
import aiConfigRoutes from './aiConfigRoutes';
import legalRoutes from './legalRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/reports', reportsRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/moderation', moderationRoutes);
router.use('/payments', paymentsRoutes);
router.use('/settings', settingsRoutes);
router.use('/deeplinks', deeplinksRoutes);
router.use('/backups', backupRoutes);
router.use('/ai/config', aiConfigRoutes);
router.use('/legal', legalRoutes);

export default router;