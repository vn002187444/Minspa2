import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('seo_settings')
      .select('mascot_enabled, mascot_character, mascot_sound')
      .eq('id', 1)
      .single();

    return NextResponse.json({
      enabled: data?.mascot_enabled ?? true,
      character: data?.mascot_character || 'min',
      soundEnabled: data?.mascot_sound ?? true,
    });
  } catch {
    return NextResponse.json({
      enabled: true,
      character: 'min',
      soundEnabled: true,
    });
  }
}
