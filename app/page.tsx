import { createClient } from '@/utils/supabase/server';
import { getSession } from '@/utils/auth';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

// Enable Incremental Static Regeneration (ISR) - cache page and services data for 5 minutes
export const revalidate = 3600;
import { 
  ArrowRight, Sparkles, MapPin, Phone, Clock, 
  Heart, Shield, Award, Calendar, ChevronRight,
  Facebook, MessageSquare, Mail, ArrowUpRight
} from 'lucide-react';
import dynamic from 'next/dynamic';
import HeaderNav from '@/components/HeaderNav';
import AppointmentLookup from '@/components/AppointmentLookup';
import BottomNavigation from '@/components/BottomNavigation';
import ServiceBookButton from '@/components/ServiceBookButton';
import ScrollReveal from '@/components/ScrollReveal';
import StatsCounter from '@/components/StatsCounter';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import { getBannerSettings } from './admin/actions';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import HomeMascotBanner from '@/components/HomeMascotBanner';
import FaqSection from '@/components/FaqSection';
import ServiceSchema from '@/components/ServiceSchema';
import ProductSchema from '@/components/ProductSchema';

const MasterSchedule = dynamic(() => import('@/components/MasterSchedule'), {
  loading: () => (
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-[#EADDCD] rounded-xl w-1/3" />
      <div className="h-64 bg-[#EADDCD] rounded-2xl" />
    </div>
  ),
});

// Helper to normalize strings into valid URL-safe IDs matching the Header ids
function slugify(text: string) {
  return text
    .normalize('NFD')                     // converts to unicode sequence
    .replace(/[\u0300-\u036f]/g, '')     // removes accent diacritics
    .replace(/đ/g, 'd')                  // handles lowercase Vietnamese d
    .replace(/Đ/g, 'D')                  // handles uppercase Vietnamese D
    .replace(/&/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')     // retains only alphanumeric, spaces, and hyphens
    .trim()
    .replace(/\s+/g, '-');               // replaces spaces with hyphens
}

export default async function Home() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    // Build/SSR without Supabase env vars — render gracefully
  }
  const bannerSettings = await getBannerSettings();
  
  let hotline = '0934 323 878';
  let facebookUrl = 'https://facebook.com/minnailhair';
  let zaloUrl = 'https://zalo.me/0934323878';
  if (supabase) {
    try {
      const { data: seoRow } = await supabase.from('seo_settings').select('hotline, facebook_url, zalo_url').eq('id', 1).single();
      if (seoRow) {
        if (seoRow.hotline) hotline = seoRow.hotline;
        if (seoRow.facebook_url) facebookUrl = seoRow.facebook_url;
        if (seoRow.zalo_url) zaloUrl = seoRow.zalo_url;
      }
    } catch {
      // ignore
    }
  }
  
  let services: any[] = [];
  let treatmentPackages: any[] = [];
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, category, price, duration, description, image_url, is_active')
        .eq('is_active', true)
        .order('price', { ascending: true });
        
      if (!error && data) {
        services = data;
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách dịch vụ trang chủ:", err);
    }

    try {
      const { data: tpData } = await supabase
        .from('treatment_packages')
        .select('id, name, buy_count, free_count, price, total_sessions, service_id, services(name, price)')
        .eq('is_active', true)
        .order('price', { ascending: true });
      treatmentPackages = tpData || [];
    } catch (err) {
      console.error("Lỗi lấy gói liệu trình trang chủ:", err);
    }
  }

  // Ensure and override standard values if needed to map perfectly to the categories
  // Normalize Categories to match flyer groupings
  const categorizedServices = services.map((s: any) => {
    let cat = s.category;
    if (cat === 'Móng' || cat?.toLowerCase().includes('móng') || cat?.toLowerCase().includes('nail')) {
      // If it has special keywords, map to Deal or Chà Gót
      if (s.name.toLowerCase().includes('chà gót') || s.name.toLowerCase().includes('gót chân')) {
        return { ...s, category: 'Chà Gót Chân' };
      }
      if (s.price < 150000 && (s.name.toLowerCase().includes('combo') || s.name.toLowerCase().includes('sơn gel'))) {
        return { ...s, category: 'Deal Chấn Động' };
      }
      return { ...s, category: 'Chăm Sóc & Trang Trí Móng' };
    }
    if (cat === 'Deal' || cat?.toLowerCase().includes('deal')) {
      return { ...s, category: 'Deal Chấn Động' };
    }
    return s;
  });

  const categoriesOrder = [
    'Deal Chấn Động',
    'Gội dưỡng sinh',
    'Chà Gót Chân',
    'Massage',
    'Chăm Sóc & Trang Trí Móng'
  ];

  const groupedServices = categorizedServices.reduce((acc: Record<string, any[]>, service: any) => {
    // Normalise key name
    let catKey = service.category;
    if (catKey === 'Gội Dưỡng Sinh') catKey = 'Gội dưỡng sinh';
    if (!acc[catKey]) acc[catKey] = [];
    acc[catKey].push(service);
    return acc;
  }, {});

  return (
    <div className="min-h-screen theme-bg theme-text font-sans selection:bg-[#EADDCD] selection:text-[#5C4033]">
      {services.length > 0 && (
        <>
          <ServiceSchema services={services} />
          <ProductSchema services={services} />
        </>
      )}
      {/* Premium Notification Topbar */}
      <AnnouncementBanner settings={bannerSettings} />

      {/* Navigation */}
      <HeaderNav />

      {/* Elegant Hero Frame */}
      <header id="hero" className="relative py-12 md:py-20 4k:py-32 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-[rgb(var(--color-bg))] via-[rgb(var(--color-bg-card))] to-[rgb(var(--color-bg))] scroll-mt-24">
        {/* Subtle decorative circles with floating animations */}
        <div className="hidden md:block absolute top-20 right-[-10%] w-96 h-96 4k:w-[32rem] 4k:h-[32rem] rounded-full theme-border/20 blur-3xl -z-10 animate-float" />
        <div className="hidden md:block absolute bottom-10 left-[-10%] w-96 h-96 4k:w-[32rem] 4k:h-[32rem] rounded-full theme-border/30 blur-3xl -z-10 animate-float-delayed" />

        <div className="max-w-4xl xxl:max-w-5xl 4k:max-w-6xl mx-auto text-center space-y-8 4k:space-y-12 animate-slideUp">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 4k:px-6 4k:py-2 bg-[rgb(var(--color-bg-warm))] theme-text-secondary rounded-full text-xs 4k:text-sm font-bold ring-1 theme-border tracking-widest uppercase min-h-[44px]">
            <Sparkles className="w-3.5 h-3.5 4k:w-5 4k:h-5 theme-text-secondary animate-pulse" /> NÂNG NIU VẺ ĐẸP TỰ NHIÊN
          </div>

          <div className="space-y-4 4k:space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl 4k:text-8xl font-display font-medium text-[#3A2E2B] tracking-tight leading-tight">
              Min Nail & Gội Đầu Dưỡng Sinh
            </h1>
            <p className="text-[#8D6E53] max-w-2xl xxl:max-w-3xl 4k:max-w-4xl mx-auto font-display italic text-lg md:text-xl 4k:text-3xl">
              &quot;Nơi sắc đẹp bắt đầu từ những phút giây an yên&quot;
            </p>
          </div>

          <div className="h-[2px] w-24 4k:w-32 bg-[#D4C3B3] mx-auto relative">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 4k:w-3 4k:h-3 rounded-full bg-[#8D6E53]"></div>
          </div>

          <p className="text-gray-600 max-w-2xl xxl:max-w-3xl 4k:max-w-4xl mx-auto text-sm md:text-base 4k:text-lg leading-relaxed">
             Chào mừng bạn đến với <strong>không gian spa sang trọng và ấm cúng</strong> tại Chung cư Lavita Charm. Chúng tôi kiến tạo những liệu trình thư giãn sâu kết hợp chăm sóc làm đẹp chu đáo nhất cho đôi tay, mái tóc và làn da của bạn.
           </p>

           {/* Primary CTA */}
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4 4k:gap-6 pt-2">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 bg-[#5C4033] hover:bg-[#3A2E2B] text-white px-8 4k:px-10 4k:py-4 py-3.5 rounded-full font-bold text-sm 4k:text-base tracking-wider uppercase transition-all shadow-lg hover:shadow-xl active:scale-95 hover-magnetic"
              >
                <Calendar className="w-4 h-4 4k:w-5 4k:h-5" />
                Đặt lịch ngay
                <ArrowRight className="w-4 h-4 4k:w-5 4k:h-5" />
              </Link>
              <Link
                href="#services"
                className="inline-flex items-center gap-2 border-2 border-[#EADDCD] hover:border-[#8D6E53] text-[#5C4033] px-8 4k:px-10 4k:py-4 py-3.5 rounded-full font-bold text-sm 4k:text-base tracking-wider uppercase transition-all active:scale-95 hover-magnetic"
             >
               Xem dịch vụ
             </Link>
           </div>

           {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 4k:gap-6 max-w-3xl xxl:max-w-4xl 4k:max-w-5xl mx-auto pt-4">
            <div className="flex items-center gap-3 bg-white/70 p-4 rounded-2xl border border-[#EADDCD] backdrop-blur-sm hover:border-[#8D6E53] hover-magnetic transition-all cursor-default">
              <div className="w-10 h-10 rounded-full bg-[#FAF0E6] flex items-center justify-center shrink-0 shadow-sm">
                <MapPin className="w-5 h-5 text-[#8D6E53]" />
              </div>
              <div className="text-left">
                <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Địa chỉ</p>
               <p className="text-xs font-semibold text-[#3A2E2B] line-clamp-1">TM14 Lavita Charm, Thủ Đức</p>
              </div>
            </div>
            
            <a href={`tel:${hotline.replace(/\s/g, '')}`} className="flex items-center gap-3 bg-white/70 p-4 rounded-2xl border border-[#EADDCD] backdrop-blur-sm hover:border-[#8D6E53] hover-magnetic transition-all">
              <div className="w-10 h-10 rounded-full bg-[#FAF0E6] flex items-center justify-center shrink-0 shadow-sm">
                <Phone className="w-5 h-5 text-[#8D6E53]" />
              </div>
              <div className="text-left">
                <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Hotline đặt lịch</p>
                <p className="text-xs font-semibold text-[#3A2E2B]">{hotline}</p>
              </div>
            </a>

            <div className="flex items-center gap-3 bg-white/70 p-4 rounded-2xl border border-[#EADDCD] backdrop-blur-sm hover:border-[#8D6E53] hover-magnetic transition-all cursor-default">
              <div className="w-10 h-10 rounded-full bg-[#FAF0E6] flex items-center justify-center shrink-0 shadow-sm">
                <Clock className="w-5 h-5 text-[#8D6E53]" />
              </div>
              <div className="text-left">
                <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Giờ mở cửa</p>
                <p className="text-xs font-semibold text-[#3A2E2B]">09:00 - 20:30 (Mỗi ngày)</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mascot Service Introduction (V3.6) */}
      <HomeMascotBanner />

      {/* Unique AI Highlight Section */}
      <section className="py-8 max-w-7xl xxl:max-w-[1600px] 4k:max-w-[1920px] mx-auto px-4">
        <div className="bg-gradient-to-r from-[#5C4033] to-[#452F25] text-white p-4 sm:p-6 md:p-8 4k:p-12 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 4k:gap-10 relative overflow-hidden hover-magnetic transition-all group border border-[#8D6E53]/30">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full filter blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider animate-fadeIn">
              <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" /> Trợ lý ảo AI đắc lực
            </div>
             <h2 className="text-lg md:text-xl 4k:text-2xl font-display font-medium text-amber-100 group-hover:text-amber-250 transition-colors">Bắt số điện thoại - Nhận đề xuất dịch vụ cá nhân hóa tức thì!</h2>
            <p className="text-xs md:text-sm 4k:text-base text-gray-300 max-w-xl 4k:max-w-2xl">
              Khi khách hàng nhập Số điện thoại, trợ lý ảo thông minh chạy bằng khu học máy **Gemini AI** sẽ tự động nhận diện lịch sử dùng dịch vụ cũ để chào đón và đề xuất dịch vụ phù hợp hoàn hảo nhất cho ngày hôm nay.
            </p>
          </div>
          <Link 
            href="/booking" 
            className="shrink-0 bg-amber-150 hover:bg-amber-200 text-gray-900 font-bold text-xs 4k:text-sm tracking-wider uppercase px-6 4k:px-8 py-3.5 4k:py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group-hover:scale-105 active:scale-95 hover-magnetic"
          >
            Trải nghiệm AI Ngay <ChevronRight className="w-4 h-4 animate-bounce" />
          </Link>
        </div>
      </section>

      {/* Elegant Quick Categories Selectors */}
      <section className="max-w-6xl xxl:max-w-[1600px] 4k:max-w-[1920px] mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-center gap-3 4k:gap-4">
          {categoriesOrder.map(cat => {
            if (!groupedServices[cat] || groupedServices[cat].length === 0) return null;
            return (
              <a 
                key={cat}
                href={`#category-${slugify(cat)}`}
                className="px-5 py-2.5 bg-white border border-[#EADDCD] hover:border-[#8D6E53] hover:bg-[#FAF0E6] hover:text-[#5C4033] rounded-full text-xs font-semibold tracking-wider hover-magnetic transition-all uppercase shadow-xs hover:shadow-sm min-h-[44px] flex items-center"
              >
                {cat}
              </a>
            );
          })}
        </div>
      </section>

      {/* Services Menu Section */}
      <main id="services" className="max-w-6xl xxl:max-w-[1600px] 4k:max-w-[1920px] mx-auto px-4 space-y-16 pb-12">
        {/* Treatment Packages Carousel/Grid Section */}
        {treatmentPackages && treatmentPackages.length > 0 && (
          <section className="bg-gradient-to-r from-amber-50 to-orange-50/70 p-5 md:p-10 4k:p-14 rounded-3xl border border-[#EADDCD] space-y-8 4k:space-y-12 shadow-sm">
            <div className="text-center md:text-left space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-100/60 text-pink-700 rounded-full text-[10px] font-extrabold tracking-widest uppercase mb-1">
                ⭐ TIẾT KIỆM TOÀN DIỆN LÊN TỚI 25%
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-black text-[#3A2E2B] flex items-center justify-center md:justify-start gap-2 uppercase tracking-wide">
                🎁 GÓI LIỆU TRÌNH VIP SIÊU ƯU ĐÃI
              </h2>
              <p className="text-xs md:text-sm text-gray-500 max-w-2xl font-medium">
                Mua trọn gói liệu trình nhiều buổi để nhận ưu đãi tặng thêm buổi hoàn toàn miễn phí. Có thể chia sẻ số buổi cho bạn bè, người thân sử dụng chung và quản lý tích điểm lâu dài trên hệ thống!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 4k:grid-cols-4 gap-6 4k:gap-8">
              {treatmentPackages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className="bg-white rounded-2xl p-6 4k:p-8 border border-[#EADDCD] shadow-sm hover:shadow-md hover-magnetic transition-all flex flex-col justify-between hover:border-pink-350"
                >
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                        Mua {pkg.buy_count} Tặng {pkg.free_count}
                      </span>
                      <h3 className="font-display font-extrabold text-lg text-[#3A2E2B] mt-1.5 line-clamp-1">
                        {pkg.name}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium italic">
                        Áp dụng: {pkg.services?.name || 'Dịch vụ nâng cao'}
                      </p>
                    </div>

                    <div className="space-y-2 bg-[#FAF6F0] p-3.5 rounded-xl text-xs text-[#5C4033] font-medium border border-[#EADDCD]/40">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Số buổi mua gốc:</span>
                        <span className="font-bold">{pkg.buy_count} buổi</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-600">
                        <span>Đặc quyền tặng thêm:</span>
                        <span className="font-extrabold">+{pkg.free_count} buổi</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-200/50 pt-2 text-[#3A2E2B]">
                        <span className="font-bold">Tổng thực nhận:</span>
                        <span className="font-black bg-[#EADDCD]/50 px-2.5 py-0.5 rounded text-sm text-pink-700">{pkg.total_sessions} buổi</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold mb-0.5">Giá Trọn Gói</span>
                      <span className="text-xl font-black text-gray-950 font-mono">
                        {Number(pkg.price).toLocaleString("vi")}đ
                      </span>
                    </div>

                    <Link 
                      href={`/booking?buy_pkg=${pkg.id}`}
                      className="px-4 py-2.5 bg-gray-900 hover:bg-[#3A2E2B] text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer uppercase"
                      aria-label={`Đặt mua gói ${pkg.name}`}
                    >
                      Đặt Mua <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {categoriesOrder.map(categoryKey => {
          const items = groupedServices[categoryKey];
          if (!items || items.length === 0) return null;

          // Define beautiful icons, accents & details based on type
          let catTitle = categoryKey;
          let catSubtitle = 'Danh sách các gói dịch vụ tốt nhất';
          let borderStyle = 'border-[#EADDCD]';

          if (categoryKey === 'Deal Chấn Động') {
            catTitle = '🔥 GÓC DEAL CHẤN ĐỘNG';
            catSubtitle = 'Làm móng trọn gói và chà gót chân với mức giá không tưởng';
            borderStyle = 'border-amber-200';
          } else if (categoryKey === 'Gội dưỡng sinh') {
            catTitle = '🌸 CHUYÊN SÂU GỘI DƯỠNG SINH';
            catSubtitle = 'Gội đầu canh thảo dược, đả thông kinh lạc giảm đau vai gáy mệt mỏi';
          } else if (categoryKey === 'Chà Gót Chân') {
            catTitle = '👣 CHÀ GÓT CHÂN CHUYÊN SÂU';
            catSubtitle = 'Liệu trình 5 bước ngâm chân và tẩy tế bào chết gót ngọc trơn mịn';
          } else if (categoryKey === 'Massage') {
            catTitle = '💆 MASSAGE BODY THƯ GIÃN';
            catSubtitle = 'Ấn huyệt, chườm đá nóng Tây Tạng, phục hồi sinh lực (Giảm 5% khi đặt lịch)';
          }

          return (
            <ScrollReveal key={categoryKey}>
            <section 
              id={`category-${slugify(categoryKey)}`} 
              className="scroll-mt-28 md:scroll-mt-24 space-y-8"
            >
              {/* Header Box */}
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#EADDCD] pb-4">
                <div className="space-y-1">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-[#3A2E2B]" id={`title-${slugify(categoryKey)}`}>
                    {catTitle}
                  </h2>
                  <p className="text-xs md:text-sm text-gray-500 font-medium">{catSubtitle}</p>
                </div>
                {categoryKey === 'Massage' && (
                  <div className="mt-2 md:mt-0 inline-flex items-center gap-1.5 text-xs text-[#8D6E53] font-bold bg-[#FAF0E6] px-3.5 py-1.5 rounded-full border border-[#EADDCD]">
                    🔥 ĐẶC BIỆT: GIẢM GIÁ 5% KHI BOOK ONLINE
                  </div>
                )}
              </div>

              {/* Grid of service cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xxl:grid-cols-4 4k:grid-cols-5 gap-6 4k:gap-8">
                {items.map((service: any) => {
                  const isDeal = categoryKey === 'Deal Chấn Động';
                  return (
                    <div 
                      key={service.id} 
                      className={`relative bg-white rounded-3xl border ${borderStyle} hover-magnetic hover:border-[#8D6E53]/40 transition-all flex flex-col justify-between overflow-hidden`}
                    >
                      {service.image_url && (
                          <div className="relative w-full h-36 md:h-48 overflow-hidden bg-gray-50">
                          <Image src={service.image_url} alt={service.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-6">
                        {/* Upper Card Grid: Title and Price */}
                        <div className="flex justify-between items-start mb-4 gap-2">
                          <h3 id={`name-${service.id}`} className="font-display font-semibold text-lg text-[#3A2E2B] leading-tight hover:text-[#8D6E53] transition-colors">
                            {service.name}
                          </h3>
                        </div>

                        {/* Middle Card: Description & Steps analysis if matches flyer */}
                        <div className="space-y-3">
                          <p className="text-sm text-gray-500 leading-relaxed font-normal">
                            {service.description}
                          </p>
                          
                          {/* Rich Step Badges for specific nail details or combos */}
                          {service.name.includes('CB1') && (
                            <div className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 rounded-lg p-2.5 space-y-1">
                              <span className="block text-emerald-900 border-b border-emerald-100 pb-1 mb-1">🎁 QUY TRÌNH CHỌN LỌC</span>
                              <span className="block">💆 Gội canh thảo dược 1 & 2</span>
                              <span className="block">🍃 Massage Cổ Vai Gáy thư giãn</span>
                              <span className="block">🌸 Thải độc & rửa mặt thiên nhiên</span>
                            </div>
                          )}

                          {service.name.includes('chà gót') && (
                            <div className="text-[10px] font-semibold text-[#8D6E53] bg-[#FAF0E6] rounded-lg p-2.5 space-y-1">
                              <span className="block text-[#5C4033] border-b border-[#EADDCD] pb-1 mb-1">🎁 LIỆU TRÌNH 5 BƯỚC</span>
                              <span className="block">👣 1. Ngâm chân thảo dược ấm và mềm chân</span>
                              <span className="block">👣 2. Tẩy bào chết gót + 5p massage chân rạng ngời</span>
                              <span className="block">👣 3. Ủ mềm gót xơ cứng & sừng hoá</span>
                              <span className="block">👣 4. Chà gót chân bằng bàn chải chuyên nghiệp</span>
                              <span className="block">👣 5. Thoa kem cấp ẩm sâu nuôi dưỡng</span>
                            </div>
                          )}
                        </div>

                      {/* Footer element of the card: Price / Duration and Book CTA */}
                      <div className="mt-6 pt-4 border-t border-[#FAF6F0] flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#8D6E53]" /> {service.duration} Phút
                          </div>
                          <div className="mt-1 font-display font-bold text-xl text-[#8D6E53]">
                            {service.price.toLocaleString('vi-VN')} ₫
                          </div>
                        </div>

                        <ServiceBookButton
                          href="/booking"
                          serviceName={service.name}
                          serviceCategory={categoryKey}
                        />
                      </div>
                    </div>

                      {/* Visual top bar ribbons for special services */}
                      {isDeal && (
                        <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                          <div className="absolute top-2 -right-8 bg-red-500 text-white text-[9px] font-extrabold py-0.5 px-8 transform rotate-45 shadow-sm uppercase tracking-widest text-center">
                            DEAL
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
            </ScrollReveal>
          );
        })}
      </main>

      {/* Stats Counter Section */}
      <ScrollReveal>
      <section className="py-16 bg-gradient-to-r from-[#FAF6F0] to-[#FDFBF7] border-y border-[#EADDCD]">
        <div className="max-w-4xl xxl:max-w-5xl 4k:max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 4k:gap-12">
          <StatsCounter end={15000} suffix="+" icon="💅" label="Khách hàng đã phục vụ" />
          <StatsCounter end={8} suffix="+" icon="⭐" label="Năm kinh nghiệm" />
          <StatsCounter end={22} icon="💆" label="Dịch vụ làm đẹp cao cấp" />
          <StatsCounter end={98} suffix="%" icon="😊" label="Khách hài lòng quay lại" />
        </div>
      </section>
      </ScrollReveal>

      {/* Testimonials Carousel */}
      <TestimonialsCarousel />

      {/* Extra Service Guarantee Banner */}
      <section className="py-12 bg-white border-t border-b border-[#EADDCD] my-8">
        <div className="max-w-4xl xxl:max-w-5xl 4k:max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 4k:gap-12 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-[#FAF0E6] rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6 text-[#8D6E53]" />
            </div>
            <h3 className="font-display font-bold text-base text-[#3A2E2B]">Yên Tâm Vệ Sinh</h3>
            <p className="text-xs text-gray-500">Mọi dụng cụ kềm kéo, chậu ngâm đều được khử trùng sấy tia cực tím chu đáo nhất.</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-[#FAF0E6] rounded-full flex items-center justify-center mx-auto">
              <Award className="w-6 h-6 text-[#8D6E53]" />
            </div>
            <h3 className="font-display font-bold text-base text-[#3A2E2B]">Tay Nghề Thành Thạo</h3>
            <p className="text-xs text-gray-500">Kỹ thuật viên gội đầu và thợ làm móng được chứng nhận tay nghề cao, tỉ mỉ tận tâm.</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-[#FAF0E6] rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-6 h-6 text-[#8D6E53]" />
            </div>
            <h3 className="font-display font-bold text-base text-[#3A2E2B]">Dược Liệu Thiên Nhiên</h3>
            <p className="text-xs text-gray-500">Min sử dụng 100% dầu gội thảo dược thảo mộc đun nấu thủ công chất lượng cao nhất.</p>
          </div>
        </div>
      </section>

      {/* Appointment Tracker Portal */}
      <Suspense fallback={<div className="h-32 bg-[#EADDCD]/30 rounded-3xl animate-pulse" />}>
      <section className="max-w-4xl xxl:max-w-5xl 4k:max-w-6xl mx-auto px-4 py-8">
        <AppointmentLookup />
      </section>
      </Suspense>

      {/* Real-time Schedule Tracker Section */}
      <Suspense fallback={<div className="h-64 bg-[#EADDCD]/30 rounded-3xl animate-pulse" />}>
      <section className="max-w-6xl xxl:max-w-[1600px] 4k:max-w-[1920px] mx-auto px-4 py-8">
        <div className="text-center max-w-2xl xxl:max-w-3xl 4k:max-w-4xl mx-auto mb-8 4k:mb-12 space-y-2 4k:space-y-4">
          <span className="text-xs tracking-[0.2em] font-bold text-[#8D6E53] uppercase block">MIN TRANSPARENT SCHEDULING</span>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-[#3A2E2B]">Theo Dõi Ca Cao Điểm</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Xem biểu đồ thời gian thực các khung giờ bận và rảnh trong ngày của các kỹ thuật viên để dễ dàng sắp xếp lịch hẹn phù hợp nhất.
          </p>
        </div>
        <MasterSchedule mode="READ_ONLY" />
      </section>
      </Suspense>

      {/* High-end Styled Final CTA Banner */}
      <section className="max-w-6xl xxl:max-w-[1600px] 4k:max-w-[1920px] mx-auto px-4 py-8">
        <div className="bg-[#5C4033] rounded-3xl p-6 md:p-12 4k:p-16 text-center text-white relative overflow-hidden shadow-2xl border border-[#D4C3B3]">
          <div className="absolute top-0 right-[-10%] w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl xxl:max-w-3xl 4k:max-w-4xl mx-auto space-y-6 4k:space-y-8">
            <span className="text-xs tracking-[0.3em] font-bold text-amber-200 uppercase block">HẸN GẶP LẠI BẠN TẠI SALON</span>
            <h2 className="text-3xl md:text-4xl 4k:text-5xl font-display font-medium text-[#FAF6F0]">Sẵn Sàng Để Tận Hưởng Phút Giây Thư Giãn?</h2>
            <p className="text-gray-300 text-sm 4k:text-base leading-relaxed max-w-lg 4k:max-w-xl mx-auto">
              Bấm ngay vào nút bên dưới để chọn lịch hẹn, chọn thợ kỹ thuật, đặt giờ chuẩn xác nhất và nhận ngay ưu đãi 5% trực tuyến.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/booking" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FAF6F0] hover:bg-[#F5EBE0] text-[#5C4033] px-8 4k:px-10 py-4 4k:py-5 rounded-full font-bold text-sm 4k:text-base tracking-wider uppercase transition-all shadow-lg hover:shadow-xl hover-magnetic"
              >
                <Calendar className="w-4 h-4 text-[#5C4033]" />
                ĐẶT LỊCH GỒI & LÀM MÓNG
              </Link>
              <a 
                href={`tel:${hotline.replace(/\s/g, '')}`} 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/40 hover:border-white text-white px-8 4k:px-10 py-4 4k:py-5 rounded-full font-bold text-sm 4k:text-base tracking-wider uppercase transition-all hover-magnetic"
              >
                <Phone className="w-4 h-4 text-white" />
                ĐIỆN THOẠI ĐẶT TRỰC TIẾP
              </a>
            </div>
            
            <p className="text-xs text-gray-400 italic pt-2">
              📍 Địa chỉ: TM14 Chung cư Lavita Charm, Trường Thọ, Thủ Đức (kế bên cổng chính chung cư)
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Section */}
      <LatestBlogPosts />
      {/* FAQ Section */}
      <Suspense fallback={null}>
        <FaqSection />
      </Suspense>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-[#2E2421] to-[#1C1513] text-white pt-16 pb-12 border-t border-[#EADDCD]/10 relative overflow-hidden">
        {/* Decorative elements for premium feel */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl xxl:max-w-[1600px] 4k:max-w-[1920px] mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 pb-10 border-b border-[#EADDCD]/10">
            {/* Column 1: Brand Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#8D6E53] to-[#5C4033] rounded-2xl flex items-center justify-center text-[#FAF6F0] font-display font-black text-2xl shadow-lg border border-[#EADDCD]/20 shrink-0">
                  M
                </div>
                <div>

                  <p className="text-xs text-amber-300 font-extrabold uppercase tracking-widest mt-1.5">Nail &amp; Hair Spa</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                Nơi gìn giữ nét xuân và khơi dậy vẻ đẹp tự nhiên của bạn. Min Salon kiêu hãnh mang đến dịch vụ gội đầu dưỡng sinh thảo dược, làm móng chuyên sâu và trị liệu tóc cao cấp trong không gian thanh tịnh, đẳng cấp.
              </p>
              {/* Social links with premium circular icons */}
              <div className="flex items-center gap-2.5 pt-2">
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#8D6E53] hover:border-[#8D6E53] transition-all group"
                  title="Theo dõi Min trên Facebook"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
                <a
                  href={zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-amber-300 hover:bg-[#8D6E53] hover:border-[#8D6E53] transition-all group"
                  title="Kết nối qua Zalo OA"
                  aria-label="Zalo OA"
                >
                  <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-4">
              <h4 className="font-display font-bold text-sm text-[#EADDCD] uppercase tracking-wider border-l-2 border-[#8D6E53] pl-2.5">
                Hành Trình Làm Đẹp
              </h4>
              <ul className="space-y-1">
                <li>
                  <Link href="/booking" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-300 py-1.5 hover:pl-1 transition-all">
                    <span className="w-1 h-1 rounded-full bg-amber-500" />
                    Đặt lịch trực tuyến
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-300 py-1.5 hover:pl-1 transition-all">
                    <span className="w-1 h-1 rounded-full bg-amber-500" />
                    Cẩm nang chăm sóc &amp; Blog
                  </Link>
                </li>
                <li>
                  <Link href="/#services" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-300 py-1.5 hover:pl-1 transition-all">
                    <span className="w-1 h-1 rounded-full bg-amber-500" />
                    Bảng giá &amp; Dịch vụ spa
                  </Link>
                </li>
                <li>
                  <a href="https://maps.google.com/?q=Lavita+Charm+Thu+Duc" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-300 py-1.5 hover:pl-1 transition-all">
                    <span className="w-1 h-1 rounded-full bg-amber-500" />
                    Xem bản đồ &amp; Chỉ đường
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact Info */}
            <div className="space-y-4">
              <h4 className="font-display font-bold text-sm text-[#EADDCD] uppercase tracking-wider border-l-2 border-[#8D6E53] pl-2.5">
                Liên Hệ Với Min
              </h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 py-0.5">
                  <MapPin className="w-4 h-4 text-[#8D6E53] shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-400 font-medium leading-relaxed">
                    TM14 Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức, TP. Hồ Chí Minh
                  </span>
                </li>
                <li className="flex items-center gap-2.5 py-0.5">
                  <Phone className="w-4 h-4 text-[#8D6E53] shrink-0" />
                  <a href={`tel:${hotline.replace(/\s+/g, '')}`} className="text-xs text-amber-300 hover:text-amber-400 font-bold transition-colors">
                    {hotline}
                  </a>
                </li>
                <li className="flex items-center gap-2.5 py-0.5">
                  <Clock className="w-4 h-4 text-[#8D6E53] shrink-0" />
                  <span className="text-xs text-gray-400 font-medium">
                    09:00 - 20:30 (Tất cả các ngày)
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div className="space-y-4">
              <h4 className="font-display font-bold text-sm text-[#EADDCD] uppercase tracking-wider border-l-2 border-[#8D6E53] pl-2.5">
                Nhận Ưu Đãi Đặc Biệt
              </h4>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                Đăng ký để nhận thông tin về các gói liệu trình khuyến mãi, sự kiện đặc biệt và mẹo làm đẹp hàng tuần của Min.
              </p>
              <div className="relative flex items-center rounded-xl bg-white/5 border border-white/10 p-1 focus-within:ring-2 focus-within:ring-[#8D6E53] focus-within:border-transparent transition-all">
                <input
                  type="email"
                  placeholder="Địa chỉ Email của bạn..."
                  className="w-full pl-3 pr-2 py-2 bg-transparent border-none outline-none text-xs text-white placeholder-gray-500"
                  aria-label="Địa chỉ Email đăng ký nhận tin"
                />
                <button
                  type="button"
                  className="bg-[#8D6E53] hover:bg-[#5C4033] text-white p-2 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Đăng ký"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 text-center sm:text-left text-xs text-gray-500">
            <div>
              © 2026 Min Nail &amp; Hair Salon. Đã đăng ký bản quyền.
            </div>
            <div className="flex gap-4">
              <Link href="/sitemap.xml" className="hover:text-gray-400 transition-colors">Sitemap</Link>
              <span className="text-gray-700">|</span>
              <a href="#" className="hover:text-gray-400 transition-colors">Chính sách bảo mật</a>
            </div>
          </div>
        </div>
      </footer>
      <BottomNavigation />
    </div>
  );
}

async function LatestBlogPosts() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from('blogs')
    .select('id, title, slug, summary, image_url, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(3);

  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-10 md:py-16 max-w-7xl xxl:max-w-[1600px] 4k:max-w-[1920px] mx-auto px-4">
      <div className="text-center mb-8 md:mb-12">
        <span className="inline-block px-3 py-1 rounded-full bg-[#8D6E53]/10 text-[#8D6E53] text-[10px] font-bold uppercase tracking-widest mb-3">
          Blog
        </span>
        <h2 className="text-2xl md:text-4xl font-serif font-black text-[#5C4033]">
          Bài viết mới nhất
        </h2>
        <p className="text-sm text-stone-500 mt-2 max-w-lg mx-auto">
          Cẩm nang chăm sóc tóc, da, móng và phong cách sống từ Min Nail &amp; Hair
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group bg-white rounded-2xl border border-[#EADDCD]/60 overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="relative h-44 md:h-52 overflow-hidden bg-stone-100">
              <Image
                src={post.image_url || 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop'}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="p-4 md:p-5 space-y-2">
              <h3 className="text-sm md:text-base font-bold text-[#3A2E2B] group-hover:text-[#8D6E53] transition-colors line-clamp-2 leading-snug">
                {post.title}
              </h3>
              {post.summary && (
                <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                  {post.summary}
                </p>
              )}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-stone-400 font-medium">
                  {post.created_at ? new Date(post.created_at).toLocaleDateString('vi-VN') : ''}
                </span>
                <span className="text-[10px] font-bold text-[#8D6E53] uppercase tracking-wider group-hover:mr-1 transition-all">
                  Đọc thêm →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#8D6E53] bg-white border-2 border-[#EADDCD] hover:bg-[#FAF6F0] px-6 py-3 rounded-full transition-all"
        >
          Xem tất cả bài viết <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
