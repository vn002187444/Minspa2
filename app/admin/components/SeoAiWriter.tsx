'use client'

import { useState } from "react";
import Image from "next/image";
import { Sparkles, Search, PenTool, ImageIcon, Globe, Facebook, Twitter, Send } from "lucide-react";
import { saveSeoArticle, publishSeoArticleToBlog } from "../actions";

export default function SeoAiWriter() {
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
  const seoImageAlt = seoTopic ? seoTopic.substring(0, 100) : '';

  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [isPublishingBlog, setIsPublishingBlog] = useState(false);

  const toSlug = (text: string) =>
    text
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim().replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const showToast = (message: string) => {
    const el = document.createElement("div");
    el.className = "fixed bottom-6 right-6 z-50 bg-gray-900 border border-gray-800 text-white text-[11px] font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce";
    el.innerHTML = `<svg class="w-4 h-4 text-pink-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"/></svg><span style="margin-left:8px">${message}</span>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const copyToClipboard = (text: string, labelId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(labelId);
    setTimeout(() => setCopiedIndex(null), 2000);
    showToast("Đã chép nội dung vào Clipboard!");
  };

  const handleShareToSocial = (platform: string, topicText: string) => {
    const url = encodeURIComponent(window.location.origin + '/blog/');
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
        image_url: seoImageUrl || "",
        image_alt: seoImageAlt
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
      const res = await publishSeoArticleToBlog(seoArticleText, seoImageUrl, { slug: customSlug, title: suggestedTitle, keywords: seoKeywords, image_alt: seoImageAlt });
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

  return (
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
            {/* SEO Image Alt display */}
            {seoImageUrl && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mô tả ảnh SEO (Alt text)</label>
                <p className="text-xs text-gray-700 font-medium">{seoImageAlt || 'Chưa có mô tả ảnh'}</p>
                <p className="text-[9px] text-gray-400 mt-1">Alt text tự động sinh từ chủ đề bài viết, giúp SEO hình ảnh.</p>
              </div>
            )}
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
  );
}
