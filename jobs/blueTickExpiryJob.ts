import { Worker } from 'bullmq';
import { blueTickExpiryQueue } from './queue';
import { isRedisAvailable } from '../config/db';
import User from '../models/client/User';
import { sendBlueTickExpiryWarning } from '../services/external/brevoService';
import { logger } from '../utils/logger';

if (isRedisAvailable() && blueTickExpiryQueue) {
  const worker = new Worker(
    'spark:bluetick:expiry',
    async (job) => {
      logger.info('Blue tick expiry check started');

      try {
        const now = new Date();

        const expiredResult = await User.updateMany(
          {
            isHdmVerified: true,
            hdmVerifiedPlan: { $in: ['monthly', 'yearly'] },
            hdmVerifiedExpiresAt: { $lte: now, $ne: null },
          },
          {
            isHdmVerified: false,
            hdmVerifiedPlan: null,
            hdmVerifiedExpiresAt: null,
          },
        );

        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

        const expiringUsers = await User.find({
          isHdmVerified: true,
          hdmVerifiedPlan: { $in: ['monthly', 'yearly'] },
          hdmVerifiedExpiresAt: {
            $gte: twoDaysFromNow,
            $lte: threeDaysFromNow,
            $ne: null,
          },
        }).select('email displayName hdmVerifiedExpiresAt');

        for (const user of expiringUsers) {
          if (user.email && user.hdmVerifiedExpiresAt) {
            const daysLeft = Math.ceil(
              (user.hdmVerifiedExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );

            sendBlueTickExpiryWarning(user.email, user.displayName, daysLeft).catch(() => {});
          }
        }

        logger.info(
          `Blue tick expiry completed: ${expiredResult.modifiedCount || 0} expired, ${expiringUsers.length} warnings sent`,
        );

        return {
          expiredCount: expiredResult.modifiedCount || 0,
          warningsSent: expiringUsers.length,
        };
      } catch (error: any) {
        logger.error('Blue tick expiry job failed', { error: error.message });
        throw error;
      }
    },
    {
      connection: blueTickExpiryQueue.opts.connection,
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    logger.debug(`Blue tick expiry job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    logger.error(`Blue tick expiry job ${job?.id} failed`, { error: error.message });
  });
}