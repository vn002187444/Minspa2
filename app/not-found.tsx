import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false } };

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-display font-bold text-amber-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Trang không tìm thấy</h2>
        <p className="text-gray-500 mb-8">Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
