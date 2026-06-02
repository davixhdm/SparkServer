// config/env.ts
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

interface EnvConfig {
  // App
  NODE_ENV: string;
  PORT: number;
  APP_NAME: string;
  APP_VERSION: string;
  APP_URL: string;

  // Client URLs
  CLIENT_URL: string;
  ADMIN_URL: string;

  // MongoDB
  MONGODB_URI: string;

  // Redis
  REDIS_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRE: string;

  // Feature Flags
  BREVO: boolean;
  CLOUDINARY: boolean;
  FIREBASE: boolean;
  HDM_AI: boolean;

  // Brevo
  BREVO_API_KEY: string;
  BREVO_SENDER_EMAIL: string;
  BREVO_SENDER_NAME: string;
  BREVO_SMS_SENDER: string;

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  CLOUDINARY_UPLOAD_FOLDER: string;
  CLOUDINARY_MAX_FILE_SIZE: number;

  // Firebase
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_CLIENT_ID: string;
  FIREBASE_AUTH_URI: string;
  FIREBASE_TOKEN_URI: string;
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL: string;
  FIREBASE_CLIENT_X509_CERT_URL: string;

  // HDM AI
  HDM_AI_URL: string;
  HDM_AI_KEY: string;

  // Encryption
  ENCRYPTION_ALGORITHM: string;
  ENCRYPTION_KEY_LENGTH: number;

  // WebSocket
  WS_PING_INTERVAL: number;
  WS_PING_TIMEOUT: number;

  // OTP
  OTP_LENGTH: number;
  OTP_EXPIRE_MINUTES: number;
  OTP_MAX_ATTEMPTS: number;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  OTP_RATE_LIMIT_MAX: number;

  // File Upload
  MAX_FILE_SIZE: number;
  ALLOWED_IMAGE_TYPES: string[];
  ALLOWED_VIDEO_TYPES: string[];
  ALLOWED_DOC_TYPES: string[];

  // Backup
  BACKUP_RETENTION_DAYS: number;
  BACKUP_MAX_SIZE_MB: number;
  BACKUP_ENCRYPTION_ENABLED: boolean;

  // Status
  STATUS_EXPIRE_HOURS: number;
  STATUS_MAX_VIDEO_DURATION: number;
  STATUS_MAX_IMAGES: number;

  // Group
  GROUP_MAX_MEMBERS: number;
  GROUP_MAX_ADMINS: number;
  GROUP_MAX_PINNED_MESSAGES: number;

  // Message
  MESSAGE_EDIT_WINDOW_MINUTES: number;
  MESSAGE_DELETE_FOR_EVERYONE_WINDOW_HOURS: number;
  MESSAGE_MAX_FORWARD_COUNT: number;

  // Session
  SESSION_MAX_DEVICES: number;
  SESSION_IDLE_TIMEOUT_DAYS: number;

  // Payment
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  MPESA_CONSUMER_KEY: string;
  MPESA_CONSUMER_SECRET: string;
  MPESA_PASSKEY: string;
  MPESA_SHORTCODE: string;
  MPESA_RECEIVE_PHONE: string;
  MPESA_PAYBILL_NUMBER: string;
  MPESA_TILL_NUMBER: string;

  // Plans
  PLAN_MONTHLY_PRICE: number;
  PLAN_YEARLY_PRICE: number;
  PLAN_PERMANENT_PRICE: number;
  PLAN_CURRENCY: string;

  // Admin
  ADMIN_DEFAULT_EMAIL: string;
  ADMIN_DEFAULT_PASSWORD: string;
  SUPER_ADMIN_EMAIL: string;

  // Logging
  LOG_LEVEL: string;
  LOG_FILE_PATH: string;

  // CORS
  CORS_ORIGINS: string[];
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvBool(key: string, defaultValue?: string): boolean {
  const value = process.env[key] || defaultValue || 'false';
  return value.toLowerCase() === 'true';
}

function getEnvNumber(key: string, defaultValue?: string): number {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
  }
  return num;
}

function getEnvArray(key: string, defaultValue?: string): string[] {
  const value = process.env[key] || defaultValue || '';
  return value.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
}

// Helper to get Redis URL with priority
function getRedisUrl(): string {
  // Priority 1: Direct REDIS_URL from environment
  if (process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://localhost:6379') {
    return process.env.REDIS_URL;
  }
  
  // Priority 2: Upstash REST URL converted to Redis protocol
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const restUrl = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (restUrl && token) {
      const host = restUrl.replace('https://', '').replace('.upstash.io', '');
      return `rediss://default:${token}@${host}.upstash.io:6379`;
    }
  }
  
  // Priority 3: Render external URL fallback
  if (process.env.RENDER_EXTERNAL_URL) {
    // Use the hardcoded Upstash URL as fallback for Render
    return 'rediss://default:gQAAAAAAAYbYAAIgcDJmMDk1MTNhYjM2YWE0NjQ0YWY0MDRlOWFiZmUwNmU1Zg@daring-fowl-100056.upstash.io:6379';
  }
  
  // Priority 4: Default from .env or localhost
  return process.env.REDIS_URL || 'redis://localhost:6379';
}

const env: EnvConfig = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: getEnvNumber('PORT', '5000'),
  APP_NAME: getEnv('APP_NAME', 'Spark'),
  APP_VERSION: getEnv('APP_VERSION', '1.0.0'),
  APP_URL: getEnv('APP_URL', 'http://localhost:5000'),

  CLIENT_URL: getEnv('CLIENT_URL', 'http://localhost:3000'),
  ADMIN_URL: getEnv('ADMIN_URL', 'http://localhost:3001'),

  MONGODB_URI: getEnv('MONGODB_URI', 'mongodb://localhost:27017/spark_db'),
  REDIS_URL: getRedisUrl(),  // ← Use the helper function

  JWT_SECRET: getEnv('JWT_SECRET'),
  JWT_EXPIRE: getEnv('JWT_EXPIRE', '7d'),
  JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRE: getEnv('JWT_REFRESH_EXPIRE', '30d'),

  BREVO: getEnvBool('BREVO', 'true'),
  CLOUDINARY: getEnvBool('CLOUDINARY', 'true'),
  FIREBASE: getEnvBool('FIREBASE', 'true'),
  HDM_AI: getEnvBool('HDM_AI', 'true'),

  BREVO_API_KEY: getEnv('BREVO_API_KEY', ''),
  BREVO_SENDER_EMAIL: getEnv('BREVO_SENDER_EMAIL', 'noreply@spark.hdm.com'),
  BREVO_SENDER_NAME: getEnv('BREVO_SENDER_NAME', 'Spark'),
  BREVO_SMS_SENDER: getEnv('BREVO_SMS_SENDER', 'Spark'),

  CLOUDINARY_CLOUD_NAME: getEnv('CLOUDINARY_CLOUD_NAME', ''),
  CLOUDINARY_API_KEY: getEnv('CLOUDINARY_API_KEY', ''),
  CLOUDINARY_API_SECRET: getEnv('CLOUDINARY_API_SECRET', ''),
  CLOUDINARY_UPLOAD_FOLDER: getEnv('CLOUDINARY_UPLOAD_FOLDER', 'spark'),
  CLOUDINARY_MAX_FILE_SIZE: getEnvNumber('CLOUDINARY_MAX_FILE_SIZE', '2097152000'),

  FIREBASE_PROJECT_ID: getEnv('FIREBASE_PROJECT_ID', ''),
  FIREBASE_PRIVATE_KEY_ID: getEnv('FIREBASE_PRIVATE_KEY_ID', ''),
  FIREBASE_PRIVATE_KEY: getEnv('FIREBASE_PRIVATE_KEY', '').replace(/\\n/g, '\n'),
  FIREBASE_CLIENT_EMAIL: getEnv('FIREBASE_CLIENT_EMAIL', ''),
  FIREBASE_CLIENT_ID: getEnv('FIREBASE_CLIENT_ID', ''),
  FIREBASE_AUTH_URI: getEnv('FIREBASE_AUTH_URI', 'https://accounts.google.com/o/oauth2/auth'),
  FIREBASE_TOKEN_URI: getEnv('FIREBASE_TOKEN_URI', 'https://oauth2.googleapis.com/token'),
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL: getEnv(
    'FIREBASE_AUTH_PROVIDER_X509_CERT_URL',
    'https://www.googleapis.com/oauth2/v1/certs',
  ),
  FIREBASE_CLIENT_X509_CERT_URL: getEnv('FIREBASE_CLIENT_X509_CERT_URL', ''),

  HDM_AI_URL: getEnv('HDM_AI_URL', 'https://hdmai-server.onrender.com/api/v1'),
  HDM_AI_KEY: getEnv('HDM_AI_KEY', ''),

  ENCRYPTION_ALGORITHM: getEnv('ENCRYPTION_ALGORITHM', 'aes-256-gcm'),
  ENCRYPTION_KEY_LENGTH: getEnvNumber('ENCRYPTION_KEY_LENGTH', '32'),

  WS_PING_INTERVAL: getEnvNumber('WS_PING_INTERVAL', '25000'),
  WS_PING_TIMEOUT: getEnvNumber('WS_PING_TIMEOUT', '20000'),

  OTP_LENGTH: getEnvNumber('OTP_LENGTH', '6'),
  OTP_EXPIRE_MINUTES: getEnvNumber('OTP_EXPIRE_MINUTES', '5'),
  OTP_MAX_ATTEMPTS: getEnvNumber('OTP_MAX_ATTEMPTS', '3'),

  RATE_LIMIT_WINDOW_MS: getEnvNumber('RATE_LIMIT_WINDOW_MS', '900000'),
  RATE_LIMIT_MAX_REQUESTS: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', '100'),
  OTP_RATE_LIMIT_MAX: getEnvNumber('OTP_RATE_LIMIT_MAX', '5'),

  MAX_FILE_SIZE: getEnvNumber('MAX_FILE_SIZE', '2097152000'),
  ALLOWED_IMAGE_TYPES: getEnvArray(
    'ALLOWED_IMAGE_TYPES',
    'image/jpeg,image/png,image/gif,image/webp',
  ),
  ALLOWED_VIDEO_TYPES: getEnvArray(
    'ALLOWED_VIDEO_TYPES',
    'video/mp4,video/mpeg,video/quicktime',
  ),
  ALLOWED_DOC_TYPES: getEnvArray(
    'ALLOWED_DOC_TYPES',
    'application/pdf,application/msword,text/plain,application/zip',
  ),

  BACKUP_RETENTION_DAYS: getEnvNumber('BACKUP_RETENTION_DAYS', '90'),
  BACKUP_MAX_SIZE_MB: getEnvNumber('BACKUP_MAX_SIZE_MB', '2048'),
  BACKUP_ENCRYPTION_ENABLED: getEnvBool('BACKUP_ENCRYPTION_ENABLED', 'true'),

  STATUS_EXPIRE_HOURS: getEnvNumber('STATUS_EXPIRE_HOURS', '24'),
  STATUS_MAX_VIDEO_DURATION: getEnvNumber('STATUS_MAX_VIDEO_DURATION', '60'),
  STATUS_MAX_IMAGES: getEnvNumber('STATUS_MAX_IMAGES', '10'),

  GROUP_MAX_MEMBERS: getEnvNumber('GROUP_MAX_MEMBERS', '1024'),
  GROUP_MAX_ADMINS: getEnvNumber('GROUP_MAX_ADMINS', '10'),
  GROUP_MAX_PINNED_MESSAGES: getEnvNumber('GROUP_MAX_PINNED_MESSAGES', '5'),

  MESSAGE_EDIT_WINDOW_MINUTES: getEnvNumber('MESSAGE_EDIT_WINDOW_MINUTES', '15'),
  MESSAGE_DELETE_FOR_EVERYONE_WINDOW_HOURS: getEnvNumber(
    'MESSAGE_DELETE_FOR_EVERYONE_WINDOW_HOURS',
    '1',
  ),
  MESSAGE_MAX_FORWARD_COUNT: getEnvNumber('MESSAGE_MAX_FORWARD_COUNT', '5'),

  SESSION_MAX_DEVICES: getEnvNumber('SESSION_MAX_DEVICES', '5'),
  SESSION_IDLE_TIMEOUT_DAYS: getEnvNumber('SESSION_IDLE_TIMEOUT_DAYS', '30'),

  STRIPE_SECRET_KEY: getEnv('STRIPE_SECRET_KEY', ''),
  STRIPE_WEBHOOK_SECRET: getEnv('STRIPE_WEBHOOK_SECRET', ''),
  MPESA_CONSUMER_KEY: getEnv('MPESA_CONSUMER_KEY', ''),
  MPESA_CONSUMER_SECRET: getEnv('MPESA_CONSUMER_SECRET', ''),
  MPESA_PASSKEY: getEnv('MPESA_PASSKEY', ''),
  MPESA_SHORTCODE: getEnv('MPESA_SHORTCODE', '174379'),
  MPESA_RECEIVE_PHONE: getEnv('MPESA_RECEIVE_PHONE', '0712345678'),
  MPESA_PAYBILL_NUMBER: getEnv('MPESA_PAYBILL_NUMBER', '247247'),
  MPESA_TILL_NUMBER: getEnv('MPESA_TILL_NUMBER', '123456'),

  PLAN_MONTHLY_PRICE: getEnvNumber('PLAN_MONTHLY_PRICE', '4.99'),
  PLAN_YEARLY_PRICE: getEnvNumber('PLAN_YEARLY_PRICE', '39.99'),
  PLAN_PERMANENT_PRICE: getEnvNumber('PLAN_PERMANENT_PRICE', '99.99'),
  PLAN_CURRENCY: getEnv('PLAN_CURRENCY', 'USD'),

  ADMIN_DEFAULT_EMAIL: getEnv('ADMIN_DEFAULT_EMAIL', 'admin@spark.hdm.com'),
  ADMIN_DEFAULT_PASSWORD: getEnv('ADMIN_DEFAULT_PASSWORD', 'change_this_immediately'),
  SUPER_ADMIN_EMAIL: getEnv('SUPER_ADMIN_EMAIL', 'davismcintyre5@gmail.com'),

  LOG_LEVEL: getEnv('LOG_LEVEL', 'debug'),
  LOG_FILE_PATH: getEnv('LOG_FILE_PATH', 'logs/spark.log'),

  CORS_ORIGINS: getEnvArray('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001'),
};

export default env;