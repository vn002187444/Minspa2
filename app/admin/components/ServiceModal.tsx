'use client'

import { useState } from "react";
import Image from "next/image";
import { RefreshCw, Sparkles, ImageIcon, Database } from "lucide-react";
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { saveService, uploadImageAction } from "../actions";
import S3ImageBrowser from '@/components/S3ImageBrowser';
import { Button } from "@/components/ui/Button";

interface ServiceModalService {
  id?: string | null;
  name?: string;
  description?: string;
  price?: number | null;
  duration?: number | null;
  category?: string;
  image_url?: string;
  is_active?: boolean;
  commission_percentage?: number | null;
  commission_amount?: number | null;
}

interface ServiceModalProps {
  service: ServiceModalService;
  onClose: () => void;
  onReload: () => void;
}

export default function ServiceModal({ service, onClose, onReload }: ServiceModalProps) {
  const trapRef = useFocusTrap(true);
  const [form, setForm] = useState({
    id: service.id || undefined,
    name: service.name || "",
    description: service.description || "",
    price: service.price ?? 0,
    duration: service.duration ?? 0,
    category: service.category || "Móng",
    image_url: service.image_url || "",
    is_active: service.is_active ?? true,
    commission_percentage:
      service.commission_percentage ?? 15,
    commission_amount:
      service.commission_amount ?? 0,
  });
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showS3Browser, setShowS3Browser] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'unsplash' | 'pexels'>('gemini');

  const handleGenerateDescription = async () => {
    setErrorMsg("");
    if (!form.name || !form.category) {
      setErrorMsg("Vui lòng nhập Tên dịch vụ và Chọn danh mục trước khi tạo mô tả tự động!");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName: form.name, category: form.category })
      });
      const data = await res.json();
      if (data.description) {
        setForm({ ...form, description: data.description });
      } else if (data.error) {
        setErrorMsg(data.error);
      }
    } catch {
      setErrorMsg("Lỗi khi tạo mô tả bằng AI. Vui lòng thử lại sau.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    const res = await saveService(form);
    if (res.success) {
      onReload();
      onClose();
    } else {
      setErrorMsg("Lỗi: " + res.error);
      setLoading(false);
    }
  };

  return (
    <div ref={trapRef} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={form.id ? "Sửa dịch vụ" : "Thêm dịch vụ"}>
      <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-in zoom-in-95 max-h-[90dvh] overflow-y-auto scrollbar-none">
        <h3 className="font-display font-bold text-lg text-gray-900 mb-6">
          {form.id ? "Sửa dịch vụ" : "Thêm dịch vụ"}
        </h3>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="svc-name" className="block text-sm font-medium text-gray-700 mb-1">
              Tên dịch vụ
            </label>
            <input
              id="svc-name"
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="svc-description" className="block text-sm font-medium text-gray-700">
                Mô tả dịch vụ
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGenerating}
                className="text-xs font-semibold text-pink-600 hover:text-pink-700 flex items-center gap-1 bg-pink-50 hover:bg-pink-100 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Tạo bằng AI
              </button>
            </div>
            <textarea
              id="svc-description"
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Nhập mô tả chi tiết cho dịch vụ này..."
              rows={3}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="svc-price" className="block text-sm font-medium text-gray-700 mb-1">
                Giá (VNĐ)
              </label>
              <input
                id="svc-price"
                required
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="svc-duration" className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian (Phút)
              </label>
              <input
                id="svc-duration"
                required
                type="number"
                value={form.duration}
                onChange={(e) =>
                  setForm({ ...form, duration: Number(e.target.value) })
                }
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between">
                <label htmlFor="svc-commissionPercent" className="block text-sm font-medium text-gray-700 mb-1">
                  Tỷ lệ hoa hồng (%)
                </label>
              </div>
              <input
                id="svc-commissionPercent"
                type="number"
                value={form.commission_percentage}
                onChange={(e) =>
                  setForm({
                    ...form,
                    commission_percentage: Number(e.target.value),
                  })
                }
                placeholder="15"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
              />
              <span className="text-[11px] text-gray-400">
                Tính theo % giá dịch vụ
              </span>
            </div>
            <div>
              <div className="flex justify-between">
                <label htmlFor="svc-commissionAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Số tiền cố định (VNĐ)
                </label>
              </div>
              <input
                id="svc-commissionAmount"
                type="number"
                value={form.commission_amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    commission_amount: Number(e.target.value),
                  })
                }
                placeholder="0"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
              />
              <span className="text-[11px] text-gray-400">
                Nếu đặt &gt; 0, sẽ ưu tiên dùng số tiền này
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="svc-category" className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục
            </label>
            <select
              id="svc-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
            >
              <option value="Móng">Móng (Nail)</option>
              <option value="Gội dưỡng sinh">Gội dưỡng sinh (Hair)</option>
              <option value="Massage">Massage</option>
              <option value="Deal">Deal Khuyến Mãi</option>
            </select>
          </div>

          {/* Service Image */}
          <div>
            <label htmlFor="svc-imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Ảnh dịch vụ
            </label>
            <div className="space-y-3">
              {form.image_url && (
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <Image src={form.image_url} alt={form.name} fill className="object-cover" sizes="(max-width: 400px) 100vw, 400px" />
                  <button type="button" onClick={() => setForm({ ...form, image_url: '' })}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors shadow-md cursor-pointer"
                  >&times;</button>
                </div>
              )}
               <div className="flex gap-2">
                  <label htmlFor="svc-imageUrl" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium text-gray-600">
                    <ImageIcon className="w-4 h-4" />
                    Tải ảnh lên
                    <input id="svc-imageUrl" type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                       if (file.size > 5242880) {
                         setErrorMsg('Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.');
                         return;
                       }
                      const reader = new FileReader();
                      reader.onload = async () => {
                        try {
                          const base64 = reader.result as string;
                          const url = await uploadImageAction(base64);
                          setForm({ ...form, image_url: url });
                        } catch (err: unknown) {
                          setErrorMsg(err instanceof Error ? err.message : 'Lỗi không xác định');
                        }
                      };
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                 <button 
                   type="button" 
                   onClick={() => setShowS3Browser(true)}
                   className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer text-sm font-medium text-blue-700"
                 >
                   <Database className="w-4 h-4" />
                   Chọn từ S3
                 </button>
                 <div className="flex flex-col gap-1 w-full">
                   <select 
                     value={selectedProvider} 
                     onChange={(e) => setSelectedProvider(e.target.value as any)}
                     className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-pink-500"
                   >
                     <option value="gemini">AI Gemini</option>
                     <option value="unsplash">Unsplash</option>
                     <option value="pexels">Pexels</option>
                   </select>
                   <button type="button" onClick={async () => {
                     if (!form.name) { setErrorMsg("Vui lòng nhập tên dịch vụ trước!"); return; }
                     setIsGenerating(true);
                     setErrorMsg("");
                     try {
                       const res = await fetch('/api/generate-seo-image', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ 
                            prompt: `Dịch vụ ${form.name} tại spa, ${form.category || 'spa'}, phong cách chuyên nghiệp, sang trọng, ảnh chụp quảng cáo`,
                            provider: selectedProvider 
                         })
                       });
                       const data = await res.json();
                       if (data.image) setForm({ ...form, image_url: data.image });
                       else if (data.error) setErrorMsg(data.error);
                     } catch { setErrorMsg("Lỗi kết nối khi tạo ảnh"); }
                     finally { setIsGenerating(false); }
                   }} disabled={isGenerating}
                     className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-50 border border-pink-200 rounded-xl hover:bg-pink-100 transition-colors cursor-pointer text-sm font-medium text-pink-700 disabled:opacity-50"
                   >
                     {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                     {selectedProvider === 'gemini' ? 'AI vẽ ảnh' : 'Tìm ảnh'}
                   </button>
                 </div>
               </div>
            </div>
          </div>

          <div>
            <label htmlFor="svc-isActive" className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái hiển thị
            </label>
            <label htmlFor="svc-isActive" className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <input
                id="svc-isActive"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
                className="w-5 h-5 rounded text-pink-500 focus:ring-pink-500"
              />
              <span className="font-medium text-gray-900">
                {form.is_active
                  ? "Đang bật (Hiển thị cho khách)"
                  : "Đang tắt (Tạm ẩn)"}
              </span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              Lưu
            </Button>
          </div>
        </form>
      </div>
      {showS3Browser && (
        <S3ImageBrowser 
          initialUrl={form.image_url}
          onSelect={(url) => {
            setForm({ ...form, image_url: url });
            setShowS3Browser(false);
          }}
          onClose={() => setShowS3Browser(false)}
        />
      )}
    </div>
  );
}
