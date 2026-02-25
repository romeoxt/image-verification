/**
 * PoPC Verification API
 * Main entry point
 */
import Fastify from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyRateLimit from '@fastify/rate-limit';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDb, closeDb, getDb } from './lib/db.js';
import { verifyRoutes } from './routes/verify.js';
import { evidenceRoutes } from './routes/evidence.js';
import { enrollRoutes } from './routes/enroll.js';
import { assetRoutes } from './routes/assets.js';
import { timestampRoutes } from './routes/timestamp.js';
import { authenticateApiKey, type AuthenticatedRequest } from './lib/auth.js';
import { securityHeaders } from './lib/security.js';
import type { Config } from './types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
loadEnv();

// Configuration
const config: Config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || '',
  logLevel: process.env.LOG_LEVEL || 'info',
  logPretty: process.env.LOG_PRETTY === 'true',
  maxAssetSize: Number(process.env.MAX_ASSET_SIZE_BYTES) || 104857600, // 100MB
  maxClockSkew: Number(process.env.MAX_CLOCK_SKEW_SECONDS) || 300,
  defaultPolicy: process.env.DEFAULT_POLICY || 'default',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

const isProduction = process.env.NODE_ENV === 'production';

// Create Fastify instance
const fastify = Fastify({
  logger: config.logPretty
    ? {
        level: config.logLevel,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        level: config.logLevel,
      },
  bodyLimit: config.maxAssetSize,
  connectionTimeout: 120000, // 2 minutes - allow time for large uploads
  keepAliveTimeout: 120000, // 2 minutes
  requestTimeout: 120000, // 2 minutes - Railway may still enforce 30s
});

/**
 * Register plugins
 */
async function registerPlugins() {
  await fastify.register(fastifyRateLimit, {
    max: Number(process.env.IP_RATE_LIMIT_PER_MINUTE) || 240,
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) => ({
      error: 'rate_limited',
      message: `Rate limit exceeded. Retry in ${Math.ceil(context.ttl / 1000)}s`,
    }),
  });

  // CORS
  await fastify.register(fastifyCors, {
    origin: config.corsOrigin,
    credentials: true,
  });

  // Multipart
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: config.maxAssetSize,
      files: 10,
    },
  });

  // Static files (for browser UI)
  await fastify.register(fastifyStatic, {
    root: join(__dirname, '../public'),
    prefix: '/ui/',
  });
}

/**
 * Register security middleware
 */
async function registerMiddleware() {
  // Add security headers to all responses
  fastify.addHook('onRequest', async (request, reply) => {
    await securityHeaders(request, reply);
  });

  // Add API key authentication to all /v1/* routes (except public endpoints)
  fastify.addHook('onRequest', async (request: AuthenticatedRequest, reply) => {
    // Skip auth for public endpoints
    const publicEndpoints = [
      '/',
      '/health',
      '/v1/verify/ui', // Public UI
    ];

    // Check if this is a public endpoint
    if (publicEndpoints.includes(request.url)) {
      return;
    }

    // Check if auth is disabled (development only)
    if (process.env.DISABLE_API_AUTH === 'true') {
      fastify.log.warn('API authentication is DISABLED - development only');
      return;
    }

    // Require authentication for all other /v1/* endpoints
    if (request.url.startsWith('/v1/')) {
      const db = getDb();
      await authenticateApiKey(request, reply, fastify, db);
      if (reply.sent) return;
      enforceScopeForRoute(request, reply);
      if (reply.sent) return;
    }
  });
}

/**
 * Register routes
 */
async function registerRoutes() {
  // Liveness check
  fastify.get('/health/live', async () => {
    return { status: 'live', timestamp: new Date().toISOString() };
  });

  // Readiness check
  fastify.get('/health/ready', async (_request, reply) => {
    try {
      const db = getDb();
      await db.query('SELECT 1');
      return { status: 'ready', timestamp: new Date().toISOString() };
    } catch {
      return reply.code(503).send({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API info
  fastify.get('/', async () => {
    return {
      name: 'PoPC Verification API',
      version: '0.1.0',
      endpoints: {
        verify: 'POST /v1/verify',
        enroll: 'POST /v1/enroll',
        timestamp: 'POST /v1/timestamp (stub)',
        verifyUi: 'GET /v1/verify/ui (stub)',
      },
      docs: '/docs/openapi.yaml',
    };
  });

  // Verification routes
  await fastify.register(verifyRoutes);

  // Evidence routes
  await fastify.register(evidenceRoutes);

  // Enrollment routes
  await fastify.register(enrollRoutes);

  // Asset routes
  await fastify.register(assetRoutes);

  // Timestamp routes
  await fastify.register(timestampRoutes);

  // Stub routes

  fastify.get('/v1/verify/ui', async (_request, reply) => {
    return reply.code(501).send({
      error: 'not_implemented',
      message: 'Verification UI endpoint not yet implemented',
    });
  });
}

/**
 * Start server
 */
let appInitialized = false;

async function initializeApp() {
  if (appInitialized) {
    return;
  }

  assertProductionSafetyConfig();

  // Initialize database
  fastify.log.info('Connecting to database...');
  initDb({
    connectionString: config.databaseUrl,
  });
  fastify.log.info('Database connected');

  // Register plugins, middleware, and routes
  await registerPlugins();
  await registerMiddleware();
  await registerRoutes();
  appInitialized = true;
}

async function start() {
  try {
    await initializeApp();

    // Start listening
    await fastify.listen({
      port: config.port,
      host: config.host,
    });

    fastify.log.info(`Server listening on ${config.host}:${config.port}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(signal: string) {
  fastify.log.info(`Received ${signal}, shutting down gracefully...`);

  try {
    await fastify.close();
    await closeDb();
    fastify.log.info('Server closed successfully');
    process.exit(0);
  } catch (error) {
    fastify.log.error(error, 'Error during shutdown');
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server unless in test mode
if (process.env.NODE_ENV !== 'test') {
  start();
}

// Export for testing
export { fastify, config, initializeApp };

function enforceScopeForRoute(request: AuthenticatedRequest, reply: import('fastify').FastifyReply): void {
  if (!request.apiKey) {
    return;
  }

  const scopes = request.apiKey.scopes || [];
  const hasScope = (scope: string) => scopes.includes(scope) || scopes.includes('admin');

  if (request.method === 'POST' && request.url.startsWith('/v1/verify') && !hasScope('verify:write')) {
    reply.code(403).send({ error: 'forbidden', message: 'Missing required scope: verify:write' });
    return;
  }

  if (request.method === 'POST' && request.url.startsWith('/v1/enroll') && !hasScope('device:write')) {
    reply.code(403).send({ error: 'forbidden', message: 'Missing required scope: device:write' });
    return;
  }

  if (request.method === 'POST' && request.url.startsWith('/v1/timestamp') && !hasScope('verify:read')) {
    reply.code(403).send({ error: 'forbidden', message: 'Missing required scope: verify:read' });
    return;
  }

  if (request.url.startsWith('/v1/evidence/') && !(hasScope('evidence:read') || hasScope('verify:read'))) {
    reply.code(403).send({ error: 'forbidden', message: 'Missing required scope: evidence:read' });
    return;
  }

  if (request.url.startsWith('/v1/assets/') && !(hasScope('asset:read') || hasScope('evidence:read') || hasScope('verify:read'))) {
    reply.code(403).send({ error: 'forbidden', message: 'Missing required scope: asset:read' });
    return;
  }
}

function assertProductionSafetyConfig(): void {
  if (!isProduction) {
    return;
  }

  const errors: string[] = [];
  const requireVar = (name: string) => {
    if (!process.env[name] || process.env[name]?.trim() === '') {
      errors.push(`${name} must be set in production`);
    }
  };

  requireVar('DATABASE_URL');
  requireVar('PUBLIC_URL');
  requireVar('CORS_ORIGIN');

  if (process.env.CORS_ORIGIN === '*') {
    errors.push('CORS_ORIGIN cannot be "*" in production');
  }
  if (process.env.DISABLE_API_AUTH === 'true') {
    errors.push('DISABLE_API_AUTH must never be true in production');
  }
  if (process.env.ALLOW_INSECURE_ATTESTATION_DEV === 'true') {
    errors.push('ALLOW_INSECURE_ATTESTATION_DEV must never be true in production');
  }
  if (process.env.ALLOW_CLIENT_SECURITY_OVERRIDE === 'true') {
    errors.push('ALLOW_CLIENT_SECURITY_OVERRIDE must never be true in production');
  }
  if (process.env.ALLOW_SOFTWARE_KEYS === 'true') {
    errors.push('ALLOW_SOFTWARE_KEYS must never be true in production');
  }
  if (process.env.ALLOW_VERIFY_URL_FETCH === 'true') {
    errors.push('ALLOW_VERIFY_URL_FETCH must never be true in production (SSRF risk)');
  }

  if (errors.length > 0) {
    throw new Error(`Production safety checks failed: ${errors.join('; ')}`);
  }
}
