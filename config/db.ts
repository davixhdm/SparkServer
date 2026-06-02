import mongoose from 'mongoose';
import Redis from 'ioredis';
import env from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let redisAvailable = false;

// Helper to get Redis URL with multiple fallbacks
function getRedisUrl(): string {
  // Priority 1: Direct REDIS_URL from environment
  if (process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://localhost:6379') {
    logger.info(`Redis: Using REDIS_URL from env`);
    return process.env.REDIS_URL;
  }
  
  // Priority 2: From env config
  if (env.REDIS_URL && env.REDIS_URL !== 'redis://localhost:6379') {
    logger.info(`Redis: Using REDIS_URL from env config`);
    return env.REDIS_URL;
  }
  
  // Priority 3: Upstash REST URL converted to Redis protocol
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const restUrl = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    const host = restUrl.replace('https://', '').replace('.upstash.io', '');
    const redisUrl = `rediss://default:${token}@${host}.upstash.io:6379`;
    logger.info(`Redis: Using Upstash REST URL converted`);
    return redisUrl;
  }
  
  // Priority 4: Hardcoded Upstash fallback for Render
  const fallbackUrl = 'rediss://default:gQAAAAAAAYbYAAIgcDJmMDk1MTNhYjM2YWE0NjQ0YWY0MDRlOWFiZmUwNmU1Zg@daring-fowl-100056.upstash.io:6379';
  logger.info(`Redis: Using fallback Upstash URL`);
  return fallbackUrl;
}

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

    const dbHost = env.MONGODB_URI.split('@').pop() || 'localhost';
    logger.info(`MongoDB: Connected to ${dbHost}`);
  } catch (error) {
    logger.error('MongoDB: Failed to connect', { error });
    process.exit(1);
  }
}

export async function connectRedis(): Promise<Redis | null> {
  if (redisClient && redisAvailable) {
    return redisClient;
  }

  const redisUrl = getRedisUrl();
  
  if (!redisUrl) {
    logger.warn('Redis: No URL provided — running without cache');
    redisAvailable = false;
    return null;
  }

  const isTls = redisUrl.startsWith('rediss://') || process.env.REDIS_TLS === 'true';
  
  logger.info(`Redis: Connecting to ${redisUrl.substring(0, 50)}...`);

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) {
          logger.error(`Redis: Max retries reached (${times})`);
          return null;
        }
        const delay = Math.min(times * 1000, 5000);
        logger.warn(`Redis: Retry attempt ${times} in ${delay}ms`);
        return delay;
      },
      tls: isTls ? {} : undefined,
      connectTimeout: 10000,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis: Connection error', { error: err.message });
      redisAvailable = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis: Connected successfully');
      redisAvailable = true;
    });

    redisClient.on('close', () => {
      logger.warn('Redis: Connection closed');
      redisAvailable = false;
    });

    await redisClient.connect();
    await redisClient.ping();
    redisAvailable = true;

    const redisHost = redisUrl.split('@').pop() || 'Upstash';
    logger.info(`Redis: Connected to ${redisHost}`);
    return redisClient;
  } catch (error: any) {
    logger.error('Redis: Failed to connect', { error: error.message });
    if (redisClient) {
      try { redisClient.disconnect(); } catch {}
      redisClient = null;
    }
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
  } catch (error) {
    logger.warn('Redis: Disconnect failed', { error });
  }

  try {
    await mongoose.disconnect();
    logger.info('MongoDB: Disconnected');
  } catch (error) {
    logger.warn('MongoDB: Disconnect failed', { error });
  }
}