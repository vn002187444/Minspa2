'use server'

import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/utils/auth";
import { revalidatePath } from "next/cache";
import { sanitizeHtml, stripHtml } from "@/lib/sanitize";

export async function getBlogPosts(page: number = 1, pageSize: number = 6) {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: posts, count } = await supabase
    .from('blogs')
    .select('id, title, slug, summary, content, image_url, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (count === null) {
    const { data, error } = await supabase
      .from('blogs')
      .select('id, title, slug, summary, content, image_url, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error reading blogs:", error);
      return { posts: [], total: 0, page: 1, pageSize: 6, totalPages: 0 };
    }
    return { posts: (data || []).map(sanitizePost), total: data?.length || 0, page: 1, pageSize: 6, totalPages: 1 };
  }

  return { posts: (posts || []).map(sanitizePost), total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) };
}

function sanitizePost(post: any) {
  return {
    ...post,
    content: sanitizeHtml(post.content || ''),
    summary: stripHtml(post.summary || ''),
  };
}

export async function getBlogPostBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('blogs')
    .select('id, title, slug, summary, content, image_url, created_at')
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
}) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    throw new Error('Unauthorized: Bạn không có quyền thực hiện thao tác này.');
  }

  const supabase = await createClient();

  if (postData.id) {
    // Edit existing post
    const { error } = await supabase
      .from('blogs')
      .update({
        title: postData.title,
        slug: postData.slug,
        summary: stripHtml(postData.summary || ''),
        content: sanitizeHtml(postData.content || ''),
        image_url: postData.image_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', postData.id);

    if (error) {
      throw new Error(error.message || 'Lỗi khi cập nhật bài viết.');
    }
  } else {
    // Insert new post
    // Check if slug is taken
    const { data: existing } = await supabase
      .from('blogs')
      .select('id')
      .eq('slug', postData.slug)
      .single();

    if (existing) {
      throw new Error('Slug này đã tồn tại, vui lòng đổi tiêu đề bài viết khác hoặc chỉnh sửa link tay.');
    }

    const { error } = await supabase
      .from('blogs')
      .insert({
        title: postData.title,
        slug: postData.slug,
        summary: stripHtml(postData.summary || ''),
        content: sanitizeHtml(postData.content || ''),
        image_url: postData.image_url || 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop',
        created_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(error.message || 'Lỗi khi tạo mới bài viết.');
    }
  }

  revalidatePath('/blog');
  revalidatePath(`/blog/${postData.slug}`);
  revalidatePath('/sitemap');
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
  revalidatePath('/sitemap');
  revalidatePath('/admin/blog');
  return { success: true };
}

export async function getCurrentSessionUser() {
  const session = await getSession();
  return session ? session.user : null;
}
