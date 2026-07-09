'use client'

import Link from 'next/link';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useNoindex } from '@/lib/use-noindex';

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  useNoindex();
  useEffect(() => { logger.error('[RootError] Page error', error); }, [error]);

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#EADDCD] p-8 max-w-md text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-lg font-bold text-[#3A2E2B]">Có lỗi xảy ra</h1>
        <p className="text-sm text-gray-500">Vui lòng thử lại hoặc quay về trang chủ.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => reset()} className="px-6 py-2.5 bg-[#5C4033] text-white text-sm font-bold rounded-xl hover:bg-[#4A3227] transition-colors">
            Thử lại
          </button>
          <Link href="/" className="px-6 py-2.5 bg-white text-[#5C4033] text-sm font-bold rounded-xl border border-[#EADDCD] hover:bg-[#FAF6F0] transition-colors">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
