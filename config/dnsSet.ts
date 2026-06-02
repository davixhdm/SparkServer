import dns from 'node:dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark_db';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB connected: ${MONGODB_URI.split('@').pop() || 'localhost'}`);
  } catch (error: any) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
  } catch (error: any) {
    console.error(`❌ MongoDB disconnect failed: ${error.message}`);
  }
}

export function getMongoUri(): string {
  return MONGODB_URI;
}

export default dns;