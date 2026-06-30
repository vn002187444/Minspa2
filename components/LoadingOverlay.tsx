'use client';

import { useFocusTrap } from '@/hooks/useFocusTrap';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export default function LoadingOverlay({
  isVisible,
  message = 'Hệ thống đang xử lý, vui lòng không tắt trình duyệt...',
}: LoadingOverlayProps) {
  const trapRef = useFocusTrap(isVisible);
  if (!isVisible) return null;

  return (
    <div ref={trapRef} className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label={message}>
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
        <div className="relative">
          <div className="w-14 h-14 border-4 border-[#EADDCD] rounded-full" />
          <div className="absolute inset-0 w-14 h-14 border-4 border-t-[#5C4033] rounded-full animate-spin" />
        </div>
        <p className="text-sm font-semibold text-gray-700 text-center leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
}
