import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Failed to hash password');
  }
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  try {
    return bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('Failed to compare password');
  }
}

export function hashData(data: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(data).digest('hex');
}