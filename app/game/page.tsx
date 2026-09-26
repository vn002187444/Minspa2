import type { Metadata } from 'next'
import Link from 'next/link'
import BreadcrumbSchema from '@/components/BreadcrumbSchema'
import DynamicBottomNavigation from '@/components/DynamicBottomNavigation'
import { Gamepad2, Heart, ArrowRight, Facebook, Music2, Share2, ThumbsUp, MessageCircle, ExternalLink, Sparkles } from 'lucide-react'
import { getBaseUrl } from '@/lib/env'

export const revalidate = 3600

const FB_URL = 'https://www.facebook.com/MinDanceStudio'
const TIKTOK_URL = 'https://www.tiktok.com/@mindancestuido'

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseUrl()
  return {
    title: 'Ủng Hộ Min 1 Like & Chơi Game Water Sort - Cảm Ơn Apaka',
    description: 'Chơi game Water Sort miễn phí và ủng hộ Min Dance Studio 1 like, share, comment trên Facebook & TikTok — mỗi lượt tương tác thay lời cảm ơn đến Apaka.',
    alternates: { canonical: `${baseUrl}/game` },
    openGraph: {
      title: 'Ủng Hộ Min 1 Like & Chơi Game Water Sort',
      description: 'Like, share, comment ủng hộ Min Dance Studio trên Facebook & TikTok — mỗi lượt tương tác thay lời cảm ơn đến Apaka.',
      url: `${baseUrl}/game`,
      siteName: 'Min Nail & Hair',
      locale: 'vi_VN',
      type: 'website',
      images: [{ url: `${baseUrl}/icons/icon-512.png`, width: 512, height: 512, alt: 'Ung ho Min - Game Water Sort' }],
    },
  }
}

export default function GamePage() {
  const baseUrl = getBaseUrl()
  const fbShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${baseUrl}/game`)}`
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Trang chủ', url: baseUrl }, { name: 'Ủng Hộ Min & Chơi Game', url: `${baseUrl}/game` }]} />
      <div className="min-h-screen bg-[#FAF6F0] text-[#3A2E2B] font-sans pb-16">
        <header className="sticky top-0 z-50 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#EADDCD] px-4 py-4 md:px-8">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="w-10 h-10 bg-[#8D6E53] rounded-full flex items-center justify-center shadow-md text-white font-bold text-lg">M</Link>
              <div>
                <Link href="/" className="font-display font-black text-lg uppercase tracking-wider text-[#3A2E2B]">MIN SALON</Link>
                <span className="block text-[9px] uppercase tracking-[0.2em] text-[#8D6E53] font-bold -mt-1 font-mono">Ủng Hộ & Chơi Game</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-xs font-bold text-[#8D6E53] hover:text-[#3A2E2B] flex items-center gap-1">← Trang Chủ</Link>
              <Link href="/booking" className="text-xs font-bold bg-[#8D6E53] text-white hover:bg-[#3A2E2B] px-4 py-2.5 rounded-full uppercase tracking-wider shadow-md">Booking ⚡</Link>
            </div>
          </div>
        </header>

        {/* HERO ỦNG HỘ */}
        <section className="relative overflow-hidden bg-[#5C4033] text-[#FAF6F0] py-10 md:py-14 px-4 text-center">
          <div className="absolute inset-0 bg-[url('/pattern-grid.svg')] opacity-5" />
          <div className="relative max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest mb-4">
              <Heart className="w-3.5 h-3.5 text-red-300" /> Xin 1 lượt ủng hộ
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight mb-4 leading-tight">
              Chơi Game Hay<br />Ủng Hộ Min 1 Like ❤️
            </h1>
            <p className="text-sm md:text-lg text-[#EADDCD] max-w-2xl mx-auto leading-relaxed">
              Game Water Sort hoàn toàn <span className="text-white font-bold">miễn phí</span> — chỉ xin bạn
              1 like, 1 share hoặc 1 comment trên Facebook & TikTok bên dưới.
            </p>
            <p className="mt-4 inline-block bg-white/10 border border-white/25 rounded-2xl px-5 py-3 text-sm md:text-base font-semibold text-amber-100">
              Bất cứ 1 like hay comment nào của bạn đều thay lời cảm ơn chân thành đến <span className="font-black text-white">Apaka</span> 🙏
            </p>
          </div>
        </section>

        {/* KÊNH ỦNG HỘ */}
        <section className="max-w-4xl mx-auto px-4 mt-6 md:mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Facebook */}
            <div className="bg-white rounded-3xl border border-[#EADDCD] shadow-lg p-6 text-center flex flex-col">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1877F2] text-white flex items-center justify-center shadow-md mb-3">
                <Facebook className="w-7 h-7" />
              </div>
              <h2 className="font-display font-black text-lg">Facebook</h2>
              <p className="text-xs text-gray-500 font-mono mb-4 break-all">facebook.com/MinDanceStudio</p>
              <div className="flex flex-col gap-2 mt-auto">
                <a href={FB_URL} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#1464cc] text-white font-bold px-6 py-3.5 rounded-full text-sm shadow-md active:scale-95 transition-all">
                  <ThumbsUp className="w-4 h-4" /> Like & Theo Dõi <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <div className="flex gap-2">
                  <a href={fbShare} target="_blank" rel="noopener" className="flex-1 inline-flex items-center justify-center gap-1.5 border-2 border-[#EADDCD] hover:border-[#1877F2] hover:text-[#1877F2] text-[#5C4033] font-bold px-4 py-2.5 rounded-full text-xs transition-all">
                    <Share2 className="w-3.5 h-3.5" /> Chia sẻ
                  </a>
                  <a href={FB_URL} target="_blank" rel="noopener" className="flex-1 inline-flex items-center justify-center gap-1.5 border-2 border-[#EADDCD] hover:border-[#1877F2] hover:text-[#1877F2] text-[#5C4033] font-bold px-4 py-2.5 rounded-full text-xs transition-all">
                    <MessageCircle className="w-3.5 h-3.5" /> Comment
                  </a>
                </div>
              </div>
            </div>
            {/* TikTok */}
            <div className="bg-white rounded-3xl border border-[#EADDCD] shadow-lg p-6 text-center flex flex-col">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-black text-white flex items-center justify-center shadow-md mb-3">
                <Music2 className="w-7 h-7" />
              </div>
              <h2 className="font-display font-black text-lg">TikTok</h2>
              <p className="text-xs text-gray-500 font-mono mb-4 break-all">@mindancestuido</p>
              <div className="flex flex-col gap-2 mt-auto">
                <a href={TIKTOK_URL} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 text-white font-bold px-6 py-3.5 rounded-full text-sm shadow-md active:scale-95 transition-all">
                  <Heart className="w-4 h-4 text-red-400" /> Follow & Thả Tim <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <div className="flex gap-2">
                  <a href={TIKTOK_URL} target="_blank" rel="noopener" className="flex-1 inline-flex items-center justify-center gap-1.5 border-2 border-[#EADDCD] hover:border-black text-[#5C4033] font-bold px-4 py-2.5 rounded-full text-xs transition-all">
                    <Share2 className="w-3.5 h-3.5" /> Chia sẻ
                  </a>
                  <a href={TIKTOK_URL} target="_blank" rel="noopener" className="flex-1 inline-flex items-center justify-center gap-1.5 border-2 border-[#EADDCD] hover:border-black text-[#5C4033] font-bold px-4 py-2.5 rounded-full text-xs transition-all">
                    <MessageCircle className="w-3.5 h-3.5" /> Comment
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NÚT VÀO GAME CỠ LỚN */}
        <section className="max-w-4xl mx-auto px-4 mt-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#8D6E53] to-[#5C4033] p-8 md:p-12 text-center shadow-2xl border border-[#8D6E53]">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-100 mb-4">
                <Gamepad2 className="w-4 h-4" /> Water Sort Ultimate — Miễn phí
              </div>
              <h2 className="text-white font-display font-black text-2xl md:text-3xl mb-2">Sẵn sàng chơi chưa?</h2>
              <p className="text-[#EADDCD] text-sm mb-6">Nhấn nút bên dưới để vào game ngay — đừng quên ủng hộ Min 1 like nhé!</p>
              <a
                href="/water-sort.html"
                target="_blank"
                rel="noopener"
                className="group inline-flex items-center justify-center gap-3 bg-white text-[#5C4033] font-black text-xl md:text-3xl px-12 md:px-16 py-5 md:py-7 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-wide animate-pulse hover:animate-none"
              >
                <Gamepad2 className="w-8 h-8 md:w-10 md:h-10 group-hover:rotate-12 transition-transform" />
                ▶ Vào Game Ngay
              </a>
              <div className="mt-4">
                <span className="inline-flex items-center gap-1.5 text-[#EADDCD] text-xs font-semibold">
                  Game mở toàn màn hình trong tab mới — chơi miễn phí, không cần tải app
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* BÀI GIỚI THIỆU MIN DANCE STUDIO — SEO / GEO */}
        <article className="max-w-4xl mx-auto px-4 mt-6 md:mt-8">
          <div className="bg-white rounded-3xl border border-[#EADDCD] shadow-lg p-6 md:p-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8D6E53] mb-2">Giới thiệu — Min Dance Studio</p>
            <h2 className="font-display font-black text-2xl md:text-3xl leading-tight mb-4">Min Dance Studio — Lớp học nhảy cho mọi lứa tuổi tại Thủ Đức, TP. Hồ Chí Minh</h2>
            <div className="space-y-4 text-sm md:text-[15px] leading-relaxed text-[#3A2E2B]">
              <p>
                <strong>Min Dance Studio</strong> là studio dạy nhảy thân thiện tại khu vực <strong>Thủ Đức, TP. Hồ Chí Minh</strong>,
                nơi bất kỳ ai — từ bé mới bắt đầu đến người lớn đi làm — đều có thể tìm thấy một lớp nhảy phù hợp với mình.
                Studio nổi bật với không khí lớp học vui vẻ, giáo viên tận tâm và lộ trình rõ ràng từ nền tảng đến biểu diễn.
                Nhiều học viên đến với Min vì muốn rèn sức khỏe, sự tự tin và tìm một cộng đồng yêu âm nhạc, yêu chuyển động.
              </p>
              <h3 className="font-display font-bold text-lg pt-2">Học gì tại Min Dance Studio?</h3>
              <p>
                Chương trình tại Min Dance Studio bao phủ các thể loại được yêu thích nhất hiện nay:
                <strong> Kpop, Hiphop, Choreography, Sexy Dance, Dance Fitness</strong> và lớp nhảy nền tảng cho người mới.
                Lớp <strong>kids</strong> giúp bé phát triển nhịp điệu, thể lực và sự dạn dĩ sân khấu,
                trong khi lớp <strong>người lớn và văn phòng</strong> tập trung giải tỏa stress sau giờ làm, giữ dáng và học pê đê biểu diễn ngắn để quay video TikTok.
                Mỗi buổi học gồm khởi động, luyện kỹ thuật, ghép tổ hợp và quay clip ôn bài gửi nhóm lớp.
              </p>
              <h3 className="font-display font-bold text-lg pt-2">Vì sao học viên gắn bó với Min?</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Giáo viên theo sát từng người:</strong> sĩ số lớp vừa phải, sửa động tác chi tiết, có giáo án riêng cho người mới và người học lâu.</li>
                <li><strong>Lịch học linh hoạt:</strong> lớp tối và cuối tuần phù hợp học sinh, sinh viên và dân văn phòng tại Thủ Đức, Bình Thạnh, Quận 9 cũ.</li>
                <li><strong>Học phí minh bạch:</strong> đóng theo tháng, theo khóa hoặc thẻ buổi tập; học thử buổi đầu để trải nghiệm trước khi đăng ký.</li>
                <li><strong>Cộng đồng Apaka:</strong> team Apaka và các dancer của studio thường xuyên dựng bài, quay collab và dẫn team đi diễn, đi thi phong trào.</li>
              </ul>
              <h3 className="font-display font-bold text-lg pt-2">Ai nên đăng ký?</h3>
              <p>
                Nếu bạn là phụ huynh muốn tìm <strong>lớp nhảy cho bé ở Thủ Đức</strong>, là bạn trẻ mê Kpop muốn nhảy đẹp để quay TikTok,
                hay là người mới hoàn toàn chưa từng tập nhảy — Min đều có lớp phù hợp.
                Chỉ cần mang giày thể thao, quần áo thoải mái và một tinh thần ham vui, phần còn lại giáo viên sẽ hướng dẫn từ nhịp đếm đầu tiên.
                Học viên mới nên nhắn tin trước qua <a href={FB_URL} target="_blank" rel="noopener" className="underline font-bold text-[#8D6E53]">Facebook Min Dance Studio</a> hoặc
                xem clip lớp học trên <a href={TIKTOK_URL} target="_blank" rel="noopener" className="underline font-bold text-[#8D6E53]">TikTok @mindancestuido</a> để chọn đúng thể loại mình thích.
              </p>
              <h3 className="font-display font-bold text-lg pt-2">Cách đăng ký và ủng hộ studio</h3>
              <p>
                Cách nhanh nhất là inbox fanpage để được xếp lớp học thử và tư vấn lịch phù hợp.
                Nếu bạn chưa sẵn sàng đăng ký, hãy ủng hộ studio bằng 1 like fanpage, 1 follow TikTok,
                1 lượt chia sẻ bài viết hoặc 1 comment cổ vũ — <strong>mỗi tương tác đều thay lời cảm ơn gửi đến Apaka</strong> và
                là động lực để Min ra thêm nhiều bài nhảy, lớp mới và game giải trí miễn phí như Water Sort trên trang này.
                Hẹn gặp bạn ở buổi tập gần nhất của Min Dance Studio!
              </p>
            </div>
          </div>
        </article>

        {/* NHẮC ỦNG HỘ LẦN 2 + BOOKING */}
        <section className="max-w-4xl mx-auto px-4 py-10 text-center space-y-4">
          <p className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-full px-5 py-2.5 text-xs md:text-sm font-semibold">
            <Sparkles className="w-4 h-4" /> Chơi vui rồi — cho Min xin 1 share để cảm ơn Apaka nhé!
          </p>
          <div>
            <Link href="/booking" className="inline-flex items-center gap-2 bg-[#8D6E53] text-white font-bold px-8 py-3.5 rounded-full text-sm hover:bg-[#3A2E2B] shadow-lg">
              Đặt Lịch Ngay <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <DynamicBottomNavigation />
      </div>
    </>
  )
}
