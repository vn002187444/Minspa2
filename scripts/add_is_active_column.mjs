import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  // Use the supabase REST API to execute raw SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
    },
  });

  // Try the pg_dump endpoint approach
  const sql = "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;";
  
  // Try Supabase's own SQL endpoint
  try {
    const res = await fetch(`${supabaseUrl}/api/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
      redirect: 'follow',
    });
    console.log('API SQL Status:', res.status);
    const text = await res.text();
    console.log('Response:', text.substring(0, 1000));
  } catch (e) {
    console.log('API SQL failed:', e.message);
  }

  // Try direct pg connection if available
  try {
    const pg = await import('pg');
    // Check if DATABASE_URL is set in env
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      const pool = new pg.Pool({ connectionString: databaseUrl });
      await pool.query(sql);
      console.log('Column added successfully via pg!');
      await pool.end();
    } else {
      console.log('No DATABASE_URL available for direct connection');
    }
  } catch (e) {
    console.log('pg approach:', e.message);
  }
}

run();
