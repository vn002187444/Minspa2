import { createClient } from '@supabase/supabase-js';

const serviceSupabase = createClient(
  'https://dpviknfsfgvkfyurhtpm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdmlrbmZzZmd2a2Z5dXJodHBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcwNDkxNSwiZXhwIjoyMDk3MjgwOTE1fQ.XwXbXc5FhPRFCaDPmfM6jvNo1HOYHbIUEN4P0_l6ZLQ'
);

const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdmlrbmZzZmd2a2Z5dXJodHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDQ5MTUsImV4cCI6MjA5NzI4MDkxNX0.H4rmObwIK8sD7g7fBwZF2N76G4aEbgMhS0ERvXxOG98';

async function main() {
  // Try to upload with anon key (simulating what the server action does)
  const anonSupabase = createClient(
    'https://dpviknfsfgvkfyurhtpm.supabase.co',
    anonKey
  );
  
  const { data: _uploadData, error: uploadErr } = await anonSupabase.storage
    .from('service-images')
    .upload('test-permissions.txt', new Blob(['test']), { contentType: 'text/plain' });
  
  if (uploadErr) {
    console.log('Anon upload ERROR:', uploadErr.message);
    
    // Try with service role key to verify bucket works
    const { data: svcUpload, error: svcErr } = await serviceSupabase.storage
      .from('service-images')
      .upload('test-svc.txt', new Blob(['test']), { contentType: 'text/plain' });
    
    if (svcErr) console.log('Service role upload also failed:', svcErr.message);
    else console.log('Service role upload succeeded:', svcUpload.path);
  } else {
    console.log('Anon upload succeeded!');
  }
}

main().catch(console.error);
