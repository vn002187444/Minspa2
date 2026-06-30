const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/run_migration.js <sql-file>');
    process.exit(1);
  }

  const sql = fs.readFileSync(file, 'utf8');
  const url = process.env.POSTGRES_URL_NON_POOLING;

  if (!url) {
    console.error('POSTGRES_URL_NON_POOLING not set');
    process.exit(1);
  }

  console.log(`Connecting to ${url.substring(0, 40)}...`);
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false, ca: '' } });
  await client.connect();
  console.log('Connected. Executing...');

  try {
    await client.query(sql);
    console.log('Migration applied successfully!');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('Note: Some objects already exist -', err.message);
    } else if (err.message.includes('already enabled')) {
      console.log('Note: RLS already enabled -', err.message);
    } else if (err.message.includes('does not exist')) {
      console.log('Warning: Table/relation missing:', err.message);
      console.log('Continuing...');
    } else {
      throw err;
    }
  }

  await client.end();
}

run().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
