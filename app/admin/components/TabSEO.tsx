'use client'

import { useState, useEffect, useCallback, startTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import TabAutoSEO from "./TabAutoSEO";
import Image from "next/image";
import { Globe, Sparkles, Search, PenTool, ImageIcon, FileText, CheckCircle2, Facebook, Twitter, Send, Trash2 } from "lucide-react";
import {
  getBannerSettings,
  saveBannerSettings,
  saveSeoSettings,
  getSeoArticles,
  saveSeoArticle,
  deleteSeoArticle,
  publishSeoArticleToBlog,
} from "../actions";

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
  
  // Banner States
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

  // METADATA Tab States
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

  useEffect(() => {
    if (data) startTransition(() => { setForm(data); });
  }, [data]);

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

  // AI_WRITER Tab States
  const [seoTopic, setSeoTopic] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [seoImagePrompt, setSeoImagePrompt] = useState("");
  const [isResearchLoading, setIsResearchLoading] = useState(false);
  const [seoResearchText, setSeoResearchText] = useState("");
  const [seoResearchSources, setSeoResearchSources] = useState<any[]>([]);
  
  const [isArticleLoading, setIsArticleLoading] = useState(false);
  const [seoArticleText, setSeoArticleText] = useState("");
  
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [seoImageUrl, setSeoImageUrl] = useState("");
  const [seoImageMethod, setSeoImageMethod] = useState("");
  
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [isPublishingBlog, setIsPublishingBlog] = useState(false);

  // SAVED_ARTICLES Tab States
  const [savedArticles, setSavedArticles] = useState<any[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [isEditingSavedArticle, setIsEditingSavedArticle] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");

  const showToast = (message: string) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadSavedArticles = useCallback(async () => {
    startTransition(() => { setIsLoadingArticles(true); });
    try {
      const arts = await getSeoArticles();
      startTransition(() => { setSavedArticles(arts || []); });
    } catch (e) {
      console.error(e);
    }
    startTransition(() => { setIsLoadingArticles(false); });
  }, []);

  useEffect(() => {
    if (subTab === "SAVED_ARTICLES") {
      loadSavedArticles();
    }
  }, [subTab, loadSavedArticles]);

  const handleResearchAI = async () => {
    if (!seoTopic) {
      showToast("Vui lòng nhập chủ đề chính!");
      return;
    }
    setIsResearchLoading(true);
    setSeoResearchText("");
    setSeoResearchSources([]);
    try {
      const res = await fetch("/api/seo-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: seoTopic, keywords: seoKeywords })
      });
      const resData = await res.json();
      if (resData.summary) {
        setSeoResearchText(resData.summary);
        setSeoResearchSources(resData.sources || []);
      } else {
        setSeoResearchText("Không tìm thấy kết quả nghiên cứu. Vui lòng thử lại.");
      }
    } catch {
      setSeoResearchText("Lỗi tìm kiếm nghiên cứu SEO.");
    }
    setIsResearchLoading(false);
  };

  const handleGenerateArticleAI = async () => {
    if (!seoTopic) {
      showToast("Vui lòng nhập chủ đề bài viết!");
      return;
    }
    setIsArticleLoading(true);
    setSeoArticleText("");
    try {
      const res = await fetch("/api/generate-seo-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: seoTopic, keywords: seoKeywords })
      });
      const data = await res.json();
      if (data.article) {
        setSeoArticleText(data.article);
      } else {
        setSeoArticleText("Có lỗi xảy ra khi gọi AI tạo bài viết. Vui lòng kiểm tra API key.");
      }
    } catch {
      setSeoArticleText("Lỗi kết nối dịch vụ tạo bài viết.");
    }
    setIsArticleLoading(false);
  };

  const handleGenerateImageAI = async () => {
    const promptValue = seoImagePrompt || seoTopic || "nail hair beauty salon";
    setIsImageLoading(true);
    setSeoImageUrl("");
    try {
      const res = await fetch("/api/generate-seo-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptValue })
      });
      const data = await res.json();
      if (data.image) {
        setSeoImageUrl(data.image);
        setSeoImageMethod(data.method);
      } else {
        showToast("Không tạo được ảnh minh họa");
      }
    } catch (e) {
      console.error(e);
      showToast("Lỗi khi kết nối dịch vụ vẽ ảnh!");
    }
    setIsImageLoading(false);
  };

  const handleSaveToArticles = async () => {
    if (!seoTopic || !seoArticleText) {
      showToast("Cần có chủ đề và nội dung bài viết để lưu!");
      return;
    }
    setIsSavingArticle(true);
    try {
      const res = await saveSeoArticle({
        topic: seoTopic,
        keywords: seoKeywords,
        article: seoArticleText,
        image_url: seoImageUrl || ""
      });
      if (res.success) {
        showToast("Lưu vào Kho Bài Viết thành công! Mời xem ở tab tiếp theo.");
        setSeoTopic("");
        setSeoKeywords("");
        setSeoImagePrompt("");
        setSeoArticleText("");
        setSeoImageUrl("");
        setSeoResearchText("");
        setSeoResearchSources([]);
      } else {
        showToast("Lỗi khi lưu bài viết: " + res.error);
      }
    } catch (e: unknown) {
      showToast("Lỗi hệ thống: " + (e instanceof Error ? e.message : 'Lỗi không xác định'));
    }
    setIsSavingArticle(false);
  };

  const handlePublishToBlog = async () => {
    if (!seoArticleText) {
      showToast("Không có nội dung bài viết để đăng!");
      return;
    }
    const suggestedTitle = seoArticleText.match(/^#\s+(.+)/m)?.[1]?.trim()
      || seoArticleText.split('\n').find(l => l.trim().startsWith('## '))?.replace(/^##\s+/, '').trim()
      || seoTopic
      || 'Bài viết SEO';
    const suggestedSlug = toSlug(suggestedTitle);
    const customSlug = window.prompt('Nhập slug (đường dẫn) cho bài viết:', suggestedSlug);
    if (!customSlug) return;
    setIsPublishingBlog(true);
    try {
      const res = await publishSeoArticleToBlog(seoArticleText, seoImageUrl, { slug: customSlug, title: suggestedTitle });
      if (res.success) {
        showToast("Đã đăng bài lên Blog thành công! 🎉");
        window.open('/blog/' + res.slug, '_blank');
      } else {
        showToast("Lỗi: " + res.error);
      }
    } catch (e: unknown) {
      showToast("Lỗi hệ thống: " + (e instanceof Error ? e.message : 'Lỗi không xác định'));
    }
    setIsPublishingBlog(false);
  };

  const [publishingBlogId, setPublishingBlogId] = useState<string | null>(null);

  const handlePublishSavedToBlog = async (art: { id: string; topic?: string; article: string; imageUrl?: string | null }) => {
    const suggestedTitle = art.article.match(/^#\s+(.+)/m)?.[1]?.trim()
      || art.article.split('\n').find(l => l.trim().startsWith('## '))?.replace(/^##\s+/, '').trim()
      || art.topic
      || 'Bài viết SEO';
    const suggestedSlug = toSlug(suggestedTitle);
    const customSlug = window.prompt('Nhập slug (đường dẫn) cho bài viết:', suggestedSlug);
    if (!customSlug) return;
    setPublishingBlogId(art.id);
    try {
      const res = await publishSeoArticleToBlog(art.article, art.imageUrl ?? '', { slug: customSlug, title: suggestedTitle });
      if (res.success) {
        showToast("Đã đăng bài lên Blog thành công! 🎉");
        window.open('/blog/' + res.slug, '_blank');
      } else {
        showToast("Lỗi: " + res.error);
      }
    } catch (e: unknown) {
      showToast("Lỗi hệ thống: " + (e instanceof Error ? e.message : 'Lỗi không xác định'));
    }
    setPublishingBlogId(null);
  };

  const handleDeleteArticle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này vĩnh viễn khỏi kho lưu trữ?")) return;
    try {
      const res = await deleteSeoArticle(id);
      if (res.success) {
        showToast("Đã xóa bài viết thành công!");
        if (selectedArticle?.id === id) {
          setSelectedArticle(null);
          setIsEditingSavedArticle(false);
        }
        loadSavedArticles();
      } else {
        showToast("Lỗi khi xóa bài viết");
      }
    } catch {
      showToast("Lỗi hệ thống khi xóa bài viết");
    }
  };

  const handleUpdateSavedArticle = async () => {
    if (!selectedArticle) return;
    try {
      const res = await saveSeoArticle({
        ...selectedArticle,
        topic: editTitle,
        article: editContent
      });
      if (res.success) {
        showToast("Cập nhật bài viết thành công!");
        setSelectedArticle({ ...selectedArticle, topic: editTitle, article: editContent });
        setIsEditingSavedArticle(false);
        loadSavedArticles();
      } else {
        showToast("Lỗi khi cập nhật bài viết");
      }
    } catch {
      showToast("Lỗi hệ thống khi lưu");
    }
  };

  const copyToClipboard = (text: string, labelId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(labelId);
    setTimeout(() => setCopiedIndex(null), 2000);
    showToast("Đã chép nội dung vào Clipboard!");
  };

  const toSlug = (text: string) =>
    text
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim().replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const handleShareToSocial = (platform: string, topicText: string) => {
    const url = encodeURIComponent(window.location.origin + '/blog/' + (selectedArticle?.topic ? toSlug(selectedArticle.topic) : ''));
    const text = encodeURIComponent(topicText + ' - Min Nail & Hair Thủ Đức');
    let shareUrl = '';
    switch (platform) {
      case 'Facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        break;
      case 'Twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}&hashtags=MinNailHair,ChamSocSacDep`;
        break;
      case 'Zalo':
        shareUrl = `https://zalo.me/share?url=${url}`;
        break;
    }
    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=500');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 border border-gray-800 text-white text-[11px] font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span>{toastMsg}</span>
        </div>
      )}

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

      {/* METADATA SUBTAB */}
      {subTab === "METADATA" && (
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
      )}

      {/* AI_WRITER SUBTAB */}
      {subTab === "AI_WRITER" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Form Controls */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b pb-3 border-gray-100">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Thông tin từ khóa & Sáng tạo</h3>
            </div>

            <div>
              <label htmlFor="seo-aiTopic" className="block text-xs font-bold text-gray-700 mb-1.5">Chủ đề bài viết / Từ khóa chính</label>
              <input
                id="seo-aiTopic"
                type="text"
                value={seoTopic}
                onChange={(e) => setSeoTopic(e.target.value)}
                placeholder="Ví dụ: Cách chăm sóc móng hư tổn sau khi úp móng"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800"
              />
            </div>

            <div>
              <label htmlFor="seo-aiKeywords" className="block text-xs font-bold text-gray-700 mb-1.5">Từ khóa phụ (Tự nhiên hóa)</label>
              <input
                id="seo-aiKeywords"
                type="text"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="chăm sóc móng, dưỡng móng úp, nail thủ đức lavita"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleResearchAI}
                disabled={isResearchLoading}
                className="flex-1 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                {isResearchLoading ? "AI lướt web..." : "AI Nghiên Cứu Web"}
              </button>

              <button
                type="button"
                onClick={handleGenerateArticleAI}
                disabled={isArticleLoading}
                className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <PenTool className="w-4 h-4 text-pink-400 animate-pulse" />
                {isArticleLoading ? "AI viết bài..." : "AI Viết Bài SEO"}
              </button>
            </div>

            {/* Internet search results */}
            {seoResearchText && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <p className="text-[11px] font-extrabold text-blue-700 flex items-center gap-1.5 border-b pb-1.5 border-gray-200">
                  <Globe className="w-4 h-4" />
                  KẾT QUẢ NGHIÊN CỨU INTERNET (GOOGLE GROUNDING)
                </p>
                <pre className="text-[11px] text-gray-600 font-sans leading-relaxed whitespace-pre-wrap font-medium">
                  {seoResearchText}
                </pre>
                {seoResearchSources.length > 0 && (
                  <div className="pt-2 border-t border-gray-200 space-y-1">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Nguồn bổ trợ:</p>
                    {seoResearchSources.map((s, idx) => (
                      <div key={idx} className="text-[10px] text-pink-600 truncate flex items-center gap-1">
                        🌍 <a href={s.uri} target="_blank" rel="noopener noreferrer" className="hover:underline font-bold">{s.title || s.uri}</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Image prompt & Generator */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tạo ảnh minh họa minh tinh ✨</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={seoImagePrompt}
                  onChange={(e) => setSeoImagePrompt(e.target.value)}
                  placeholder="Nhập prompt vẽ ảnh (vd: a luxury pink nail art showcase)"
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800"
                />
                <button
                  type="button"
                  onClick={handleGenerateImageAI}
                  disabled={isImageLoading}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-4 rounded-xl text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <ImageIcon className="w-4 h-4" />
                  {isImageLoading ? "AI vẽ..." : "Vẽ ảnh"}
                </button>
              </div>
              
              {seoImageUrl && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-200">
                    <Image
                      src={seoImageUrl}
                      alt="SEO AI"
                      fill
                      className="object-cover animate-fade-in"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-1 text-[9px] bg-black/70 text-white rounded font-mono font-bold tracking-widest">
                      {seoImageMethod === 'AI' ? 'GEMINI IMAGEN' : 'STOCK REPOSITORY'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium text-center">Ảnh minh họa chuẩn kích thước ngang Facebook/Web.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Preview and Output */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b pb-3 border-gray-100 font-semibold">
              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Bài viết hoạt động chuẩn SEO</h3>
              {seoArticleText && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => copyToClipboard(seoArticleText, "copy")}
                    className="text-[10px] font-bold bg-pink-50 hover:bg-pink-100 text-pink-600 px-2.5 py-1.5 rounded-lg transition-all"
                  >
                    {copiedIndex === "copy" ? "✓ Đã copy" : "Copy Bài Viết"}
                  </button>
                  <button
                    onClick={handleSaveToArticles}
                    disabled={isSavingArticle}
                    className="text-[10px] items-center gap-1 font-bold bg-[#5C4033] hover:bg-[#3A2E2B] text-white px-2.5 py-1.5 rounded-lg transition-all flex disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingArticle ? "Đang lưu..." : "Lưu Kho Bài"}
                  </button>
                  <button
                    onClick={handlePublishToBlog}
                    disabled={isPublishingBlog}
                    className="text-[10px] items-center gap-1 font-bold bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded-lg transition-all flex disabled:opacity-50 cursor-pointer"
                  >
                    {isPublishingBlog ? "Đang đăng..." : "Đăng lên Blog"}
                  </button>
                </div>
              )}
            </div>

            {seoArticleText ? (
              <div className="space-y-4 font-semibold">
                <div className="p-5 bg-gray-50 border border-gray-150 rounded-xl max-h-96 overflow-y-auto font-sans leading-relaxed text-xs text-gray-700 whitespace-pre-wrap">
                  {seoArticleText}
                </div>

                {/* Social Simulation Preview */}
                <div className="border border-gray-200/80 rounded-2xl p-4 bg-gray-50 space-y-3 shadow-inner">
                  <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Giao diện xem trước trên Mạng xã hội</p>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#5C4033] text-white flex items-center justify-center font-bold text-xs shadow-inner">
                        MN
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Min Nail & Hair (Thủ Đức)</p>
                        <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">Vừa xong · 🌐 Công khai</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-800 line-clamp-3 leading-relaxed">
                      Chào đón cả nhà đến với hệ thống thẩm mỹ & chăm sóc sức khỏe Min Nail & Hair Lavita Charm! ✨ {seoTopic}
                    </p>

                    {seoImageUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-gray-150 max-h-48 aspect-video">
                        <Image src={seoImageUrl} alt="Social Promo" fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
                      </div>
                    )}

                    <div className="bg-gray-50 p-2.5 rounded-lg border-t border-gray-100 flex justify-between items-center text-[10px] font-mono text-gray-400">
                      <span>🌏 MIN-NAIL-HAIR.SEO</span>
                      <span className="font-bold underline text-pink-600">Đọc bài chuẩn</span>
                    </div>

                    <div className="flex justify-between border-t border-gray-100 pt-3 text-[11px] font-bold text-gray-500">
                      <button onClick={() => handleShareToSocial("Facebook", seoTopic)} className="flex-1 hover:text-blue-600 flex justify-center items-center gap-1 cursor-pointer"><Facebook className="w-3.5 h-3.5" /> Facebook</button>
                      <button onClick={() => handleShareToSocial("Twitter", seoTopic)} className="flex-1 hover:text-sky-500 flex justify-center items-center gap-1 cursor-pointer"><Twitter className="w-3.5 h-3.5" /> Twitter</button>
                      <button onClick={() => handleShareToSocial("Zalo", seoTopic)} className="flex-1 hover:text-indigo-600 flex justify-center items-center gap-1 cursor-pointer"><Send className="w-3.5 h-3.5" /> Zalo</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <Sparkles className="w-8 h-8 text-gray-300 animate-pulse mb-2" />
                <p className="text-xs text-gray-400 font-bold">Hãy nhập chủ đề ở cột bên trái và bấm <span className="text-pink-600 font-extrabold">&quot;AI Viết Bài SEO&quot;</span></p>
                <p className="text-[10px] text-gray-400 font-medium max-w-xs mt-1 leading-relaxed">Công cụ Gemini sẽ tự nghiên cứu online để đem lại thông tin thị trường làm đẹp chuẩn xác nhất.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SAVED_ARTICLES SUBTAB */}
      {subTab === "SAVED_ARTICLES" && (
        <div className="space-y-6">
          {isLoadingArticles ? (
            <div className="flex justify-center items-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
          ) : savedArticles.length === 0 ? (
            <div className="bg-white p-12 text-center border border-gray-100 rounded-2xl shadow-sm text-gray-400 flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-gray-200 mb-2" />
              <p className="text-xs font-bold">Trống lịch sử!</p>
              <p className="text-[10px] font-medium leading-relaxed max-w-sm mt-1">Chưa có bài viết SEO AI nào được lưu trữ. Bạn có thể sang thẻ &quot;Sáng tạo AI SEO 🪄&quot; để soạn và lưu một bài.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start font-semibold">
              {/* Left Column: List details */}
              <div className="lg:col-span-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">Kho Bài Viết ({savedArticles.length})</h4>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {savedArticles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => {
                        setSelectedArticle(art);
                        setEditTitle(art.topic);
                        setEditContent(art.article);
                        setIsEditingSavedArticle(false);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        selectedArticle?.id === art.id
                          ? "border-pink-500 bg-pink-50/20 shadow-sm"
                          : "border-gray-100 hover:bg-gray-50/50"
                      }`}
                    >
                      {art.imageUrl ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
                          <Image src={art.imageUrl} alt="preview" fill className="object-cover" sizes="48px" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate leading-snug">{art.topic}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Từ khóa phụ: {art.keywords || "không có"}</p>
                        <div className="flex justify-between items-center text-[9px] text-gray-400 font-semibold pt-1">
                          <span>{format(new Date(art.createdAt), "dd/MM/yyyy")}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePublishSavedToBlog(art); }}
                              disabled={publishingBlogId === art.id}
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50/50 transition-colors cursor-pointer disabled:opacity-40"
                              title="Đăng lên Blog"
                            >
                              {publishingBlogId === art.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                              )}
                            </button>
                            {userRole === 'ADMIN' && (
                              <button
                                onClick={(e) => handleDeleteArticle(art.id, e)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50/50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Detailed Reader and Editor */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                {selectedArticle ? (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4 border-b pb-3 border-gray-100">
                      <div className="min-w-0">
                        <span className="text-[9px] font-extrabold uppercase bg-pink-100 text-pink-650 px-2 py-0.5 rounded font-mono">
                          BÀI VIẾT ĐÃ LƯU KHO
                        </span>
                        {isEditingSavedArticle ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full mt-1.5 p-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800"
                          />
                        ) : (
                          <h3 className="text-sm font-bold text-gray-900 mt-1 lines-clamp-2 leading-snug">{selectedArticle.topic}</h3>
                        )}
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5 flex items-center gap-1">
                          Khởi tạo: {format(new Date(selectedArticle.createdAt), "dd/MM/yyyy HH:mm")}.
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {isEditingSavedArticle ? (
                          <>
                            <button
                              onClick={handleUpdateSavedArticle}
                              className="text-[10px] font-bold bg-[#5C4033] hover:bg-[#3A2E2B] text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Lưu Thay Đổi
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingSavedArticle(false);
                                setEditTitle(selectedArticle.topic);
                                setEditContent(selectedArticle.article);
                              }}
                              className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Huỷ bỏ
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => copyToClipboard(selectedArticle.article, "copy-exist")}
                              className="text-[10px] font-bold bg-pink-50 hover:bg-pink-100 text-pink-600 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              {copiedIndex === "copy-exist" ? "✓ Đã copy" : "Copy"}
                            </button>
                            <button
                              onClick={() => handlePublishSavedToBlog(selectedArticle)}
                              disabled={publishingBlogId === selectedArticle.id}
                              className="text-[10px] font-bold bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                            >
                              {publishingBlogId === selectedArticle.id ? "Đang đăng..." : "Đăng lên Blog"}
                            </button>
                            <button
                              onClick={() => setIsEditingSavedArticle(true)}
                              className="text-[10px] font-bold bg-gray-100 hover:bg-gray-205 text-gray-750 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Sửa bài
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Image visualizer */}
                    {selectedArticle.imageUrl && (
                      <div className="relative aspect-video max-h-48 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 w-full">
                        <Image src={selectedArticle.imageUrl} alt="visual banner" fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" />
                      </div>
                    )}

                    {/* Body Content */}
                    {isEditingSavedArticle ? (
                      <textarea
                        rows={12}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-gray-850 resize-none leading-relaxed"
                      />
                    ) : (
                      <div className="p-5 bg-gray-50 border border-gray-150 rounded-xl max-h-80 overflow-y-auto font-sans leading-relaxed text-xs text-gray-700 whitespace-pre-wrap">
                        {selectedArticle.article}
                      </div>
                    )}

                    {/* Social Media Sharing Panel */}
                    {!isEditingSavedArticle && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Đẩy nhanh lên Mạng xã hội</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShareToSocial("Facebook", selectedArticle.topic)}
                            className="flex-1 bg-white hover:bg-blue-50 border border-gray-200 py-2.5 px-3 rounded-lg text-[10px] font-bold text-blue-700 flex justify-center items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Facebook className="w-3.5 h-3.5" /> Share FB
                          </button>
                          <button
                            onClick={() => handleShareToSocial("Twitter", selectedArticle.topic)}
                            className="flex-1 bg-white hover:bg-sky-50 border border-gray-200 py-2.5 px-3 rounded-lg text-[10px] font-bold text-sky-700 flex justify-center items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Twitter className="w-3.5 h-3.5" /> Share TW
                          </button>
                          <button
                            onClick={() => handleShareToSocial("Zalo", selectedArticle.topic)}
                            className="flex-1 bg-white hover:bg-indigo-50 border border-gray-200 py-2.5 px-3 rounded-lg text-[10px] font-bold text-indigo-700 flex justify-center items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" /> Share Zalo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <FileText className="w-10 h-10 text-gray-200 mb-2 animate-pulse" />
                    <p className="text-xs text-gray-400 font-bold">Chưa chọn bài viết</p>
                    <p className="text-[10px] text-gray-400 font-semibold max-w-xs mt-1">Chọn một bài viết ở danh sách bên trái để đọc, chỉnh sửa nội dung hoặc đẩy chia sẻ lên mạng xã hội.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AUTO SEO SUBTAB */}
      {subTab === "AUTO_SEO" && <TabAutoSEO />}

      {/* BANNER SUBTAB */}
      {subTab === "BANNER" && (
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
      )}
    </div>
  );
}
