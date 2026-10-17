import { createClient } from '@/utils/supabase/server';
import { getBaseUrl } from '@/lib/env';
import { logger } from '@/lib/logger';
import { slugify } from '@/lib/slugify';

// ISR: tự động cập nhật nội dung mỗi 1 giờ, không truy vấn DB mỗi request (tiết kiệm CPU).
export const revalidate = 3600;

function clean(text: unknown): string {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET() {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const lines: string[] = [];

  lines.push('# Min Nail & Hair');
  lines.push('');
  lines.push(
    '> Min Nail & Hair là salon nail & hair, gội dưỡng sinh và massage tại Thủ Đức, TP. Hồ Chí Minh. Đặt lịch hẹn trực tuyến nhanh chóng.'
  );
  lines.push('');
  lines.push('Giờ mở cửa: 09:00 – 20:30 (tất cả các ngày trong tuần).');
  lines.push('');

  // Dịch vụ đang hoạt động
  try {
    const supabase = await createClient();
    const { data: services } = await supabase
      .from('services')
      .select('name, description, category')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .limit(200);

    if (services?.length) {
      lines.push('## Dịch vụ');
      lines.push('');
      for (const s of services as Array<{ name: string; description?: string }>) {
        const url = `${baseUrl}/dich-vu/${slugify(s.name)}`;
        const desc = clean(s.description);
        lines.push(`- [${s.name}](${url})${desc ? `: ${desc}` : ''}`);
      }
      lines.push('');
    }
  } catch (err) {
    logger.error('llms.txt: failed to fetch services', err as Error);
  }

  // Bài viết mới nhất (blogs + seo_articles, khử trùng theo slug)
  const seen = new Set<string>();
  const posts: string[] = [];
  try {
    const supabase = await createClient();
    const { data: blogs } = await supabase
      .from('blogs')
      .select('title, slug, summary, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(30);

    for (const b of (blogs as Array<{ title: string; slug: string; summary?: string }>) || []) {
      if (!b.slug || seen.has(b.slug)) continue;
      seen.add(b.slug);
      const desc = clean(b.summary);
      posts.push(`- [${b.title}](${baseUrl}/blog/${b.slug})${desc ? `: ${desc}` : ''}`);
    }
  } catch (err) {
    logger.error('llms.txt: failed to fetch blogs', err as Error);
  }

  try {
    const supabase = await createClient();
    const { data: articles } = await supabase
      .from('seo_articles')
      .select('topic, blog_slug, published_at')
      .not('blog_slug', 'is', null)
      .order('published_at', { ascending: false })
      .limit(30);

    for (const a of (articles as Array<{ topic?: string; blog_slug: string }>) || []) {
      if (!a.blog_slug || seen.has(a.blog_slug)) continue;
      seen.add(a.blog_slug);
      posts.push(`- [${clean(a.topic) || a.blog_slug}](${baseUrl}/blog/${a.blog_slug})`);
    }
  } catch (err) {
    logger.error('llms.txt: failed to fetch seo_articles', err as Error);
  }

  if (posts.length) {
    lines.push('## Bài viết mới nhất');
    lines.push('');
    lines.push(...posts);
    lines.push('');
  }

  // Trang chính
  lines.push('## Trang chính');
  lines.push('');
  lines.push(`- [Trang chủ](${baseUrl}/): giới thiệu salon, bảng giá, đặt lịch`);
  lines.push(`- [Đặt lịch](${baseUrl}/booking): đặt lịch hẹn trực tuyến`);
  lines.push(`- [Giới thiệu](${baseUrl}/about): thông tin, địa chỉ, giờ mở cửa`);
  lines.push(`- [Câu hỏi thường gặp](${baseUrl}/faq)`);
  lines.push(`- [Blog](${baseUrl}/blog): kiến thức chăm sóc nail & hair`);
  lines.push('');

  const body = lines.join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
