import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export function generateId(): string {
  return uuidv4();
}

export function generateShortId(length: number = 12): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

export function formatPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  if (cleaned.startsWith('0')) {
    return '+254' + cleaned.slice(1);
  }

  if (cleaned.startsWith('254')) {
    return '+' + cleaned;
  }

  if (cleaned.match(/^7\d{8}$/)) {
    return '+254' + cleaned;
  }

  if (cleaned.match(/^1\d{9}$/)) {
    return '+' + cleaned;
  }

  return '+' + cleaned;
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^\+?[1-9]\d{9,14}$/.test(cleaned);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function parsePagination(query: any): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return '******';
  return phone.slice(0, 3) + '****' + phone.slice(-3);
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `**@${domain}`;
  return name[0] + '***' + name[name.length - 1] + '@' + domain;
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const intervals: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [604800, 'week'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];

  for (const [secondsInInterval, label] of intervals) {
    const count = Math.floor(seconds / secondsInInterval);
    if (count >= 1) {
      return `${count} ${label}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

export function fileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isImageFile(filename: string): boolean {
  const ext = fileExtension(filename);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
}

export function isVideoFile(filename: string): boolean {
  const ext = fileExtension(filename);
  return ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}