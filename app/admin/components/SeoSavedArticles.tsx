'use client'

import { useState, useEffect, useCallback, startTransition } from "react";
import { format } from "date-fns";
import Image from "next/image";
import { FileText, Facebook, Twitter, Send, Trash2 } from "lucide-react";
import { getSeoArticles, saveSeoArticle, deleteSeoArticle, publishSeoArticleToBlog } from "../actions";

export default function SeoSavedArticles({ userRole }: { userRole: string }) {
  const [savedArticles, setSavedArticles] = useState<any[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [isEditingSavedArticle, setIsEditingSavedArticle] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editKeywords, setEditKeywords] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImageAlt, setEditImageAlt] = useState("");

  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [publishingBlogId, setPublishingBlogId] = useState<string | null>(null);

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
    loadSavedArticles();
  }, [loadSavedArticles]);

  const handlePublishSavedToBlog = async (art: { id: string; topic?: string; article: string; imageUrl?: string | null; imageAlt?: string; keywords?: string }) => {
    const suggestedTitle = art.article.match(/^#\s+(.+)/m)?.[1]?.trim()
      || art.article.split('\n').find(l => l.trim().startsWith('## '))?.replace(/^##\s+/, '').trim()
      || art.topic
      || 'Bài viết SEO';
    const suggestedSlug = toSlug(suggestedTitle);
    const customSlug = window.prompt('Nhập slug (đường dẫn) cho bài viết:', suggestedSlug);
    if (!customSlug) return;
    setPublishingBlogId(art.id);
    try {
      const res = await publishSeoArticleToBlog(art.article, art.imageUrl ?? '', { slug: customSlug, title: suggestedTitle, keywords: art.keywords, image_alt: art.imageAlt });
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
        keywords: editKeywords,
        article: editContent,
        image_url: editImageUrl,
        image_alt: editImageAlt,
      });
      if (res.success) {
        showToast("Cập nhật bài viết thành công!");
        setSelectedArticle({ ...selectedArticle, topic: editTitle, keywords: editKeywords, article: editContent, imageUrl: editImageUrl, imageAlt: editImageAlt });
        setIsEditingSavedArticle(false);
        loadSavedArticles();
      } else {
        showToast("Lỗi khi cập nhật bài viết");
      }
    } catch {
      showToast("Lỗi hệ thống khi lưu");
    }
  };

  return (
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
                    setEditKeywords(art.keywords || '');
                    setEditImageUrl(art.imageUrl || '');
                    setEditImageAlt(art.imageAlt || art.image_alt || '');
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
                            setEditKeywords(selectedArticle.keywords || '');
                            setEditImageUrl(selectedArticle.imageUrl || '');
                            setEditImageAlt(selectedArticle.imageAlt || selectedArticle.image_alt || '');
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
                    <Image src={selectedArticle.imageUrl} alt={selectedArticle.imageAlt || selectedArticle.image_alt || 'visual banner'} fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" />
                  </div>
                )}
                {!isEditingSavedArticle && (selectedArticle.imageAlt || selectedArticle.image_alt) && (
                  <p className="text-[10px] text-gray-400 font-medium italic">
                    Alt: {selectedArticle.imageAlt || selectedArticle.image_alt}
                  </p>
                )}

                {/* Body Content */}
                {isEditingSavedArticle ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tiêu đề</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Từ khóa phụ</label>
                      <input
                        type="text"
                        value={editKeywords}
                        onChange={(e) => setEditKeywords(e.target.value)}
                        placeholder="từ khóa 1, từ khóa 2, ..."
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">URL ảnh đại diện</label>
                      <input
                        type="text"
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800"
                      />
                      {editImageUrl && (
                        <div className="relative aspect-video max-h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 mt-2">
                          <Image src={editImageUrl} alt="preview" fill className="object-cover" sizes="200px" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mô tả ảnh (Alt text)</label>
                      <input
                        type="text"
                        value={editImageAlt}
                        onChange={(e) => setEditImageAlt(e.target.value)}
                        placeholder="Mô tả ngắn về ảnh cho SEO"
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800"
                      />
                      <p className="text-[9px] text-gray-400 mt-1">Alt text giúp SEO hình ảnh và accessibility.</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nội dung (Markdown)</label>
                      <textarea
                        rows={12}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-gray-850 resize-none leading-relaxed"
                      />
                    </div>
                  </div>
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
  );
}
