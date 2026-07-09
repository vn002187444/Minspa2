'use client'

import { useState } from 'react';
import { ImageIcon, Sparkles, Copy, Check } from 'lucide-react';

interface Props {
  imageUrl?: string;
  currentAlt?: string;
  onSetAlt: (_alt: string) => void;
  title?: string;
}

export default function AltTextGenerator({ imageUrl, currentAlt, onSetAlt, title }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function handleGenerate() {
    if (!imageUrl && !title) return;
    setLoading(true);
    setSuggestions([]);

    try {
      const topic = title || 'dịch vụ làm đẹp';
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'writeArticle', title: topic }),
      });
      const data = await res.json();
      if (data.image_alt) {
        setSuggestions([data.image_alt]);
      } else {
        // Generate fallback suggestions
        const kw = topic.toLowerCase();
        const fallbacks = [
          `Dịch vụ ${kw} chất lượng cao tại Min Nail & Hair Thủ Đức`,
          `Hình ảnh ${kw} tại Min Nail & Hair Lavita Charm`,
          `Trải nghiệm ${kw} chuyên nghiệp tại Min Nail & Hair`,
          `${kw} - Min Nail & Hair Thủ Đức`,
        ];
        setSuggestions(fallbacks);
      }
    } catch {
      // Fallback if AI fails
      const kw = (title || 'dịch vụ làm đẹp').toLowerCase();
      setSuggestions([
        `Dịch vụ ${kw} tại Min Nail & Hair Thủ Đức`,
        `Hình ảnh ${kw} - Min Nail & Hair Lavita Charm`,
      ]);
    }
    setLoading(false);
  }

  function copyToClipboard(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase text-stone-500 tracking-wider flex items-center gap-1">
          <ImageIcon className="w-3.5 h-3.5" /> Alt text gợi ý
        </p>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || (!imageUrl && !title)}
          className="text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="w-3 h-3" />
          {loading ? 'Đang sinh...' : 'Sinh alt text'}
        </button>
      </div>

      {currentAlt && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Đang dùng</p>
          <p className="text-[11px] text-stone-700 font-medium">{currentAlt}</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((alt, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-stone-700 font-medium">{alt}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onSetAlt(alt)}
                  className="p-1.5 bg-[#8D6E53] text-white rounded-lg hover:bg-[#5C4033] transition-all cursor-pointer text-[10px] font-bold"
                  title="Dùng alt text này"
                >
                  Dùng
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(alt, idx)}
                  className="p-1.5 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 transition-all cursor-pointer"
                  title="Copy alt text"
                >
                  {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
