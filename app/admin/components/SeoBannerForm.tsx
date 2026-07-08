'use client'

import { useState, useEffect, startTransition } from "react";
import { getBannerSettings, saveBannerSettings } from "../actions";

export default function SeoBannerForm() {
  const [bannerForm, setBannerForm] = useState({
    is_enabled: true,
    content: "✨ GIẢM NGAY 5% KHI ĐẶT LỊCH HẸN TRỰC TUYẾN ✨ HOTLINE: 0934 323 878"
  });
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerMsg, setBannerMsg] = useState({ type: "", text: "" });

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

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerMsg({ type: "", text: "" });
    setBannerLoading(true);
    const res = await saveBannerSettings(bannerForm);
    if (res.success) {
      setBannerMsg({ type: "success", text: "Đã lưu cấu hình Banner Thông Báo thành công!" });
    } else {
      setBannerMsg({ type: "error", text: "Lỗi khi lưu Banner: " + res.error });
    }
    setBannerLoading(false);
  };

  return (
    <div className="space-y-6">
      {bannerMsg.text && (
        <div className={`p-4 rounded-xl text-sm font-medium ${bannerMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {bannerMsg.text}
        </div>
      )}

      <form
        onSubmit={handleBannerSubmit}
        className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6"
      >
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-1">
            Cấu hình Banner Khuyến Mãi &amp; Thông Báo 📣
          </h3>
          <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
            Cấu hình dải banner nổi bật chạy ở đầu trang chủ dịch vụ. Dải banner giúp quảng bá các chương trình ưu đãi mới hoặc ghim thông tin đường dây nóng hỗ trợ khách hàng nhanh chóng.
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-150">
          <div className="space-y-0.5">
            <span className="block text-xs font-bold text-gray-800">Trạng thái hiển thị</span>
            <span className="block text-[10px] text-gray-400 font-semibold">Bật/Tắt dải banner lập tức ngoài trang chủ</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerForm({ ...bannerForm, is_enabled: !bannerForm.is_enabled })}
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

        {/* Banner Text Area */}
        <div>
          <label htmlFor="seo-bannerContent" className="block text-xs font-bold text-gray-700 uppercase mb-2">
            Nội dung thông báo (Banner Content)
          </label>
          <textarea
            id="seo-bannerContent"
            rows={2}
            value={bannerForm.content || ""}
            onChange={(e) => setBannerForm({ ...bannerForm, content: e.target.value })}
            placeholder="VD: ✨ GIẢM NGAY 5% KHI ĐẶT LỊCH HẸN TRỰC TUYẾN ✨ HOTLINE: 0934 323 878"
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800 resize-none leading-relaxed"
          ></textarea>
          <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
            Văn bản hiển thị ngắn gọn lý tưởng khoảng 50 - 120 ký tự để không bị xuống dòng quá nhiều trên thiết bị di động.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={bannerLoading}
            className="w-full md:w-auto px-6 py-3 bg-[#5C4033] hover:bg-[#3A2E2B] text-[#FAF6F0] rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {bannerLoading ? "Đang lưu..." : "Lưu Cấu Hình Banner"}
          </button>
        </div>
      </form>
    </div>
  );
}
