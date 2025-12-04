#!/usr/bin/env node
/**
 * API Key Management CLI
 * 
 * Usage:
 *   npm run keys:create -- --name "My Key" --scopes "verify:read,verify:write"
 *   npm run keys:list
 *   npm run keys:revoke -- --id abc123
 *   npm run keys:info -- --id abc123
 */

import { Pool } from 'pg';
import { generateApiKey, hashApiKey, getApiKeyPrefix } from '../lib/auth.js';
import 'dotenv/config';

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface CreateKeyOptions {
  name: string;
  description?: string;
  scopes?: string[];
  rateLimitPerMinute?: number;
  rateLimitPerDay?: number;
  expiresInDays?: number;
  createdBy?: string;
}

async function createKey(options: CreateKeyOptions): Promise<void> {
  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);
  const keyPrefix = getApiKeyPrefix(apiKey);

  const scopes = options.scopes || ['verify:read'];
  const rateLimitPerMinute = options.rateLimitPerMinute || 60;
  const rateLimitPerDay = options.rateLimitPerDay || 10000;
  const expiresAt = options.expiresInDays 
    ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const result = await db.query(
    `INSERT INTO api_keys (
      key_hash,
      key_prefix,
      name,
      description,
      scopes,
      rate_limit_per_minute,
      rate_limit_per_day,
      expires_at,
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, created_at`,
    [
      keyHash,
      keyPrefix,
      options.name,
      options.description || null,
      scopes,
      rateLimitPerMinute,
      rateLimitPerDay,
      expiresAt,
      options.createdBy || 'cli',
    ]
  );

  const { id, created_at } = result.rows[0];

  console.log('\nAPI Key created successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`ID:          ${id}`);
  console.log(`Name:        ${options.name}`);
  console.log(`Key:         ${apiKey}`);
  console.log(`Prefix:      ${keyPrefix}...`);
  console.log(`Scopes:      ${scopes.join(', ')}`);
  console.log(`Rate Limit:  ${rateLimitPerMinute}/min, ${rateLimitPerDay}/day`);
  console.log(`Created:     ${created_at}`);
  if (expiresAt) {
    console.log(`Expires:     ${expiresAt}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('IMPORTANT: Save this key securely. It will not be shown again.\n');
  console.log(`Usage: Authorization: Bearer ${apiKey}\n`);
}

async function listKeys(): Promise<void> {
  const result = await db.query(
    `SELECT 
      id,
      key_prefix,
      name,
      description,
      scopes,
      is_active,
      rate_limit_per_minute,
      rate_limit_per_day,
      usage_count,
      last_used_at,
      created_at,
      expires_at
    FROM api_keys
    ORDER BY created_at DESC`
  );

  if (result.rows.length === 0) {
    console.log('\nNo API keys found.\n');
    return;
  }

  console.log(`\nFound ${result.rows.length} API key(s):\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const key of result.rows) {
    const status = key.is_active ? 'Active' : 'Inactive';
    const expired = key.expires_at && new Date(key.expires_at) < new Date();
    const statusIcon = key.is_active && !expired ? '✓' : '✗';

    console.log(`\n${statusIcon} ${key.name} (${key.key_prefix}...)`);
    console.log(`   ID:          ${key.id}`);
    console.log(`   Status:      ${status}${expired ? ' (expired)' : ''}`);
    console.log(`   Scopes:      ${key.scopes.join(', ')}`);
    console.log(`   Usage:       ${key.usage_count} requests`);
    console.log(`   Rate Limit:  ${key.rate_limit_per_minute}/min, ${key.rate_limit_per_day}/day`);
    console.log(`   Last Used:   ${key.last_used_at ? new Date(key.last_used_at).toISOString() : 'Never'}`);
    console.log(`   Created:     ${new Date(key.created_at).toISOString()}`);
    if (key.expires_at) {
      console.log(`   Expires:     ${new Date(key.expires_at).toISOString()}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function revokeKey(keyId: string): Promise<void> {
  const result = await db.query(
    `UPDATE api_keys 
     SET is_active = false 
     WHERE id = $1 
     RETURNING name, key_prefix`,
    [keyId]
  );

  if (result.rows.length === 0) {
    console.log(`\nAPI key not found: ${keyId}\n`);
    return;
  }

  const { name, key_prefix } = result.rows[0];
  console.log(`\nRevoked API key: ${name} (${key_prefix}...)\n`);
}

async function keyInfo(keyId: string): Promise<void> {
  const result = await db.query(
    `SELECT 
      k.*,
      COUNT(u.id) as total_requests,
      AVG(u.response_time_ms) as avg_response_time,
      COUNT(CASE WHEN u.status_code >= 400 THEN 1 END) as error_count
    FROM api_keys k
    LEFT JOIN api_key_usage u ON u.api_key_id = k.id
    WHERE k.id = $1
    GROUP BY k.id`,
    [keyId]
  );

  if (result.rows.length === 0) {
    console.log(`\nAPI key not found: ${keyId}\n`);
    return;
  }

  const key = result.rows[0];

  console.log('\nAPI Key Information:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`ID:                ${key.id}`);
  console.log(`Name:              ${key.name}`);
  console.log(`Prefix:            ${key.key_prefix}...`);
  console.log(`Status:            ${key.is_active ? 'Active' : 'Inactive'}`);
  console.log(`Scopes:            ${key.scopes.join(', ')}`);
  console.log(`Rate Limit:        ${key.rate_limit_per_minute}/min, ${key.rate_limit_per_day}/day`);
  console.log(`\nUsage Statistics:`);
  console.log(`Total Requests:    ${key.total_requests}`);
  console.log(`Error Rate:        ${key.total_requests > 0 ? ((key.error_count / key.total_requests) * 100).toFixed(2) : 0}%`);
  console.log(`Avg Response Time: ${key.avg_response_time ? Math.round(key.avg_response_time) : 0}ms`);
  console.log(`\nTimestamps:`);
  console.log(`Created:           ${new Date(key.created_at).toISOString()}`);
  console.log(`Last Used:         ${key.last_used_at ? new Date(key.last_used_at).toISOString() : 'Never'}`);
  if (key.expires_at) {
    console.log(`Expires:           ${new Date(key.expires_at).toISOString()}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'create': {
        const name = args.find((_arg, i) => args[i - 1] === '--name');
        const description = args.find((_arg, i) => args[i - 1] === '--description');
        const scopesStr = args.find((_arg, i) => args[i - 1] === '--scopes');
        const scopes = scopesStr ? scopesStr.split(',') : undefined;
        const rateLimitMin = args.find((_arg, i) => args[i - 1] === '--rate-minute');
        const rateLimitDay = args.find((_arg, i) => args[i - 1] === '--rate-day');
        const expiresInDays = args.find((_arg, i) => args[i - 1] === '--expires-days');

        if (!name) {
          console.error('Error: --name is required');
          process.exit(1);
        }

        await createKey({
          name,
          description,
          scopes,
          rateLimitPerMinute: rateLimitMin ? parseInt(rateLimitMin) : undefined,
          rateLimitPerDay: rateLimitDay ? parseInt(rateLimitDay) : undefined,
          expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
        });
        break;
      }

      case 'list':
        await listKeys();
        break;

      case 'revoke': {
        const keyId = args.find((_arg, i) => args[i - 1] === '--id');
        if (!keyId) {
          console.error('Error: --id is required');
          process.exit(1);
        }
        await revokeKey(keyId);
        break;
      }

      case 'info': {
        const keyId = args.find((_arg, i) => args[i - 1] === '--id');
        if (!keyId) {
          console.error('Error: --id is required');
          process.exit(1);
        }
        await keyInfo(keyId);
        break;
      }

      default:
        console.log('Usage:');
        console.log('  Create key:  npm run keys:create -- --name "My Key" --scopes "verify:read,verify:write"');
        console.log('  List keys:   npm run keys:list');
        console.log('  Revoke key:  npm run keys:revoke -- --id <key-id>');
        console.log('  Key info:    npm run keys:info -- --id <key-id>');
        console.log('\nOptions for create:');
        console.log('  --name <string>          Key name (required)');
        console.log('  --description <string>   Key description');
        console.log('  --scopes <string>        Comma-separated scopes (default: verify:read)');
        console.log('  --rate-minute <number>   Rate limit per minute (default: 60)');
        console.log('  --rate-day <number>      Rate limit per day (default: 10000)');
        console.log('  --expires-days <number>  Expires in N days (optional)');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();

