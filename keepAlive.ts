// server/keepAlive.ts
// Prevents Render free tier sleep by pinging own health endpoint

import http from 'http';
import https from 'https';
import { logger } from './utils/logger';

// Read from environment variables
const KEEP_ALIVE_ENABLED = process.env.KEEP_ALIVE_ENABLED !== 'false';
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
const SELF_URL = RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 5000}`;
const PING_INTERVAL = parseInt(process.env.KEEP_ALIVE_INTERVAL || '540000'); // 9 minutes default
const STARTUP_DELAY = parseInt(process.env.KEEP_ALIVE_STARTUP_DELAY || '60000'); // 60 seconds default
const PING_ENDPOINT = process.env.KEEP_ALIVE_ENDPOINT || '/ping';

let keepAliveInterval: NodeJS.Timeout | null = null;

function ping(): void {
  const url = `${SELF_URL}${PING_ENDPOINT}`;
  const client = url.startsWith('https') ? https : http;
  const startTime = Date.now();

  client.get(url, { timeout: 30000 }, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      const latency = Date.now() - startTime;
      if (res.statusCode === 200) {
        console.log(`  💙 Keep-alive: OK (${latency}ms) - ${new Date().toISOString()}`);
      } else {
        console.warn(`  🔴 Keep-alive: HTTP ${res.statusCode} (${latency}ms) - ${new Date().toISOString()}`);
        logger.warn('Keep-alive ping failed', { statusCode: res.statusCode, latency });
      }
    });
  }).on('error', (err) => {
    console.warn(`  🔴 Keep-alive: ${err.message} - ${new Date().toISOString()}`);
    logger.error('Keep-alive ping error', { error: err.message });
  });
}

export function startKeepAlive(): void {
  // Check if keep-alive is enabled
  if (!KEEP_ALIVE_ENABLED) {
    console.log('  ⏭️ Keep-alive: DISABLED by KEEP_ALIVE_ENABLED=false');
    return;
  }

  // Only run in production on Render
  if (process.env.NODE_ENV !== 'production' && !process.env.RENDER_EXTERNAL_URL) {
    console.log('  ⏭️ Keep-alive: SKIPPED (not in production on Render)');
    return;
  }

  if (!SELF_URL || SELF_URL === 'http://localhost:5000') {
    console.log('  ⏭️ Keep-alive: SKIPPED (no external URL configured)');
    return;
  }

  console.log(`  ────────────────────────────────────────────────────`);
  console.log(`  🔄 KEEP-ALIVE: ENABLED`);
  console.log(`  🔗 Target: ${SELF_URL}${PING_ENDPOINT}`);
  console.log(`  ⏱️  Interval: ${PING_INTERVAL / 1000 / 60} minutes`);
  console.log(`  ⏳ Startup delay: ${STARTUP_DELAY / 1000} seconds`);
  console.log(`  ────────────────────────────────────────────────────`);

  // Wait for server to fully start
  setTimeout(() => {
    console.log(`  💙 Starting keep-alive pings...`);
    ping();
    keepAliveInterval = setInterval(ping, PING_INTERVAL);
  }, STARTUP_DELAY);
}

export function stopKeepAlive(): void {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('  🛑 Keep-alive stopped');
  }
}

// For direct execution (node keepAlive.ts)
if (require.main === module) {
  console.log('Starting keep-alive as standalone...');
  startKeepAlive();
}