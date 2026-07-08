'use client'

import { useState, useEffect, startTransition } from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { saveSeoSettings, saveBannerSettings, getBannerSettings } from "../actions";

interface SeoData {
  page_title: string;
  meta_description: string;
  meta_keywords: string;
  og_image_url: string;
  online_discount_enabled: boolean;
  online_discount_percent: number;
  default_commission_percent: number;
  hotline: string;
  facebook_url: string;
  zalo_url: string;
}

export default function SeoMetadataForm({ data, onReload }: { data: SeoData | null; onReload: () => void }) {
  const [form, setForm] = useState(
    data || {
      page_title: "",
      meta_description: "",
      meta_keywords: "",
      og_image_url: "",
      online_discount_enabled: true,
      online_discount_percent: 5,
      default_commission_percent: 15,
      hotline: "0934 323 878",
      facebook_url: "https://facebook.com/minnailhair",
      zalo_url: "https://zalo.me/0934323878",
    }
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [bannerForm, setBannerForm] = useState({
    is_enabled: true,
    content: "✨ GIẢM NGAY 5% KHI ĐẶT LỊCH HẸN TRỰC TUYẾN ✨ HOTLINE: 0934 323 878"
  });
  const [bannerLoading, setBannerLoading] = useState(false);

  useEffect(() => {
    if (data) startTransition(() => { setForm(data); });
  }, [data]);

  useEffect(() => {
    const loadBanner = async () => {
      try {
        const res = await getBannerSettings();
        if (res) {
          startTransition(() => {
            setBannerForm({
              is_enabled: res.is_enabled !== undefined ? res.is_enabled : true,
              content: res.content || ""
            });
          });
        }
      } catch (err) {
        console.error("Lỗi tải cấu hình banner:", err);
      }
    };
    loadBanner();
  }, []);

  const showToast = (message: string) => {
    const el = document.createElement("div");
    el.className = "fixed bottom-6 right-6 z-50 bg-gray-900 border border-gray-800 text-white text-[11px] font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce";
    el.innerHTML = `<svg class="w-4 h-4 text-pink-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"/></svg><span style="margin-left:8px">${message}</span>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setLoading(true);
    const res = await saveSeoSettings(form);
    if (res.success) {
      setMsg({ type: "success", text: "Đã lưu cấu hình SEO thành công!" });
      onReload();
    } else {
      setMsg({ type: "error", text: "Lỗi khi lưu SEO: " + res.error });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {msg.text && (
        <div className={`p-4 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {/* Banner Quick Control Switch */}
      <div className="bg-gradient-to-r from-[#FAF6F0] to-white p-6 rounded-2xl border border-[#EADDCD] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Hiển thị Banner Thông Báo ngoài Trang Chủ 📣</h3>
          </div>
          <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
            Bật hoặc tắt dải banner thông báo khuyến mãi và hotline ở vùng đầu trang chủ lập tức mà không làm mất nội dung văn bản.
          </p>
          {bannerForm.content && (
            <div className="mt-1 max-w-full">
              <span className="inline-block text-[10px] text-[#5C4033] bg-[#FAF0E6] px-2.5 py-1 rounded-lg font-semibold border border-[#EADDCD]/50 max-w-full truncate">
                Nội dung hiện tại: &quot;{bannerForm.content}&quot;
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto bg-[#FAF6F0] border border-[#EADDCD]/60 px-4 py-2 rounded-xl">
          <span className={`text-[10px] font-black uppercase tracking-widest ${bannerForm.is_enabled ? 'text-pink-600' : 'text-gray-400'}`}>
            {bannerForm.is_enabled ? 'Đang Bật' : 'Đang Tắt'}
          </span>
          <button
            type="button"
            disabled={bannerLoading}
            onClick={async () => {
              const newIsEnabled = !bannerForm.is_enabled;
              setBannerForm(prev => ({ ...prev, is_enabled: newIsEnabled }));
              setBannerLoading(true);
              try {
                const res = await saveBannerSettings({ ...bannerForm, is_enabled: newIsEnabled });
                if (res.success) {
                  showToast(`Đã ${newIsEnabled ? 'BẬT' : 'TẮT'} banner thông báo thành công!`);
                } else {
                  showToast(`Lỗi khi cập nhật trạng thái banner: ${res.error}`);
                }
              } catch {
                showToast("Đã xảy ra lỗi hệ thống khi chuyển đổi.");
              } finally {
                setBannerLoading(false);
              }
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              bannerForm.is_enabled ? 'bg-pink-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                bannerForm.is_enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5"
      >
        <div>
          <label htmlFor="seo-pageTitle" className="block text-xs font-bold text-gray-700 uppercase mb-2">
            Tiêu đề trang (Page Title)
          </label>
          <input
            id="seo-pageTitle"
            type="text"
            value={form.page_title || ""}
            onChange={(e) => setForm({ ...form, page_title: e.target.value })}
            placeholder="VD: Min Nail & Hair - Dưỡng sinh & Làm móng"
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800"
          />
          <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
            Độ dài lý tưởng: 50 - 60 ký tự.
          </p>
        </div>
        <div>
          <label htmlFor="seo-metaDescription" className="block text-xs font-bold text-gray-700 uppercase mb-2">
            Đoạn mô tả (Meta Description)
          </label>
          <textarea
            id="seo-metaDescription"
            rows={3}
            value={form.meta_description || ""}
            onChange={(e) =>
              setForm({ ...form, meta_description: e.target.value })
            }
            placeholder="VD: Tiệm gội đầu dưỡng sinh thảo dược, làm móng chuyên sâu uy tím hàng đầu tại Chung cư Lavita Charm, Thủ Đức..."
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800 resize-none"
          ></textarea>
          <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
            Đoạn tóm tắt hiển thị trên Google. Tối đa 150 - 160 ký tự.
          </p>
        </div>
        <div>
          <label htmlFor="seo-metaKeywords" className="block text-xs font-bold text-gray-700 uppercase mb-2">
            Từ khóa (Meta Keywords)
          </label>
          <input
            id="seo-metaKeywords"
            type="text"
            value={form.meta_keywords || ""}
            onChange={(e) =>
              setForm({ ...form, meta_keywords: e.target.value })
            }
            placeholder="VD: gội đầu dưỡng sinh, làm móng thủ đức, min nail, salon tóc"
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800"
          />
          <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
            Các từ khóa cách nhau bởi dấu phẩy (,).
          </p>
        </div>
        <div>
          <label htmlFor="seo-ogImageUrl" className="block text-xs font-bold text-gray-700 uppercase mb-2">
            Ảnh chia sẻ (Open Graph Image URL)
          </label>
          <input
            id="seo-ogImageUrl"
            type="text"
            value={form.og_image_url || ""}
            onChange={(e) => setForm({ ...form, og_image_url: e.target.value })}
            placeholder="VD: https://domain.com/og-image.jpg"
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800"
          />
          <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
            Đường dẫn ảnh Thumbnail hiển thị khi chia sẻ link website lên MXH.
          </p>
          {form.og_image_url && (
            <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 inline-block">
              <Image
                src={form.og_image_url}
                alt="OG Preview"
                width={300}
                height={128}
                className="h-32 w-auto object-cover"
                onError={(e) =>
                  ((e.currentTarget as HTMLImageElement).style.display = "none")
                }
              />
            </div>
          )}
        </div>

        {/* Online Booking Discount Settings */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-widest">Ưu đãi đặt lịch Online</h3>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-600">Bật giảm giá khi đặt lịch Online</label>
            <button
              type="button"
              onClick={() => setForm({ ...form, online_discount_enabled: !form.online_discount_enabled })}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.online_discount_enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.online_discount_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          {form.online_discount_enabled && (
            <div className="flex items-center gap-3">
              <label htmlFor="seo-discountPercent" className="text-xs font-semibold text-gray-600 shrink-0">Phần trăm giảm:</label>
              <input
                id="seo-discountPercent"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={form.online_discount_percent ?? 5}
                onChange={(e) => setForm({ ...form, online_discount_percent: Math.min(100, Math.max(0, Number(e.target.value))) })}
                className="w-24 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800 text-center"
              />
              <span className="text-xs font-bold text-gray-500">%</span>
            </div>
          )}
        </div>

        {/* Default Commission Rate */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-widest">Hoa hồng & Liên hệ</h3>
          <div className="flex items-center gap-3">
            <label htmlFor="seo-commissionPercent" className="text-xs font-semibold text-gray-600 shrink-0">Hoa hồng mặc định:</label>
            <input
              id="seo-commissionPercent"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={form.default_commission_percent ?? 15}
              onChange={(e) => setForm({ ...form, default_commission_percent: Math.min(100, Math.max(0, Number(e.target.value))) })}
              className="w-24 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800 text-center"
            />
            <span className="text-xs font-bold text-gray-500">%</span>
            <p className="text-[10px] text-gray-400 ml-2">Áp dụng khi dịch vụ/gói không có tỷ lệ riêng</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label htmlFor="seo-hotline" className="text-xs font-semibold text-gray-600 shrink-0 sm:w-28">Số hotline:</label>
            <input
              id="seo-hotline"
              type="text"
              value={form.hotline || ""}
              onChange={(e) => setForm({ ...form, hotline: e.target.value })}
              placeholder="VD: 0934 323 878"
              className="w-full sm:w-56 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label htmlFor="seo-facebook" className="text-xs font-semibold text-gray-600 shrink-0 sm:w-28">Link Facebook:</label>
            <input
              id="seo-facebook"
              type="text"
              value={form.facebook_url || ""}
              onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
              placeholder="VD: https://facebook.com/minnailhair"
              className="w-full sm:w-96 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label htmlFor="seo-zalo" className="text-xs font-semibold text-gray-600 shrink-0 sm:w-28">Link Zalo:</label>
            <input
              id="seo-zalo"
              type="text"
              value={form.zalo_url || ""}
              onChange={(e) => setForm({ ...form, zalo_url: e.target.value })}
              placeholder="VD: https://zalo.me/0934323878"
              className="w-full sm:w-96 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-[#5C4033] hover:bg-[#3A2E2B] text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
          >
            {loading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div>
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Lưu cấu hình SEO
          </button>
        </div>
      </form>
    </div>
  );
}
