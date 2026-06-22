import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('seo_settings')
      .select('theme_override, theme_particles_enabled')
      .eq('id', 1)
      .single();

    return NextResponse.json({
      override: data?.theme_override || null,
      particlesEnabled: data?.theme_particles_enabled ?? true,
    });
  } catch {
    return NextResponse.json({ override: null, particlesEnabled: true });
  }
}
