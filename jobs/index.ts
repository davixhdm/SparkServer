import cron from 'node-cron';
import { isRedisAvailable } from '../config/db';
import {
  statusCleanupQueue,
  backupQueue,
  sessionCleanupQueue,
  blueTickExpiryQueue,
  messageSchedulerQueue,
} from './queue';
import { logger } from '../utils/logger';

// Import workers to register them
import './statusCleanupJob';
import './backupJob';
import './sessionCleanupJob';
import './blueTickExpiryJob';
import './messageSchedulerJob';

export function initializeCronJobs(): void {
  logger.info('Initializing cron jobs...');

  if (!isRedisAvailable()) {
    logger.warn('Cron jobs initialized but queues unavailable — jobs will run when Redis is connected');
  }

  // Status cleanup — every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    if (statusCleanupQueue) {
      try {
        await statusCleanupQueue.add('status-cleanup', {
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error('Failed to queue status cleanup', { error: error.message });
      }
    }
  });

  // Session cleanup — every hour
  cron.schedule('0 * * * *', async () => {
    if (sessionCleanupQueue) {
      try {
        await sessionCleanupQueue.add('session-cleanup', {
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error('Failed to queue session cleanup', { error: error.message });
      }
    }
  });

  // Auto-backup — daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    if (backupQueue) {
      try {
        await backupQueue.add('auto-backup', {
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error('Failed to queue auto-backup', { error: error.message });
      }
    }
  });

  // Blue tick expiry check — daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    if (blueTickExpiryQueue) {
      try {
        await blueTickExpiryQueue.add('bluetick-expiry', {
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error('Failed to queue blue tick expiry check', { error: error.message });
      }
    }
  });

  // Scheduled messages — every minute
  cron.schedule('* * * * *', async () => {
    if (messageSchedulerQueue) {
      try {
        await messageSchedulerQueue.add('message-scheduler', {
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error('Failed to queue message scheduler', { error: error.message });
      }
    }
  });

  logger.info('All cron jobs initialized');
}