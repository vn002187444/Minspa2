import Link from 'next/link';
import type { Metadata } from 'next';
import { SearchX } from 'lucide-react';

export const metadata: Metadata = { robots: { index: false } };

export default function BookingNotFound() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-lg border border-[#EADDCD] space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <SearchX className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-[#5C4033]">Không tìm thấy trang</h2>
        <p className="text-sm text-stone-500">Trang đặt lịch bạn yêu cầu không tồn tại.</p>
        <Link href="/booking" className="inline-block px-5 py-2.5 bg-[#8D6E53] text-white rounded-full text-xs font-bold hover:bg-[#5C4033] transition-all">
          Đến trang đặt lịch
        </Link>
      </div>
    </div>
  );
}
