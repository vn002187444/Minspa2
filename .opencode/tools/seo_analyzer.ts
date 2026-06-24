export const description = 'Quét bài blog trong database, phát hiện bài thiếu meta description, slug, hoặc image. Cần Supabase env vars.';
export const args = {
  fix: {
    type: 'boolean',
    description: 'Tự động sửa các bài thiếu meta description (dùng Gemini sinh tự động).',
    default: false,
  },
};

export async function execute({ fix = false }: { fix?: boolean }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, error: 'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.' };
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: articles, error } = await supabase
      .from('seo_articles')
      .select('id, title, slug, meta_description, image_url, content')
      .not('status', 'eq', 'deleted');

    if (error) {
      return { success: false, error: `Query failed: ${error.message}` };
    }

    const issues: Array<{ id: number; title: string; issues: string[] }> = [];

    for (const article of (articles || []) as Array<{ id: number; title: string; slug: string | null; meta_description: string | null; image_url: string | null; content: string | null }>) {
      const articleIssues: string[] = [];
      if (!article.slug) articleIssues.push('Missing slug');
      if (!article.meta_description) articleIssues.push('Missing meta description');
      if (!article.image_url) articleIssues.push('Missing image');
      if (article.content && article.content.length < 100) articleIssues.push('Content too short (<100 chars)');
      if (article.content && article.content.length > 10000) articleIssues.push('Content too long (>10000 chars)');

      if (articleIssues.length > 0) {
        issues.push({ id: article.id, title: article.title, issues: articleIssues });
      }
    }

    const totalIssues = issues.reduce((sum, i) => sum + i.issues.length, 0);

    return {
      success: true,
      totalArticles: (articles || []).length,
      articlesWithIssues: issues.length,
      totalIssues,
      issues,
      healthScore: (articles || []).length > 0
        ? Math.round(((articles || []).length - issues.length) / (articles || []).length * 100)
        : 100,
      message: totalIssues === 0
        ? 'All articles are healthy!'
        : `Found ${totalIssues} issue(s) across ${issues.length} article(s).`,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { success: false, error: err.message || 'Failed to analyze SEO articles' };
  }
}
