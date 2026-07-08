import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getBlogPosts } from './actions';
import dynamic from 'next/dynamic';
import { BookOpen, Calendar, ArrowLeft, ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
const BottomNavigation = dynamic(() => import('@/components/BottomNavigation'));
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import GlobalSearch from '@/components/GlobalSearch';
import BreadcrumbSchema from '@/components/BreadcrumbSchema';
import { getBaseUrl } from '@/lib/env';

export const revalidate = 60; // Revalidate every minute

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseUrl();
  return {
    title: 'Cẩm nang Làm đẹp - Min Nail & Hair',
    description: 'Khám phá các bài viết về chăm sóc tóc, móng, massage body tại Min Nail & Hair. Bí quyết làm đẹp cho phái nữ.',
    alternates: { canonical: `${baseUrl}/blog` },
    openGraph: {
      title: 'Cẩm nang Làm đẹp - Min Nail & Hair',
      description: 'Khám phá các bài viết về chăm sóc tóc, móng, massage body.',
      url: `${baseUrl}/blog`,
      siteName: 'Min Nail & Hair',
      locale: 'vi_VN',
      type: 'website',
      images: [{ url: `${baseUrl}/icons/icon-512.png`, width: 512, height: 512, alt: 'Cẩm nang Làm đẹp - Min Nail & Hair' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Cẩm nang Làm đẹp - Min Nail & Hair',
      description: 'Khám phá các bài viết về chăm sóc tóc, móng, massage body.',
      images: [{ url: `${baseUrl}/icons/icon-512.png`, alt: 'Cẩm nang Làm đẹp - Min Nail & Hair' }],
    },
  };
}

export default async function BlogListPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageStr } = await searchParams;
  const currentPage = parseInt(pageStr || '1', 10);
  const { posts, totalPages, page } = await getBlogPosts(currentPage, 6);

  const baseUrl = getBaseUrl();

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Trang chủ", url: baseUrl },
        { name: "Blog", url: `${baseUrl}/blog` },
      ]} />
    <div className="min-h-screen bg-[#FAF6F0] text-[#3A2E2B] font-sans pb-16">
      {/* Blog Elegant Header */}
      <header className="sticky top-0 z-50 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#EADDCD] px-4 py-4 md:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
            <Link href="/" className="text-xs font-bold text-[#8D6E53] hover:text-[#3A2E2B] flex items-center gap-1 transition-all">
              <ArrowLeft className="w-3.5 h-3.5" /> Về Trang Chủ
            </Link>
            <Link href="/booking" className="text-xs font-bold bg-[#8D6E53] text-white hover:bg-[#3A2E2B] px-4 py-2.5 rounded-full uppercase tracking-wider shadow-md transition-all">
              Booking ⚡
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative overflow-hidden bg-[#5C4033] text-[#FAF6F0] py-16 md:py-24 px-4 text-center">
        {/* Subtle decorative layout */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FAF6F0_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF6F0]/10 border border-[#FAF6F0]/20 text-xs font-bold uppercase tracking-widest text-[#EADDCD]">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" /> Cẩm nang làm đẹp độc quyền
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-white leading-tight">
            Min Nail &amp; Hair Blogs
          </h1>
          <p className="text-sm md:text-base text-[#FAF0E6] max-w-xl mx-auto leading-relaxed">
            Chia sẻ chân thực về xu hướng thiết kế móng tân thời, các combo gội dưỡng sinh đả thông kinh lạc và chăm sóc cơ thể trọn vẹn từ đội ngũ chuyên gia giàu kinh nghiệm.
          </p>
          <div className="mt-8 flex justify-center">
            <GlobalSearch />
          </div>
        </div>
      </section>

      {/* Main Grid Section */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 mt-12 space-y-12">
        {posts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-[#EADDCD] max-w-md mx-auto space-y-4 shadow-sm">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-bold text-stone-700">Chưa có bài viết nào</h3>
            <p className="text-xs text-stone-500">Chúng tôi đang chuẩn bị nội dung hay nhất phục vụ bạn. Vui lòng quay lại sau nhé!</p>
            <Link href="/" className="inline-block text-xs font-bold text-pink-600 hover:underline">Về trang chủ</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post: any, index: number) => {
              const formattedDate = post.created_at 
                ? format(new Date(post.created_at), 'dd MMMM yyyy', { locale: vi })
                : 'Đang cập nhật';

              return (
                <article 
                  key={post.id || index}
                  className="bg-white rounded-3xl overflow-hidden border border-[#EADDCD]/60 shadow-sm hover:shadow-xl hover:border-[#8D6E53]/40 transition-all flex flex-col group h-full"
                >
                  <Link href={`/blog/${post.slug}`} className="block relative h-52 overflow-hidden bg-stone-100">
                    <Image
                      src={post.image_url || "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop"}
                      alt={post.image_alt || post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-[#8D6E53] text-white text-[11px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-full shadow-sm">
                      Làm Đẹp
                    </div>
                  </Link>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-[10px] text-stone-400 font-bold font-mono tracking-wider gap-1.5 uppercase">
                        <Calendar className="w-3.5 h-3.5 text-[#8D6E53]" />
                        <span>{formattedDate}</span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-stone-900 group-hover:text-[#8D6E53] line-clamp-2 transition-colors leading-snug">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                        {post.summary}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                      <Link 
                        href={`/blog/${post.slug}`}
                        className="text-xs font-black text-[#8D6E53] group-hover:text-[#5C4033] flex items-center gap-1 uppercase tracking-wider cursor-pointer font-sans"
                      >
                        Đọc bài viết <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pb-8">
            {page > 1 && (
              <Link
                href={`/blog?page=${page - 1}`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-[#EADDCD] rounded-full text-xs font-bold text-[#8D6E53] hover:bg-[#8D6E53] hover:text-white transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/blog?page=${p}`}
                className={`w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                  p === page
                    ? 'bg-[#8D6E53] text-white shadow-md'
                    : 'bg-white border border-[#EADDCD] text-stone-600 hover:bg-stone-50'
                }`}
              >
                {p}
              </Link>
            ))}
            {page < totalPages && (
              <Link
                href={`/blog?page=${page + 1}`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-[#EADDCD] rounded-full text-xs font-bold text-[#8D6E53] hover:bg-[#8D6E53] hover:text-white transition-all shadow-sm"
              >
                Sau <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </main>
      <BottomNavigation />
    </div>
    </>
  );
}
