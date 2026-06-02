import rateLimit from 'express-rate-limit';
import { getRedisClient } from '../../config/db';
import env from '../../config/env';
import { sendTooMany } from '../../utils/response';
import { Request, Response } from 'express';

let redisAvailable = false;

try {
  getRedisClient();
  redisAvailable = true;
} catch {
  redisAvailable = false;
}

// Create rate limiter with trust proxy support
function createRateLimiter(windowMs: number, max: number, message: string) {
  const config: any = {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message, error: message },
    handler(_req: Request, res: Response) {
      sendTooMany(res, message);
    },
    // Disable X-Forwarded-For validation for proxy environments (Render, Heroku, etc.)
    validate: {
      xForwardedForHeader: false,
    },
    // Skip failed requests to avoid counting errors
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
  };

  if (redisAvailable) {
    try {
      const RedisStore = require('rate-limit-redis');
      config.store = new RedisStore({
        sendCommand: (...args: any[]) => getRedisClient().call(...args),
        prefix: 'spark:ratelimit:',
      });
    } catch (error) {
      console.warn('Redis store failed, using memory store:', error);
    }
  }

  return rateLimit(config);
}

export const globalLimiter = createRateLimiter(
  env.RATE_LIMIT_WINDOW_MS,
  env.RATE_LIMIT_MAX_REQUESTS,
  'Too many requests. Please try again later.',
);

export const otpLimiter = createRateLimiter(
  15 * 60 * 1000,
  env.OTP_RATE_LIMIT_MAX,
  'Too many OTP requests. Please try again in 15 minutes.',
);

export const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  10,
  'Too many login attempts. Please try again in 15 minutes.',
);

export const messageLimiter = createRateLimiter(
  60 * 1000,
  30,
  'Too many messages. Please slow down.',
);

export const uploadLimiter = createRateLimiter(
  60 * 1000,
  10,
  'Too many uploads. Please try again shortly.',
);

export const searchLimiter = createRateLimiter(
  60 * 1000,
  20,
  'Too many searches. Please try again shortly.',
);