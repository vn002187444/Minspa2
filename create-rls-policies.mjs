import { createClient } from '@supabase/supabase-js';

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdmlrbmZzZmd2a2Z5dXJodHBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcwNDkxNSwiZXhwIjoyMDk3MjgwOTE1fQ.XwXbXc5FhPRFCaDPmfM6jvNo1HOYHbIUEN4P0_l6ZLQ';

const supabase = createClient(
  'https://dpviknfsfgvkfyurhtpm.supabase.co',
  SERVICE_KEY
);

async function main() {
  // Check what policies exist on storage.objects
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_text: `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies
      WHERE tablename = 'objects' AND schemaname = 'storage'
    `
  }).single();

  console.log('Policies:', JSON.stringify(data, null, 2));
  if (error) console.log('Policy query error:', error.message);
}

main().catch(console.error);
