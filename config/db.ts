// config/db.ts
import mongoose from 'mongoose';
import Redis from 'ioredis';
import env from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let redisAvailable = false;

// DIRECT HARDCODED URL - Copy exactly as is
const REDIS_URL = 'rediss://default:gQAAAAAAAYbYAAIgcDJmMDk1MTNhYjM2YWE0NjQ0YWY0MDRlOWFiZmUwNmU1Zg@daring-fowl-100056.upstash.io:6379';

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

  console.log('⏳ Connecting to Redis on Render...');
  console.log('📍 Using Upstash Redis');

  try {
    redisClient = new Redis(REDIS_URL, {
      tls: {},
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        console.log(`🔄 Redis retry ${times}`);
        if (times > 5) {
          console.error('❌ Redis max retries reached');
          return null;
        }
        return Math.min(times * 2000, 10000);
      },
      connectTimeout: 15000,
    });

    redisClient.on('connect', () => {
      console.log('📡 Redis: Connecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis: Connected and ready!');
      redisAvailable = true;
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
      redisAvailable = false;
    });

    await redisClient.connect();
    const pong = await redisClient.ping();
    
    if (pong === 'PONG') {
      console.log('✅ Redis PONG received - Connected to Upstash!');
      redisAvailable = true;
      return redisClient;
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    console.error('❌ Redis connection failed:', error.message);
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