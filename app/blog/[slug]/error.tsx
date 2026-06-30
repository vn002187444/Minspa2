'use client';
import { useNoindex } from '@/lib/seo';

export default function BlogPostError({ error: _error, reset }: { error: Error; reset: () => void }) {
  useNoindex();
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#EADDCD] p-8 max-w-md w-full text-center space-y-4 shadow-sm">
        <div className="text-4xl">😵</div>
        <h2 className="text-xl font-bold text-gray-900">Không thể tải bài viết</h2>
        <p className="text-sm text-gray-500">Đã có lỗi xảy ra khi tải nội dung. Vui lòng thử lại.</p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-[#8D6E53] hover:bg-[#5C4033] text-white rounded-full font-bold text-sm transition-all"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}

