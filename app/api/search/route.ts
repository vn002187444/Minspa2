import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json({ success: true, results: { articles: [], services: [] } });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
    const rl = await rateLimit(`search:${ip}`, 20, 60);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'Quá nhiều yêu cầu. Thử lại sau.' }, { status: 429 });
    }

    const supabase = await createClient();

    // Search in Blogs (Manual) + SEO Articles (Auto)
    const { data: blogPosts, error: blogErr } = await supabase
      .from('blogs')
      .select('id, title, slug, image_url')
      .textSearch('search_vector', query, {
        config: 'simple',
        type: 'websearch',
      })
      .limit(5);

    const { data: seoArticles, error: seoErr } = await supabase
      .from('seo_articles')
      .select('id, topic, image_url')
      .textSearch('search_vector', query, {
        config: 'simple',
        type: 'websearch',
      })
      .limit(5);

    // Search in Services
    const { data: services, error: serviceErr } = await supabase
      .from('services')
      .select('id, name, price, duration')
      .eq('is_active', true)
      .textSearch('search_vector', query, {
        config: 'simple',
        type: 'websearch',
      })
      .limit(5);

    if (blogErr && seoErr && serviceErr) {
      throw new Error(`Search error: ${blogErr.message} | ${seoErr.message} | ${serviceErr.message}`);
    }

    // Combine blogs and seo articles into one list
    const allArticles = [
      ...(blogPosts || []).map(p => ({ ...p, type: 'manual', link: `/blog/${p.slug}` })),
      ...(seoArticles || []).map(p => ({ ...p, type: 'auto', title: p.topic, link: `/blog/${p.id}` }))
    ]        .sort((_a, _b) => 0); // could add ranking here

    return NextResponse.json({
      success: true,
      results: {
        articles: allArticles,
        services: services || [],
      },
    });
  } catch (error: unknown) {
    console.error('[API SEARCH ERROR]:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
