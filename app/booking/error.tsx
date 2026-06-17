'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function BookingError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-lg border border-[#EADDCD] space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-[#5C4033]">Đặt lịch tạm gián đoạn</h2>
        <p className="text-sm text-stone-500">{error.message || 'Có lỗi xảy ra, vui lòng thử lại.'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-5 py-2.5 bg-[#8D6E53] text-white rounded-full text-xs font-bold hover:bg-[#5C4033] transition-all">
            Thử lại
          </button>
          <Link href="/" className="px-5 py-2.5 border border-[#EADDCD] rounded-full text-xs font-bold text-stone-600 hover:bg-[#FAF0E6] transition-all">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
