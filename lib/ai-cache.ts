import { createClient } from '@/utils/supabase/server';

export async function getAiCache(key: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ai_cache')
    .select('response')
    .eq('id', key)
    .gt('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
    .single();

  if (error || !data) return null;
  return data.response;
}

export async function setAiCache(key: string, response: any) {
  const supabase = await createClient();
  await supabase.from('ai_cache').upsert({
    id: key,
    response,
    created_at: new Date().toISOString(),
  });
}
