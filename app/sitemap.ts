import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';
import { getBaseUrl } from '@/lib/env';
import { logger } from '@/lib/logger';

export const revalidate = 3600;

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
        blogMap.set(post.slug, {
          url: `${baseUrl}/blog/${post.slug}`,
          lastModified: (post.updated_at || post.created_at)
            ? new Date(post.updated_at || post.created_at).toISOString()
            : new Date().toISOString(),
          changeFrequency: 'weekly',
          priority: 0.7,
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
          blogMap.set(a.blog_slug, {
            url: `${baseUrl}/blog/${a.blog_slug}`,
            lastModified: a.published_at
              ? new Date(a.published_at).toISOString()
              : new Date().toISOString(),
            changeFrequency: 'weekly',
            priority: 0.6,
          });
        }
      }
    }
  } catch (err) {
    logger.error('Error fetching seo_articles for sitemap', err as Error);
  }

  return [...routes, ...blogMap.values()];
}
