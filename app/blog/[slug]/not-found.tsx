import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function BlogPostNotFound() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-lg border border-[#EADDCD] space-y-4">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8 text-[#8D6E53]" />
        </div>
        <h2 className="text-xl font-bold text-[#5C4033]">Bài viết không tồn tại</h2>
        <p className="text-sm text-stone-500">Bài viết bạn tìm kiếm đã bị xóa hoặc không có trên hệ thống.</p>
        <Link href="/blog" className="inline-block px-5 py-2.5 bg-[#8D6E53] text-white rounded-full text-xs font-bold hover:bg-[#5C4033] transition-all">
          Xem tất cả bài viết
        </Link>
      </div>
    </div>
  );
}
