'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

const MASCOT_DISMISSED_KEY = 'min_mascot_dismissed';

const stepMessages: Record<number, { title: string; body: string }> = {
  1: {
    title: 'Nhập số điện thoại nhé!',
    body: 'Min sẽ tra cứu lịch sử và gợi ý dịch vụ phù hợp nhất cho bạn hôm nay.',
  },
  2: {
    title: 'Chọn ngày giờ bạn nhé!',
    body: 'Min đề xuất khung giờ vàng còn trống. Chọn KTV yêu thích nếu muốn!',
  },
  3: {
    title: 'Đặt lịch thành công rồi!',
    body: 'Min đã ghi nhận lịch hẹn. Bạn có thể hủy hoặc dời lịch qua số hotline bất cứ lúc nào.',
  },
};

export default function BookingMascotGuide({ step }: { step: number }) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(MASCOT_DISMISSED_KEY) === 'true';
  });

  if (dismissed) return null;

  const msg = stepMessages[step] || stepMessages[1];

  return (
    <AnimatePresence>
      <div className="flex items-start gap-3 mb-6">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="relative shrink-0"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center shadow-md border border-amber-300">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-md border border-[#EADDCD] flex-1 max-w-xs"
        >
          <button
            onClick={() => {
              setDismissed(true);
              localStorage.setItem(MASCOT_DISMISSED_KEY, 'true');
            }}
            aria-label="Đóng hướng dẫn"
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
          <p className="text-[11px] font-bold text-[#5C4033] mb-0.5">{msg.title}</p>
          <p className="text-[10px] text-gray-500 leading-relaxed">{msg.body}</p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
