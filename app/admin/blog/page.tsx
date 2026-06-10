'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  getBlogPosts, 
  saveBlogPost, 
  deleteBlogPost, 
  getCurrentSessionUser 
} from '../../blog/actions';
import { 
  BookOpen, Plus, Edit3, Trash2, ArrowLeft, ArrowRight, 
  Sparkles, Globe, Key, CheckCircle, AlertTriangle, Info, Image as ImageIcon,
  Bold, Italic, Link2
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import BottomNavigation from '@/components/BottomNavigation';
import { toast, Toaster } from 'sonner';

export default function AdminBlogPage() {
  const router = useRouter();
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Blog management states
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref to content textarea for rich format insertion
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // SEO target keywords & checks
  const SEO_KEYWORDS = [
    { text: "gội dưỡng sinh Thủ Đức", label: "Gội dưỡng sinh Thủ Đức" },
    { text: "làm móng Lavita Charm", label: "Làm móng Lavita Charm" },
    { text: "sơn gel Trường Thọ", label: "Sơn gel Trường Thọ" },
    { text: "Min Nail & Hair", label: "Min Nail & Hair" }
  ];

  // Helper to generate slug from title input
  const slugify = (text: string) => {
    return text
      .toString()
      .normalize('NFD') // splits accented characters into base and diacritics
      .replace(/[\u0300-\u036f]/g, '') // removes diacritics
      .toLowerCase()
      .trim()
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '') // keeps alphanumerics, spaces, hyphens
      .replace(/\s+/g, '-') // replaces spaces with hyphens
      .replace(/-+/g, '-'); // removes duplicate hyphens
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!editingId) {
      setSlug(slugify(val));
    }
  };

  // Check auth and load posts on mount
  useEffect(() => {
    async function initPage() {
      try {
        setCheckingAuth(true);
        const user = await getCurrentSessionUser();
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
          router.push('/login');
          return;
        }
        setCurrentUser(user);
        setCheckingAuth(false);

        await loadPosts();
      } catch (err: any) {
        setError('Lỗi phân quyền bài viết hoặc phiên làm việc đã quá hạn.');
        setCheckingAuth(false);
      }
    }
    initPage();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getBlogPosts();
      setPosts(data);
    } catch (e: any) {
      setError('Lỗi khi tải danh sách bài viết từ database.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setSummary('');
    setContent('');
    setImageUrl('');
    setError('');
  };

  const handleEdit = (post: any) => {
    setEditingId(post.id);
    setTitle(post.title || '');
    setSlug(post.slug || '');
    setSummary(post.summary || '');
    setContent(post.content || '');
    setImageUrl(post.image_url || '');
    setError('');
    setSuccess('');
    
    // Scroll to form smoothly
    const formEl = document.getElementById('blog-editor-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const applyFormat = (type: 'bold' | 'italic' | 'link' | 'h2' | 'h3') => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        replacement = `**${selectedText || 'chữ đậm'}**`;
        cursorOffset = selectedText ? replacement.length : 2;
        break;
      case 'italic':
        replacement = `*${selectedText || 'chữ nghiêng'}*`;
        cursorOffset = selectedText ? replacement.length : 1;
        break;
      case 'link':
        replacement = `[${selectedText || 'tên liên kết'}](url)`;
        cursorOffset = selectedText ? replacement.length : 1;
        break;
      case 'h2':
        replacement = `\n## ${selectedText || 'Tiêu đề lớn'}\n`;
        cursorOffset = selectedText ? replacement.length : 4;
        break;
      case 'h3':
        replacement = `\n### ${selectedText || 'Tiêu đề nhỏ'}\n`;
        cursorOffset = selectedText ? replacement.length : 5;
        break;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setContent(newValue);

    // Focus & set selection back
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !summary.trim() || !content.trim()) {
      const errMsg = 'Vui lòng điền đầy đủ các thông tin bắt buộc.';
      setError(errMsg);
      toast.error(errMsg);
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await saveBlogPost({
        id: editingId || undefined,
        title,
        slug,
        summary,
        content,
        image_url: imageUrl
      });

      if (res.success) {
        const msg = editingId ? 'Cập nhật bài viết thành công!' : 'Đã đăng bài viết mới thành công!';
        setSuccess(msg);
        toast.success(msg, {
          description: editingId ? 'Bài viết đã được cập nhật thành công lên website.' : 'Bài viết mới đã được hiển thị công khai trên phần tin tức.',
          duration: 4000,
        });
        resetForm();
        await loadPosts();
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Có lỗi xảy ra khi lưu bài viết.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, postTitle: string) => {
    if (currentUser?.role !== 'ADMIN') {
      const errMsg = 'Bạn không có quyền xóa bài viết (Chỉ ADMIN mới được xóa).';
      setError(errMsg);
      toast.error(errMsg);
      return;
    }

    if (!confirm(`Bạn chắc chắn muốn xóa bài viết "${postTitle}"? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await deleteBlogPost(id);
      if (res.success) {
        const msg = 'Đã xóa bài viết thành công!';
        setSuccess(msg);
        toast.success(msg, {
          description: `Đã loại bỏ vĩnh viễn bài viết "${postTitle}" khỏi hệ thống.`,
          duration: 4000,
        });
        await loadPosts();
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Lỗi khi xóa bài viết.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // SEO Assistant Check Statuses
  const checkKeywordPresent = (keyword: string) => {
    const textLower = (title + ' ' + summary + ' ' + content).toLowerCase();
    return textLower.includes(keyword.toLowerCase());
  };

  const checkBacklinkPresent = () => {
    return content.includes('/booking');
  };

  const getWordCount = () => {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  };

  if (checkingAuth) {
    return (
      <div className="flex md:h-screen items-center justify-center bg-[#FAF6F0]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#8D6E53] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest animate-pulse">Đang xác thực bảo mật...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#3A2E2B] font-sans pb-12">
      <Toaster position="top-right" richColors />
      {/* Top Banner Administration navbar */}
      <nav className="sticky top-0 z-50 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#EADDCD] px-4 py-4 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={currentUser?.role === 'ADMIN' ? '/admin' : '/staff'} className="p-2 border border-[#EADDCD] rounded-full hover:bg-stone-50 transition-colors">
              <ArrowLeft className="w-4 h-4 text-[#8D6E53]" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg tracking-wider text-[#3A2E2B] uppercase">PHÂN HỆ BLOG &amp; SEO</span>
                <span className="bg-[#8D6E53] text-[9px] text-[#FAF6F0] px-2 py-0.5 rounded-full font-bold uppercase">WorkSpace</span>
              </div>
              <p className="text-[11px] text-[#8D6E53] font-medium font-mono lowercase">Hệ thống tạo bài viết chuẩn SEO tối ưu hóa tìm kiếm Google</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-white px-4 py-2 rounded-2xl border border-[#EADDCD]/60 self-start md:self-auto text-xs font-bold">
            <span className="text-gray-500">Tài khoản:</span>
            <span className="text-[#3A2E2B]">{currentUser?.username || 'Chưa nhận diện'}</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] tracking-wide font-black uppercase text-white ${
              currentUser?.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-teal-600'
            }`}>
              {currentUser?.role === 'ADMIN' ? 'ADMIN 👑' : 'MANAGER 🛡️'}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-8">
        
        {/* Global Notifications Alert boxes */}
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

        {/* Section 1: Split Layout Editor vs SEO Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="blog-editor-form">
          
          {/* Main Form Area (Left) */}
          <div className="lg:col-span-8 bg-white rounded-2xl md:rounded-3xl border border-[#EADDCD]/80 px-4 sm:px-6 md:p-8 py-5 md:py-8 space-y-6 shadow-sm max-w-full break-words mb-8">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-base font-bold text-[#5C4033] flex items-center gap-2 uppercase tracking-wider">
                <BookOpen className="w-5 h-5 text-[#8D6E53]" /> 
                {editingId ? 'Chỉnh sửa bài viết cũ' : 'Soạn thảo bài viết mới chuẩn SEO'}
              </h2>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="text-xs text-rose-600 hover:underline px-3 py-1.5 border border-rose-200 hover:bg-rose-50 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Xủy bỏ Chỉnh sửa / Viết bài mới
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="block font-black text-stone-700 tracking-wide uppercase">Tiêu đề bài viết <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Ví dụ: Bí Quyết Gội Dưỡng Sinh Thủ Đức Thư Giãn"
                    required
                    className="w-full bg-[#FAF6F0] border-2 border-[#EADDCD] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]/50 text-stone-900 font-semibold"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="block font-black text-stone-700 tracking-wide uppercase flex items-center justify-between">
                    <span>Đường dẫn (Slug) <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-stone-400 italic">Tự sinh nhạy bén</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder="bi-quyet-goi-duong-sinh-thu-duc"
                      required
                      className="w-full bg-[#FAF6F0] border-2 border-[#EADDCD] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]/50 text-[#8D6E53] font-bold font-mono"
                    />
                    <span className="absolute right-3.5 top-3.5 text-[10px] text-stone-400 font-mono">.html</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block font-black text-stone-700 tracking-wide uppercase">Đoạn tóm tắt (Meta Description) <span className="text-rose-500">*</span></label>
                  <span className={`text-[10px] font-bold ${
                    summary.length >= 100 && summary.length <= 160 ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {summary.length} ký tự (Khuyên dùng: 100 - 160)
                  </span>
                </div>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Viết đoạn giới thiệu ngắn (summary) bắt mắt chứa từ khóa chính, đoạn này sẽ hiển thị ở thẻ mô tả khi chia sẻ link lên Facebook, Zalo, Google..."
                  rows={2}
                  maxLength={250}
                  required
                  className="w-full bg-[#FAF6F0] border-2 border-[#EADDCD] rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]/50 text-stone-900 font-medium"
                />
              </div>

              {/* Image URL */}
              <div className="space-y-1.5">
                <label className="block font-black text-stone-700 tracking-wide uppercase">Ảnh đại diện (Image URL)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-stone-400">
                    <ImageIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800..."
                    className="w-full bg-[#FAF6F0] border-2 border-[#EADDCD] rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]/50 text-stone-800 font-semibold text-[11px]"
                  />
                </div>
              </div>

              {/* Content Textarea */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block font-black text-stone-700 tracking-wide uppercase">Nội dung bài viết (Hỗ trợ tiêu đề ##, ### &amp; liên kết) <span className="text-rose-500">*</span></label>
                  <span className="text-stone-400 font-mono text-[10px] font-bold">Trạng thái: Đang soạn thảo...</span>
                </div>
                <div className="bg-[#FAF0E6] p-2.5 rounded-2xl text-[10px] text-stone-600 space-y-1 font-semibold leading-relaxed border border-[#EADDCD]/50">
                  <span className="text-[#8D6E53] font-bold">💡 Mẹo viết nhanh:</span>
                  <p>Sử dụng dòng cách đôi <strong className="text-stone-800">&quot;\n\n&quot;</strong> để ngắt đoạn. Gõ <code className="bg-white/80 p-0.5 rounded">## Tên Tiêu Đề</code> hoặc <code className="bg-white/85 p-0.5 rounded">### Tiêu Đề Nhỏ hơn</code> để làm mục lục. Gõ liên kết dạng <code className="bg-white/80 p-0.5 rounded">[Booking](/booking)</code>.</p>
                </div>

                {/* Rich Formatting Toolbar - Sticky */}
                <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#FAF6F0]/95 backdrop-blur-md rounded-2xl border-2 border-[#EADDCD] text-[11px] font-bold text-stone-700 sticky top-[75px] md:top-[83px] z-30 shadow-sm transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => applyFormat('bold')}
                    className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-[#8D6E53] hover:text-white border border-[#EADDCD]/60 rounded-xl shadow-xs cursor-pointer transition-all"
                    title="In đậm chữ (Ctrl+B)"
                  >
                    <Bold className="w-3.5 h-3.5 text-[#8D6E53]" />
                    <span>In Đậm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('italic')}
                    className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-[#8D6E53] hover:text-white border border-[#EADDCD]/60 rounded-xl shadow-xs cursor-pointer transition-all"
                    title="In nghiêng chữ (Ctrl+I)"
                  >
                    <Italic className="w-3.5 h-3.5 text-[#8D6E53]" />
                    <span>In Nghiêng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('link')}
                    className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-[#8D6E53] hover:text-white border border-[#EADDCD]/60 rounded-xl shadow-xs cursor-pointer transition-all"
                    title="Chèn liên kết"
                  >
                    <Link2 className="w-3.5 h-3.5 text-[#8D6E53]" />
                    <span>Chèn Link</span>
                  </button>
                  <div className="w-[1px] h-5 bg-[#EADDCD] mx-1"></div>
                  <button
                    type="button"
                    onClick={() => applyFormat('h2')}
                    className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-[#8D6E53] hover:text-white border border-[#EADDCD]/60 rounded-xl shadow-xs cursor-pointer transition-all"
                    title="Tiêu đề to H2"
                  >
                    <span className="font-mono text-xs text-[#8D6E53]">H2</span>
                    <span>Tiêu Đề H2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('h3')}
                    className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-[#8D6E53] hover:text-white border border-[#EADDCD]/60 rounded-xl shadow-xs cursor-pointer transition-all"
                    title="Tiêu đề vừa H3"
                  >
                    <span className="font-mono text-xs text-[#8D6E53]">H3</span>
                    <span>Tiêu Đề H3</span>
                  </button>
                </div>

                {/* Grid Side-by-Side Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  {/* Left Workspace: Input Textarea */}
                  <div className="lg:col-span-9 h-full min-h-[350px]">
                    <textarea
                      ref={contentRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Nhập nội dung đầy đủ của bài viết của bạn tại đây..."
                      rows={14}
                      required
                      className="w-full h-full min-h-[350px] bg-[#FAF6F0] border-2 border-[#EADDCD] rounded-3xl p-5 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]/50 text-stone-900 font-medium leading-relaxed font-sans text-xs"
                    />
                  </div>

                  {/* Right Workspace: Live Word Counter & Standard SEO Monitor */}
                  <div className="lg:col-span-3 bg-[#FAF0E6]/60 border-2 border-[#EADDCD] rounded-3xl p-4 flex flex-col justify-between space-y-4">
                    {/* Metrics Panel */}
                    <div className="space-y-3.5">
                      <p className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Trình đếm từ trực tiếp</p>
                      
                      <div className="space-y-1">
                        <div className="text-3xl font-mono font-black text-[#8D6E53] tracking-tight">
                          {getWordCount()} <span className="text-xs font-sans text-stone-500 font-bold">từ</span>
                        </div>
                        <p className="text-[10px] text-stone-400 font-bold font-mono">Khoảng {content.length} ký tự</p>
                      </div>

                      {/* Quality Rating Check */}
                      <div className="pt-1.5">
                        {getWordCount() === 0 ? (
                          <span className="text-[10px] font-black uppercase rounded-lg px-2.5 py-1 bg-stone-100 text-stone-500 border border-stone-200">
                            Chưa nhập dữ liệu
                          </span>
                        ) : getWordCount() < 100 ? (
                          <span className="text-[10px] font-black uppercase rounded-lg px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 inline-block">
                            Quá ngắn (Cần &gt;100 từ)
                          </span>
                        ) : getWordCount() < 300 ? (
                          <span className="text-[10px] font-black uppercase rounded-lg px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 inline-block">
                            Khá tốt ✓
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase rounded-lg px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-250 inline-block">
                            Tối ưu xuất sắc ★
                          </span>
                        )}
                      </div>
                    </div>

                    {/* SEO checklist indicators */}
                    <div className="border-t border-[#EADDCD]/85 pt-3.5 space-y-2.5 text-[11px] font-bold text-stone-600">
                      <div className="flex justify-between items-center">
                        <span>Thời lượng đọc:</span>
                        <span className="font-mono text-stone-800">
                          ~{Math.max(1, Math.ceil(getWordCount() / 200))} phút
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Tiêu đề phụ:</span>
                        <span className={(content.includes('##') || content.includes('###')) ? 'text-emerald-600' : 'text-amber-600 font-medium'}>
                          {(content.includes('##') || content.includes('###')) ? 'Đạt chuẩn (H2/H3) ✓' : 'Chưa có H2/H3 ✗'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Đường liên kết:</span>
                        <span className={content.includes('[') && content.includes(']') ? 'text-emerald-600' : 'text-amber-600 font-medium'}>
                          {content.includes('[') && content.includes(']') ? 'Đã liên kết link ✓' : 'Chưa chèn link ✗'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4.5 bg-[#8D6E53] hover:bg-[#5C4033] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-[98%] cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>💾 ĐĂNG / LƯU BÀI VIẾT LÊN HỆ THỐNG</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* SEO Assistant Panel Sidebar (Right) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border-2 border-[#EADDCD] p-6 shadow-sm space-y-6">
            <div className="border-b pb-3 flex items-center gap-2">
              <div className="p-1 bg-[#8D6E53]/10 text-[#8D6E53] rounded-lg">
                <Sparkles className="w-5 h-5 text-amber-500 animate-[pulse_2s_infinite]" />
              </div>
              <div>
                <h3 className="font-display font-black text-[#5C4033] tracking-wide uppercase text-xs">TRỢ LÝ GỢI Ý SEO</h3>
                <span className="text-[10px] text-stone-400 block -mt-1 font-mono font-bold">SEO Realtime Checker</span>
              </div>
            </div>

            {/* Keyword checker list */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Từ khóa địa phương khuyên dùng 📍</p>
              
              <div className="space-y-2.5">
                {SEO_KEYWORDS.map((k, index) => {
                  const isPresent = checkKeywordPresent(k.text);
                  return (
                    <div 
                      key={index} 
                      className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                        isPresent 
                          ? 'bg-emerald-50/50 border-emerald-300 text-emerald-800 font-bold' 
                          : 'bg-stone-50 border-stone-205 text-stone-500 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        {isPresent ? (
                          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[11px] font-black font-sans shrink-0">
                            ✓
                          </div>
                        ) : (
                          <div className="w-5 h-5 bg-stone-200 rounded-full flex items-center justify-center text-stone-400 text-xs shrink-0 font-sans">
                            ?
                          </div>
                        )}
                        <span className="line-clamp-1">{k.label}</span>
                      </div>
                      
                      <span className="text-[10px] tracking-wider font-mono uppercase bg-white px-2 py-0.5 rounded-lg border">
                        {isPresent ? 'ĐÃ CHÈN' : 'CHƯA CÓ'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Internal link / Backlink check */}
            <div className="space-y-3.5 border-t pt-4">
              <p className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Kiểm tra lèn liên kết nội bộ 🔗</p>
              
              {checkBacklinkPresent() ? (
                <div className="p-3 bg-emerald-500/5 border border-emerald-300 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Lập Chỉ Mục Hoàn Hảo!</span>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    Hệ thống đã nhận diện được đường dẫn liên kết nội bộ <strong className="text-pink-600">/booking</strong>. Điều này giúp tối ưu hóa lượt đặt phòng gội &amp; làm móng vượt trội!
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-500/5 border-2 border-amber-300 rounded-2xl text-xs space-y-1.5 animate-pulse">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
                    <span>Thiếu Backlink Đặt Lịch!</span>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    Hãy chèn cụm từ đặt lịch ví dụ: <code className="bg-white/80 px-1 py-0.5 rounded text-amber-700">[Booking](/booking)</code> vào nội dung để nhắc nhở khách hàng đặt ca nhé!
                  </p>
                </div>
              )}
            </div>

            {/* General Advice and recommendation */}
            <div className="space-y-3.5 border-t pt-4 text-xs font-medium text-stone-600 space-y-2">
              <p className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Chỉ số SEO tổng thể 📈</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span>Trạng thái độ dài:</span>
                  <span className={getWordCount() >= 100 ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                    {getWordCount() >= 100 ? 'Đạt chuẩn (~150 từ)' : 'Cần viết thêm...'}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Thẻ Meta ảnh minh họa:</span>
                  <span className={imageUrl ? 'text-emerald-700 font-bold' : 'text-[#8D6E53]'}>
                    {imageUrl ? 'Đã bật ✓' : 'Mặc định tệp có sẵn'}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Section 2: List of Existing Articles */}
        <div className="bg-white rounded-3xl border border-[#EADDCD]/80 p-6 md:p-8 space-y-6 shadow-sm">
          <div className="border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#5C4033] uppercase tracking-wider">Danh sách bài viết hiện tại ({posts.length})</h2>
              <p className="text-xs text-stone-500 font-medium">Bấm chỉnh sửa để sửa đổi từng bài viết, hoặc xóa (chỉ áp dụng với tài khoản admin)</p>
            </div>
            <button 
              onClick={loadPosts}
              className="text-xs font-bold text-[#8D6E53] hover:text-[#5C4033] px-3.5 py-2 border border-[#EADDCD] rounded-xl hover:bg-stone-50 cursor-pointer transition-colors"
            >
              🔄 Tải lại bảng tin
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className="w-8 h-8 border-2 border-[#8D6E53] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs">Chưa có bài viết nào trong hệ thống. Hãy soạn và thêm mới nhé!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-black uppercase tracking-wider text-[10px]">
                    <th className="pb-3.5 pl-2 font-black">Bài viết</th>
                    <th className="pb-3.5 font-black">Slug</th>
                    <th className="pb-3.5 font-black">Ngày đăng</th>
                    <th className="pb-3.5 pr-2 text-right font-black">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-semibold text-stone-800">
                  {posts.map((post: any) => (
                    <tr key={post.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="py-4 pl-2 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                          <img
                            src={post.image_url || 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop'}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="max-w-xs md:max-w-md min-w-0">
                          <h4 className="font-bold text-stone-900 truncate" title={post.title}>{post.title}</h4>
                          <p className="text-[10px] text-stone-500 truncate" title={post.summary}>{post.summary}</p>
                        </div>
                      </td>
                      <td className="py-4 font-mono text-[10px] text-[#8D6E53] max-w-[120px] truncate" title={post.slug}>{post.slug}</td>
                      <td className="py-4 text-stone-500 text-[11px] font-mono whitespace-nowrap">
                        {post.created_at ? format(new Date(post.created_at), 'dd-MM-yyyy HH:mm', { locale: vi }) : '--'}
                      </td>
                      <td className="py-2 pr-2 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(post)}
                            className="px-3 py-1.5 bg-[#FAF6F0] text-[#8D6E53] hover:bg-[#8D6E53] hover:text-white border border-[#EADDCD] rounded-xl text-[11px] font-extrabold cursor-pointer transition-all flex items-center gap-1 active:scale-95"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Sửa
                          </button>
                          
                          {/* Hide/Disable delete button if manager */}
                          {currentUser?.role === 'ADMIN' ? (
                            <button
                              onClick={() => handleDelete(post.id, post.title)}
                              className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 rounded-xl text-[11px] font-extrabold cursor-pointer transition-all flex items-center gap-1 active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Xóa
                            </button>
                          ) : (
                            <button
                              disabled
                              title="Tài khoản Quản lý (MANAGER) không được cấp quyền xóa bài viết"
                              className="px-3 py-1.5 bg-stone-100 text-stone-400 border border-stone-200 rounded-xl text-[11px] font-black cursor-not-allowed opacity-50 flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
      <BottomNavigation />
    </div>
  );
}
