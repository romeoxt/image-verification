import { Pool } from 'pg';

// Declare a global variable to hold the pool instance in development
// to prevent creating multiple pools during hot reloads
declare global {
  // eslint-disable-next-line no-var
  var _postgresPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // In development, you might want a fallback, but for security, it's better to fail fast or use a dummy local one
  // throw new Error('DATABASE_URL environment variable is not set');
  console.warn('⚠️ DATABASE_URL is not set. Using empty connection string (DB will fail).');
}

console.log('🔌 Database connecting to:', connectionString ? connectionString.replace(/:[^:@]+@/, ':***@') : 'undefined'); // Log masked URL

let pool: Pool;

if (!connectionString) {
    // Dummy pool to prevent crash on import, but queries will fail
    pool = new Pool({});
} else if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
} else {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      connectionString,
      max: 5, // Reduce max connections for local dev
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increase timeout to 10s
    });
  }
  pool = global._postgresPool;
}

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export const db = pool;

export async function query<T extends import('pg').QueryResultRow = any>(
  text: string,
  params?: any[]
) {
  return pool.query<T>(text, params);
}

export async function queryOne<T extends import('pg').QueryResultRow = any>(
  text: string,
  params?: any[]
) {
  const result = await pool.query<T>(text, params);
  return result.rows[0] ?? null;
}

export async function queryMany<T extends import('pg').QueryResultRow = any>(
  text: string,
  params?: any[]
) {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

// Type definitions
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

export interface Verification {
  id: string;
  asset_sha256: string;
  verdict: 'verified' | 'tampered' | 'unsigned' | 'invalid' | 'revoked';
  reasons_json: string[]; // JSONB comes as array or string? usually object/array in JS
  device_id: string | null;
  policy_id: string | null;
  asset_size_bytes: number | null;
  captured_at: Date | null;
  created_at: Date;
}

