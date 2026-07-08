'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import TabAutoSEO from "./TabAutoSEO";
import SeoMetadataForm from "./SeoMetadataForm";
import SeoAiWriter from "./SeoAiWriter";
import SeoSavedArticles from "./SeoSavedArticles";
import SeoBannerForm from "./SeoBannerForm";

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

export default function TabSEO({ data, userRole, onReload }: { data: SeoData | null; userRole: string; onReload: () => void }) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<"METADATA" | "AI_WRITER" | "SAVED_ARTICLES" | "BANNER" | "AUTO_SEO">("METADATA");

  return (
    <div className="space-y-6">
      {/* Header and Sub tabs */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-pink-500" />
            SEO Marketing Hub ✨
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Quản trị viên cấu hình Website tối ưu tìm kiếm Google & tạo các nội dung chuẩn SEO bằng Gemini AI mạnh mẽ.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setSubTab("METADATA")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "METADATA" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Cấu hình Metadata
          </button>
          <button
            onClick={() => setSubTab("AI_WRITER")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "AI_WRITER" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Sáng tạo AI SEO 🪄
          </button>
          <button
            onClick={() => setSubTab("SAVED_ARTICLES")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "SAVED_ARTICLES" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Kho bài viết đã lưu
          </button>
          <button
            onClick={() => setSubTab("BANNER")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "BANNER" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Cấu hình Banner 📣
          </button>
          <button
            onClick={() => setSubTab("AUTO_SEO")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "AUTO_SEO" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Auto SEO 🤖
          </button>
        </div>
      </div>

      {/* Blog Suite Promotional Call to Action */}
      <div className="bg-gradient-to-r from-[#8D6E53] via-[#5C4033] to-[#3A2E2B] p-5 rounded-2xl text-[#FAF6F0] flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white border border-white/30 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">MỚI ✨</span>
            <span className="text-white text-xs font-semibold">PHÂN HỆ BLOG &amp; SEO SUITE</span>
          </div>
          <h3 className="font-bold text-sm md:text-base leading-snug">Sử dụng Trình Biên Tập Chuyên Nghiệp Để Đăng Bài Viết Lên Website Công Khai</h3>
          <p className="text-[11px] text-stone-200 leading-relaxed font-semibold">Bao gồm hệ thống đồng bộ trực tiếp database, tự động sinh slug tiếng Việt không dấu, chấm điểm từ khóa SEO địa phương và sitemap XML tự động chạy ngầm phục vụ tăng trưởng SEO.</p>
        </div>
        <button
          onClick={() => router.push('/admin/blog')}
          className="px-5 py-3 bg-[#FAF6F0] hover:bg-[#EADDCD] text-[#5C4033] rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
        >
          Mở Trình Soạn Thảo Blog ✍️
        </button>
      </div>

      {subTab === "METADATA" && <SeoMetadataForm data={data} onReload={onReload} />}
      {subTab === "AI_WRITER" && <SeoAiWriter />}
      {subTab === "SAVED_ARTICLES" && <SeoSavedArticles userRole={userRole} />}
      {subTab === "AUTO_SEO" && <TabAutoSEO />}
      {subTab === "BANNER" && <SeoBannerForm />}
    </div>
  );
}
