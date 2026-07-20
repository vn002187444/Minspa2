'use client'

import { Button } from '@/components/ui/Button';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  console.error('[GlobalError]', error);
  return (
    <html lang="vi">
      <body className="bg-[#FAF6F0]">
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EADDCD] p-8 max-w-md text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-lg font-bold text-[#3A2E2B]">Đã xảy ra lỗi hệ thống</h1>
            <p className="text-sm text-gray-500">Vui lòng thử lại hoặc liên hệ quản trị viên.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => reset()}>
                Thử lại
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
