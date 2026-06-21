-- Fix: Create missing blog_views and blog_stats tables (P4.20)
-- These were in database.sql but never applied

CREATE TABLE IF NOT EXISTS public.blog_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  ip_hash VARCHAR(64),
  user_agent TEXT
);

CREATE TABLE IF NOT EXISTS public.blog_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  UNIQUE(post_id, date)
);

CREATE INDEX IF NOT EXISTS idx_blog_views_post_id ON public.blog_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_viewed_at ON public.blog_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_blog_stats_date ON public.blog_stats(date);

CREATE OR REPLACE FUNCTION public.increment_blog_view(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.blog_stats
  SET views = views + 1
  WHERE post_id = p_post_id AND date = CURRENT_DATE;
  IF NOT FOUND THEN
    INSERT INTO public.blog_stats (post_id, date, views) VALUES (p_post_id, CURRENT_DATE, 1);
  END IF;
END;
$$;

GRANT ALL ON public.blog_views TO service_role;
GRANT ALL ON public.blog_stats TO service_role;
