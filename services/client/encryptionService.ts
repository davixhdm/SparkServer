import crypto from 'crypto';
import env from '../../config/env';
import { logger } from '../../utils/logger';

const ALGORITHM = env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';
const KEY_LENGTH = env.ENCRYPTION_KEY_LENGTH || 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function generateKeyPair(): { publicKey: string; privateKey: string } {
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    return { publicKey, privateKey };
  } catch (error: any) {
    logger.error('Key pair generation failed', { error: error.message });
    throw new Error('Failed to generate encryption keys');
  }
}

export function generateSymmetricKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}

export function encryptMessage(plaintext: string, key: string): { encrypted: string; iv: string; authTag: string } {
  try {
    const keyBuffer = Buffer.from(key, 'base64');
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    } as any);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = (cipher as any).getAuthTag().toString('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag,
    };
  } catch (error: any) {
    logger.error('Encryption failed', { error: error.message });
    throw new Error('Failed to encrypt message');
  }
}

export function decryptMessage(
  encrypted: string,
  key: string,
  iv: string,
  authTag: string,
): string {
  try {
    const keyBuffer = Buffer.from(key, 'base64');
    const ivBuffer = Buffer.from(iv, 'hex');
    const authTagBuffer = Buffer.from(authTag, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer, {
      authTagLength: AUTH_TAG_LENGTH,
    } as any);

    (decipher as any).setAuthTag(authTagBuffer);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    logger.error('Decryption failed', { error: error.message });
    throw new Error('Failed to decrypt message');
  }
}

export function hashVerificationCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function generateVerificationCode(): string {
  return crypto.randomBytes(32).toString('hex');
}