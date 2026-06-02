require('./config/dnsSet');

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';

import env from './config/env';
import corsOptions from './config/cors';
import { connectMongoDB, connectRedis, disconnectDatabases, getRedisClient } from './config/db';
import { loadSettings } from './config/settings';
import { maintenanceMiddleware } from './middleware/admin/maintenanceMiddleware';
import routes from './routes/index';
import { initializeSocket } from './socket/index';
import { initializeCronJobs } from './jobs/index';
import { initializeQueues } from './jobs/queue';
import { logger, logRequest } from './utils/logger';
import { startKeepAlive, stopKeepAlive } from './keepAlive';

const app = express();
const server = http.createServer(app);

// ====================================================================
// TRUST PROXY (Required for Render, Heroku, etc.)
// ====================================================================
app.set('trust proxy', 1);

// Enable HTTP keep-alive
const KEEP_ALIVE_TIMEOUT = parseInt(process.env.SERVER_KEEP_ALIVE_TIMEOUT || '65000');
const HEADERS_TIMEOUT = parseInt(process.env.SERVER_HEADERS_TIMEOUT || '66000');

server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT;
server.headersTimeout = HEADERS_TIMEOUT;

// ====================================================================
// MIDDLEWARE
// ====================================================================
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(maintenanceMiddleware);

// Add keep-alive headers
app.use((_req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', `timeout=${Math.floor(KEEP_ALIVE_TIMEOUT / 1000)}`);
  next();
});

app.use(
  morgan(':method :url :status :response-time ms', {
    stream: {
      write: (message: string) => {
        const parts = message.trim().split(' ');
        const method = parts[0];
        const url = parts[1];
        const status = parseInt(parts[2]);
        const duration = parseFloat(parts[3]);
        logRequest(method, url, status, duration);
      },
    },
  }),
);

// ====================================================================
// PUBLIC ROUTES (No auth required - MUST come BEFORE API routes)
// ====================================================================
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Spark Messenger API',
    app: env.APP_NAME,
    version: env.APP_VERSION,
    poweredBy: 'HDM',
    docs: `${env.APP_URL}/api`,
    health: `${env.APP_URL}/health`,
  });
});

app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'Spark Messenger API v1',
    version: env.APP_VERSION,
    environment: env.NODE_ENV,
    baseUrl: `${env.APP_URL}/api/v1`,
    adminUrl: `${env.APP_URL}/api/v1/admin`,
    webhooksUrl: `${env.APP_URL}/api/v1/webhooks`,
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      chats: '/api/v1/chats',
      messages: '/api/v1/messages',
      groups: '/api/v1/groups',
      status: '/api/v1/status',
      calls: '/api/v1/calls',
      contacts: '/api/v1/contacts',
      privacy: '/api/v1/privacy',
      payments: '/api/v1/payments',
      backups: '/api/v1/backups',
      notifications: '/api/v1/notifications',
      search: '/api/v1/search',
      deeplinks: '/api/v1/deeplinks',
      ai: '/api/v1/ai',
      admin: '/api/v1/admin',
      webhooks: '/api/v1/webhooks',
    },
  });
});

// Health check endpoints
app.get('/health', async (_req, res) => {
  const health: any = {
    success: true,
    app: env.APP_NAME,
    version: env.APP_VERSION,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {},
  };

  try {
    const state = mongoose.connection.readyState;
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    health.services.mongodb = states[state] || 'unknown';
  } catch {
    health.services.mongodb = 'error';
  }

  try {
    const redis = getRedisClient();
    const ping = await redis.ping();
    health.services.redis = ping === 'PONG' ? 'connected' : 'error';
  } catch {
    health.services.redis = 'disconnected';
  }

  health.memory = {
    rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB`,
    heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`,
    heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(1)} MB`,
  };

  const statusCode = health.services.mongodb === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Simple ping endpoint for keep-alive
app.get('/ping', (_req, res) => {
  res.status(200).send('pong');
});

// Readiness probe
app.get('/ready', (_req, res) => {
  const isReady = mongoose.connection.readyState === 1;
  res.status(isReady ? 200 : 503).json({ 
    status: isReady ? 'ready' : 'not ready',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Liveness probe
app.get('/live', (_req, res) => {
  res.status(200).json({ status: 'alive', uptime: process.uptime() });
});

// ====================================================================
// API ROUTES
// ====================================================================
app.use('/api', routes);

// ====================================================================
// 404 HANDLER
// ====================================================================
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'The requested endpoint does not exist',
  });
});

// ====================================================================
// GLOBAL ERROR HANDLER
// ====================================================================
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    error: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// ====================================================================
// GRACEFUL SHUTDOWN
// ====================================================================
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n  ⚠️  Received ${signal}. Shutting down gracefully...\n`);

  // Stop keep-alive
  stopKeepAlive();

  server.close(async () => {
    console.log('  🔌 HTTP server closed');
  });

  try {
    const { getIO } = require('./socket/index');
    const io = getIO();
    if (io) {
      await io.close();
      console.log('  🔌 WebSocket server closed');
    }
  } catch {
    // Socket may not be initialized
  }

  await disconnectDatabases();
  console.log('  🗄️  Database connections closed');

  console.log('\n  ✅ Graceful shutdown complete. Goodbye! 👋\n');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection', { reason: reason?.message || reason });
});
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  gracefulShutdown('uncaughtException');
});

// ====================================================================
// SMART STARTUP BANNER
// ====================================================================
async function printBanner(): Promise<void> {
  console.log('');
  console.log('  ⚡ ═══════════════════════════════════════════════ ⚡');
  console.log('  ⚡         S P A R K   M E S S E N G E R            ⚡');
  console.log('  ⚡              Powered by HDM                       ⚡');
  console.log('  ⚡ ═══════════════════════════════════════════════ ⚡');
  console.log('');
  console.log(`  🚀 Server:        ${env.APP_URL || `http://localhost:${env.PORT}`}`);
  console.log(`  🌐 Client:        ${env.CLIENT_URL}`);
  console.log(`  🛠️  Admin:         ${env.ADMIN_URL}`);
  console.log(`  📪 Environment:   ${env.NODE_ENV}`);
  console.log(`  📋 Version:       ${env.APP_VERSION}`);
  console.log('');
  console.log('  ────────────────────────────────────────────────────');
  console.log('  🔌 FEATURE STATUS');
  console.log('  ────────────────────────────────────────────────────');

  const features: { name: string; enabled: boolean; icon: string }[] = [
    { name: 'MongoDB', enabled: true, icon: '🗄️' },
    { name: 'Redis', enabled: true, icon: '⚡' },
    { name: 'Brevo (SMS/Email)', enabled: env.BREVO, icon: '📫' },
    { name: 'Cloudinary (Media)', enabled: env.CLOUDINARY, icon: '🖼️' },
    { name: 'Firebase (Push)', enabled: env.FIREBASE, icon: '🔔' },
    { name: 'HDM AI', enabled: env.HDM_AI, icon: '🤖' },
    { name: 'WebSocket', enabled: true, icon: '🔌' },
    { name: 'Cron Jobs', enabled: true, icon: '⏰' },
    { name: 'Keep-Alive', enabled: process.env.KEEP_ALIVE_ENABLED !== 'false', icon: '💙' },
  ];

  for (const feature of features) {
    if (feature.enabled) {
      console.log(`  ${feature.icon}  ${feature.name.padEnd(24)} ✅ Enabled`);
    } else {
      console.log(`  ${feature.icon}  ${feature.name.padEnd(24)} ⏭️  Skipped`);
    }
  }

  console.log('  ────────────────────────────────────────────────────');
  console.log('');
}

// ====================================================================
// START SERVER
// ====================================================================
async function start(): Promise<void> {
  try {
    await printBanner();

    console.log('  ⏳ Connecting to MongoDB...');
    await connectMongoDB();
    console.log('  ✅ MongoDB connected\n');

    console.log('  ⏳ Connecting to Redis...');
    await connectRedis();
    console.log('  ✅ Redis connected\n');

    console.log('  ⏳ Initializing job queues...');
    await initializeQueues();
    console.log('  ✅ Job queues initialized\n');

    console.log('  ⏳ Loading dynamic settings...');
    await loadSettings();
    console.log('  ✅ Settings loaded\n');

    console.log('  ⏳ Initializing WebSocket...');
    initializeSocket(server);
    console.log('  ✅ WebSocket initialized\n');

    console.log('  ⏳ Initializing cron jobs...');
    initializeCronJobs();
    console.log('  ✅ Cron jobs initialized\n');

    server.listen(env.PORT, () => {
      console.log(`  ⚡ ═══════════════════════════════════════════════ ⚡`);
      console.log(`  ⚡  Spark Messenger is LIVE on port ${env.PORT}           ⚡`);
      console.log(`  ⚡ ═══════════════════════════════════════════════ ⚡\n`);
    });

    // Start keep-alive for Render free tier
    startKeepAlive();
    
  } catch (error: any) {
    console.error(`\n  ❌ Failed to start server: ${error.message}\n`);
    logger.error('Server startup failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

start();