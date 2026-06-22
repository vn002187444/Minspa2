import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';

// Enable Incremental Static Regeneration (ISR) - cache page and services data for 5 minutes
export const revalidate = 3600;
import { 
  ArrowRight, Sparkles, MapPin, Phone, Clock, Star, 
  CheckCircle2, Heart, Shield, Award, Calendar, ChevronRight 
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
  const supabase = await createClient();
  const bannerSettings = await getBannerSettings();
  
  const { data: seoRow } = await supabase.from('seo_settings').select('hotline').eq('id', 1).single();
  const hotline = seoRow?.hotline || '0934 323 878';
  
  let services: any[] = [];
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

  let treatmentPackages: any[] = [];
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
      {/* Premium Notification Topbar */}
      <AnnouncementBanner settings={bannerSettings} />

      {/* Navigation */}
      <HeaderNav />

      {/* Elegant Hero Frame */}
      <header className="relative py-20 px-6 overflow-hidden bg-gradient-to-b from-[rgb(var(--color-bg))] via-[rgb(var(--color-bg-card))] to-[rgb(var(--color-bg))]">
        {/* Subtle decorative circles with floating animations */}
        <div className="absolute top-20 right-[-10%] w-96 h-96 rounded-full theme-border/20 blur-3xl -z-10 animate-float" />
        <div className="absolute bottom-10 left-[-10%] w-96 h-96 rounded-full theme-border/30 blur-3xl -z-10 animate-float-delayed" />

        <div className="max-w-4xl mx-auto text-center space-y-8 animate-slideUp">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[rgb(var(--color-bg-warm))] theme-text-secondary rounded-full text-xs font-bold ring-1 theme-border tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 theme-text-secondary animate-pulse" /> NÂNG NIU VẺ ĐẸP TỰ NHIÊN
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-medium text-[#3A2E2B] tracking-tight leading-tight">
              Min Nail & Gội Đầu Dưỡng Sinh
            </h1>
            <p className="text-[#8D6E53] max-w-2xl mx-auto font-display italic text-lg md:text-xl">
              &quot;Nơi sắc đẹp bắt đầu từ những phút giây an yên&quot;
            </p>
          </div>

          <div className="h-[2px] w-24 bg-[#D4C3B3] mx-auto relative">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#8D6E53]"></div>
          </div>

          <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
             Chào mừng bạn đến với <strong>không gian spa sang trọng và ấm cúng</strong> tại Chung cư Lavita Charm. Chúng tôi kiến tạo những liệu trình thư giãn sâu kết hợp chăm sóc làm đẹp chu đáo nhất cho đôi tay, mái tóc và làn da của bạn.
           </p>

           {/* Primary CTA */}
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 bg-[#5C4033] hover:bg-[#3A2E2B] text-white px-8 py-3.5 rounded-full font-bold text-sm tracking-wider uppercase transition-all shadow-lg hover:shadow-xl active:scale-95 hover-magnetic"
              >
                <Calendar className="w-4 h-4" />
                Đặt lịch ngay
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#services"
                className="inline-flex items-center gap-2 border-2 border-[#EADDCD] hover:border-[#8D6E53] text-[#5C4033] px-8 py-3.5 rounded-full font-bold text-sm tracking-wider uppercase transition-all active:scale-95 hover-magnetic"
             >
               Xem dịch vụ
             </Link>
           </div>

           {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto pt-4">
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
      <section className="py-8 max-w-7xl xxl:max-w-[1500px] mx-auto px-4">
        <div className="bg-gradient-to-r from-[#5C4033] to-[#452F25] text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden hover-magnetic transition-all group border border-[#8D6E53]/30">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full filter blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider animate-fadeIn">
              <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" /> Trợ lý ảo AI đắc lực
            </div>
            <h3 className="text-lg md:text-xl font-display font-medium text-amber-100 group-hover:text-amber-250 transition-colors">Bắt số điện thoại - Nhận đề xuất dịch vụ cá nhân hóa tức thì!</h3>
            <p className="text-xs md:text-sm text-gray-300 max-w-xl">
              Khi khách hàng nhập Số điện thoại, trợ lý ảo thông minh chạy bằng khu học máy **Gemini AI** sẽ tự động nhận diện lịch sử dùng dịch vụ cũ để chào đón và đề xuất dịch vụ phù hợp hoàn hảo nhất cho ngày hôm nay.
            </p>
          </div>
          <Link 
            href="/booking" 
            className="shrink-0 bg-amber-150 hover:bg-amber-200 text-gray-900 font-bold text-xs tracking-wider uppercase px-6 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group-hover:scale-105 active:scale-95 hover-magnetic"
          >
            Trải nghiệm AI Ngay <ChevronRight className="w-4 h-4 animate-bounce" />
          </Link>
        </div>
      </section>

      {/* Elegant Quick Categories Selectors */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {categoriesOrder.map(cat => {
            if (!groupedServices[cat] || groupedServices[cat].length === 0) return null;
            return (
              <a 
                key={cat}
                href={`#category-${slugify(cat)}`}
                className="px-5 py-2.5 bg-white border border-[#EADDCD] hover:border-[#8D6E53] hover:bg-[#FAF0E6] hover:text-[#5C4033] rounded-full text-xs font-semibold tracking-wider hover-magnetic transition-all uppercase shadow-xs hover:shadow-sm"
              >
                {cat}
              </a>
            );
          })}
        </div>
      </section>

      {/* Services Menu Section */}
      <main id="services" className="max-w-6xl mx-auto px-4 space-y-16 pb-12">
        {/* Treatment Packages Carousel/Grid Section */}
        {treatmentPackages && treatmentPackages.length > 0 && (
          <section className="bg-gradient-to-r from-amber-50 to-orange-50/70 p-8 md:p-10 rounded-3xl border border-[#EADDCD] space-y-8 shadow-sm">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {treatmentPackages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className="bg-white rounded-2xl p-6 border border-[#EADDCD] shadow-sm hover:shadow-md hover-magnetic transition-all flex flex-col justify-between hover:border-pink-350"
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
          let catBg = 'bg-[#FAF0E6]';
          let borderStyle = 'border-[#EADDCD]';
          let accentText = 'text-[#8D6E53] font-display font-medium text-lg italic';

          if (categoryKey === 'Deal Chấn Động') {
            catTitle = '🔥 GÓC DEAL CHẤN ĐỘNG';
            catSubtitle = 'Làm móng trọn gói và chà gót chân với mức giá không tưởng';
            catBg = 'bg-amber-50';
            borderStyle = 'border-amber-200';
          } else if (categoryKey === 'Gội dưỡng sinh') {
            catTitle = '🌸 CHUYÊN SÂU GỘI DƯỠNG SINH';
            catSubtitle = 'Gội đầu canh thảo dược, đả thông kinh lạc giảm đau vai gáy mệt mỏi';
            catBg = 'bg-emerald-50/50';
          } else if (categoryKey === 'Chà Gót Chân') {
            catTitle = '👣 CHÀ GÓT CHÂN CHUYÊN SÂU';
            catSubtitle = 'Liệu trình 5 bước ngâm chân và tẩy tế bào chết gót ngọc trơn mịn';
            catBg = 'bg-peach-50/20';
          } else if (categoryKey === 'Massage') {
            catTitle = '💆 MASSAGE BODY THƯ GIÃN';
            catSubtitle = 'Ấn huyệt, chườm đá nóng Tây Tạng, phục hồi sinh lực (Giảm 5% khi đặt lịch)';
          }

          return (
            <ScrollReveal key={categoryKey}>
            <section 
              id={`category-${slugify(categoryKey)}`} 
              className="scroll-mt-24 space-y-8"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xxl:grid-cols-4 gap-6">
                {items.map((service: any) => {
                  const isDeal = categoryKey === 'Deal Chấn Động';
                  return (
                    <div 
                      key={service.id} 
                      className={`relative bg-white rounded-3xl border ${borderStyle} hover-magnetic hover:border-[#8D6E53]/40 transition-all flex flex-col justify-between overflow-hidden`}
                    >
                      {service.image_url && (
                        <div className="relative w-full h-48 overflow-hidden bg-gray-50">
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
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
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
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-[#FAF0E6] rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6 text-[#8D6E53]" />
            </div>
            <h4 className="font-display font-bold text-base text-[#3A2E2B]">Yên Tâm Vệ Sinh</h4>
            <p className="text-xs text-gray-500">Mọi dụng cụ kềm kéo, chậu ngâm đều được khử trùng sấy tia cực tím chu đáo nhất.</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-[#FAF0E6] rounded-full flex items-center justify-center mx-auto">
              <Award className="w-6 h-6 text-[#8D6E53]" />
            </div>
            <h4 className="font-display font-bold text-base text-[#3A2E2B]">Tay Nghề Thành Thạo</h4>
            <p className="text-xs text-gray-500">Kỹ thuật viên gội đầu và thợ làm móng được chứng nhận tay nghề cao, tỉ mỉ tận tâm.</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-[#FAF0E6] rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-6 h-6 text-[#8D6E53]" />
            </div>
            <h4 className="font-display font-bold text-base text-[#3A2E2B]">Dược Liệu Thiên Nhiên</h4>
            <p className="text-xs text-gray-500">Min sử dụng 100% dầu gội thảo dược thảo mộc đun nấu thủ công chất lượng cao nhất.</p>
          </div>
        </div>
      </section>

      {/* Appointment Tracker Portal */}
      <Suspense fallback={<div className="h-32 bg-[#EADDCD]/30 rounded-3xl animate-pulse" />}>
      <section className="max-w-4xl mx-auto px-4 py-8">
        <AppointmentLookup />
      </section>
      </Suspense>

      {/* Real-time Schedule Tracker Section */}
      <Suspense fallback={<div className="h-64 bg-[#EADDCD]/30 rounded-3xl animate-pulse" />}>
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
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
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-[#5C4033] rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl border border-[#D4C3B3]">
          <div className="absolute top-0 right-[-10%] w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="text-xs tracking-[0.3em] font-bold text-amber-200 uppercase block">HẸN GẶP LẠI BẠN TẠI SALON</span>
            <h2 className="text-3xl md:text-4xl font-display font-medium text-[#FAF6F0]">Sẵn Sàng Để Tận Hưởng Phút Giây Thư Giãn?</h2>
            <p className="text-gray-300 text-sm leading-relaxed max-w-lg mx-auto">
              Bấm ngay vào nút bên dưới để chọn lịch hẹn, chọn thợ kỹ thuật, đặt giờ chuẩn xác nhất và nhận ngay ưu đãi 5% trực tuyến.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/booking" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FAF6F0] hover:bg-[#F5EBE0] text-[#5C4033] px-8 py-4 rounded-full font-bold text-sm tracking-wider uppercase transition-all shadow-lg hover:shadow-xl hover-magnetic"
              >
                <Calendar className="w-4 h-4 text-[#5C4033]" />
                ĐẶT LỊCH GỒI & LÀM MÓNG
              </Link>
              <a 
                href={`tel:${hotline.replace(/\s/g, '')}`} 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/40 hover:border-white text-white px-8 py-4 rounded-full font-bold text-sm tracking-wider uppercase transition-all hover-magnetic"
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

      {/* Footer */}
      <footer className="bg-[#3A2E2B] text-white py-12">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <h4 className="font-display font-bold text-lg text-[#EADDCD]">Min Nail &amp; Hair</h4>
            <p className="text-xs text-gray-400">📍 TM14 Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức</p>
            <a href="tel:0934323878" className="text-xs text-amber-300 font-bold">📞 0934 323 878</a>
            <p className="text-xs text-gray-400">⏰ 09:00 - 20:30 (Mỗi ngày)</p>
          </div>
          <div className="space-y-3">
            <h4 className="font-display font-bold text-lg text-[#EADDCD]">Dịch vụ</h4>
            <Link href="/booking" className="block text-xs text-gray-400 hover:text-amber-300">Đặt lịch trực tuyến</Link>
            <Link href="/blog" className="block text-xs text-gray-400 hover:text-amber-300">Blog làm đẹp</Link>
            <a href="https://maps.google.com/?q=Lavita+Charm+Thu+Duc" target="_blank" rel="noopener noreferrer" className="block text-xs text-gray-400 hover:text-amber-300">Xem bản đồ</a>
          </div>
          <div className="space-y-3">
            <h4 className="font-display font-bold text-lg text-[#EADDCD]">Kết nối</h4>
            <a href="https://facebook.com/minnailhair" target="_blank" rel="noopener noreferrer" className="block text-xs text-gray-400 hover:text-amber-300">Facebook</a>
            <a href="https://zalo.me/0934323878" target="_blank" rel="noopener noreferrer" className="block text-xs text-gray-400 hover:text-amber-300">Zalo OA</a>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-xs text-gray-500">
          © 2026 Min Nail &amp; Hair Salon. All rights reserved.
        </div>
      </footer>
      <BottomNavigation />
    </div>
  );
}
