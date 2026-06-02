import { Worker } from 'bullmq';
import { backupQueue } from './queue';
import { isRedisAvailable } from '../config/db';
import { createSystemBackup } from '../services/admin/systemBackupService';
import { logger } from '../utils/logger';

if (isRedisAvailable() && backupQueue) {
  const worker = new Worker(
    'spark:backup',
    async (job) => {
      logger.info('Auto-backup job started');

      try {
        const backup = await createSystemBackup(
          'system',
          {
            backupType: 'full',
            includesMedia: false,
            compressionType: 'gzip',
          },
        );

        logger.info('Auto-backup completed', {
          backupId: backup._id,
          fileName: backup.fileName,
        });

        return { backupId: backup._id, fileName: backup.fileName };
      } catch (error: any) {
        logger.error('Auto-backup job failed', { error: error.message });
        throw error;
      }
    },
    {
      connection: backupQueue.opts.connection,
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    logger.debug(`Backup job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    logger.error(`Backup job ${job?.id} failed`, { error: error.message });
  });
}