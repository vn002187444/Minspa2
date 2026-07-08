import type { Metadata } from 'next';
import Link from 'next/link';
import BreadcrumbSchema from '@/components/BreadcrumbSchema';
import DynamicBottomNavigation from '@/components/DynamicBottomNavigation';
import { Sparkles, Scissors, Leaf, Award, Heart, MapPin, Phone, Clock, ArrowRight, Star } from 'lucide-react';
import { getBaseUrl } from '@/lib/env';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseUrl();
  return {
    title: 'Giới thiệu - Min Nail & Hair | Salon làm đẹp tại Thủ Đức',
    description: 'Min Nail & Hair - Salon làm đẹp uy tín tại Lavita Charm, Thủ Đức. Dịch vụ gội đầu dưỡng sinh thảo dược, nail nghệ thuật, massage body chuyên nghiệp.',
    alternates: { canonical: `${baseUrl}/about` },
    openGraph: {
      title: 'Giới thiệu - Min Nail & Hair | Salon làm đẹp tại Thủ Đức',
      description: 'Khám phá Min Nail & Hair - Không gian làm đẹp sang trọng tại Lavita Charm, Thủ Đức.',
      url: `${baseUrl}/about`,
      siteName: 'Min Nail & Hair',
      locale: 'vi_VN',
      type: 'website',
      images: [{ url: `${baseUrl}/icons/icon-512.png`, width: 512, height: 512, alt: 'Min Nail & Hair' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Giới thiệu - Min Nail & Hair',
      description: 'Salon làm đẹp uy tín tại Lavita Charm, Thủ Đức.',
      images: [{ url: `${baseUrl}/icons/icon-512.png`, alt: 'Min Nail & Hair' }],
    },
  };
}

const values = [
  { icon: Leaf, title: 'Thảo dược thiên nhiên', desc: 'Sử dụng nguyên liệu thảo dược an toàn, lành tính cho mọi loại da và tóc.' },
  { icon: Award, title: 'Chất lượng cao cấp', desc: 'Đội ngũ kỹ thuật viên giàu kinh nghiệm, quy trình chuẩn salon chuyên nghiệp.' },
  { icon: Heart, title: 'Tận tâm với khách hàng', desc: 'Mỗi khách hàng là người thân – lắng nghe, thấu hiểu và phục vụ tận tâm.' },
  { icon: Sparkles, title: 'Không gian thư giãn', desc: 'Không gian sang trọng, ấm cúng giúp bạn thư giãn sau những giờ làm việc.' },
];

const stats = [
  { value: '5+', label: 'Năm kinh nghiệm' },
  { value: '10k+', label: 'Khách hàng hài lòng' },
  { value: '50+', label: 'Dịch vụ làm đẹp' },
  { value: '4.9', label: 'Đánh giá trung bình', icon: Star },
];

export default function AboutPage() {
  const baseUrl = getBaseUrl();

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Trang chủ", url: baseUrl },
        { name: "Giới thiệu", url: `${baseUrl}/about` },
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
                <span className="block text-[9px] uppercase tracking-[0.2em] text-[#8D6E53] font-bold -mt-1 font-mono">Giới Thiệu</span>
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
        <section className="relative overflow-hidden bg-[#5C4033] text-[#FAF6F0] py-20 md:py-28 px-4 text-center">
          <div className="absolute inset-0 bg-[url('/pattern-grid.svg')] opacity-5" />
          <div className="relative max-w-4xl mx-auto">
            <Sparkles className="w-8 h-8 mx-auto mb-4 text-[#EADDCD]" />
            <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">
              Min Nail &amp; Hair
            </h1>
            <p className="text-lg md:text-xl text-[#EADDCD]/90 max-w-2xl mx-auto leading-relaxed">
              Không gian làm đẹp sang trọng tại Lavita Charm, Thủ Đức – nơi hội tụ tinh hoa chăm sóc sắc đẹp từ gội đầu dưỡng sinh thảo dược đến nail nghệ thuật và massage body.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-6xl mx-auto px-4 -mt-10 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg border border-[#EADDCD] p-6 text-center">
                {s.icon && <s.icon className="w-5 h-5 text-[#8D6E53] mx-auto mb-2 fill-current" />}
                <div className="text-2xl md:text-3xl font-black text-[#5C4033]">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Story */}
        <section className="max-w-6xl mx-auto px-4 mt-16 md:mt-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-[#3A2E2B] mb-4">
                Câu Chuyện Của Chúng Tôi
              </h2>
              <div className="w-16 h-1 bg-[#8D6E53] mb-6" />
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Min Nail &amp; Hair ra đời với sứ mệnh mang đến cho phụ nữ Việt Nam một không gian làm đẹp trọn vẹn – nơi bạn không chỉ được chăm sóc ngoại hình mà còn tìm thấy sự thư giãn và cân bằng trong tâm hồn.
                </p>
                <p>
                  Tọa lạc tại khu đô thị Lavita Charm, Trường Thọ, Thủ Đức, chúng tôi tự hào là địa chỉ uy tín chuyên gội đầu dưỡng sinh thảo dược, nail nghệ thuật, massage body và các dịch vụ chăm sóc sắc đẹp toàn diện.
                </p>
                <p>
                  Mỗi liệu trình tại Min Nail &amp; Hair đều được thiết kế riêng dựa trên tình trạng da, tóc và sức khỏe của từng khách hàng. Chúng tôi cam kết chỉ sử dụng nguyên liệu thiên nhiên, an toàn và mang lại hiệu quả cao nhất.
                </p>
              </div>
            </div>
            <div className="bg-[#EADDCD]/40 rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <Scissors className="w-16 h-16 text-[#8D6E53] mx-auto mb-4" />
                <p className="text-sm text-gray-500 italic">Không gian làm đẹp tại Lavita Charm, Thủ Đức</p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-white py-16 md:py-20 mt-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-[#3A2E2B] mb-2">
                Giá Trị Cốt Lõi
              </h2>
              <p className="text-gray-500 text-sm">Tại sao khách hàng tin chọn Min Nail &amp; Hair</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v, i) => (
                <div key={i} className="text-center p-6 rounded-2xl border border-[#EADDCD] bg-[#FAF6F0]/50 hover:shadow-lg transition-all">
                  <div className="w-14 h-14 bg-[#8D6E53]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <v.icon className="w-7 h-7 text-[#8D6E53]" />
                  </div>
                  <h3 className="font-bold text-[#3A2E2B] mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-[#3A2E2B] mb-2">
              Dịch Vụ Chính
            </h2>
            <p className="text-gray-500 text-sm">Chúng tôi mang đến trải nghiệm làm đẹp toàn diện</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Leaf, title: 'Gội đầu dưỡng sinh', desc: 'Liệu trình gội đầu thảo dược kết hợp massage vai cổ, giúp thư giãn và phục hồi tóc hư tổn.' },
              { icon: Sparkles, title: 'Nail nghệ thuật', desc: 'Đa dạng mẫu nail từ cổ điển đến hiện đại, sử dụng sơn gel cao cấp bền màu.' },
              { icon: Heart, title: 'Massage Body', desc: 'Massage thư giãn toàn thân, giảm đau mỏi vai gáy với tinh dầu thiên nhiên.' },
              { icon: Scissors, title: 'Chăm sóc tóc', desc: 'Ủ tóc, phục hồi tóc hư tổn và tạo kiểu chuyên nghiệp.' },
              { icon: Award, title: 'Những combo ưu đãi', desc: 'Combo gội đầu + massage + nail với giá ưu đãi, tiết kiệm chi phí.' },
              { icon: Star, title: 'Gói thành viên VIP', desc: 'Tích điểm thành viên, giảm giá và ưu đãi đặc biệt dành cho khách hàng thân thiết.' },
            ].map((s, i) => (
              <div key={i} className="p-6 rounded-2xl border border-[#EADDCD] bg-white hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-[#8D6E53]/10 rounded-xl flex items-center justify-center mb-4">
                  <s.icon className="w-6 h-6 text-[#8D6E53]" />
                </div>
                <h3 className="font-bold text-[#3A2E2B] mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Location */}
        <section className="bg-[#5C4033] text-[#FAF6F0] py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
                  Đến Với Chúng Tôi
                </h2>
                <div className="w-16 h-1 bg-[#EADDCD] mb-6" />
                <div className="space-y-4 text-[#EADDCD]/90">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold">Địa chỉ</p>
                      <p className="text-sm">TM14 Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức, TP. Hồ Chí Minh</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold">Hotline</p>
                      <a href="tel:+84934323878" className="text-sm hover:underline">0934 323 878</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold">Giờ mở cửa</p>
                      <p className="text-sm">09:00 – 20:30 (Tất cả các ngày trong tuần)</p>
                    </div>
                  </div>
                </div>
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 mt-6 bg-white text-[#5C4033] font-bold px-6 py-3 rounded-full text-sm hover:bg-[#EADDCD] transition-all shadow-lg"
                >
                  Đặt lịch ngay <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="bg-[#3A2E2B]/50 rounded-2xl p-8 flex items-center justify-center min-h-[250px]">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-[#EADDCD] mx-auto mb-3" />
                  <p className="text-sm text-[#EADDCD]/70">Lavita Charm, Trường Thọ, Thủ Đức</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-[#3A2E2B] mb-4">
            Trải Nghiệm Ngay Hôm Nay
          </h2>
          <p className="text-gray-500 mb-6 max-w-xl mx-auto">
            Đặt lịch hẹn tại Min Nail &amp; Hair để trải nghiệm dịch vụ làm đẹp đẳng cấp với giá ưu đãi nhất.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 bg-[#8D6E53] text-white font-bold px-8 py-3.5 rounded-full text-sm hover:bg-[#3A2E2B] transition-all shadow-lg"
          >
            Đặt Lịch Ngay <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        <DynamicBottomNavigation />
      </div>
    </>
  );
}
