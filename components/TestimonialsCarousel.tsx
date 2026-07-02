'use client';

import { Star } from 'lucide-react';
import { testimonials } from '@/lib/testimonials';

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
