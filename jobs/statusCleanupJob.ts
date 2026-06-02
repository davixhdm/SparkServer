import { Worker } from 'bullmq';
import { statusCleanupQueue } from './queue';
import { isRedisAvailable } from '../config/db';
import Status from '../models/client/Status';
import { deleteFile } from '../services/external/cloudinaryService';
import { logger } from '../utils/logger';

if (isRedisAvailable() && statusCleanupQueue) {
  const worker = new Worker(
    'spark:status:cleanup',
    async (job) => {
      logger.info('Status cleanup job started');

      try {
        const now = new Date();
        const expiredStatuses = await Status.find({
          expiresAt: { $lte: now },
          isDeleted: false,
        });

        let deletedCount = 0;

        for (const status of expiredStatuses) {
          try {
            if (status.mediaUrl) {
              const matches = status.mediaUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
              const publicId = matches ? matches[1] : null;
              if (publicId) {
                await deleteFile(publicId).catch(() => {});
              }
            }

            status.isDeleted = true;
            await status.save();
            deletedCount++;
          } catch (err) {
            logger.warn('Failed to clean up status', { statusId: status._id });
          }
        }

        logger.info(`Status cleanup completed: ${deletedCount} statuses removed`);
        return { deletedCount, total: expiredStatuses.length };
      } catch (error: any) {
        logger.error('Status cleanup job failed', { error: error.message });
        throw error;
      }
    },
    {
      connection: statusCleanupQueue.opts.connection,
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    logger.debug(`Status cleanup job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    logger.error(`Status cleanup job ${job?.id} failed`, { error: error.message });
  });
}