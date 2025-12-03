/**
 * PoPC Verification API
 * Main entry point
 */
import Fastify from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDb, closeDb } from './lib/db.js';
import { verifyRoutes } from './routes/verify.js';
import { evidenceRoutes } from './routes/evidence.js';
import { enrollRoutes } from './routes/enroll.js';
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
});

/**
 * Register plugins
 */
async function registerPlugins() {
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
 * Register routes
 */
async function registerRoutes() {
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

  // Stub routes

  fastify.post('/v1/timestamp', async (_request, reply) => {
    return reply.code(501).send({
      error: 'not_implemented',
      message: 'Timestamp endpoint not yet implemented',
    });
  });

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
async function start() {
  try {
    // Initialize database
    fastify.log.info('Connecting to database...');
    initDb({
      connectionString: config.databaseUrl,
    });
    fastify.log.info('Database connected');

    // Register plugins and routes
    await registerPlugins();
    await registerRoutes();

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

// Start server
start();

// Export for testing
export { fastify, config };
