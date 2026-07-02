'use client'

import { useState, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  getSeoArticles, saveSeoArticle, deleteSeoArticle, publishSeoArticleToBlog,
} from '../actions';
import {
  Edit3, Trash2, ArrowLeft,
  CheckCircle, AlertTriangle, FileText, Globe,
  Sparkles, Send,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function AdminSeoArticlesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [status, setStatus] = useState('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishingBlogId, setPublishingBlogId] = useState<string | null>(null);

  const loadArticles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSeoArticles();
      setArticles(data || []);
    } catch {
      setError('Lỗi khi tải danh sách bài viết SEO.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function initPage() {
      try {
        startTransition(() => setCheckingAuth(true));
        const { getCurrentSessionUser } = await import('../../blog/actions');
        const user = await getCurrentSessionUser();
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
          router.push('/login');
          return;
        }
        startTransition(() => {
          setCurrentUser(user);
          setCheckingAuth(false);
        });
        startTransition(() => loadArticles());
      } catch {
        startTransition(() => {
          setError('Lỗi phân quyền hoặc phiên làm việc đã quá hạn.');
          setCheckingAuth(false);
        });
      }
    }
    initPage();
  }, [router]);

  const resetForm = () => {
    setEditingId(null);
    setTopic('');
    setKeywords('');
    setContent('');
    setImageUrl('');
    setImageAlt('');
    setStatus('draft');
    setError('');
  };

  const handleEdit = (article: any) => {
    setEditingId(article.id);
    setTopic(article.topic || '');
    setKeywords(article.keywords || '');
    setContent(article.article || '');
    setImageUrl(article.imageUrl || '');
    setImageAlt(article.imageAlt || '');
    setStatus(article.status || 'draft');
    setError('');
    setSuccess('');
    const formEl = document.getElementById('seo-editor-form');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !content.trim()) {
      const errMsg = 'Vui lòng nhập chủ đề và nội dung bài viết.';
      setError(errMsg);
      toast.error(errMsg);
      return;
    }
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const now = new Date().toISOString();
      const res = await saveSeoArticle({
        id: editingId || undefined,
        topic,
        keywords,
        article: content,
        image_url: imageUrl,
        imageAlt,
        status,
        createdAt: editingId ? undefined : now,
      });
      if (res.success) {
        const msg = editingId ? 'Cập nhật bài viết SEO thành công!' : 'Đã lưu bài viết SEO mới!';
        setSuccess(msg);
        toast.success(msg);
        resetForm();
        await loadArticles();
      } else {
        throw new Error(res.error || 'Lỗi khi lưu');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Có lỗi xảy ra khi lưu bài viết.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, articleTopic: string) => {
    if (currentUser?.role !== 'ADMIN') {
      toast.error('Chỉ ADMIN mới được xóa bài viết.');
      return;
    }
    if (!confirm(`Xóa vĩnh viễn bài viết "${articleTopic}"?`)) return;
    setLoading(true);
    try {
      const res = await deleteSeoArticle(id);
      if (res.success) {
        toast.success(`Đã xóa bài viết "${articleTopic}"`);
        await loadArticles();
      }
    } catch {
      toast.error('Lỗi khi xóa bài viết');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToBlog = async (article: any) => {
    const suggestedTitle = article.article.match(/^#\s+(.+)/m)?.[1]?.trim()
      || article.article.split('\n').find((l: string) => l.trim().startsWith('## '))?.replace(/^##\s+/, '').trim()
      || article.topic
      || 'Bài viết SEO';
    const suggestedSlug = suggestedTitle
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim().replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    const customSlug = window.prompt('Nhập slug (đường dẫn) cho bài viết:', suggestedSlug);
    if (!customSlug) return;
    setPublishingBlogId(article.id);
    try {
      const res = await publishSeoArticleToBlog(article.article, article.imageUrl ?? '', {
        slug: customSlug, title: suggestedTitle,
        keywords: article.keywords,
      });
      if (res.success) {
        toast.success('Đã đăng bài lên Blog!');
        window.open('/blog/' + res.slug, '_blank');
      } else {
        toast.error('Lỗi: ' + res.error);
      }
    } catch {
      toast.error('Lỗi hệ thống khi đăng bài');
    }
    setPublishingBlogId(null);
  };

  if (checkingAuth) {
    return (
      <div className="flex md:h-screen items-center justify-center bg-[#FAF6F0]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#8D6E53] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest animate-pulse">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#3A2E2B] font-sans pb-12">
      <Toaster position="top-right" richColors />
      <nav className="sticky top-0 z-50 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#EADDCD] px-4 py-4 md:px-8 shadow-sm">
        <div className="max-w-7xl xxl:max-w-[1500px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 border border-[#EADDCD] rounded-full hover:bg-stone-50 transition-colors">
              <ArrowLeft className="w-4 h-4 text-[#8D6E53]" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg tracking-wider text-[#3A2E2B] uppercase">QUẢN LÝ BÀI VIẾT SEO</span>
                <span className="bg-[#8D6E53] text-[9px] text-[#FAF6F0] px-2 py-0.5 rounded-full font-bold uppercase">Kho</span>
              </div>
              <p className="text-[11px] text-[#8D6E53] font-medium font-mono lowercase">Quản lý bài viết SEO đã lưu — soạn, sửa, xóa, đăng lên blog</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 bg-white px-4 py-2 rounded-2xl border border-[#EADDCD]/60 self-start md:self-auto text-xs font-bold">
            <span className="text-gray-500">Tài khoản:</span>
            <span className="text-[#3A2E2B]">{currentUser?.username || '...'}</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] tracking-wide font-black uppercase text-white ${
              currentUser?.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-teal-600'
            }`}>
              {currentUser?.role === 'ADMIN' ? 'ADMIN' : 'MANAGER'}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl xxl:max-w-[1500px] mx-auto px-4 md:px-8 mt-8 space-y-8">
        {error && (
          <div className="p-4 bg-rose-50 border-2 border-rose-200 text-rose-800 rounded-3xl flex items-start gap-2.5 text-xs font-semibold shadow-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 rounded-3xl flex items-start gap-2.5 text-xs font-semibold shadow-sm">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="seo-editor-form">
          <div className="lg:col-span-8 bg-white rounded-2xl md:rounded-3xl border border-[#EADDCD]/80 px-4 sm:px-6 md:p-8 py-5 md:py-8 space-y-6 shadow-sm max-w-full break-words mb-8">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-base font-bold text-[#5C4033] flex items-center gap-2 uppercase tracking-wider">
                <Globe className="w-5 h-5 text-[#8D6E53]" />
                {editingId ? 'Chỉnh sửa bài viết SEO' : 'Thêm bài viết SEO mới'}
              </h2>
              {editingId && (
                <button onClick={resetForm}
                  className="text-xs text-rose-600 hover:underline px-3 py-2.5 border border-rose-200 hover:bg-rose-50 rounded-xl font-bold cursor-pointer transition-colors min-h-[44px]"
                >
                  Hủy / Viết mới
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-black text-stone-700 tracking-wide uppercase">Chủ đề <span className="text-rose-500">*</span></label>
                  <input type="text" value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ví dụ: Cách chăm sóc tóc tại nhà"
                    required
                    className="w-full bg-[#FAF6F0] border-2 border-[#EADDCD] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]/50 text-stone-900 font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-black text-stone-700 tracking-wide uppercase">Từ khóa SEO</label>
                  <input type="text" value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="gội dưỡng sinh, làm móng, ..."
                    className="w-full bg-[#FAF6F0] border-2 border-[#EADDCD] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]/50 text-stone-900 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-black text-stone-700 tracking-wide uppercase">Ảnh đại diện (URL)</label>
                <input type="url" value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-[#FAF6F0] border-2 border-[#EADDCD] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]/50 text-stone-800 font-semibold text-[11px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-black text-stone-700 tracking-wide uppercase">Mô tả ảnh (Alt Text)</label>
                <input type="text" value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Mô tả ngắn cho ảnh, hỗ trợ SEO"
                  className="w-full bg-[#FAF6F0] border-2 border-[#EADDCD] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]/50 text-stone-900 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-black text-stone-700 tracking-wide uppercase">Nội dung (Markdown) <span className="text-rose-500">*</span></label>
                <textarea value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`# Tiêu đề bài viết\n\nNội dung...\n\n## Tiêu đề phụ\n- Mục 1\n- Mục 2`}
                  rows={16}
                  required
                  className="w-full bg-[#FAF6F0] border-2 border-[#EADDCD] rounded-3xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]/50 text-stone-900 font-medium text-sm leading-relaxed font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-[#FAF6F0] rounded-2xl border-2 border-[#EADDCD]">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-stone-700 uppercase tracking-wide">Trạng thái</span>
                  <p className="text-[10px] text-stone-500 font-medium">{status === 'published' ? 'Bài viết đã xuất bản' : 'Bài viết đang ở trạng thái nháp'}</p>
                </div>
                <button type="button" onClick={() => setStatus(status === 'published' ? 'draft' : 'published')}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    status === 'published' ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${status === 'published' ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isSubmitting}
                  className="w-full py-4.5 bg-[#8D6E53] hover:bg-[#5C4033] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-[98%] cursor-pointer flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> LƯU BÀI VIẾT SEO</>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-4 bg-white rounded-3xl border-2 border-[#EADDCD] p-6 shadow-sm space-y-4">
            <div className="border-b pb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-display font-black text-[#5C4033] tracking-wide uppercase text-xs">HƯỚNG DẪN</h3>
            </div>
            <div className="text-[11px] text-stone-600 font-medium space-y-3 leading-relaxed">
              <p>Viết nội dung bằng Markdown để dễ dàng xuất bản lên Blog.</p>
              <p>Sử dụng <code className="bg-stone-100 px-1 rounded"># Tiêu đề</code> cho H1, <code className="bg-stone-100 px-1 rounded">## Tiêu đề</code> cho H2.</p>
              <p>Thêm từ khóa chính vào tiêu đề và rải đều trong nội dung.</p>
              <p>Sau khi lưu, bạn có thể đăng bài viết lên Blog bằng nút <strong>Đăng Blog</strong> ở danh sách bên dưới.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#EADDCD]/80 p-6 md:p-8 space-y-6 shadow-sm">
          <div className="border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#5C4033] uppercase tracking-wider">Kho bài viết SEO ({articles.length})</h2>
              <p className="text-xs text-stone-500 font-medium">Danh sách bài viết đã lưu. Bấm để chỉnh sửa, xóa hoặc đăng lên Blog.</p>
            </div>
            <button onClick={loadArticles}
              className="text-xs font-bold text-[#8D6E53] hover:text-[#5C4033] px-3.5 py-2 border border-[#EADDCD] rounded-xl hover:bg-stone-50 cursor-pointer transition-colors min-h-[44px]"
            >
              Tải lại
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className="w-8 h-8 border-2 border-[#8D6E53] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs">Chưa có bài viết SEO nào. Hãy tạo bài viết mới ở trên.</div>
          ) : (
            <div className="space-y-3">
              {articles.map((art) => (
                <div key={art.id}
                  className="p-4 rounded-2xl border border-[#EADDCD] hover:border-[#8D6E53]/30 transition-all flex items-start gap-4"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200 relative">
                    {art.imageUrl ? (
                      <Image src={art.imageUrl} alt={art.imageAlt || art.topic} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-stone-900 truncate">{art.topic}</h4>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider shrink-0 ${
                        art.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {art.status === 'published' ? 'Đã XB' : 'Nháp'}
                      </span>
                      {art.blogSlug && (
                        <span className="text-[9px] font-black uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded tracking-wider shrink-0">
                          Đã đăng Blog
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">{art.keywords}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {format(new Date(art.createdAt), 'dd-MM-yyyy HH:mm', { locale: vi })}
                      {art.topicSource === 'auto_seo' && <span className="ml-2 text-[#8D6E53] font-bold">(Auto SEO)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!art.blogSlug && (
                      <button onClick={() => handlePublishToBlog(art)} disabled={publishingBlogId === art.id}
                        className="px-3 py-2.5 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 rounded-xl text-[11px] font-extrabold cursor-pointer transition-all min-h-[44px] disabled:opacity-50"
                        title="Đăng lên Blog"
                      >
                        {publishingBlogId === art.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <button onClick={() => handleEdit(art)}
                      className="px-3 py-2.5 bg-[#FAF6F0] text-[#8D6E53] hover:bg-[#8D6E53] hover:text-white border border-[#EADDCD] rounded-xl text-[11px] font-extrabold cursor-pointer transition-all min-h-[44px]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {currentUser?.role === 'ADMIN' && (
                      <button onClick={() => handleDelete(art.id, art.topic)}
                        className="px-3 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 rounded-xl text-[11px] font-extrabold cursor-pointer transition-all min-h-[44px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
