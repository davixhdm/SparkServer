import { Worker } from 'bullmq';
import { sessionCleanupQueue } from './queue';
import { isRedisAvailable } from '../config/db';
import Session from '../models/client/Session';
import { logger } from '../utils/logger';

if (isRedisAvailable() && sessionCleanupQueue) {
  const worker = new Worker(
    'spark:session:cleanup',
    async (job) => {
      logger.info('Session cleanup job started');

      try {
        const now = new Date();

        const idleResult = await Session.updateMany(
          {
            isActive: true,
            lastActivity: {
              $lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          {
            isActive: false,
            loggedOutAt: now,
          },
        );

        const expiredResult = await Session.updateMany(
          {
            isActive: true,
            expiresAt: { $lte: now },
          },
          {
            isActive: false,
            loggedOutAt: now,
          },
        );

        const totalCleaned = (idleResult.modifiedCount || 0) + (expiredResult.modifiedCount || 0);

        logger.info(`Session cleanup completed: ${totalCleaned} sessions cleaned`);
        return { cleanedCount: totalCleaned };
      } catch (error: any) {
        logger.error('Session cleanup job failed', { error: error.message });
        throw error;
      }
    },
    {
      connection: sessionCleanupQueue.opts.connection,
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    logger.debug(`Session cleanup job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    logger.error(`Session cleanup job ${job?.id} failed`, { error: error.message });
  });
}