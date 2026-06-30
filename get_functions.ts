import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error('POSTGRES_URL_NON_POOLING is not defined in .env.local');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
});

async function getFunctionDef(funcName: string) {
  try {
    const res = await client.query(
      `SELECT pg_get_functiondef(pfunc.oid) 
       FROM pg_proc pfunc 
       WHERE proname = $1`, 
      [funcName]
    );
    return res.rows.length > 0 ? res.rows[0].pg_get_functiondef : null;
  } catch (err) {
    console.error(`Error fetching function ${funcName}:`, err);
    return null;
  }
}

async function main() {
  try {
    await client.connect();
    
    const functions = ['notify_appointment_change', 'update_customer_last_booking'];
    for (const func of functions) {
      console.log(`--- ${func} ---`);
      const def = await getFunctionDef(func);
      if (def) {
        console.log(def);
      } else {
        console.log('Function not found');
      }
      console.log('--- End ---\n');
    }
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await client.end();
  }
}

main();
