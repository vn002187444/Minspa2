'use client';

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#5C4033] focus:text-white focus:rounded-xl focus:text-xs focus:font-bold focus:outline-none focus:ring-2 focus:ring-white"
    >
      Chuyển đến nội dung chính
    </a>
  );
}
