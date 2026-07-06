'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Search, Loader2, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';
import { listStorageImages } from '@/app/admin/actions';

interface S3ImageBrowserProps {
  onSelect: (url: string) => void;
  onClose: () => void;
  initialUrl?: string;
}

export default function S3ImageBrowser({ onSelect, onClose, initialUrl }: S3ImageBrowserProps) {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImages() {
      try {
        setLoading(true);
        const data = await listStorageImages();
        setImages(data);
      } catch (e: any) {
        setError(e.message || 'Không thể tải danh sách ảnh');
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, []);

  const filteredImages = images.filter(img => 
    img.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 text-pink-600 rounded-xl">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#3A2E2B]">Thư viện ảnh S3</h3>
              <p className="text-xs text-gray-500">Chọn một ảnh từ storage để sử dụng</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm ảnh theo tên..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#FAF6F0]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              <p className="text-sm font-medium">Đang tải thư viện...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-rose-500 p-8 text-center">
              <AlertCircle className="w-10 h-10" />
              <p className="text-sm font-medium">{error}</p>
              <button 
                onClick={() => { setLoading(true); setError(null); /* retry logic */ }}
                className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400 p-8 text-center">
              <ImageIcon className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Không tìm thấy ảnh nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredImages.map((img) => (
                <div 
                  key={img.url} 
                  className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all border-4 ${
                    initialUrl === img.url ? 'border-pink-500 ring-4 ring-pink-500/20' : 'border-transparent hover:border-pink-300'
                  }`}
                  onClick={() => onSelect(img.url)}
                >
                  <Image 
                    src={img.url} 
                    alt={img.name} 
                    fill 
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="200px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <p className="text-white text-[10px] truncate font-medium">{img.name}</p>
                  </div>
                  {initialUrl === img.url && (
                    <div className="absolute top-2 right-2 bg-pink-500 text-white rounded-full p-1 shadow-lg">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={() => onSelect(images.find(img => img.url === initialUrl)?.url || '')}
            className="px-5 py-2.5 bg-[#5C4033] text-white rounded-xl text-sm font-semibold hover:bg-[#4A352B] transition-colors shadow-md"
          >
            Xác nhận chọn
          </button>
        </div>
      </div>
    </div>
  );
}


