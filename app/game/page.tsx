import type { Metadata } from 'next'
import Link from 'next/link'
import BreadcrumbSchema from '@/components/BreadcrumbSchema'
import DynamicBottomNavigation from '@/components/DynamicBottomNavigation'
import { Gamepad2, Sparkles, ArrowRight, Clock, Heart } from 'lucide-react'
import { getBaseUrl } from '@/lib/env'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseUrl()
  return {
    title: 'Game Giải Đố Water Sort - Min Nail & Hair | Thư giãn khi chờ',
    description: 'Chơi Water Sort thư giãn tại Min Nail & Hair — game giải đố ống nghiệm nước ép, solver thông minh A*/IDA*, chơi ngay trên web khi chờ làm đẹp tại Lavita Charm Thủ Đức.',
    alternates: { canonical: `${baseUrl}/game` },
    openGraph: {
      title: 'Game Water Sort - Min Nail & Hair',
      description: 'Game giải đố thư giãn khi chờ làm đẹp — Water Sort solver A*/IDA* ngay trên web.',
      url: `${baseUrl}/game`,
      siteName: 'Min Nail & Hair',
      locale: 'vi_VN',
      type: 'website',
      images: [{ url: `${baseUrl}/icons/icon-512.png`, width: 512, height: 512, alt: 'Water Sort Game' }],
    },
  }
}

export default function GamePage() {
  const baseUrl = getBaseUrl()
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Trang chủ', url: baseUrl }, { name: 'Game Giải Đố', url: `${baseUrl}/game` }]} />
      <div className="min-h-screen bg-[#FAF6F0] text-[#3A2E2B] font-sans pb-16">
        <header className="sticky top-0 z-50 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#EADDCD] px-4 py-4 md:px-8">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="w-10 h-10 bg-[#8D6E53] rounded-full flex items-center justify-center shadow-md text-white font-bold text-lg">M</Link>
              <div>
                <Link href="/" className="font-display font-black text-lg uppercase tracking-wider text-[#3A2E2B]">MIN SALON</Link>
                <span className="block text-[9px] uppercase tracking-[0.2em] text-[#8D6E53] font-bold -mt-1 font-mono">Game Giải Đố</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-xs font-bold text-[#8D6E53] hover:text-[#3A2E2B] flex items-center gap-1">← Trang Chủ</Link>
              <Link href="/booking" className="text-xs font-bold bg-[#8D6E53] text-white hover:bg-[#3A2E2B] px-4 py-2.5 rounded-full uppercase tracking-wider shadow-md">Booking ⚡</Link>
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden bg-[#5C4033] text-[#FAF6F0] py-10 md:py-14 px-4 text-center">
          <div className="absolute inset-0 bg-[url('/pattern-grid.svg')] opacity-5" />
          <div className="relative max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest mb-3">
              <Gamepad2 className="w-3.5 h-3.5" /> Water Sort Ultimate — SPA Edition
            </div>
            <h1 className="text-2xl md:text-4xl font-display font-bold tracking-tight mb-3">Giải Đố Ống Nghiệm Nước Ép</h1>
            <p className="text-sm md:text-base text-[#EADDCD]/90 max-w-2xl mx-auto leading-relaxed">
              Chơi thư giãn khi chờ làm đẹp tại Lavita Charm — solver A*/IDA* chạy 100% local, hỗ trợ <span className="text-white font-bold">? ô ẩn</span>, import ảnh, checkpoint.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-[11px] font-semibold">
              <span className="bg-white text-[#5C4033] rounded-full px-3 py-1 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Chơi ngay dưới đây</span>
              <span className="bg-[#EADDCD] text-[#5C4033] rounded-full px-3 py-1 inline-flex items-center gap-1"><Heart className="w-3 h-3" /> Dwell-time SEO</span>
              <span className="bg-white/15 border border-white/30 rounded-full px-3 py-1 inline-flex items-center gap-1"><Sparkles className="w-3 h-3" /> 100% Local</span>
            </div>
          </div>
        </section>

        <section className="max-w-[1240px] mx-auto px-0 md:px-4 mt-0 md:mt-6">
          <div className="bg-white md:rounded-2xl shadow-lg border-y md:border border-[#EADDCD] overflow-hidden">
            <iframe
              src="/water-sort.html"
              title="Water Sort Game - Min Salon"
              className="w-full h-[85vh] md:h-[78vh] min-h-[600px] border-0"
              loading="lazy"
              allow="clipboard-read; clipboard-write"
            />
          </div>
          <p className="text-center text-[11px] text-[#8D6E53] mt-3 px-4">
            Mẹo: Nếu game không tải, <a href="/water-sort.html" target="_blank" rel="noopener" className="underline font-bold hover:text-[#5C4033]">mở riêng tại đây</a> · Đã recolor sang tông spa <span className="inline-block w-3 h-3 rounded-full bg-[#8D6E53] align-middle ml-1" /> <span className="inline-block w-3 h-3 rounded-full bg-[#FAF6F0] border border-[#EADDCD] align-middle ml-1" />
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-10 text-center">
          <Link href="/booking" className="inline-flex items-center gap-2 bg-[#8D6E53] text-white font-bold px-8 py-3.5 rounded-full text-sm hover:bg-[#3A2E2B] shadow-lg">
            Đặt Lịch Ngay <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        <DynamicBottomNavigation />
      </div>
    </>
  )
}
