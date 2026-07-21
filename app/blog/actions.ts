'use server'

import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/utils/auth";
import { revalidatePath } from "next/cache";
import { sanitizeHtml, stripHtml } from "@/lib/sanitize";
import { normalizeNFC } from "@/lib/utils";

export async function getBlogPosts(page: number = 1, pageSize: number = 6, includeDrafts: boolean = false) {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('blogs')
    .select('id, title, slug, summary, content, image_url, image_alt, created_at, updated_at, published, keywords', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (!includeDrafts) {
    query = query.eq('published', true);
  }

  const { data: posts, count } = await query.range(from, to);

  if (count === null) {
    const { data, error } = await supabase
      .from('blogs')
      .select('id, title, slug, summary, content, image_url, image_alt, created_at, updated_at, keywords')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error reading blogs:", error);
      return { posts: [], total: 0, page: 1, pageSize: 6, totalPages: 0 };
    }
    return { posts: (data || []).map(sanitizePost), total: data?.length || 0, page: 1, pageSize: 6, totalPages: 1 };
  }

  return { posts: (posts || []).map(sanitizePost), total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) };
}

async function sanitizePost(post: any) {
  const normalized = normalizeNFC(post || {});
  return {
    ...normalized,
    content: await sanitizeHtml(normalized.content || ''),
    summary: stripHtml(normalized.summary || ''),
  };
}

export async function getBlogPostBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('blogs')
    .select('id, title, slug, summary, content, image_url, image_alt, created_at, updated_at, keywords')
    .eq('slug', slug)
    .single();

  if (error) {
    console.warn(`Blog not found for slug: ${slug}, error:`, error?.message);
    return null;
  }
  return sanitizePost(data);
}

export async function saveBlogPost(postData: {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  image_url: string;
  image_alt?: string;
  published?: boolean;
  keywords?: string;
}) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized: Bạn không có quyền thực hiện thao tác này.');
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const normalized = normalizeNFC(postData) as typeof postData;

  if (postData.id) {
    const updates: Record<string, unknown> = {
      title: normalized.title,
      slug: normalized.slug,
      summary: stripHtml(normalized.summary || ''),
      content: await sanitizeHtml(normalized.content || ''),
      image_url: normalized.image_url,
      image_alt: normalized.image_alt || '',
      keywords: normalized.keywords || '',
      updated_at: now,
    };

    // Handle publish status
    if (normalized.published !== undefined) {
      updates.published = normalized.published;
      if (normalized.published) {
        // Set published_at only if not already set
        const { data: existing } = await supabase
          .from('blogs')
          .select('published_at')
          .eq('id', normalized.id)
          .maybeSingle();

        if (existing && !existing.published_at) {
          updates.published_at = now;
        }
      }
    }

    const { error } = await supabase
      .from('blogs')
      .update(updates)
      .eq('id', normalized.id);

    if (error) {
      throw new Error(error.message || 'Lỗi khi cập nhật bài viết.');
    }
  } else {
    // Check if slug is taken
    const { data: existing } = await supabase
      .from('blogs')
      .select('id')
      .eq('slug', normalized.slug)
      .maybeSingle();

    if (existing) {
      throw new Error('Slug này đã tồn tại, vui lòng đổi tiêu đề bài viết khác hoặc chỉnh sửa link tay.');
    }

    const isPublished = normalized.published !== false;

    const { error } = await supabase
      .from('blogs')
      .insert({
        title: normalized.title,
        slug: normalized.slug,
        summary: stripHtml(normalized.summary || ''),
        content: await sanitizeHtml(normalized.content || ''),
        image_url: normalized.image_url || 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop',
        image_alt: normalized.image_alt || '',
        keywords: normalized.keywords || '',
        published: isPublished,
        published_at: isPublished ? now : null,
        created_at: now,
      });

    if (error) {
      throw new Error(error.message || 'Lỗi khi tạo mới bài viết.');
    }
  }

  revalidatePath('/blog');
  revalidatePath(`/blog/${normalized.slug}`);
  revalidatePath('/sitemap.xml');
  revalidatePath('/admin/blog');
  return { success: true };
}

export async function deleteBlogPost(id: string) {
  const session = await getSession();
  // Only ADMIN is allowed to delete posts (MANAGER cannot delete)
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Chỉ tài khoản ADMIN mới có quyền xóa bài viết.');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('blogs')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Lỗi khi xóa bài viết.');
  }

  revalidatePath('/blog');
  revalidatePath('/sitemap.xml');
  revalidatePath('/admin/blog');
  return { success: true };
}

export async function getCurrentSessionUser() {
  const session = await getSession();
  return session ? session.user : null;
}
