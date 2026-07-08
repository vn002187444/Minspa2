'use client'
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getDashboardData, getStaffs, createStaff, getServices, saveService, getReviews, getCommissionReport } from '@/app/admin/actions';
import { PenTool, User, PlusCircle, DollarSign, Star, Search, Globe, Sparkles, Share2, FileText, Send, Facebook, Twitter, Image as ImageIcon } from 'lucide-react';

export default function ManagementTab() {
  const [subTab, setSubTab] = useState<"SEO_AI" | "STAFF_MGMT" | "SERVICE_MGMT" | "COMMISSIONS" | "REVIEWS">("SEO_AI");
  const [overview, setOverview] = useState<any>(null);
  const [_loading, setLoading] = useState(false);

  // SEO states
  const [seoTopic, setSeoTopic] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [seoResearchText, setSeoResearchText] = useState("");
  const [seoResearchSources, setSeoResearchSources] = useState<any[]>([]);
  const [seoArticleText, setSeoArticleText] = useState("");
  const [seoImagePrompt, setSeoImagePrompt] = useState("");
  const [seoImageUrl, setSeoImageUrl] = useState("");
  const [seoImageMethod, setSeoImageMethod] = useState("");
  const [isResearchLoading, setIsResearchLoading] = useState(false);
  const [isArticleLoading, setIsArticleLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Staff States
  const [staffs, setStaffs] = useState<any[]>([]);
  const [newStaff, setNewStaff] = useState({ fullName: "", cccd: "", username: "", password: "", role: "STAFF" });
  const [staffMsg, setStaffMsg] = useState({ type: "", text: "" });

  // Service States
  const [services, setServices] = useState<any[]>([]);
  const [newService, setNewService] = useState({ name: "", price: 100000, duration: 30, category: "Móng", description: "" });
  const [serviceMsg, setServiceMsg] = useState({ type: "", text: "" });

  // Reports States
  const [commissionReport, setCommissionReport] = useState<any[]>([]);
  const [dbReviews, setDbReviews] = useState<any[]>([]);

  useEffect(() => {
    async function initMgmt() {
      setLoading(true);
      try {
        const ov = await getDashboardData();
        setOverview(ov || null);

        const st = await getStaffs();
        setStaffs(st || []);

        const sv = await getServices();
        setServices(sv || []);

        const commResult = await getCommissionReport(
          format(new Date(), "yyyy-MM-01"),
          format(new Date(), "yyyy-MM-dd")
        );
        if (commResult && "success" in commResult && commResult.success && commResult.data) {
          setCommissionReport(commResult.data.staffReports || []);
        } else {
          setCommissionReport([]);
        }

        const revs = await getReviews();
        setDbReviews(revs || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    initMgmt();
  }, [subTab]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffMsg({ type: "", text: "" });

    if (!newStaff.fullName || !newStaff.cccd || !newStaff.username || !newStaff.password) {
      return setStaffMsg({ type: "error", text: "Vui lòng nhập đầy đủ thông tin nhân viên" });
    }

    const res = await createStaff(newStaff);
    if (res.success) {
      setStaffMsg({ type: "success", text: "Thêm nhân viên mới thành công!" });
      setNewStaff({ fullName: "", cccd: "", username: "", password: "", role: "STAFF" });
      const st = await getStaffs();
      setStaffs(st);
    } else {
      setStaffMsg({ type: "error", text: "Lỗi: " + res.error });
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceMsg({ type: "", text: "" });

    if (!newService.name || !newService.price) {
      return setServiceMsg({ type: "error", text: "Vui lòng nhập tên và giá dịch vụ" });
    }

    const res = await saveService({
      name: newService.name,
      price: Number(newService.price),
      duration: Number(newService.duration),
      category: newService.category,
      description: newService.description,
      is_active: true
    });

    if (res.success) {
      setServiceMsg({ type: "success", text: "Thêm dịch vụ mới thành công!" });
      setNewService({ name: "", price: 100000, duration: 30, category: "Móng", description: "" });
      const sv = await getServices();
      setServices(sv);
    } else {
      setServiceMsg({ type: "error", text: "Lỗi: " + res.error });
    }
  };

  const handleResearchAI = async () => {
    if (!seoTopic) return toast.error("Vui lòng nhập chủ để cần tìm kiếm nghiên cứu!");
    setIsResearchLoading(true);
    setSeoResearchText("");
    try {
      const res = await fetch("/api/seo-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: seoTopic })
      });
      const data = await res.json();
      if (data.research) {
        setSeoResearchText(data.research);
        setSeoResearchSources(data.sources || []);
      } else {
        setSeoResearchText("Không tìm thấy kết quả nghiên cứu. Vui lòng thử lại.");
      }
    } catch {
      setSeoResearchText("Lỗi tìm kiếm nghiên cứu SEO.");
    }
    setIsResearchLoading(false);
  };

  const handleGenerateArticleAI = async () => {
    if (!seoTopic) return toast.error("Vui lòng nhập chủ để bài viết SEO!");
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
        setSeoArticleText("Có lỗi xảy ra khi tạo bài viết SEO. Vui lòng kiểm tra API key.");
      }
    } catch {
      setSeoArticleText("Có lỗi xảy ra khi gọi dịch vụ tạo bài viết SEO.");
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
      }
    } catch (e) {
      console.error(e);
    }
    setIsImageLoading(false);
  };

  const copyToClipboard = (text: string, labelId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(labelId);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const simulateSocialShare = (platform: string, _content: string) => {
    toast.success(`[MÔ PHỎNG CHIA SẺ] Đã chia sẻ nội dung bài viết lên ${platform} một cách nhanh chóng cùng hashtag #MinNailHair #SEO!`);
  };

  return (
    <div className="space-y-6">
      {overview ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white p-4 rounded-2xl shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFF]/80">Tổng doanh thu tiệm</span>
            <span className="text-xl font-black mt-2">{(overview.stats?.revenue || 0).toLocaleString()}đ</span>
            <span className="text-[10px] text-[#FFF]/70 mt-1">Từ {overview.stats?.completedCount || 0} đơn hoàn tất</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between text-gray-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tỷ lệ đặt lịch giữ chỗ</span>
            <span className="text-xl font-black mt-2">{overview.stats?.appointmentCount || 0} lượt đặt</span>
            <span className="text-[10px] text-emerald-600 font-bold mt-1">Hoạt động sôi nổi</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between text-gray-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tổng thợ & nhân viên</span>
            <span className="text-xl font-black mt-2">{staffs.length} nhân sự</span>
            <span className="text-[10px] text-pink-600 font-semibold mt-1">Hoạt động ổn định</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between text-gray-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tổng số dịch vu hoạt động</span>
            <span className="text-xl font-black mt-2">{services.length} nhóm lớn</span>
            <span className="text-[10px] text-gray-500 mt-1">Đầy đủ các thể loại</span>
          </div>
        </div>
      ) : (
        <div className="animate-pulse bg-gray-50 h-20 rounded-2xl" />
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-gray-100 scrollbar-none">
        {[
          { id: "SEO_AI", label: "Viết Bài SEO AI ✨", icon: PenTool },
          { id: "STAFF_MGMT", label: "Nhân Sự Toàn Tiệm", icon: User },
          { id: "SERVICE_MGMT", label: "Danh Mục Dịch Vụ", icon: PlusCircle },
          { id: "COMMISSIONS", label: "Báo Cáo Hoa Hồng", icon: DollarSign },
          { id: "REVIEWS", label: "Đánh Giá Khách", icon: Star }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id as "SEO_AI" | "STAFF_MGMT" | "SERVICE_MGMT" | "COMMISSIONS" | "REVIEWS")}
className={`py-2 px-4 text-xs font-bold rounded-full transition-all shrink-0 cursor-pointer flex items-center gap-1.5 min-h-[44px] ${
                isActive ? "bg-pink-600 text-white shadow-sm" : "bg-gray-100/80 text-gray-600 hover:bg-gray-250"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {subTab === "SEO_AI" && (
        <div className="space-y-6">
          <div className="bg-pink-50/50 p-5 rounded-2xl border border-pink-100/50 space-y-2">
            <h4 className="text-sm font-bold text-pink-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-600" />
              Công Cụ Hỗ Trợ Tìm Kiếm & Viết Bài SEO bằng AI
            </h4>
            <p className="text-xs text-pink-700 leading-relaxed md:max-w-2xl">
              Nhập chủ đề bạn mong muốn viết (Ví dụ: &quot;gội đầu dưỡng sinh thảo dược&quot;, &quot;xu hướng nails đính đá&quot;). 
              AI sẽ hỗ trợ tìm kiếm nghiên cứu trực tuyến, viết bài viết chuẩn SEO và tạo hình ảnh minh họa tương ứng ngay lập tức!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
              <h5 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Thông tin từ khóa</h5>
              
              <div>
                <label htmlFor="staff-mgmtSeoTopic" className="block text-xs font-bold text-gray-700 mb-1">Chủ đề bài viết / Từ khóa chính</label>
                <input
                  id="staff-mgmtSeoTopic"
                  type="text"
                  value={seoTopic}
                  onChange={(e) => setSeoTopic(e.target.value)}
                  placeholder="Ví dụ: Gội đầu dưỡng sinh trị rụng tóc hiệu quả bằng bồ kết"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold"
                />
              </div>

              <div>
                <label htmlFor="staff-mgmtSeoKeywords" className="block text-xs font-bold text-gray-700 mb-1">Các từ khóa phụ (Phân cách bằng dấu phẩy)</label>
                <input
                  id="staff-mgmtSeoKeywords"
                  type="text"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="bồ kết dưỡng sinh, tiệm gội đầu lavita charm, thư giãn cổ vai gáy"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResearchAI}
                  disabled={isResearchLoading}
                  className="flex-1 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  {isResearchLoading ? "AI Tìm Kiếm..." : "AI Nghiên Cứu Lướt Web"}
                </button>

                <button
                  type="button"
                  onClick={handleGenerateArticleAI}
                  disabled={isArticleLoading}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <PenTool className="w-4 h-4" />
                  {isArticleLoading ? "AI Viết..." : "AI Viết Bài SEO"}
                </button>
              </div>

              {seoResearchText && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5 border-b pb-2 border-gray-200">
                    <Globe className="w-4 h-4 text-blue-500 animate-spin" />
                    Kết Quả Nghiên Cứu Internet Thực Tế
                  </p>
                  <pre className="text-[11px] whitespace-pre-wrap font-sans leading-relaxed text-gray-600 font-medium">
                    {seoResearchText}
                  </pre>
                  {seoResearchSources.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nguồn tham khảo:</p>
                      {seoResearchSources.map((s, idx) => (
                        <div key={idx} className="text-[11px] text-pink-600 truncate flex items-center gap-1">
                          🌐 <a href={s.uri} target="_blank" rel="noopener noreferrer" className="hover:underline font-bold">{s.title || s.uri}</a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-3 border-gray-150">
                <h5 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Bài Viết Hoạt Động & Hình Ảnh</h5>
                {seoArticleText && (
                  <button
                    onClick={() => copyToClipboard(seoArticleText, "copy-art")}
                    className="text-[11px] font-bold bg-pink-50 hover:bg-pink-100 text-pink-600 px-2.5 py-2.5 rounded-lg transition-all min-h-[44px] flex items-center"
                  >
                    {copiedIndex === "copy-art" ? "Copied!" : "Chép Toàn Bộ"}
                  </button>
                )}
              </div>

              {seoArticleText ? (
                <div className="space-y-4">
                  <div className="max-h-96 overflow-y-auto p-4 bg-amber-50/20 rounded-2xl border border-amber-100/50 text-xs text-gray-800 leading-relaxed font-medium space-y-3 select-all">
                    <p className="font-bold text-pink-700 border-b pb-1">BẢN THẢO SEO MARKDOWN</p>
                    <pre className="whitespace-pre-wrap font-sans">{seoArticleText}</pre>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex justify-center items-center gap-1">
                      <Share2 className="w-3.5 h-3.5" />
                      KHU CHIA SẺ NỘI DUNG LÊN MẠNG XÃ HỘI
                    </p>
                    
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => simulateSocialShare("Facebook", seoArticleText)}
                        className="bg-[#1877F2] hover:bg-[#166FE5] text-white p-2.5 rounded-full transition-all flex items-center justify-center shrink-0 active:scale-95"
                        title="Đăng bài lên Facebook"
                      >
                        <Facebook className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => simulateSocialShare("Twitter / X", seoArticleText)}
                        className="bg-black hover:bg-gray-800 text-white p-2.5 rounded-full transition-all flex items-center justify-center shrink-0 active:scale-95"
                        title="Đăng bài lên X"
                      >
                        <Twitter className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => simulateSocialShare("Zalo / Messenger", seoArticleText)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full transition-all flex items-center justify-center shrink-0 active:scale-95"
                        title="Nhắn tin qua Messenger/Zalo"
                      >
                        <Send className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => copyToClipboard(seoArticleText, "copy-snip")}
                        className="bg-gray-200 hover:bg-gray-250 text-gray-700 px-4 py-2 font-bold rounded-full text-[11px] flex items-center justify-center gap-1 shrink-0 transition-all cursor-pointer min-h-[44px]"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {copiedIndex === "copy-snip" ? "Đã chép!" : "Sao chép link bài viết"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-gray-400 text-xs italic font-medium">
                  Sinh bài thiết kế chuẩn SEO sẽ xuất hiện ở đây.
                </div>
              )}

              <div className="border-t pt-5 border-gray-150 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="staff-mgmtSeoImagePrompt" className="block text-xs font-bold text-gray-700">Tạo hình minh họa cho bài viết (Prompt / Từ khóa)</label>
                  <div className="flex gap-2">
                    <input
                      id="staff-mgmtSeoImagePrompt"
                      type="text"
                      value={seoImagePrompt}
                      onChange={(e) => setSeoImagePrompt(e.target.value)}
                      placeholder="VD: Beautiful girl with elegant nail art in salon"
                      className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateImageAI}
                      disabled={isImageLoading}
                      className="bg-gray-900 hover:bg-black text-white px-4 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4" />
                      {isImageLoading ? "Đang Vẽ..." : "Tạo Ảnh AI"}
                    </button>
                  </div>
                </div>

                {seoImageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 space-y-2">
                    <div className="relative aspect-video w-full bg-gray-100">
                      <Image src={seoImageUrl} alt="Seo Illustration" fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" />
                    </div>
                    <div className="p-3 bg-gray-50 text-[10px] flex justify-between items-center text-gray-500 font-semibold">
                      <span>Mô hình: {seoImageMethod === "AI" ? "Gemini Realtime Image" : "Hình Stock Cực Đẹp"}</span>
                      <button
                        onClick={() => copyToClipboard(seoImageUrl, "copy-url")}
                        className="text-pink-600 hover:underline"
                      >
                        {copiedIndex === "copy-url" ? "Có đường dẫn!" : "Sao chép đường dẫn ảnh"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === "STAFF_MGMT" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <form onSubmit={handleCreateStaff} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h5 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Tuyển thợ mới (Không cho phép xóa)</h5>

            {staffMsg.text && (
              <div className={`p-3 rounded-lg text-xs font-semibold ${staffMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {staffMsg.text}
              </div>
            )}

            <div>
              <label htmlFor="staff-mgmtFullName" className="block text-xs font-bold text-gray-500 mb-1">Tên nghệ sĩ thợ / Quản lý</label>
              <input
                id="staff-mgmtFullName"
                type="text"
                value={newStaff.fullName}
                onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                placeholder="VD: Nguyễn Diễm Quỳnh"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label htmlFor="staff-mgmtCccd" className="block text-xs font-bold text-gray-500 mb-1">Cần cước công dân (CCCD)</label>
              <input
                id="staff-mgmtCccd"
                type="text"
                value={newStaff.cccd}
                onChange={(e) => setNewStaff({ ...newStaff, cccd: e.target.value })}
                placeholder="VD: 079198001234"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label htmlFor="staff-mgmtUsername" className="block text-xs font-bold text-gray-500 mb-1">Tài khoản đăng nhập (Username)</label>
              <input
                id="staff-mgmtUsername"
                type="text"
                value={newStaff.username}
                onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                placeholder="VD: diemyquynh"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label htmlFor="staff-mgmtPassword" className="block text-xs font-bold text-gray-500 mb-1">Mật khẩu (Password)</label>
              <input
                id="staff-mgmtPassword"
                type="password"
                value={newStaff.password}
                onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                placeholder="Nhập mật khẩu"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">Vai trò (Role)</label>
              <div className="flex gap-4">
                <label htmlFor="staff-mgmtRoleStaff" className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <input
                    id="staff-mgmtRoleStaff"
                    type="radio"
                    name="role"
                    checked={newStaff.role === "STAFF"}
                    onChange={() => setNewStaff({ ...newStaff, role: "STAFF" })}
                  />
                  Nhân viên thông thường
                </label>
                <label htmlFor="staff-mgmtRoleManager" className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <input
                    id="staff-mgmtRoleManager"
                    type="radio"
                    name="role"
                    checked={newStaff.role === "MANAGER"}
                    onChange={() => setNewStaff({ ...newStaff, role: "MANAGER" })}
                  />
                  Quản lý tiệm (Có đầy đủ quyền quản lý)
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#5C4033] hover:bg-[#3A2E2B] text-white py-3 rounded-xl text-xs font-bold tracking-widest uppercase shadow-sm cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Lưu nhân sự mới
            </button>
          </form>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h5 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Nhân Sự Hiện diện ({staffs.length})</h5>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-1">
              {staffs.map((st) => (
                <div key={st.id} className="py-3 flex justify-between items-center text-xs font-semibold">
                  <div className="space-y-0.5">
                    <p className="text-gray-800">{st.full_name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">CCCD: {st.cccd || "Không có"}</p>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${st.role === "MANAGER" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                      {st.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === "SERVICE_MGMT" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <form onSubmit={handleCreateService} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h5 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Thêm dịch vụ mới (Không được xóa)</h5>

            {serviceMsg.text && (
              <div className={`p-3 rounded-lg text-xs font-semibold ${serviceMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {serviceMsg.text}
              </div>
            )}

            <div>
              <label htmlFor="staff-mgmtSvcName" className="block text-xs font-bold text-gray-500 mb-1">Tên nhóm dịch vụ chi tiết</label>
              <input
                id="staff-mgmtSvcName"
                type="text"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                placeholder="VD: Combo Chà Gót Sen Hồng & Gội Đầu Thảo Dược H2"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label htmlFor="staff-mgmtSvcPrice" className="block text-xs font-bold text-gray-500 mb-1">Đơn giá niêm yết (VNĐ)</label>
              <input
                id="staff-mgmtSvcPrice"
                type="number"
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label htmlFor="staff-mgmtSvcDuration" className="block text-xs font-bold text-gray-500 mb-1">Thời gian thi công thực tế (Phút)</label>
              <input
                id="staff-mgmtSvcDuration"
                type="number"
                value={newService.duration}
                onChange={(e) => setNewService({ ...newService, duration: Number(e.target.value) })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label htmlFor="staff-mgmtSvcCategory" className="block text-xs font-bold text-gray-500 mb-2">Chuyên mục lớn (Category Group)</label>
              <select
                id="staff-mgmtSvcCategory"
                value={newService.category}
                onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
              >
                <option value="Móng">Móng (Nail)</option>
                <option value="Gội dưỡng sinh">Gội dưỡng sinh (Hair)</option>
                <option value="Massage">Massage</option>
                <option value="Deal">Deal Khuyến Mãi</option>
              </select>
            </div>

            <div>
              <label htmlFor="staff-mgmtSvcDescription" className="block text-xs font-bold text-gray-500 mb-1">Nội dung mô tả ngắn</label>
              <textarea
                id="staff-mgmtSvcDescription"
                rows={2}
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                placeholder="Mô tả kỹ thuật làm đẹp"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#5C4033] hover:bg-[#3A2E2B] text-white py-3 rounded-xl text-xs font-bold tracking-widest uppercase shadow-sm cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Lưu dịch vụ
            </button>
          </form>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h5 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Dịch Vụ Đang Áp Dụng ({services.length})</h5>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-1">
              {services.map((s) => (
                <div key={s.id} className="py-3 flex justify-between items-start text-xs font-semibold">
                  <div className="space-y-0.5 max-w-[70%]">
                    <p className="text-gray-800 line-clamp-1">{s.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Nhóm: {s.category || s.special_category} | {s.duration || 30} phút</p>
                  </div>
                  <span className="text-pink-600 font-bold shrink-0">{(s.price || 0).toLocaleString()}đ</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === "COMMISSIONS" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
          <div className="flex justify-between items-center border-b pb-3">
            <h5 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Xem báo cáo hoa hồng doanh số tháng này</h5>
            <span className="text-[10px] font-mono font-bold bg-pink-50 text-pink-600 px-2 py-1 rounded">Chỉ số thợ phục vụ</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pt-0">Thợ phục vụ</th>
                  <th className="pb-3 pt-0">Tài khoản</th>
                  <th className="pb-3 pt-0 text-center">Số đơn làm</th>
                  <th className="pb-3 pt-0 text-right">Tổng Doanh Thu</th>
                  <th className="pb-3 pt-0 text-right text-pink-600">Hoa hồng thợ nhận (10%)</th>
                  <th className="pb-3 pt-0 text-right">Tiền tips</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                {commissionReport.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 font-medium italic">
                      Chưa phát sinh doanh số hoa hồng nào trong tháng này.
                    </td>
                  </tr>
                ) : (
                  commissionReport.map((c: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="py-3 text-gray-900 font-bold">{c.fullName}</td>
                      <td className="py-3 font-mono text-gray-500">@{c.username || "n/a"}</td>
                      <td className="py-3 text-center text-gray-900">{c.totalAppointments || 0}</td>
                      <td className="py-3 text-right">{(c.totalSales || 0).toLocaleString()}đ</td>
                      <td className="py-3 text-right text-pink-600">{(c.totalCommission || 0).toLocaleString()}đ</td>
                      <td className="py-3 text-right">{(c.totalTip || 0).toLocaleString()}đ</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === "REVIEWS" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h5 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Review đánh giá từ tệp khách hàng</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
            {dbReviews.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-400 text-xs italic font-medium">Chưa có bình chọn phản hồi nào của khách kỳ này.</div>
            ) : (
              dbReviews.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-gray-150 space-y-2.5 bg-gray-50/30">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-gray-800">{r.appointments?.customers?.full_name || "Nhà Min Member"}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{format(new Date(r.created_at), "dd/MM/yyyy")}</p>
                    </div>
                    <div className="flex text-amber-400 star-item">
                      {Array.from({ length: r.rating || 5 }).map((_, starIdx) => (
                        <Star key={starIdx} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 font-medium italic">&quot;{r.comment || "Đã trải nghiệm dịch vụ xuất sắc!"}&quot;</p>

                  {r.quick_tags && r.quick_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {r.quick_tags.map((tg: string, tgIdx: number) => (
                        <span key={tgIdx} className="bg-pink-50 text-[9px] px-1.5 py-0.5 rounded text-pink-600 font-bold">
                          #{tg}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[9px] text-gray-400 font-semibold italic flex items-center gap-1">
                    👥 Thợ thực hiện: <span className="text-gray-600">{r.appointments?.users?.full_name || "Hệ thống"}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
