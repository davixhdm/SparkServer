import { Worker } from 'bullmq';
import { messageSchedulerQueue } from './queue';
import { isRedisAvailable } from '../config/db';
import Message from '../models/client/Message';
import Chat from '../models/client/Chat';
import { logger } from '../utils/logger';

if (isRedisAvailable() && messageSchedulerQueue) {
  const worker = new Worker(
    'spark:message:scheduler',
    async (job) => {
      logger.info('Message scheduler job started');

      try {
        const now = new Date();

        const scheduledMessages = await Message.find({
          scheduledAt: { $lte: now, $ne: null },
          status: 'sent',
          isDeleted: false,
        });

        let sentCount = 0;

        for (const message of scheduledMessages) {
          try {
            await Chat.findByIdAndUpdate(message.chatId, {
              lastMessage: {
                content: message.content?.substring(0, 100) || '',
                senderId: message.senderId,
                messageType: message.messageType,
                createdAt: now,
              },
            });

            message.scheduledAt = null;
            message.createdAt = now;
            await message.save();

            sentCount++;
          } catch (err) {
            logger.warn('Failed to process scheduled message', {
              messageId: message._id,
              error: err,
            });
          }
        }

        logger.info(`Message scheduler completed: ${sentCount} messages sent`);
        return { sentCount, total: scheduledMessages.length };
      } catch (error: any) {
        logger.error('Message scheduler job failed', { error: error.message });
        throw error;
      }
    },
    {
      connection: messageSchedulerQueue.opts.connection,
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    logger.debug(`Message scheduler job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    logger.error(`Message scheduler job ${job?.id} failed`, { error: error.message });
  });
}