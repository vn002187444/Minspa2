import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';
import { getBaseUrl } from '@/lib/env';
import { logger } from '@/lib/logger';
import { slugify } from '@/lib/slugify';
import { LANGUAGES } from '@/lib/i18n/config';

export const revalidate = 43200;

// Helper để sinh hreflang alternates cho sitemap (đáp ứng yêu cầu B full 9 locales)
// Next MetadataRoute.Sitemap hỗ trợ `alternates: { languages: {...} }` -> render <xhtml:link>
function withHreflang(url: string): MetadataRoute.Sitemap[number]['alternates'] {
  const langs: Record<string, string> = {};
  for (const loc of Object.keys(LANGUAGES)) {
    // Mỗi locale có URL riêng /{locale}{path}
    const path = url.replace(/^https?:\/\/[^/]+/, '') || '/';
    const base = url.replace(path, '');
    langs[loc] = `${base}/${loc}${path === '/' ? '' : path}`;
  }
  langs['x-default'] = `${url.replace(/\/$/, '')}/vi`;
  return { languages: langs };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const routes: MetadataRoute.Sitemap = [
    '',
    '/about',
    '/faq',
    '/booking',
    '/blog',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : route === '/about' || route === '/faq' ? 0.7 : 0.8,
    alternates: withHreflang(`${baseUrl}${route}`),
  }));

  const blogMap = new Map<string, MetadataRoute.Sitemap[number]>();

  try {
    const supabase = await createClient();
    const { data: blogs } = await supabase
      .from('blogs')
      .select('slug, created_at, updated_at')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (blogs) {
      for (const post of blogs) {
        const url = `${baseUrl}/blog/${post.slug}`;
        blogMap.set(post.slug, {
          url,
          lastModified: (post.updated_at || post.created_at)
            ? new Date(post.updated_at || post.created_at).toISOString()
            : new Date().toISOString(),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: withHreflang(url),
        });
      }
    }
  } catch (err) {
    logger.error('Error fetching blogs for sitemap', err as Error);
  }

  try {
    const supabase = await createClient();
    const { data: articles } = await supabase
      .from('seo_articles')
      .select('blog_slug, published_at')
      .not('blog_slug', 'is', null)
      .order('published_at', { ascending: false });

    if (articles) {
      for (const a of articles) {
        if (!blogMap.has(a.blog_slug)) {
          const url = `${baseUrl}/blog/${a.blog_slug}`;
          blogMap.set(a.blog_slug, {
            url,
            lastModified: a.published_at
              ? new Date(a.published_at).toISOString()
              : new Date().toISOString(),
            changeFrequency: 'weekly',
            priority: 0.6,
            alternates: withHreflang(url),
          });
        }
      }
    }
  } catch (err) {
    logger.error('Error fetching seo_articles for sitemap', err as Error);
  }

  // Thêm services vào sitemap (khắc phục orphan, tăng GEO coverage)
  const svcMap = new Map<string, MetadataRoute.Sitemap[number]>();
  try {
    const supabase = await createClient();
    const { data: services } = await supabase.from('services').select('name, updated_at, created_at, is_active').eq('is_active', true).limit(200);
    if (services) {
      for (const s of services as any[]) {
        const slug = slugify(s.name);
        const url = `${baseUrl}/dich-vu/${slug}`;
        svcMap.set(slug, {
          url,
          lastModified: s.updated_at || s.created_at ? new Date(s.updated_at || s.created_at).toISOString() : new Date().toISOString(),
          changeFrequency: 'weekly',
          priority: 0.8,
          alternates: withHreflang(url),
        });
      }
    }
  } catch (err) {
    logger.error('Error fetching services for sitemap', err as Error);
  }

  return [...routes, ...blogMap.values(), ...svcMap.values()];
}
