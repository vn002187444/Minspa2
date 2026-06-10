'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface AnnouncementBannerProps {
  settings: {
    is_enabled: boolean;
    content: string;
  };
}

export default function AnnouncementBanner({ settings }: AnnouncementBannerProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!settings.is_enabled || !settings.content) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
          className="bg-[#5C4033] text-[#FAF6F0] relative overflow-hidden shrink-0"
          id="announcement-banner"
        >
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-center min-h-[36px]">
            <div className="flex-1 text-center text-[11px] md:text-sm font-medium uppercase tracking-widest pl-6 pr-6 py-0.5 leading-relaxed selection:bg-[#FAF6F0] selection:text-[#5C4033] line-clamp-2 md:line-clamp-1">
              {settings.content}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#FAF6F0]/80 hover:text-white hover:bg-white/10 rounded-full transition-all focus:outline-none cursor-pointer"
              aria-label="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
