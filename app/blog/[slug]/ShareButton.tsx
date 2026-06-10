'use client';

import { useState } from 'react';
import { Share, Check, Copy } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  url?: string;
}

export default function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Cùng đọc bài viết hay trên Min Nail & Hair: ${title}`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        console.warn('Native share failed or dismissed, trying clipboard copy instead:', err);
      }
    }

    // Fallback: Copy to clipboard
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF6F0] hover:bg-[#8D6E53] text-[#8D6E53] hover:text-white border border-[#EADDCD] rounded-2xl text-[11px] font-extrabold cursor-pointer transition-all active:scale-95"
        title="Chia sẻ bài viết"
        id="share-article-btn"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white" />
            <span className="text-emerald-700 font-bold">Đã sao chép!</span>
          </>
        ) : (
          <>
            <Share className="w-3.5 h-3.5" />
            <span>Chia sẻ bài viết</span>
          </>
        )}
      </button>

      {copied && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#3A2E2B] text-white text-[10px] px-2 py-1 rounded-md shadow-md whitespace-nowrap animate-bounce font-medium">
          Đã copy link bài viết! 🔗
        </span>
      )}
    </div>
  );
}
