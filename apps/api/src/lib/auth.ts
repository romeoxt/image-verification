/**
 * API Key Authentication & Rate Limiting
 * 
 * Provides middleware for:
 * - API key validation
 * - Rate limiting (per-minute and per-day)
 * - Usage tracking
 * - Scope-based permissions
 */

import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import crypto from 'crypto';
import type { Pool } from 'pg';

export interface ApiKey {
  id: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
  description: string | null;
  scopes: string[];
  isActive: boolean;
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  lastUsedAt: Date | null;
  usageCount: bigint;
  createdBy: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface AuthenticatedRequest extends FastifyRequest {
  apiKey?: ApiKey;
  apiKeyId?: string;
}

/**
 * Hash an API key for storage/comparison
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a new API key
 * Format: pk_{random}_{random}
 */
export function generateApiKey(): string {
  const part1 = crypto.randomBytes(16).toString('hex');
  const part2 = crypto.randomBytes(16).toString('hex');
  return `pk_${part1}${part2}`;
}

/**
 * Get API key prefix for display (first 11 chars)
 */
export function getApiKeyPrefix(key: string): string {
  return key.substring(0, 11);
}

/**
 * Validate API key and check rate limits
 */
export async function validateApiKey(
  db: Pool,
  apiKey: string
): Promise<{ valid: boolean; key?: ApiKey; error?: string }> {
  try {
    const keyHash = hashApiKey(apiKey);

    // Fetch API key from database
    const result = await db.query<ApiKey>(
      `SELECT 
        id,
        key_hash as "keyHash",
        key_prefix as "keyPrefix",
        name,
        description,
        scopes,
        is_active as "isActive",
        rate_limit_per_minute as "rateLimitPerMinute",
        rate_limit_per_day as "rateLimitPerDay",
        last_used_at as "lastUsedAt",
        usage_count as "usageCount",
        created_by as "createdBy",
        metadata,
        created_at as "createdAt",
        expires_at as "expiresAt"
      FROM api_keys
      WHERE key_hash = $1`,
      [keyHash]
    );

    if (result.rows.length === 0) {
      return { valid: false, error: 'Invalid API key' };
    }

    const key = result.rows[0];

    // Check if key is active
    if (!key.isActive) {
      return { valid: false, error: 'API key is inactive' };
    }

    // Check if key has expired
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return { valid: false, error: 'API key has expired' };
    }

    // Check rate limits
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check per-minute rate limit
    const minuteUsage = await db.query(
      `SELECT COUNT(*) as count 
       FROM api_key_usage 
       WHERE api_key_id = $1 AND created_at >= $2`,
      [key.id, oneMinuteAgo]
    );

    if (parseInt(minuteUsage.rows[0].count) >= key.rateLimitPerMinute) {
      return { valid: false, error: 'Rate limit exceeded (per minute)' };
    }

    // Check per-day rate limit
    const dayUsage = await db.query(
      `SELECT COUNT(*) as count 
       FROM api_key_usage 
       WHERE api_key_id = $1 AND created_at >= $2`,
      [key.id, oneDayAgo]
    );

    if (parseInt(dayUsage.rows[0].count) >= key.rateLimitPerDay) {
      return { valid: false, error: 'Rate limit exceeded (per day)' };
    }

    return { valid: true, key };
  } catch (error) {
    console.error('API key validation error:', error);
    return { valid: false, error: 'Internal server error' };
  }
}

/**
 * Log API key usage
 */
export async function logApiKeyUsage(
  db: Pool,
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs?: number
): Promise<void> {
  try {
    await db.query(
      `INSERT INTO api_key_usage (api_key_id, endpoint, method, status_code, response_time_ms)
       VALUES ($1, $2, $3, $4, $5)`,
      [apiKeyId, endpoint, method, statusCode, responseTimeMs]
    );

    // Update last_used_at and usage_count
    await db.query(
      `UPDATE api_keys 
       SET last_used_at = now(), usage_count = usage_count + 1
       WHERE id = $1`,
      [apiKeyId]
    );
  } catch (error) {
    console.error('Failed to log API key usage:', error);
    // Don't fail the request if usage logging fails
  }
}

/**
 * Fastify middleware for API key authentication
 */
export async function authenticateApiKey(
  request: AuthenticatedRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
  db: Pool
): Promise<void> {
  const startTime = Date.now();

  try {
    // Check if API auth is disabled (for development)
    if (process.env.DISABLE_API_AUTH === 'true') {
      fastify.log.warn('API authentication is DISABLED - development only');
      return;
    }

    // Extract API key from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      reply.code(401).send({
        error: 'unauthorized',
        message: 'Missing Authorization header. Use: Authorization: Bearer YOUR_API_KEY',
      });
      return;
    }

    // Parse Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      reply.code(401).send({
        error: 'unauthorized',
        message: 'Invalid Authorization header format. Use: Authorization: Bearer YOUR_API_KEY',
      });
      return;
    }

    const apiKey = parts[1];

    // Validate API key
    const validation = await validateApiKey(db, apiKey);

    if (!validation.valid) {
      reply.code(401).send({
        error: 'unauthorized',
        message: validation.error || 'Invalid API key',
      });
      
      // Still log the failed attempt (with a generic ID if no key found)
      if (validation.key) {
        await logApiKeyUsage(
          db,
          validation.key.id,
          request.url,
          request.method,
          401,
          Date.now() - startTime
        ).catch(err => fastify.log.warn('Failed to log auth failure:', err));
      }
      
      return;
    }

    // Attach API key to request
    request.apiKey = validation.key!;
    request.apiKeyId = validation.key!.id;

    // Log usage asynchronously after response
    reply.raw.on('finish', () => {
      if (request.apiKeyId) {
        logApiKeyUsage(
          db,
          request.apiKeyId,
          request.url,
          request.method,
          reply.statusCode,
          Date.now() - startTime
        ).catch(err => fastify.log.warn('Failed to log API usage:', err));
      }
    });
  } catch (error) {
    fastify.log.error({ error }, 'API key authentication error');
    reply.code(500).send({
      error: 'internal_server_error',
      message: 'Authentication failed',
    });
  }
}

/**
 * Check if API key has required scope
 */
export function requireScope(scope: string) {
  return async function (request: AuthenticatedRequest, reply: FastifyReply) {
    if (process.env.DISABLE_API_AUTH === 'true') {
      return; // Skip scope check if auth is disabled
    }

    if (!request.apiKey) {
      reply.code(401).send({
        error: 'unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    if (!request.apiKey.scopes.includes(scope) && !request.apiKey.scopes.includes('admin')) {
      reply.code(403).send({
        error: 'forbidden',
        message: `Missing required scope: ${scope}`,
      });
      return;
    }
  };
}

