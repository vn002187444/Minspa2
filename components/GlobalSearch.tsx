'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface SearchResult {
  id: string;
  title: string;
  link: string;
  type: 'manual' | 'auto' | 'service';
  imageUrl?: string;
  price?: number;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ articles: SearchResult[]; services: SearchResult[] }>({
    articles: [],
    services: [],
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults({ articles: [], services: [] });
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setResults({
            articles: data.results.articles,
             services: data.results.services.map((s: any) => ({
              id: s.id,
              title: s.name,
              link: '/booking',
              type: 'service',
              price: s.price,
            })),
          });
        }
      } catch {
        toast.error('Lỗi tìm kiếm, vui lòng thử lại');
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={containerRef} className="relative w-full max-w-md group">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-stone-400 group-focus-within:text-[#8D6E53] transition-colors" />
        <input
          id="global-search"
          name="query"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Tìm kiếm bài viết, dịch vụ..."
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#EADDCD] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6E53]/20 focus:border-[#8D6E53] transition-all shadow-sm"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute right-3 p-1 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5 text-stone-400" />
          </button>
        )}
      </div>

      {isOpen && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#EADDCD] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-stone-500 italic">Đang tìm kiếm...</div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {results.articles.length === 0 && results.services.length === 0 ? (
                <div className="p-4 text-center text-xs text-stone-500">Không tìm thấy kết quả phù hợp.</div>
              ) : (
                <>
                  {results.articles.length > 0 && (
                    <div className="p-2">
                      <div className="px-3 py-2 text-[10px] uppercase tracking-widest font-bold text-stone-400 bg-stone-50">Bài viết</div>
                      <div className="space-y-1 mt-1">
                        {results.articles.map((art) => (
                          <Link 
                            key={art.id} 
                            href={art.link} 
                            className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-xl transition-colors group"
                            onClick={() => setIsOpen(false)}
                          >
                            {art.imageUrl && (
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                                <Image src={art.imageUrl} alt="" width={40} height={40} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-stone-800 truncate group-hover:text-[#8D6E53]">{art.title}</div>
                              <div className="text-[10px] text-stone-500 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> {art.type === 'auto' ? 'AI Research' : 'Blog'}
                              </div>
                            </div>
                            <ArrowRight className="w-3 h-3 text-stone-300 group-hover:text-[#8D6E53] transition-colors" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {results.services.length > 0 && (
                    <div className="p-2 border-t border-stone-100">
                      <div className="px-3 py-2 text-[10px] uppercase tracking-widest font-bold text-stone-400 bg-stone-50">Dịch vụ</div>
                      <div className="space-y-1 mt-1">
                        {results.services.map((svc) => (
                          <Link 
                            key={svc.id} 
                            href={svc.link} 
                            className="flex items-center justify-between p-2 hover:bg-stone-50 rounded-xl transition-colors group"
                            onClick={() => {
                              setIsOpen(false);
                              router.push(`${svc.link}?search=${encodeURIComponent(svc.title)}`);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#FAF6F0] flex items-center justify-center shrink-0">
                                <Sparkles className="w-3.5 h-3.5 text-[#8D6E53]" />
                              </div>
                              <div className="text-xs font-bold text-stone-800 truncate group-hover:text-[#8D6E53]">{svc.title}</div>
                            </div>
                            <div className="text-[10px] font-bold text-[#8D6E53]">{svc.price?.toLocaleString('vi-VN')}đ</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
