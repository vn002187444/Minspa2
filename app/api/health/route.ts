import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('appointments').select('id', { count: 'exact', head: true });
    
    if (error) {
      return NextResponse.json({ status: 'unhealthy', error: error.message }, { status: 503 });
    }
    
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
  }
}
