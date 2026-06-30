// scripts/test-add-staff.ts
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

async function testNullCccd() {
  console.log('Testing inserting a STAFF member with NULL cccd...');
  const { data, error } = await supabase.from('users').insert({
    role: 'STAFF',
    username: 'test_staff_null_' + Math.random().toString(36).substring(7),
    password_hash: '123456',
    full_name: 'Test Staff Null',
    cccd: null
  }).select();

  if (error) {
    console.error('❌ Insert failed with error:', error.message);
    console.error('Full error:', error);
  } else {
    console.log('✅ Insert succeeded!', data);
    await supabase.from('users').delete().eq('id', data[0].id);
  }
}

testNullCccd();
