'use client'

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, startTransition, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  getBlogPosts, 
  saveBlogPost, 
  deleteBlogPost, 
  getCurrentSessionUser 
} from '../../blog/actions';
import { 
  BookOpen, Edit3, Trash2, ArrowLeft, 
  Sparkles, CheckCircle, AlertTriangle, Image as ImageIcon,
  Link2, Eye,
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Code2,
  WandSparkles, FileText, BarChart3
} from 'lucide-react';
import LinkSuggester from './LinkSuggester';
import AltTextGenerator from './AltTextGenerator';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast, Toaster } from 'sonner';

const BottomNavigation = dynamic(() => import('@/components/BottomNavigation'), { ssr: false });
const BlogRichEditor = dynamic(() => import('@/components/BlogRichEditor'), { ssr: false });

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
  const [imageAlt, setImageAlt] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editorMode, setEditorMode] = useState<'textarea' | 'tiptap'>('textarea');
  const [contentKey, setContentKey] = useState(0);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const wrapWithMarkdown = useCallback((prefix: string, suffix: string = '') => {
    const ta = contentRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = content;
    const selected = text.substring(start, end);
    const replacement = prefix + selected + suffix;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setContent(newContent);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  }, [content]);

  // Convert markdown to HTML for backward compatibility with legacy posts
  const mdToHtml = (md: string) => {
    if (!md) return ''
    if (/<[a-z][\s\S]*>/i.test(md)) return md // already HTML
    return md
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/^[\*\-] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[a-z])/gm, '<p>')
      .replace(/(.+)$/gm, (m) => m.startsWith('<') ? m : m)
      .replace(/<p><\/p>/g, '')
  }

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

  const handleEditorSwitch = useCallback(() => {
    if (editorMode === 'textarea') {
      // Chuyển sang TipTap: convert markdown → HTML nếu cần
      if (!/<[a-z][\s\S]*>/i.test(content)) {
        setContent(mdToHtml(content));
      }
      setContentKey(k => k + 1);
      setEditorMode('tiptap');
    } else {
      setEditorMode('textarea');
    }
  }, [editorMode, content]);

  // SEO target keywords & checks
  const SEO_KEYWORDS = [
    { text: "gội dưỡng sinh Thủ Đức", label: "Gội dưỡng sinh Thủ Đức" },
    { text: "làm móng Lavita Charm", label: "Làm móng Lavita Charm" },
    { text: "sơn gel Trường Thọ", label: "Sơn gel Trường Thọ" },
    { text: "Min Nail & Hair", label: "Min Nail & Hair" }
  ];

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!editingId) {
      setSlug(slugify(val));
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const { posts: data } = await getBlogPosts(1, 50, true);
      setPosts(data);
    } catch {
      setError('Lỗi khi tải danh sách bài viết từ database.');
    } finally {
      setLoading(false);
    }
  };

  // Check auth and load posts on mount
  useEffect(() => {
    async function initPage() {
      try {
        startTransition(() => {
          setCheckingAuth(true);
        });
        const user = await getCurrentSessionUser();
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
          router.push('/login');
          return;
        }
        startTransition(() => {
          setCurrentUser(user);
          setCheckingAuth(false);
        });

        startTransition(() => {
          loadPosts();
        });
      } catch {
        startTransition(() => {
          setError('Lỗi phân quyền bài viết hoặc phiên làm việc đã quá hạn.');
          setCheckingAuth(false);
        });
      }
    }
    initPage();
  }, [router]);

  // AI Assist States
  const [aiTopic, setAiTopic] = useState('');
  const [aiKeywords, setAiKeywords] = useState('');
  const [isAiWriting, setIsAiWriting] = useState(false);
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [isAiSuggestingImages, setIsAiSuggestingImages] = useState(false);

  const handleAiWrite = async () => {
    if (!aiTopic.trim()) { toast.error('Vui lòng nhập chủ đề bài viết!'); return; }
    setIsAiWriting(true);
    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'writeArticle', title: aiTopic, keywords: aiKeywords })
      });
      const data = await res.json();
      if (data.article) {
        setTitle(data.title || aiTopic);
        setContent(mdToHtml(data.article));
        setContentKey(k => k + 1);
        setSummary(data.summary || '');
        if (data.image_alt) setImageAlt(data.image_alt);
        if (!editingId) setSlug(slugify(data.title || aiTopic));
        toast.success('AI đã viết bài thành công!');
      } else {
        toast.error(data.error || 'Lỗi khi AI viết bài');
      }
    } catch { toast.error('Lỗi kết nối dịch vụ AI'); }
    setIsAiWriting(false);
  };

  const handleAiSummarize = async () => {
    if (!content.trim()) { toast.error('Không có nội dung để tóm tắt!'); return; }
    setIsAiSummarizing(true);
    try {
      const textToSummarize = content.replace(/^#\s+.+\n*/m, '').replace(/[*#\[\]()>`\n-]/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 2000);
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'summarize', content: textToSummarize })
      });
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary.substring(0, 250));
        toast.success('Đã tạo tóm tắt!');
      } else {
        toast.error('Lỗi khi tóm tắt');
      }
    } catch { toast.error('Lỗi kết nối dịch vụ AI'); }
    setIsAiSummarizing(false);
  };

  const handleAiSuggestImages = async () => {
    const topic = title || aiTopic;
    if (!topic.trim()) { toast.error('Vui lòng nhập tiêu đề hoặc chủ đề!'); return; }
    setIsAiSuggestingImages(true);
    suggestedImagesRef.current = [];
    setImagesFailed(new Set());
    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggestImages', title: topic })
      });
      const data = await res.json();
      if (data.images && data.images.length > 0) {
        setImageUrl(data.images[0]);
        setSuggestedImages(data.images);
        suggestedImagesRef.current = data.images;
        if (data.imageAlts?.[0]) setImageAlt(data.imageAlts[0]);
        toast.success('Đã gợi ý ảnh!');
      } else {
        toast.error('Không tìm thấy ảnh gợi ý');
      }
    } catch { toast.error('Lỗi kết nối dịch vụ AI'); }
    setIsAiSuggestingImages(false);
  };

  const [suggestedImages, setSuggestedImages] = useState<string[]>([]);
  const [imagesFailed, setImagesFailed] = useState<Set<number>>(new Set());
  const suggestedImagesRef = useRef<string[]>([]);
  const autoSuggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear images when title changes so auto-suggest re-fetches
  useEffect(() => {
    setImagesFailed(new Set());
  }, [title, aiTopic]);

  // Auto-suggest images when title changes
  useEffect(() => {
    if (autoSuggestTimer.current) clearTimeout(autoSuggestTimer.current);
    const t = (title || aiTopic || '').trim();
    if (!t) return;
    autoSuggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/ai-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'suggestImages', title: t }),
        });
        const data = await res.json();
        if (data.images?.length > 0) {
          suggestedImagesRef.current = data.images;
          setSuggestedImages(data.images);
          if (!imageUrl && data.images[0]) startTransition(() => setImageUrl(data.images[0]));
          if (!imageAlt && data.imageAlts?.[0]) startTransition(() => setImageAlt(data.imageAlts[0]));
        }
      } catch { /* silent */ }
    }, 1500);
    return () => { if (autoSuggestTimer.current) clearTimeout(autoSuggestTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, aiTopic, imageUrl]);

  const handleImageError = (idx: number) => {
    setImagesFailed(prev => new Set(prev).add(idx));
  };

  const handleRefreshImages = async () => {
    const t = (title || aiTopic || '').trim();
    if (!t) { toast.error('Vui lòng nhập tiêu đề!'); return; }
    setSuggestedImages([]);
    setImagesFailed(new Set());
    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggestImages', title: t }),
      });
      const data = await res.json();
      if (data.images?.length > 0) {
        setSuggestedImages(data.images);
        if (data.images[0]) startTransition(() => setImageUrl(data.images[0]));
        if (data.imageAlts?.[0]) startTransition(() => setImageAlt(data.imageAlts[0]));
        toast.success('Đã làm mới ảnh gợi ý!');
      } else {
        toast.error('Không tìm thấy ảnh gợi ý');
      }
    } catch { toast.error('Lỗi kết nối'); }
  };

  // Auto-save draft to localStorage (debounced 3s)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      const draft = { title, slug, summary, content, imageUrl, imageAlt, editingId };
      try {
        localStorage.setItem('blog_draft', JSON.stringify(draft));
      } catch { /* storage full */ }
    }, 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [title, slug, summary, content, imageUrl, imageAlt, editingId]);

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('blog_draft');
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.title || draft.content) {
          toast('Bạn có bản nháp chưa lưu', {
            description: `"${draft.title || '(không tiêu đề)'}" — nhấn Khôi phục để tiếp tục.`,
            duration: 8000,
            action: {
              label: 'Khôi phục',
              onClick: () => {
                setTitle(draft.title || '');
                setSlug(draft.slug || '');
                setSummary(draft.summary || '');
                setContent(draft.content || '');
                setImageUrl(draft.imageUrl || '');
                setImageAlt(draft.imageAlt || '');
                setEditingId(draft.editingId || null);
              }
            }
          });
        }
      }
    } catch { /* invalid json */ }
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setSummary('');
    setContent('');
    setImageUrl('');
    setImageAlt('');
    setKeywords('');
    setSuggestedImages([]);
    setIsPublished(false);
    setError('');
  };

  const handleEdit = (post: any) => {
    setEditingId(post.id);
    setTitle(post.title || '');
    setSlug(post.slug || '');
    setSummary(post.summary || '');
    setContent(mdToHtml(post.content || ''));
    setContentKey(k => k + 1);
    setImageUrl(post.image_url || '');
    setImageAlt(post.image_alt || '');
    setKeywords(post.keywords || '');
    setIsPublished(post.published !== false);
    setError('');
    setSuccess('');
    
    // Scroll to form smoothly
    const formEl = document.getElementById('blog-editor-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
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
        image_url: imageUrl,
        image_alt: imageAlt,
        keywords,
        published: isPublished
      });

      if (res.success) {
        const msg = editingId ? 'Cập nhật bài viết thành công!' : 'Đã đăng bài viết mới thành công!';
        setSuccess(msg);
        toast.success(msg, {
          description: editingId ? 'Bài viết đã được cập nhật thành công lên website.' : 'Bài viết mới đã được hiển thị công khai trên phần tin tức.',
          duration: 4000,
        });
        localStorage.removeItem('blog_draft');
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
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text ? text.split(/\s+/).filter(Boolean).length : 0;
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
         <div className="max-w-7xl xxl:max-w-[1500px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          <div className="flex items-center gap-2">
            <Link
              href="/admin/blog-analytics"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#EADDCD] rounded-xl text-[11px] font-black text-[#8D6E53] hover:bg-[#8D6E53] hover:text-white transition-all uppercase tracking-wider min-h-[44px]"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </Link>
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

       <main className="max-w-7xl xxl:max-w-[1500px] mx-auto px-4 md:px-8 mt-8 space-y-8">
        
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
                  className="text-xs text-rose-600 hover:underline px-3 py-2.5 border border-rose-200 hover:bg-rose-50 rounded-xl font-bold cursor-pointer transition-colors min-h-[44px] flex items-center"
                >
                  Xủy bỏ Chỉnh sửa / Viết bài mới
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label htmlFor="blog-title" className="block font-black text-stone-700 tracking-wide uppercase">Tiêu đề bài viết <span className="text-rose-500">*</span></label>
                  <input
                    id="blog-title"
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
                  <label htmlFor="blog-slug" className="block font-black text-stone-700 tracking-wide uppercase flex items-center justify-between">
                    <span>Đường dẫn (Slug) <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-stone-400 italic">Tự sinh nhạy bén</span>
                  </label>
                  <div className="relative">
                    <input
                      id="blog-slug"
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
                  <label htmlFor="blog-summary" className="block font-black text-stone-700 tracking-wide uppercase">Đoạn tóm tắt (Meta Description) <span className="text-rose-500">*</span></label>
                  <span className={`text-[10px] font-bold ${
                    summary.length >= 100 && summary.length <= 160 ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {summary.length} ký tự (Khuyên dùng: 100 - 160)
                  </span>
                </div>
                <textarea
                  id="blog-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Viết đoạn giới thiệu ngắn (summary) bắt mắt chứa từ khóa chính, đoạn này sẽ hiển thị ở thẻ mô tả khi chia sẻ link lên Facebook, Zalo, Google..."
                  rows={2}
                  maxLength={250}
                  required
                  className="w-full bg-[#FAF6F0] border-2 border-[#EADDCD] rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]/50 text-stone-900 font-medium"
                />
              </div>

              {/* Keywords */}
              <div className="space-y-1.5">
                <label htmlFor="blog-keywords" className="block font-black text-stone-700 tracking-wide uppercase">Từ khóa SEO (Keywords)</label>
                <input
                  id="blog-keywords"
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="gội dưỡng sinh, làm móng, nail art Thủ Đức, ..."
                  className="w-full bg-[#FAF6F0] border-2 border-[#EADDCD] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]/50 text-stone-900 font-medium text-xs"
                />
                <p className="text-[10px] text-stone-400 font-medium">Các từ khóa cách nhau bằng dấu phẩy, sẽ được thêm vào Schema BlogPosting.</p>
              </div>

              {/* Image URL */}
              <div className="space-y-1.5">
                <label htmlFor="blog-imageUrl" className="block font-black text-stone-700 tracking-wide uppercase">Ảnh đại diện (Image URL)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-stone-400">
                    <ImageIcon className="w-4 h-4" />
                  </span>
                  <input
                    id="blog-imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800..."
                    className="w-full bg-[#FAF6F0] border-2 border-[#EADDCD] rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]/50 text-stone-800 font-semibold text-[11px]"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 pt-1 min-h-[3.5rem]">
                  {Array.from({ length: 4 }).map((_, idx) => {
                    const img = suggestedImages[idx];
                    const isSelected = img && imageUrl === img;
                    const hasFailed = imagesFailed.has(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => { if (img && !hasFailed) setImageUrl(img); }}
                        disabled={!img || hasFailed}
                        className={`shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex items-center justify-center ${
                          isSelected && !hasFailed
                            ? 'border-purple-500 ring-2 ring-purple-300'
                            : img && !hasFailed
                              ? 'border-[#EADDCD] hover:border-[#8D6E53]'
                              : 'border-dashed border-gray-300 bg-gray-50 cursor-default'
                        }`}
                      >
                        {img && !hasFailed ? (
                          <Image
                            src={img}
                            alt={`gợi ý ${idx + 1}`}
                            width={80}
                            height={56}
                            className="w-full h-full object-cover"
                            unoptimized
                            onError={() => handleImageError(idx)}
                          />
                        ) : (
                          <span className="text-[18px] text-gray-300 font-light leading-none">+</span>
                        )}
                      </button>
                    );
                  })}
                  {suggestedImages.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRefreshImages}
                      className="shrink-0 w-20 h-14 rounded-xl border-2 border-dashed border-[#EADDCD] hover:border-[#8D6E53] bg-[#FAF6F0] flex items-center justify-center transition-all cursor-pointer"
                      title="Làm mới ảnh gợi ý"
                    >
                      <svg className="w-5 h-5 text-[#8D6E53]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Image Alt Text */}
              <div className="space-y-1.5">
                <label htmlFor="blog-imageAlt" className="block font-black text-stone-700 tracking-wide uppercase">Mô tả ảnh (Alt Text) <span className="text-[10px] font-medium text-stone-400 normal-case">— hỗ trợ SEO</span></label>
                <input
                  id="blog-imageAlt"
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Ví dụ: Dịch vụ gội đầu dưỡng sinh thảo dược thư giãn tại Min Nail & Hair"
                  maxLength={500}
                  className="w-full bg-[#FAF6F0] border-2 border-[#EADDCD] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]/50 text-stone-900 font-medium"
                />
                <p className="text-[10px] text-stone-400 font-medium">Mô tả ngắn 5-10 từ, chứa từ khóa chính. Hiển thị khi ảnh không tải được và giúp Google hiểu nội dung ảnh.</p>
              </div>

              {/* AI Alt Text Generator */}
              <AltTextGenerator imageUrl={imageUrl} currentAlt={imageAlt} onSetAlt={setImageAlt} title={title || aiTopic} />

              {/* Content Editor */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block font-black text-stone-700 tracking-wide uppercase">Nội dung bài viết <span className="text-rose-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 font-mono text-[10px] font-bold">{editorMode === 'tiptap' ? 'HTML Editor' : 'Text Editor'}</span>
                    <button
                      type="button"
                      onClick={handleEditorSwitch}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer min-h-[32px] ${
                        editorMode === 'tiptap'
                          ? 'bg-[#8D6E53] text-white border-[#8D6E53]'
                          : 'bg-white text-stone-600 border-[#EADDCD] hover:border-[#8D6E53]'
                      }`}
                    >
                      {editorMode === 'tiptap' ? '✕ Dùng Text Editor' : '⚡ Chuyển sang HTML Editor'}
                    </button>
                  </div>
                </div>

                {/* AI Assist Toolbar */}
                <div className="flex flex-wrap items-center gap-2 p-2.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 text-[11px] font-bold">
                  <WandSparkles className="w-4 h-4 text-purple-600 inline-block align-middle" />
                  <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider mr-1 align-middle">AI:</span>

                  <div className="inline-flex items-center gap-1.5 bg-white rounded-xl px-2 py-1.5 border border-purple-200">
                    <input type="text" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="Chủ đề bài viết..." className="w-28 md:w-40 bg-transparent outline-none text-[11px] font-semibold text-stone-800 placeholder-stone-400" />
                    <input type="text" value={aiKeywords} onChange={(e) => setAiKeywords(e.target.value)} placeholder="Từ khóa phụ..." className="w-20 md:w-32 bg-transparent outline-none text-[11px] font-semibold text-stone-400 placeholder-stone-300 hidden md:inline-block" />
                  </div>

                  <button type="button" onClick={handleAiWrite} disabled={isAiWriting} className="px-3 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer transition-all min-h-[44px]">
                    {isAiWriting ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span> : <WandSparkles className="w-3 h-3 inline-block" />} Viết Bài
                  </button>

                  <button type="button" onClick={handleAiSummarize} disabled={isAiSummarizing} className="px-3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer transition-all min-h-[44px]">
                    {isAiSummarizing ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span> : <FileText className="w-3 h-3 inline-block" />} Tóm Tắt
                  </button>

                  <button type="button" onClick={handleAiSuggestImages} disabled={isAiSuggestingImages} className="px-3 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer transition-all min-h-[44px]">
                    {isAiSuggestingImages ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span> : <ImageIcon className="w-3 h-3 inline-block" />} Gợi Ý Ảnh
                  </button>

                  <button type="button" onClick={() => { if (title) { setSlug(slugify(title)); toast.success('Đã sinh slug từ tiêu đề!'); } else { toast.error('Chưa có tiêu đề!'); } }} className="px-3 py-2.5 bg-stone-600 hover:bg-stone-700 text-white rounded-xl text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all min-h-[44px]">
                    <Link2 className="w-3 h-3 inline-block" /> Sinh Slug
                  </button>
                </div>

                {editorMode === 'tiptap' ? (
                  <BlogRichEditor
                    key={contentKey}
                    content={content}
                    onChange={setContent}
                    placeholder="Nhập nội dung bài viết của bạn tại đây..."
                  />
                ) : (
                  <div className="space-y-1">
                    {/* Markdown Formatting Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 p-2 bg-[#FAF6F0] rounded-2xl border-2 border-[#EADDCD]">
                      <button type="button" onClick={() => wrapWithMarkdown('**', '**')} title="In đậm" className="px-2.5 py-2 min-h-[36px] min-w-[36px] rounded-xl border border-[#EADDCD]/60 bg-white text-stone-700 hover:bg-[#8D6E53] hover:text-white transition-all cursor-pointer flex items-center justify-center"><Bold className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => wrapWithMarkdown('*', '*')} title="In nghiêng" className="px-2.5 py-2 min-h-[36px] min-w-[36px] rounded-xl border border-[#EADDCD]/60 bg-white text-stone-700 hover:bg-[#8D6E53] hover:text-white transition-all cursor-pointer flex items-center justify-center"><Italic className="w-3.5 h-3.5" /></button>
                      <span className="w-px h-5 bg-[#EADDCD] mx-0.5 inline-block" />
                      <button type="button" onClick={() => wrapWithMarkdown('## ', '')} title="Tiêu đề H2" className="px-2.5 py-2 min-h-[36px] min-w-[36px] rounded-xl border border-[#EADDCD]/60 bg-white text-stone-700 hover:bg-[#8D6E53] hover:text-white transition-all cursor-pointer flex items-center justify-center"><Heading2 className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => wrapWithMarkdown('### ', '')} title="Tiêu đề H3" className="px-2.5 py-2 min-h-[36px] min-w-[36px] rounded-xl border border-[#EADDCD]/60 bg-white text-stone-700 hover:bg-[#8D6E53] hover:text-white transition-all cursor-pointer flex items-center justify-center"><Heading3 className="w-3.5 h-3.5" /></button>
                      <span className="w-px h-5 bg-[#EADDCD] mx-0.5 inline-block" />
                      <button type="button" onClick={() => wrapWithMarkdown('- ')} title="Danh sách" className="px-2.5 py-2 min-h-[36px] min-w-[36px] rounded-xl border border-[#EADDCD]/60 bg-white text-stone-700 hover:bg-[#8D6E53] hover:text-white transition-all cursor-pointer flex items-center justify-center"><List className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => wrapWithMarkdown('1. ')} title="Danh sách số" className="px-2.5 py-2 min-h-[36px] min-w-[36px] rounded-xl border border-[#EADDCD]/60 bg-white text-stone-700 hover:bg-[#8D6E53] hover:text-white transition-all cursor-pointer flex items-center justify-center"><ListOrdered className="w-3.5 h-3.5" /></button>
                      <span className="w-px h-5 bg-[#EADDCD] mx-0.5 inline-block" />
                      <button type="button" onClick={() => wrapWithMarkdown('> ')} title="Trích dẫn" className="px-2.5 py-2 min-h-[36px] min-w-[36px] rounded-xl border border-[#EADDCD]/60 bg-white text-stone-700 hover:bg-[#8D6E53] hover:text-white transition-all cursor-pointer flex items-center justify-center"><Quote className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => wrapWithMarkdown('`', '`')} title="Code" className="px-2.5 py-2 min-h-[36px] min-w-[36px] rounded-xl border border-[#EADDCD]/60 bg-white text-stone-700 hover:bg-[#8D6E53] hover:text-white transition-all cursor-pointer flex items-center justify-center"><Code2 className="w-3.5 h-3.5" /></button>
                      <span className="w-px h-5 bg-[#EADDCD] mx-0.5 inline-block" />
                      <button type="button" onClick={() => {
                        const url = window.prompt('Nhập URL:');
                        if (url) wrapWithMarkdown('[', `](${url})`);
                      }} title="Chèn link" className="px-2.5 py-2 min-h-[36px] min-w-[36px] rounded-xl border border-[#EADDCD]/60 bg-white text-stone-700 hover:bg-[#8D6E53] hover:text-white transition-all cursor-pointer flex items-center justify-center"><Link2 className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => {
                        const url = window.prompt('Nhập URL ảnh:');
                        if (url) wrapWithMarkdown(`![${title || 'image'}](${url})`);
                      }} title="Chèn ảnh" className="px-2.5 py-2 min-h-[36px] min-w-[36px] rounded-xl border border-[#EADDCD]/60 bg-white text-stone-700 hover:bg-[#8D6E53] hover:text-white transition-all cursor-pointer flex items-center justify-center"><ImageIcon className="w-3.5 h-3.5" /></button>
                    </div>
                    <textarea
                      id="blog-content"
                      ref={contentRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={`Nhập nội dung bài viết tại đây...\n\nHỗ trợ Markdown:\n## Tiêu đề H2\n### Tiêu đề H3\n**In đậm** *In nghiêng*\n- Danh sách\n[Link text](url)\n> Trích dẫn`}
                      rows={18}
                      required
                      className="w-full bg-[#FAF6F0] border-2 border-[#EADDCD] rounded-3xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]/50 text-stone-900 font-medium text-sm leading-relaxed font-mono"
                    />
                  </div>
                )}

                {/* Word Count & SEO Metrics Bar */}
                <div className="flex flex-wrap items-center gap-4 p-4 bg-[#FAF0E6]/60 border-2 border-[#EADDCD] rounded-3xl">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-mono font-black text-[#8D6E53]">{getWordCount()}</span>
                    <span className="text-[10px] font-bold text-stone-500">từ</span>
                    <span className="text-[10px] text-stone-400 font-mono">({content.length} ký tự)</span>
                  </div>
                  <div className="w-px h-8 bg-[#EADDCD]" />
                  <span className="text-[10px] font-bold text-stone-500">~{Math.max(1, Math.ceil(getWordCount() / 200))} phút đọc</span>
                  <div className="w-px h-8 bg-[#EADDCD]" />
                  {getWordCount() === 0 ? (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-stone-100 text-stone-500 rounded-lg">Chưa nhập</span>
                  ) : getWordCount() < 100 ? (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg">Quá ngắn (Cần &gt;100 từ)</span>
                  ) : getWordCount() < 300 ? (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg">Khá tốt ✓</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">Tối ưu ★</span>
                  )}
                  <div className="w-px h-8 bg-[#EADDCD]" />
                  <span className="text-[10px] font-bold text-stone-500">H2/H3: <span className={content.includes('<h2') || content.includes('<h3') ? 'text-emerald-600' : 'text-amber-600'}>
                    {content.includes('<h2') || content.includes('<h3') ? 'Có ✓' : 'Chưa có ✗'}
                  </span></span>
                  <div className="w-px h-8 bg-[#EADDCD]" />
                  <span className="text-[10px] font-bold text-stone-500">Link: <span className={content.includes('<a ') ? 'text-emerald-600' : 'text-amber-600'}>
                    {content.includes('<a ') ? 'Có ✓' : 'Chưa có ✗'}
                  </span></span>
                </div>
              </div>

              {/* Published toggle */}
              <div className="flex items-center justify-between p-4 bg-[#FAF6F0] rounded-2xl border-2 border-[#EADDCD]">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-stone-700 uppercase tracking-wide">Trạng thái bài viết</span>
                  <p className="text-[10px] text-stone-500 font-medium">{isPublished ? 'Bài viết sẽ hiển thị công khai ngay sau khi lưu.' : 'Bài viết được lưu dưới dạng nháp, chỉ admin mới thấy.'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isPublished ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPublished ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  disabled={!content.trim()}
                  className="flex-1 py-4.5 bg-white border-2 border-[#EADDCD] text-[#5C4033] rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-[98%] cursor-pointer flex items-center justify-center gap-2 min-h-[44px] hover:bg-[#FAF6F0] disabled:opacity-40"
                >
                  <Eye className="w-4 h-4" /> Xem trước
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-4.5 bg-[#8D6E53] hover:bg-[#5C4033] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-[98%] cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
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

            {/* Internal Link Suggester */}
            <div className="border-t pt-4">
              <LinkSuggester currentId={editingId} keywords={keywords} />
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
              className="text-xs font-bold text-[#8D6E53] hover:text-[#5C4033] px-3.5 py-2 border border-[#EADDCD] rounded-xl hover:bg-stone-50 cursor-pointer transition-colors min-h-[44px] flex items-center"
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
              <table className="w-full text-left border-collapse text-xs font-sans">
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
                        <div className="w-12 h-12 relative rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                          <Image
                            src={post.image_url || 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop'}
                            alt={post.image_alt || post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="max-w-xs md:max-w-md min-w-0">
                          <h4 className="font-bold text-stone-900 truncate flex items-center gap-2" title={post.title}>
                            {post.title}
                            {post.published === false && (
                              <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded tracking-wider">Nháp</span>
                            )}
                            {post.published !== false && (
                              <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded tracking-wider">Đã đăng</span>
                            )}
                          </h4>
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
                            className="px-3 py-2.5 bg-[#FAF6F0] text-[#8D6E53] hover:bg-[#8D6E53] hover:text-white border border-[#EADDCD] rounded-xl text-[11px] font-extrabold cursor-pointer transition-all flex items-center gap-1 active:scale-95 min-h-[44px]"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Sửa
                          </button>
                          
                          {/* Hide/Disable delete button if manager */}
                          {currentUser?.role === 'ADMIN' ? (
                            <button
                              onClick={() => handleDelete(post.id, post.title)}
                              className="px-3 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 rounded-xl text-[11px] font-extrabold cursor-pointer transition-all flex items-center gap-1 active:scale-95 min-h-[44px]"
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

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-start justify-center overflow-y-auto p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-3xl max-w-3xl w-full my-8 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#EADDCD] px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-sm font-black text-[#5C4033] uppercase tracking-wider">Xem trước bài viết</h2>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-stone-100 rounded-xl cursor-pointer transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              {imageUrl && (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-100">
                  <Image src={imageUrl} alt={imageAlt || title} fill className="object-cover" unoptimized />
                </div>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-[#3A2E2B] leading-tight">{title || '(Chưa có tiêu đề)'}</h1>
              {summary && (
                <p className="text-sm text-stone-500 leading-relaxed font-medium">{summary}</p>
              )}
              <div className="prose prose-stone max-w-none text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content || '<p class="text-stone-400 italic">(Chưa có nội dung)</p>' }}
              />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-[#EADDCD] px-6 py-4 flex justify-end">
              <button onClick={() => setShowPreview(false)} className="px-6 py-2.5 bg-[#5C4033] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors hover:bg-[#3A2E2B]">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
