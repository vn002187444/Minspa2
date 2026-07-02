import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';

export const revalidate = 3600; // Cache sitemap for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minhair.vercel.app';

  // 1. Static Routes
  const routes = [
    '',
    '/booking',
    '/blog',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // 2. Fetch all services
  let servicesRoutes: any[] = [];
  try {
    const supabase = await createClient();
    const { data: services } = await supabase
      .from('services')
      .select('id, category')
      .eq('is_active', true);

    if (services && services.length > 0) {
      servicesRoutes = services.map((svc: any) => ({
        url: `${baseUrl}/booking?service=${svc.id}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.error('Error fetching services for sitemap:', err);
  }

  // 3. Fetch all blog posts
  let blogsRoutes: any[] = [];
  try {
    const supabase = await createClient();
    const { data: blogs } = await supabase
      .from('blogs')
      .select('slug, created_at')
      .order('created_at', { ascending: false });

    if (blogs && blogs.length > 0) {
      blogsRoutes = blogs.map((post: any) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.created_at ? new Date(post.created_at).toISOString() : new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error('Error fetching blogs for sitemap:', err);
  }

  // 4. Fetch all published SEO articles with blog_slug
  let seoRoutes: any[] = [];
  try {
    const supabase = await createClient();
    const { data: articles } = await supabase
      .from('seo_articles')
      .select('blog_slug, published_at')
      .not('blog_slug', 'is', null)
      .order('published_at', { ascending: false });

    if (articles && articles.length > 0) {
      seoRoutes = articles.map((a: any) => ({
        url: `${baseUrl}/blog/${a.blog_slug}`,
        lastModified: a.published_at ? new Date(a.published_at).toISOString() : new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.error('Error fetching seo_articles for sitemap:', err);
  }

  return [...routes, ...servicesRoutes, ...blogsRoutes, ...seoRoutes];
}
