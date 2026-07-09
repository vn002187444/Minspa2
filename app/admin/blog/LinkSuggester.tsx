'use client'

import { useState, useEffect } from 'react';
import { Link2, Sparkles, Copy, Check } from 'lucide-react';

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  keywords?: string;
}

export default function LinkSuggester({ currentId, keywords }: { currentId?: string | null; keywords?: string }) {
  const [posts, setPosts] = useState<RelatedPost[]>([]);
  const [suggestions, setSuggestions] = useState<{ post: RelatedPost; reason: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { getBlogPosts } = await import('../../blog/actions');
        const { posts: allPosts } = await getBlogPosts(1, 50);
        setPosts(allPosts.filter((p: any) => p.id !== currentId));
      } catch {}
    }
    load();
  }, [currentId]);

  function suggestLinks() {
    if (posts.length === 0) return;
    setLoading(true);
    setSuggestions([]);

    const kwList = (keywords || '').split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const titleWords = new Set<string>();
    posts.forEach(p => {
      p.title.toLowerCase().split(/\s+/).forEach(w => {
        if (w.length > 3) titleWords.add(w);
      });
      if (p.keywords) {
        p.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean).forEach(k => titleWords.add(k));
      }
    });

    const scored = posts.map(p => {
      let score = 0;
      const pTitle = p.title.toLowerCase();
      const pKw = (p.keywords || '').toLowerCase();
      const text = pTitle + ' ' + pKw;

      // Score based on keyword overlap
      for (const kw of kwList) {
        if (text.includes(kw)) score += 3;
        if (pTitle.includes(kw)) score += 5;
      }

      // Score based on word overlap
      const words = pTitle.split(/\s+/);
      for (const w of words) {
        if (w.length > 3 && titleWords.has(w)) score += 1;
      }

      return { post: p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const topSuggestions = scored.slice(0, 5).filter(s => s.score > 0);

    if (topSuggestions.length === 0) {
      // Fallback: suggest most recent posts
      setSuggestions(posts.slice(0, 3).map(p => ({
        post: p,
        reason: 'Bài viết gần đây — có thể liên kết để tăng lượt xem chéo.'
      })));
    } else {
      setSuggestions(topSuggestions.map(s => {
        let reason = '';
        if (s.score >= 8) reason = 'Cùng chủ đề — liên kết nội bộ mạnh.';
        else if (s.score >= 4) reason = 'Từ khóa tương đồng — nên chèn link.';
        else reason = 'Có liên quan nhẹ — có thể tham khảo.';
        return { post: s.post, reason };
      }));
    }
    setLoading(false);
  }

  function copyLink(post: RelatedPost, idx: number) {
    const link = `[${post.title}](/blog/${post.slug})`;
    navigator.clipboard.writeText(link);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  if (posts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase text-stone-500 tracking-wider flex items-center gap-1">
          <Link2 className="w-3.5 h-3.5" /> Liên kết nội bộ
        </p>
        <button
          type="button"
          onClick={suggestLinks}
          disabled={loading}
          className="text-[10px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="w-3 h-3" />
          {loading ? 'Đang gợi ý...' : 'Gợi ý link'}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((s, idx) => (
            <div key={s.post.id} className="flex items-start gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-stone-800 truncate">{s.post.title}</p>
                <p className="text-[9px] text-stone-400 truncate font-mono">/blog/{s.post.slug}</p>
                <p className="text-[9px] text-purple-600 font-semibold mt-0.5">{s.reason}</p>
              </div>
              <button
                type="button"
                onClick={() => copyLink(s.post, idx)}
                className="shrink-0 p-1.5 bg-white border border-stone-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all cursor-pointer"
                title="Copy link dạng Markdown"
              >
                {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              </button>
            </div>
          ))}
          <p className="text-[8px] text-stone-400 font-medium">Click Copy để chép link dạng <span className="font-mono">[title](/blog/slug)</span> và dán vào nội dung.</p>
        </div>
      )}
    </div>
  );
}
