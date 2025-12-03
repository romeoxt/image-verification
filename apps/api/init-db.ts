import { initDb, getDb, closeDb } from './src/lib/db.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config({ path: '../../.env' });

async function run() {
  console.log('Initializing DB...');
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  try {
    initDb({ connectionString: dbUrl });
    const db = getDb();

    console.log('Creating role popc...');
    try {
        // Try to create role if it doesn't exist
        await db.query(`DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'popc') THEN 
            CREATE ROLE popc WITH LOGIN PASSWORD 'popc_password'; 
          END IF; 
        END $$;`);
        console.log('Role popc created/exists.');
    } catch (e: any) {
        console.log('Role creation skipped/failed:', e.message);
    }

    // DROP tables to reset schema
    await db.query('DROP TABLE IF EXISTS revocations CASCADE');
    await db.query('DROP TABLE IF EXISTS transparency_log CASCADE');
    await db.query('DROP TABLE IF EXISTS verifications CASCADE');
    await db.query('DROP TABLE IF EXISTS device_certs CASCADE');
    await db.query('DROP TABLE IF EXISTS devices CASCADE');
    await db.query('DROP TABLE IF EXISTS policies CASCADE');

    // Read schema.sql
    console.log('Applying schema...');
    const schema = fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');
    await db.query(schema);
    console.log('Schema applied.');

    // Read seed.sql
    console.log('Applying seed...');
    const seed = fs.readFileSync(path.join(process.cwd(), 'db', 'seed.sql'), 'utf8');
    await db.query(seed);
    console.log('Seed applied.');

  } catch (e: any) {
    console.error('Init failed:', e);
  } finally {
    await closeDb();
  }
}

run();

