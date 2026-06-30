import 'dotenv/config';
import { createClient } from '@/utils/supabase/server';

async function main() {
  try {
    // Simulate session as admin by setting env variable SUPABASE_SERVICE_ROLE_KEY if needed
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, role, is_active')
      .in('role', ['STAFF', 'MANAGER'])
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching staff:', error);
      process.exit(1);
    }
    console.log('Staff records:', data);
  } catch (e) {
    console.error('Unexpected error:', e);
    process.exit(1);
  }
}

main();
