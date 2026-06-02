import { Queue } from 'bullmq';
import { isRedisAvailable } from '../config/db';
import { logger } from '../utils/logger';

let statusCleanupQueue: Queue | null = null;
let backupQueue: Queue | null = null;
let sessionCleanupQueue: Queue | null = null;
let blueTickExpiryQueue: Queue | null = null;
let messageSchedulerQueue: Queue | null = null;

function createQueueIfRedis(name: string): Queue | null {
  if (!isRedisAvailable()) {
    logger.warn(`Queue "${name}" skipped — Redis not available`);
    return null;
  }
  return new Queue(name, {
    connection: { host: 'localhost', port: 6379 },
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  });
}

export function initializeQueues(): void {
  statusCleanupQueue = createQueueIfRedis('spark-status-cleanup');
  backupQueue = createQueueIfRedis('spark-backup');
  sessionCleanupQueue = createQueueIfRedis('spark-session-cleanup');
  blueTickExpiryQueue = createQueueIfRedis('spark-bluetick-expiry');
  messageSchedulerQueue = createQueueIfRedis('spark-message-scheduler');

  if (isRedisAvailable()) {
    logger.info('All job queues initialized');
  } else {
    logger.warn('Job queues not initialized — Redis unavailable');
  }
}

export async function closeQueues(): Promise<void> {
  const queues = [
    statusCleanupQueue,
    backupQueue,
    sessionCleanupQueue,
    blueTickExpiryQueue,
    messageSchedulerQueue,
  ];

  for (const queue of queues) {
    if (queue) {
      try {
        await queue.close();
      } catch {
        // Queue close failed — non-critical
      }
    }
  }
}

export {
  statusCleanupQueue,
  backupQueue,
  sessionCleanupQueue,
  blueTickExpiryQueue,
  messageSchedulerQueue,
};