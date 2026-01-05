/**
 * Database client and utilities
 */
import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export interface DbConfig {
  connectionString: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

/**
 * Initialize database pool
 */
export function initDb(config: DbConfig): pg.Pool {
  if (pool) {
    return pool;
  }

  // Force SSL for Railway or any remote connection (detected by non-localhost host)
  const isRemote = config.connectionString.includes('railway') || 
                   !config.connectionString.includes('localhost') && 
                   !config.connectionString.includes('127.0.0.1');

  pool = new Pool({
    connectionString: config.connectionString,
    max: config.max ?? 20,
    idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
    connectionTimeoutMillis: config.connectionTimeoutMillis ?? 5000,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
  });

  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
  });

  return pool;
}

/**
 * Get database pool (must call initDb first)
 */
export function getDb(): pg.Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return pool;
}

/**
 * Close database pool
 */
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Execute a query
 */
export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const db = getDb();
  return db.query<T>(text, params);
}

/**
 * Execute a query and return a single row
 */
export async function queryOne<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] ?? null;
}

/**
 * Execute a query and return all rows
 */
export async function queryMany<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

// Type definitions for database tables

export interface Device {
  id: string;
  public_key: string;
  public_key_fingerprint: string;
  attestation_type: string;
  enrolled_at: Date;
  revoked_at: Date | null;
  platform: string | null;
  manufacturer: string | null;
  model: string | null;
  os_version: string | null;
}

export interface DeviceCert {
  id: string;
  device_id: string;
  cert_pem: string;
  issuer: string;
  subject: string | null;
  not_before: Date;
  not_after: Date;
  status: 'valid' | 'expired' | 'revoked' | 'invalid';
  fingerprint: string;
  is_leaf: boolean;
  chain_position: number | null;
  created_at: Date;
}

export interface Policy {
  id: string;
  name: string;
  json: Record<string, any>;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Verification {
  id: string;
  asset_sha256: string;
  verdict: 'verified' | 'tampered' | 'unsigned' | 'invalid' | 'revoked';
  reasons_json: string[];
  device_id: string | null;
  policy_id: string | null;
  asset_size_bytes: number | null;
  asset_mime_type: string | null;
  manifest_sha256: string | null;
  signature_algorithm: string | null;
  transparency_log_id: number | null;
  captured_at: Date | null;
  created_at: Date;
  api_key_id: string | null;
  request_id: string | null;
}

export interface TransparencyLog {
  id: number;
  asset_sha256: string;
  device_cert_fingerprint: string;
  merkle_leaf: string;
  merkle_root: string | null;
  tree_size: number | null;
  leaf_index: number | null;
  verification_id: string | null;
  inserted_at: Date;
}

export interface Revocation {
  id: string;
  device_id: string;
  reason: string;
  revoked_by: string | null;
  metadata: Record<string, any> | null;
  created_at: Date;
}
