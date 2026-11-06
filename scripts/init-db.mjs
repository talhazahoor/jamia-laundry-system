import fs from 'fs';
import path from 'path';
import { Pool } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

async function init() {
  if (!connectionString) {
    console.log('ℹ️ DATABASE_URL not detected in environment. Local persistent file-backed mode is ready in .data/laundry_db.json');
    return;
  }

  console.log('🔄 Connecting to Neon Serverless PostgreSQL...');
  const pool = new Pool({ connectionString });
  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('📦 Executing schema migrations on Neon...');
    await pool.query(schemaSql);
    console.log('✅ Neon PostgreSQL tables initialized successfully!');
  } catch (err) {
    console.error('❌ Failed to run Neon migration:', err);
  } finally {
    await pool.end();
  }
}

init();
