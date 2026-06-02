import { getRedisClient, isRedisAvailable } from '../config/db';
import env from '../config/env';

const memoryStore: Map<string, { otp: string; expiresAt: number; attempts: number }> = new Map();

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeOtp(phone: string, otp: string): Promise<void> {
  if (isRedisAvailable()) {
    try {
      const redis = getRedisClient();
      const key = `spark:otp:${phone}`;
      await redis.setex(key, env.OTP_EXPIRE_MINUTES * 60, otp);
      return;
    } catch {
      // Fall through to memory store
    }
  }

  memoryStore.set(phone, {
    otp,
    expiresAt: Date.now() + env.OTP_EXPIRE_MINUTES * 60 * 1000,
    attempts: 0,
  });
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  if (isRedisAvailable()) {
    try {
      const redis = getRedisClient();
      const key = `spark:otp:${phone}`;
      const storedOtp = await redis.get(key);

      if (!storedOtp) return false;

      if (storedOtp !== otp) {
        const attemptsKey = `spark:otp:attempts:${phone}`;
        const attempts = await redis.incr(attemptsKey);
        await redis.expire(attemptsKey, env.OTP_EXPIRE_MINUTES * 60);

        if (attempts >= env.OTP_MAX_ATTEMPTS) {
          await redis.del(key);
          await redis.del(attemptsKey);
          throw new Error('Max OTP attempts reached. Request a new OTP.');
        }
        return false;
      }

      await redis.del(key);
      const attemptsKey = `spark:otp:attempts:${phone}`;
      await redis.del(attemptsKey);
      return true;
    } catch (error: any) {
      if (error.message === 'Max OTP attempts reached. Request a new OTP.') throw error;
      // Fall through to memory store
    }
  }

  // In-memory verification
  const stored = memoryStore.get(phone);

  if (!stored || Date.now() > stored.expiresAt) {
    memoryStore.delete(phone);
    return false;
  }

  if (stored.otp !== otp) {
    stored.attempts++;
    if (stored.attempts >= env.OTP_MAX_ATTEMPTS) {
      memoryStore.delete(phone);
      throw new Error('Max OTP attempts reached. Request a new OTP.');
    }
    return false;
  }

  memoryStore.delete(phone);
  return true;
}