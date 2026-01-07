import fs from 'fs';
import path from 'path';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function run() {
  try {
    const migrationPath = path.join(__dirname, '../../../apps/api/db/migrations/004_add_users.sql');
    let sql = fs.readFileSync(migrationPath, 'utf8');

    // Generate real hash for admin123
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    
    // Replace placeholder in SQL
    // Assuming the placeholder in the file is what I wrote previously
    // I'll just Replace the VALUES part dynamically to be safe
    // Actually, simpler to just run the CREATE TABLE part and then do the INSERT manually in JS
    
    // Split SQL into statements (rough split by ;)
    // But the function body has semicolons.
    // Let's just execute the CREATE TABLE and TRIGGER first.
    
    // Better: Read the file, remove the INSERT statement, execute it. Then INSERT via parameter query.
    
    // Find where INSERT starts
    const insertIndex = sql.indexOf('INSERT INTO users');
    const createSql = sql.substring(0, insertIndex);
    
    console.log('Running schema migration...');
    await pool.query(createSql);
    
    console.log('Seeding admin user...');
    const insertQuery = `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `;
    
    await pool.query(insertQuery, ['admin@popc.dev', hash, 'Admin User', 'admin']);
    
    console.log('Migration complete. Admin user seeded (admin@popc.dev / admin123)');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
}

run();

