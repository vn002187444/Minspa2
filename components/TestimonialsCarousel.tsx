'use client';

import { Star } from 'lucide-react';

const testimonials = [
  { name: 'Nguyễn Phương Vy', text: 'Mình làm móng ở đây thường xuyên, chị chủ kỹ tính lắm, làm rất tỉ mỉ. Không gian sạch sẽ, thơm tho, giá cả hợp lý.', rating: 5 },
  { name: 'Trần Thị Mai', text: 'Gội đầu dưỡng sinh đã lắm các chị ơi. Nhân viên massage cổ vai gáy nhẹ nhàng mà thấm, xong tóc mềm mượt thơm cả ngày.', rating: 5 },
  { name: 'Lê Hoàng Anh', text: 'Min Nail là chỗ làm móng yêu thích của mình. Nhiều mẫu đẹp, thợ lành nghề và luôn tư vấn nhiệt tình. Sẽ quay lại thường xuyên!', rating: 5 },
  { name: 'Phạm Thị Hương', text: 'Combo gội đầu + massage vai gáy + chà gót chân siêu thư giãn. Sau một tuần làm việc mệt mỏi, tới đây là hết stress luôn.', rating: 5 },
  { name: 'Đặng Thùy Trang', text: 'Mình đặt lịch online rất tiện, tới là được làm luôn không phải chờ. Nhân viên thân thiện, tay nghề cao. Đáng tiền!', rating: 5 },
  { name: 'Võ Thị Kim Ngân', text: 'Làm móng gel ở đây đẹp lắm, giữ được 3-4 tuần. Màu sắc đa dạng, giá cả phải chăng. Chị chủ dễ thương nữa.', rating: 5 },
  { name: 'Bùi Thanh Thảo', text: 'Lần đầu tới Min mà ấn tượng luôn. Spa sạch sẽ, trang trí ấm cúng. Được tư vấn nhiệt tình, làm xong móng đẹp xuất sắc.', rating: 5 },
  { name: 'Ngô Thị Bích Trâm', text: 'Mình bị đau vai gáy kinh niên, từ ngày gội đầu dưỡng sinh ở Min thấy giảm hẳn. Chị chủ biết rõ về huyệt đạo lắm.', rating: 5 },
  { name: 'Dương Mỹ Linh', text: 'Mua liệu trình 10 buổi gội đầu ở Min tiết kiệm lắm. Mỗi tuần ghé 1 lần vừa thư giãn vừa tốt cho tóc. Yêu Min quá!', rating: 5 },
  { name: 'Hoàng Thị Ái Vân', text: 'Min làm móng đẹp mê ly luôn. Mình hay chọn mẫu trên Pinterest rồi nhờ thợ làm theo, y chang không sai tí nào.', rating: 5 },
  { name: 'Trương Thị Trúc Ly', text: 'Địa chỉ làm đẹp yêu thích ở Thủ Đức. Gội đầu thảo dược thơm dịu, massage nhẹ nhàng, giá lại rất bình dân. 10/10!', rating: 5 },
  { name: 'Nguyễn Thị Cẩm Tiên', text: 'Mình dẫn mẹ đi gội đầu ở Min, mẹ khen dữ lắm. Không gian yên tĩnh, nhân viên chăm sóc tận tình. Sẽ ủng hộ dài dài.', rating: 5 },
];

export default function TestimonialsCarousel() {
  return (
    <section id="reviews" className="scroll-mt-28 md:scroll-mt-24 py-16 bg-white border-y border-[#EADDCD] overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 mb-10 text-center space-y-3">
        <span className="text-xs tracking-[0.2em] font-bold text-[#8D6E53] uppercase block">
          Khách hàng nói gì về Min
        </span>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-[#3A2E2B]">
          1.500+ Khách Hàng Hài Lòng
        </h2>
        <p className="text-xs text-gray-500 max-w-lg mx-auto">
          Những cảm nhận chân thật từ các chị em đã trải nghiệm dịch vụ tại Min Nail &amp; Hair
        </p>
      </div>

      <div className="relative">
        <div className="flex gap-6 animate-[scroll_40s_linear_infinite] w-max hover:[animation-play-state:paused]">
          {[...testimonials, ...testimonials].map((t, i) => (
            <div
              key={i}
              className="w-72 shrink-0 bg-[#FAF6F0] rounded-2xl p-5 border border-[#EADDCD] flex flex-col gap-3 select-none"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-[#3A2E2B] leading-relaxed italic line-clamp-4">
                &ldquo;{t.text}&rdquo;
              </p>
              <p className="text-[11px] font-bold text-[#8D6E53] mt-auto">— {t.name}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
