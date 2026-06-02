import winston from 'winston';
import path from 'path';
import fs from 'fs';
import env from '../config/env';

const logsDir = path.resolve(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    if (stack) {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}${metaStr}`;
    }
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  }),
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'debug',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: env.LOG_FILE_PATH || 'logs/spark.log',
      maxsize: 10485760,
      maxFiles: 5,
      tailable: true,
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760,
      maxFiles: 3,
    }),
  ],
});

if (env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
}

export function logRequest(method: string, url: string, statusCode: number, duration: number): void {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  logger.log(level, `${method} ${url} ${statusCode} - ${duration}ms`);
}

export function logError(error: Error, context?: string): void {
  logger.error(`${context ? `[${context}] ` : ''}${error.message}`, {
    stack: error.stack,
  });
}

export function logInfo(message: string, meta?: Record<string, any>): void {
  logger.info(message, meta);
}

export function logWarn(message: string, meta?: Record<string, any>): void {
  logger.warn(message, meta);
}

export function logDebug(message: string, meta?: Record<string, any>): void {
  logger.debug(message, meta);
}