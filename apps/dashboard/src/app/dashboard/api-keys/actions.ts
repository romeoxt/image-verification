'use server';

import { query, queryOne } from "@/lib/db";
import { randomBytes, createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export async function createApiKey(name: string) {
  try {
    // Generate Key
    const part1 = randomBytes(16).toString('hex');
    const part2 = randomBytes(16).toString('hex');
    const rawKey = `pk_${part1}${part2}`;
    
    // Hash Key
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 11);
    
    const id = uuidv4();
    const now = new Date();

    // Insert into DB
    // Note: Assuming api_keys table exists with these columns based on auth.ts
    const result = await queryOne(`
      INSERT INTO api_keys (
        id, key_hash, key_prefix, name, scopes, is_active, 
        rate_limit_per_minute, rate_limit_per_day, usage_count, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9)
      RETURNING id, key_prefix, name, is_active, created_at, last_used_at, scopes
    `, [
      id, 
      keyHash, 
      keyPrefix, 
      name, 
      ['default'], // Default scope
      true, 
      60, // 60 req/min default
      10000, // 10k req/day default
      now
    ]);

    return { success: true, key: result, rawKey };
  } catch (e) {
    console.error('Failed to create API key:', e);
    return { success: false, error: 'Failed to create key' };
  }
}

export async function revokeApiKey(id: string) {
  try {
    await query(`DELETE FROM api_keys WHERE id = $1`, [id]);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: 'Failed to revoke key' };
  }
}

