import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createAnonClient } from '@/utils/supabase/server';
import { Clock, ArrowLeft, Calendar, Phone, Star, CheckCircle2 } from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';

export const revalidate = 3600;

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/&/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

async function getServiceBySlug(slug: string) {
  const supabase = await createAnonClient();
  const { data: services } = await supabase
    .from('services')
    .select('id, name, category, price, duration, description, image_url, is_active')
    .eq('is_active', true);
  if (!services) return null;
  // try exact slug match first
  let svc = services.find((s: any) => slugify(s.name) === slug.toLowerCase());
  if (svc) return svc;
  // fallback: match by id (for direct /dich-vu/<id>)
  svc = services.find((s: any) => s.id === slug);
  return svc || null;
}

async function getRelatedServices(category: string, excludeId: string) {
  const supabase = await createAnonClient();
  const { data } = await supabase
    .from('services')
    .select('id, name, category, price, duration, image_url')
    .eq('is_active', true)
    .eq('category', category)
    .neq('id', excludeId)
    .limit(3);
  return data || [];
}

export async function generateStaticParams() {
  const supabase = await createAnonClient();
  const { data } = await supabase.from('services').select('id, name').eq('is_active', true);
  if (!data) return [];
  return data.map((s: any) => ({ slug: slugify(s.name) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://min-nail-hair.vercel.app';
  if (!service) {
    return { title: 'Không tìm thấy dịch vụ | Min Nail & Hair' };
  }
  const title = `${service.name} Thủ Đức | Min Nail & Hair`;
  const desc = (service.description || `Dịch vụ ${service.name} chuyên nghiệp tại Min Nail & Hair Lavita Charm Thủ Đức.`).slice(0, 155);
  const url = `${baseUrl}/dich-vu/${slugify(service.name)}`;
  const ogImage = service.image_url || `${baseUrl}/icons/icon-512.png`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: 'Min Nail & Hair',
      locale: 'vi_VN',
      type: 'website',
      images: [{ url: ogImage, width: 800, height: 600, alt: service.name }],
    },
    twitter: { card: 'summary_large_image', title, description: desc, images: [ogImage] },
  };
}

export default async function DichVuDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://min-nail-hair.vercel.app';
  const related = await getRelatedServices(service.category, service.id);
  const serviceUrl = `${baseUrl}/dich-vu/${slugify(service.name)}`;

  const jsonLdService = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": service.name,
    "name": service.name,
    "description": service.description || service.name,
    "category": service.category,
    "image": service.image_url || `${baseUrl}/icons/icon-512.png`,
    "provider": {
      "@type": "BeautySalon",
      "name": "Min Nail & Hair",
      "url": baseUrl,
      "telephone": "+84934323878",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "TM14 Chung cư Lavita Charm, Đường số 1",
        "addressLocality": "Trường Thọ, Thủ Đức",
        "addressRegion": "TP. Hồ Chí Minh",
        "addressCountry": "VN"
      }
    },
    "areaServed": "Thủ Đức, TP. Hồ Chí Minh",
    "offers": {
      "@type": "Offer",
      "price": service.price,
      "priceCurrency": "VND",
      "availability": "https://schema.org/InStock",
      "url": serviceUrl
    }
  };

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Trang chủ", "item": baseUrl },
      { "@type": "ListItem", "position": 2, "name": "Dịch vụ", "item": `${baseUrl}/#services` },
      { "@type": "ListItem", "position": 3, "name": service.name, "item": serviceUrl }
    ]
  };

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `${service.name} giá bao nhiêu?`,
        "acceptedAnswer": { "@type": "Answer", "text": `Giá ${service.name} tại Min Nail & Hair là ${Number(service.price).toLocaleString('vi-VN')}đ, thời lượng ${service.duration} phút. Đặt online giảm 5%.` }
      },
      {
        "@type": "Question",
        "name": `${service.name} mất bao lâu?`,
        "acceptedAnswer": { "@type": "Answer", "text": `Thời lượng ${service.duration} phút, bao gồm chuẩn bị và hoàn thiện.` }
      },
      {
        "@type": "Question",
        "name": "Đặt lịch như thế nào?",
        "acceptedAnswer": { "@type": "Answer", "text": "Đặt trực tuyến tại min-nail-hair.vercel.app/booking hoặc hotline 0934 323 878. Chọn ngày giờ và kỹ thuật viên yêu thích." }
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdService) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />

      <div className="min-h-screen bg-[#FAF6F0] text-[#3A2E2B] font-sans pb-16">
        <header className="sticky top-0 z-50 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#EADDCD] px-4 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="w-10 h-10 bg-[#8D6E53] rounded-full flex items-center justify-center text-white font-bold">M</span>
              <span className="font-display font-black uppercase tracking-wider">MIN SALON</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/" className="text-xs font-bold text-[#8D6E53] flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Trang chủ</Link>
              <Link href="/booking" className="text-xs font-bold bg-[#8D6E53] text-white px-4 py-2.5 rounded-full uppercase">Đặt lịch</Link>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
          <nav aria-label="Breadcrumb" className="text-xs text-stone-500 flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#8D6E53]">Trang chủ</Link>
            <span>/</span>
            <Link href="/#services" className="hover:text-[#8D6E53]">Dịch vụ</Link>
            <span>/</span>
            <span className="text-[#3A2E2B] font-semibold line-clamp-1">{service.name}</span>
          </nav>

          <article className="bg-white rounded-3xl border border-[#EADDCD]/60 overflow-hidden shadow-sm">
            {service.image_url && (
              <div className="relative h-64 md:h-[420px] w-full bg-stone-100">
                <Image src={service.image_url} alt={`${service.name} - ${service.category} tại Min Nail & Hair Thủ Đức`} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 800px" />
              </div>
            )}
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-[#FAF0E6] border border-[#EADDCD] rounded-full text-[10px] font-bold uppercase tracking-wider text-[#8D6E53]">{service.category}</span>
                <span className="inline-flex items-center gap-1 text-xs text-stone-500"><Clock className="w-3.5 h-3.5 text-[#8D6E53]" /> {service.duration} phút</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-[#3A2E2B] leading-tight">{service.name}</h1>
              <p className="text-sm md:text-base text-stone-600 leading-relaxed bg-[#FAF6F0] p-4 rounded-2xl border-l-4 border-[#8D6E53]/80">{service.description || `Trải nghiệm ${service.name} chuyên nghiệp tại Min Nail & Hair Lavita Charm.`}</p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-stone-100">
                <div>
                  <span className="text-xs text-stone-400 uppercase tracking-wider font-bold">Giá dịch vụ</span>
                  <p className="text-2xl font-black text-[#8D6E53]">{Number(service.price).toLocaleString('vi-VN')}đ</p>
                  <p className="text-xs text-emerald-600 font-semibold">Giảm 5% khi đặt online</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Link href={`/booking?service=${service.id}`} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#8D6E53] hover:bg-[#5C4033] text-white px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider shadow-md">
                    <Calendar className="w-4 h-4" /> Đặt lịch ngay
                  </Link>
                  <a href="tel:0934323878" className="inline-flex items-center justify-center gap-2 bg-white border border-[#EADDCD] text-[#8D6E53] px-5 py-3.5 rounded-full font-bold text-xs uppercase">
                    <Phone className="w-4 h-4" /> Gọi tư vấn
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                <div className="flex items-center gap-2 p-3 bg-[#FAF6F0] rounded-xl border border-[#EADDCD]/50 text-xs"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dụng cụ khử trùng UV</div>
                <div className="flex items-center gap-2 p-3 bg-[#FAF6F0] rounded-xl border border-[#EADDCD]/50 text-xs"><Star className="w-4 h-4 text-amber-500" /> Kỹ thuật viên tay nghề cao</div>
                <div className="flex items-center gap-2 p-3 bg-[#FAF6F0] rounded-xl border border-[#EADDCD]/50 text-xs"><Clock className="w-4 h-4 text-[#8D6E53]" /> Đúng giờ • Không chờ đợi</div>
              </div>
            </div>
          </article>

          {/* FAQ */}
          <section className="bg-white rounded-3xl border border-[#EADDCD]/60 p-6 md:p-8 shadow-sm space-y-4">
            <h2 className="font-display font-bold text-lg text-[#3A2E2B]">Câu hỏi thường gặp</h2>
            <div className="space-y-3 text-sm">
              <div className="p-4 bg-[#FAF6F0] rounded-xl border border-[#EADDCD]/50">
                <p className="font-bold text-[#3A2E2B]">{service.name} giá bao nhiêu?</p>
                <p className="text-stone-600 mt-1">Giá {Number(service.price).toLocaleString('vi-VN')}đ / {service.duration} phút. Đặt online giảm 5% còn {Math.round(Number(service.price)*0.95).toLocaleString('vi-VN')}đ.</p>
              </div>
              <div className="p-4 bg-[#FAF6F0] rounded-xl border border-[#EADDCD]/50">
                <p className="font-bold text-[#3A2E2B]">Làm ở đâu? Có cần đặt trước không?</p>
                <p className="text-stone-600 mt-1">TM14 Lavita Charm, Thủ Đức. Nên đặt trước qua /booking hoặc hotline 0934 323 878 để giữ chỗ, không chờ đợi.</p>
              </div>
            </div>
          </section>

          {/* Related */}
          {related.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display font-bold text-lg text-[#3A2E2B]">Dịch vụ liên quan</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {related.map((r: any) => (
                  <Link key={r.id} href={`/dich-vu/${slugify(r.name)}`} className="bg-white rounded-2xl border border-[#EADDCD]/60 overflow-hidden hover:shadow-md transition-all group">
                    {r.image_url && <div className="relative h-32 bg-stone-100"><Image src={r.image_url} alt={`${r.name} - Min Nail & Hair`} fill className="object-cover group-hover:scale-105 transition-transform" sizes="300px" /></div>}
                    <div className="p-4 space-y-1">
                      <p className="text-xs font-bold text-[#8D6E53] uppercase">{r.category}</p>
                      <p className="font-bold text-sm text-[#3A2E2B] line-clamp-1">{r.name}</p>
                      <p className="text-xs text-[#8D6E53] font-black">{Number(r.price).toLocaleString('vi-VN')}đ • {r.duration}p</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
        <BottomNavigation />
      </div>
    </>
  );
}
