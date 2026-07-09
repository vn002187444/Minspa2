import Link from 'next/link';
import Image from 'next/image';
import { getBlogPostBySlug, getBlogPosts } from '../actions';
import ShareButton from './ShareButton';
import { notFound } from 'next/navigation';
import { sanitizeHtml } from '@/lib/sanitize';

function isHtmlContent(text: string): boolean {
  try {
    return new RegExp('<[a-z][\\s\\S]*>', 'i').test(text);
  } catch {
    return false;
  }
}

function inlineMarkdown(text: string): string {
  let t = text;
  // Images: ![alt](url)
  t = t.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="rounded-xl mx-auto my-6 w-full md:w-auto" loading="lazy"/>',
  );
  // Bold: **text**
  t = t.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-bold text-[#5C4033]">$1</strong>',
  );
  // Links: [text](url)
  t = t.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-[#8D6E53] hover:text-[#5C4033] font-semibold underline hover:no-underline transition-colors">$1</a>',
  );
  return t;
}

function markdownToHtml(text: string): string {
  let html = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Escape HTML special chars (must be before markdown processing)
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Insert blank lines before block elements that lack them:
  //   inline headers (### or ## mid-paragraph), blockquotes, HRs
  html = html
    .replace(/([^\n])### /g, '$1\n\n### ')
    .replace(/([^\n])## /g, '$1\n\n## ')
    .replace(/([^\n])---+/g, '$1\n\n---')
    .replace(/([^\n])> /g, '$1\n\n> ');
  const blocks = html.split(/\n{2,}/);
  return blocks
    .map((block) => {
      const t = block.trim();
      if (!t) return '';
      // Horizontal rule
      if (/^---+\s*$/.test(t)) return '<hr/>';
      // Blockquote
      if (t.startsWith('> ')) {
        const lines = t
          .split('\n')
          .map((l) => l.replace(/^>\s?/, ''))
          .join('<br/>');
        return `<blockquote><p>${lines}</p></blockquote>`;
      }
      // Unordered list
      if (/^[\*\-]\s/.test(t)) {
        const items = t
          .split('\n')
          .map((l) => `<li>${inlineMarkdown(l.replace(/^[\*\-]\s+/, ''))}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }
      // Ordered list
      if (/^\d+\.\s/.test(t)) {
        const items = t
          .split('\n')
          .map((l) => `<li>${inlineMarkdown(l.replace(/^\d+\.\s+/, ''))}</li>`)
          .join('');
        return `<ol>${items}</ol>`;
      }
      // Headings
      if (t.startsWith('## ')) return `<h2>${inlineMarkdown(t.replace(/^##\s+/, ''))}</h2>`;
      if (t.startsWith('### ')) return `<h3>${inlineMarkdown(t.replace(/^###\s+/, ''))}</h3>`;
      // Regular paragraph
      return `<p>${inlineMarkdown(t)}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import dynamic from 'next/dynamic';
const BottomNavigation = dynamic(() => import('@/components/BottomNavigation'));
import { ArrowLeft, Calendar, Sparkles, User, BookOpen, Clock } from 'lucide-react';
import ViewTracker from '@/components/ViewTracker';
import ArticleSchema from '@/components/ArticleSchema';
import BreadcrumbSchema from '@/components/BreadcrumbSchema';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import { getBaseUrl } from '@/lib/env';

export const revalidate = 60; // Revalidate every minute

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const resolvedParams = await params;
  const post = await getBlogPostBySlug(resolvedParams.slug);

  const baseUrl = getBaseUrl();

  if (!post) {
    return {
      title: "Không tìm thấy bài viết | Min Nail & Hair",
      description: "Bài viết không khả dụng hoặc đã bị gỡ.",
      robots: { index: false },
    };
  }

  const ogImage = post.image_url || `${baseUrl}/icons/icon-512.png`;
  const keywordsArr = post.keywords
    ? post.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
    : [];

  return {
    title: `${post.title} - Min Nail & Hair`,
    description: post.summary || 'Cẩm nang thông tin chăm sóc cơ thể tại Min Nail & Hair',
    alternates: { canonical: `${baseUrl}/blog/${resolvedParams.slug}` },
    keywords: keywordsArr.length > 0 ? keywordsArr.join(', ') : undefined,
    openGraph: {
      type: "article",
      locale: "vi_VN",
      siteName: "Min Nail & Hair",
      title: `${post.title} - Min Nail & Hair`,
      description: post.summary || 'Cẩm nang thông tin chăm sóc cơ thể tại Min Nail & Hair',
      url: `${baseUrl}/blog/${resolvedParams.slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.image_alt || post.title }],
      publishedTime: post.created_at || undefined,
      modifiedTime: post.updated_at || post.created_at || undefined,
      authors: [`${baseUrl}/about`],
      tags: keywordsArr.length > 0 ? keywordsArr : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} - Min Nail & Hair`,
      description: post.summary || 'Cẩm nang thông tin chăm sóc cơ thể tại Min Nail & Hair',
      images: [{ url: ogImage, alt: post.image_alt || post.title }],
    },
  };
}

export default async function BlogPostDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const post = await getBlogPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const { posts: allPosts } = await getBlogPosts();
  const recentPosts = allPosts
    .filter((p: any) => p.id !== post.id)
    .slice(0, 3); // top 3 other posts

  const formattedDate = post.created_at 
    ? format(new Date(post.created_at), 'dd MMMM yyyy', { locale: vi })
    : 'Đang cập nhật';

  const wordCount = post.content ? post.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const baseUrl = getBaseUrl();

  return (
    <>
      <ArticleSchema
        title={post.title}
        description={post.summary || ''}
        image={post.image_url || ''}
        datePublished={post.created_at || ''}
        dateModified={post.updated_at || post.created_at || ''}
        author="Min Nail & Hair"
        baseUrl={`${baseUrl}/blog/${resolvedParams.slug}`}
        articleSection="Làm đẹp & Sức khỏe"
        keywords={post.keywords ? post.keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : undefined}
        wordCount={wordCount}
      />
      <BreadcrumbSchema items={[
        { name: "Trang chủ", url: baseUrl },
        { name: "Blog", url: `${baseUrl}/blog` },
        { name: post.title, url: `${baseUrl}/blog/${resolvedParams.slug}` },
      ]} />
      <ViewTracker postId={post.id} />
    <div className="min-h-screen bg-[#FAF6F0] text-[#3A2E2B] font-sans pb-16">
      {/* Blog Detail Header */}
      <header className="sticky top-0 z-50 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#EADDCD] px-4 py-4 md:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 bg-[#8D6E53] rounded-full flex items-center justify-center shadow-md text-white font-bold text-lg">
              M
            </Link>
            <div>
              <Link href="/" className="font-display font-black text-lg uppercase tracking-wider text-[#3A2E2B]">
                MIN SALON
              </Link>
              <span className="block text-[9px] uppercase tracking-[0.2em] text-[#8D6E53] font-bold -mt-1 font-mono">Blogs &amp; SEO Suite</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/blog" className="text-xs font-bold text-[#8D6E53] hover:text-[#3A2E2B] flex items-center gap-1 transition-all">
              <ArrowLeft className="w-3.5 h-3.5" /> Danh sách bài viết
            </Link>
            <Link href="/booking" className="text-xs font-bold bg-[#8D6E53] text-white hover:bg-[#3A2E2B] px-4 py-2.5 rounded-full uppercase tracking-wider shadow-md transition-all">
              Booking ⚡
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-4">
        <BreadcrumbNav items={[
          { name: "Trang chủ", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: post.title, url: `/blog/${resolvedParams.slug}` },
        ]} />
      </div>
      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 mt-2 md:mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Article Main Content (8 cols) */}
          <article 
            className="lg:col-span-8 bg-white rounded-2xl md:rounded-3xl border border-[#EADDCD]/60 px-4 sm:px-6 md:px-8 py-5 md:py-8 space-y-5 md:space-y-6 shadow-sm max-w-full break-words mb-6 md:mb-12"
            style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
          >
            {/* Banner image */}
            <div className="relative h-48 sm:h-60 md:h-[400px] w-full max-w-full rounded-xl md:rounded-2xl overflow-hidden bg-stone-100 border border-[#EADDCD]/20 shadow-inner">
              <Image
                src={post.image_url || "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop"}
                alt={post.image_alt || post.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Author / Date Meta bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-stone-500 pb-4 border-b border-stone-100 max-w-full">
              <div className="flex flex-wrap items-center gap-4 max-w-full">
                <div className="flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <Calendar className="w-4 h-4 text-[#8D6E53]" />
                  <span>Đăng ngày {formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5 uppercase tracking-wider">
                  <User className="w-4 h-4 text-[#8D6E53]" />
                  <span>Biên tập viên Min Salon</span>
                </div>
                <div className="inline-flex items-center gap-1 bg-[#8D6E53]/10 text-[#8D6E53] px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider" id="reading-time-badge">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{readingTime} phút đọc</span>
                </div>
              </div>
              <ShareButton title={post.title} />
            </div>

            {/* Title & Summary */}
            <div className="space-y-4 max-w-full">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-100 pb-2 max-w-full">
                <h1 className="text-2xl md:text-4xl font-display font-black text-[#5C4033] leading-tight max-w-full">
                  {post.title}
                </h1>
                <div className="shrink-0">
                  <ShareButton title={post.title} />
                </div>
              </div>
              <p className="text-sm md:text-base italic text-stone-600 bg-[#FAF6F0] p-4 rounded-2xl border-l-4 border-[#8D6E53]/80 leading-relaxed font-medium max-w-full">
                {post.summary}
              </p>
            </div>

            {/* Rich text output */}
            <div className="prose prose-stone max-w-full prose-headings:font-display prose-headings:text-[#5C4033] prose-h2:text-xl prose-h2:md:text-2xl prose-h2:border-b prose-h2:border-stone-100 prose-h2:pb-1 prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-lg prose-h3:md:text-xl prose-h3:mt-6 prose-h3:mb-2 prose-p:text-stone-700 prose-p:leading-relaxed prose-p:text-sm prose-p:md:text-base prose-a:text-[#8D6E53] prose-a:font-semibold prose-a:underline hover:prose-a:no-underline prose-strong:text-[#5C4033] prose-strong:font-bold prose-img:rounded-xl prose-img:mx-auto prose-img:my-6 prose-blockquote:border-l-[#8D6E53] prose-blockquote:bg-[#FAF6F0] prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-2xl prose-blockquote:italic prose-blockquote:text-stone-600 prose-li:text-stone-700 prose-li:marker:text-[#8D6E53] pt-2">
              {!post.content ? (
                <p className="text-stone-400">Không có dữ liệu bài viết.</p>
              ) : isHtmlContent(post.content) ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(markdownToHtml(post.content)) }} />
              )}
            </div>

            {/* Backlink & Internal Promotion block */}
            <div className="mt-8 p-6 bg-[#FAF0E6] rounded-2xl border-2 border-[#EADDCD] space-y-3">
              <span className="inline-flex items-center gap-1 bg-[#8D6E53] text-white font-bold text-[11px] tracking-wider px-2.5 py-1 rounded-full uppercase">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Ưu đãi đặt lịch
              </span>
              <h4 className="font-bold text-base text-[#5C4033]">Bấm máy Đặt Lịch hoặc Chọn gói combo làm đẹp ngay hôm nay!</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Đăng ký online tại Min Nail &amp; Hair giúp thợ chuẩn bị phòng bấm huyệt, chuẩn bị đá nóng và nước gội thảo dước nóng tốt nhất cho bạn!
              </p>
              <div className="pt-2">
                <Link 
                  href="/booking" 
                  className="inline-flex items-center gap-2 text-xs font-black bg-[#8D6E53] hover:bg-[#5C4033] text-white px-5 py-3 rounded-full uppercase tracking-wider shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  Đặt lịch dịch vụ trực tuyến 📅
                </Link>
              </div>
            </div>
          </article>

          {/* Right Sidebar (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Quick Action Widget */}
            <div className="bg-white rounded-3xl border border-[#EADDCD]/60 p-6 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#8D6E53]/10 flex items-center justify-center mx-auto text-[#8D6E53]">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#5C4033]">Min Nail &amp; Hair</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Hệ thống gội dưỡng sinh thảo dược Tây Bắc kết hợp làm móng kiểu Hàn tại TP. Hồ Chí Minh.
              </p>
              <div className="space-y-2 pt-2">
                <Link 
                  href="/booking" 
                  className="block w-full py-3 bg-[#8D6E53] hover:bg-[#5C4033] text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-sm active:scale-95"
                >
                  Đặt Lịch Đã Chọn 💅
                </Link>
                <Link 
                  href="/" 
                  className="block w-full py-3 bg-white hover:bg-[#FAF6F0] text-[#8D6E53] border border-[#EADDCD] font-bold text-xs uppercase tracking-wider rounded-2xl transition-all"
                >
                  Xem bảng giá dịch vụ
                </Link>
              </div>
            </div>

            {/* Other Recent Posts */}
            <div className="bg-white rounded-3xl border border-[#EADDCD]/60 p-6 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-sm text-[#3A2E2B] uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-100 pb-2">
                <BookOpen className="w-4 h-4 text-[#8D6E53]" /> Các bài viết khác
              </h3>

              {recentPosts.length === 0 ? (
                <p className="text-xs text-stone-400">Không tìm thấy bài viết khác.</p>
              ) : (
                <div className="space-y-4">
                  {recentPosts.map((post: any) => (
                    <Link 
                      key={post.id} 
                      href={`/blog/${post.slug}`}
                      className="flex items-center gap-3 group border-b border-stone-50/50 pb-3 last:border-0 last:pb-0 block"
                    >
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                        <Image
                          src={post.image_url || "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop"}
                          alt={post.image_alt || post.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#8D6E53] line-clamp-2 transition-colors leading-snug">
                          {post.title}
                        </h4>
                        <span className="text-[9px] text-[#8D6E53] font-bold uppercase tracking-wider block mt-0.5">
                          Đọc ngay →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </aside>

        </div>
      </main>
      <BottomNavigation />
    </div>
    </>
  );
}
