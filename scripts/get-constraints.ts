// scripts/get-constraints.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getConstraints() {
  const { data, error } = await supabase.rpc('get_table_constraints', { table_name: 'users' });
  if (error) {
    // If RPC doesn't exist, we can use an inline SQL query via REST API or write a query.
    // Wait, let's try calling a raw query if we have an rpc, or query pg_constraint using select.
    // But wait, Supabase REST API doesn't allow raw SQL unless we use an RPC.
    // Let's see if we can query pg_catalog or information_schema using rpc or check if there is an existing rpc.
    console.error('RPC get_table_constraints failed:', error.message);
    
    // Let's try executing a select from a pg view if accessible via PostgREST
    // PostgREST sometimes exposes schemas or pg_catalog if configured.
    console.log('Trying to query postgrest directly...');
  } else {
    console.log('Constraints:', data);
  }
}

getConstraints();
