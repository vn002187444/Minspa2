import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
const BottomNavigation = dynamic(() => import('@/components/BottomNavigation'));
import Link from 'next/link';
import BreadcrumbSchema from '@/components/BreadcrumbSchema';
import FaqSection from '@/components/FaqSection';
import { HelpCircle, ArrowRight, MessageCircle, Mail } from 'lucide-react';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minhair.vercel.app';
  return {
    title: 'Câu hỏi thường gặp - Min Nail & Hair',
    description: 'Giải đáp các thắc mắc về dịch vụ gội đầu dưỡng sinh, nail, massage tại Min Nail & Hair. Hướng dẫn đặt lịch, giá cả và chính sách ưu đãi.',
    alternates: { canonical: `${baseUrl}/faq` },
    openGraph: {
      title: 'Câu hỏi thường gặp - Min Nail & Hair',
      description: 'Giải đáp các thắc mắc về dịch vụ gội đầu dưỡng sinh, nail, massage tại Min Nail & Hair.',
      url: `${baseUrl}/faq`,
      siteName: 'Min Nail & Hair',
      locale: 'vi_VN',
      type: 'website',
      images: [{ url: `${baseUrl}/icons/icon-512.png`, width: 512, height: 512, alt: 'Câu hỏi thường gặp - Min Nail & Hair' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Câu hỏi thường gặp - Min Nail & Hair',
      description: 'Giải đáp thắc mắc về dịch vụ tại Min Nail & Hair.',
      images: [{ url: `${baseUrl}/icons/icon-512.png`, alt: 'Min Nail & Hair FAQ' }],
    },
  };
}

export default function FaqPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minhair.vercel.app';

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Trang chủ", url: baseUrl },
        { name: "FAQ", url: `${baseUrl}/faq` },
      ]} />
      <div className="min-h-screen bg-[#FAF6F0] text-[#3A2E2B] font-sans pb-16">
        {/* Header */}
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
                <span className="block text-[9px] uppercase tracking-[0.2em] text-[#8D6E53] font-bold -mt-1 font-mono">Hỏi &amp; Đáp</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-xs font-bold text-[#8D6E53] hover:text-[#3A2E2B] flex items-center gap-1 transition-all">
                ← Về Trang Chủ
              </Link>
              <Link href="/booking" className="text-xs font-bold bg-[#8D6E53] text-white hover:bg-[#3A2E2B] px-4 py-2.5 rounded-full uppercase tracking-wider shadow-md transition-all">
                Booking ⚡
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden bg-[#5C4033] text-[#FAF6F0] py-16 md:py-24 px-4 text-center">
          <div className="absolute inset-0 bg-[url('/pattern-grid.svg')] opacity-5" />
          <div className="relative max-w-3xl mx-auto">
            <HelpCircle className="w-8 h-8 mx-auto mb-4 text-[#EADDCD]" />
            <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">
              Câu Hỏi Thường Gặp
            </h1>
            <p className="text-base md:text-lg text-[#EADDCD]/90 max-w-xl mx-auto leading-relaxed">
              Những thắc mắc phổ biến về dịch vụ, đặt lịch, giá cả và chính sách tại Min Nail &amp; Hair.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto px-4 mt-12">
          <FaqSection />

          {/*
            If FaqSection returns nothing (no faqs in DB), show a fallback message
            The FaqSection component already handles empty state by returning null.
          */}
        </section>

        {/* Still have questions */}
        <section className="max-w-3xl mx-auto px-4 mt-16">
          <div className="bg-white rounded-2xl border border-[#EADDCD] p-8 md:p-10 text-center">
            <MessageCircle className="w-10 h-10 text-[#8D6E53] mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-display font-bold text-[#3A2E2B] mb-2">
              Chưa Tìm Thấy Câu Trả Lời?
            </h2>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              Liên hệ với chúng tôi qua hotline hoặc đặt lịch hẹn để được tư vấn trực tiếp.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="tel:+84934323878"
                className="inline-flex items-center gap-2 bg-[#8D6E53] text-white font-bold px-6 py-3 rounded-full text-sm hover:bg-[#3A2E2B] transition-all shadow-md"
              >
                <Mail className="w-4 h-4" /> Gọi 0934 323 878
              </a>
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 border border-[#8D6E53] text-[#8D6E53] font-bold px-6 py-3 rounded-full text-sm hover:bg-[#8D6E53] hover:text-white transition-all"
              >
                Đặt Lịch Hẹn <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <BottomNavigation />
      </div>
    </>
  );
}
