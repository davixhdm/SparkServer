import mongoose from 'mongoose';
import Redis from 'ioredis';
import env from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let redisAvailable = false;

export async function connectMongoDB(): Promise<void> {
  try {
    mongoose.connection.on('connecting', () => {
      logger.info('MongoDB: Connecting...');
    });

    mongoose.connection.on('connected', () => {
      logger.info('MongoDB: Connected successfully');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB: Disconnected');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB: Connection error', { error: error.message });
    });

    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    logger.info(`MongoDB: Connected to ${env.MONGODB_URI.split('@').pop() || 'localhost'}`);
  } catch (error) {
    logger.error('MongoDB: Failed to connect', { error });
    process.exit(1);
  }
}

export async function connectRedis(): Promise<Redis | null> {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisClient.on('error', () => {
      redisAvailable = false;
    });

    redisClient.on('close', () => {
      redisAvailable = false;
    });

    await redisClient.connect();
    await redisClient.ping();

    redisAvailable = true;

    logger.info(`Redis: Connected to ${env.REDIS_URL.split('@').pop() || 'localhost'}`);
    return redisClient;
  } catch {
    if (redisClient) {
      try { redisClient.disconnect(); } catch {}
      redisClient = null;
    }
    logger.warn('Redis: Not available — running without cache and queues');
    redisAvailable = false;
    return null;
  }
}

export function getRedisClient(): Redis {
  if (!redisClient || !redisAvailable) {
    throw new Error('Redis not available');
  }
  return redisClient;
}

export function isRedisAvailable(): boolean {
  return redisAvailable && redisClient !== null;
}

export async function disconnectDatabases(): Promise<void> {
  try {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
      redisAvailable = false;
      logger.info('Redis: Disconnected');
    }
  } catch {
    // Redis disconnect failed — non-critical
  }

  try {
    await mongoose.disconnect();
    logger.info('MongoDB: Disconnected');
  } catch {
    // MongoDB disconnect failed
  }
}