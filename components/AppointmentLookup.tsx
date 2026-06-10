'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Calendar, Clock, User, Sparkles, Check, ChevronDown, CheckCircle, ShieldAlert, BadgeInfo, X, Star, AlertTriangle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { lookupAppointmentsByPhone, submitAppointmentReview, cancelAppointmentByCustomer } from '@/app/booking/actions';

// Status styling configuration
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; step: number; desc: string }> = {
  'PENDING_RANDOM': {
    label: 'Chờ Sắp Xếp KTV',
    bg: 'bg-amber-50/80',
    text: 'text-amber-800',
    border: 'border-amber-200',
    step: 1,
    desc: 'Lịch của bạn đã được ghi nhận. Đang điều phối KTV trống phù hợp nhất phục vụ bạn.'
  },
  'CONFIRMED': {
    label: 'Đã Xác Nhận',
    bg: 'bg-teal-50/80',
    text: 'text-teal-800',
    border: 'border-teal-200',
    step: 2,
    desc: 'Min Salon đã sẵn sàng! Kỹ thuật viên đã được phân công và chuẩn bị chu đáo để đón bạn.'
  },
  'IN_PROGRESS': {
    label: 'Đang Thực Hiện',
    bg: 'bg-indigo-50/80',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    step: 3,
    desc: 'Gói liệu trình của bạn đang được tiến hành trực tiếp cực kỳ chăm chút.'
  },
  'COMPLETED': {
    label: 'Đã Hoàn Thành',
    bg: 'bg-emerald-50/80',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    step: 4,
    desc: 'Liệu trình hoàn tất! Cảm ơn bạn đã lựa chọn tin tưởng dịch vụ tại Min Nail & Hair.'
  },
  'CANCELLED': {
    label: 'Đã Huỷ',
    bg: 'bg-rose-50/80',
    text: 'text-rose-800',
    border: 'border-rose-200',
    step: 0,
    desc: 'Lịch hẹn đã bị huỷ bỏ khỏi hệ thống. Quý khách vui lòng đặt lại lịch mới để được phục vụ.'
  }
};

function AppointmentReviewSection({ apptId, existingReview, onReviewSubmitted }: { apptId: string; existingReview: any; onReviewSubmitted: (rating: number, tags: string[], comment?: string) => void }) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const tags = ['KTV Thân Thiện', 'Tay Nghề Cao', 'Không Gian Thư Giãn', 'Làm Rất Kỹ', 'Phục Vụ Tận Tình', 'Giá Cả Hợp Lý'];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await submitAppointmentReview(apptId, rating, selectedTags, comment);
      if (res.success) {
        onReviewSubmitted(rating, selectedTags, comment);
      } else {
        setSubmitError(res.error || 'Đã xảy ra lỗi khi gửi đánh giá.');
      }
    } catch (err) {
      setSubmitError('Lỗi kết nối máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (existingReview) {
    return (
      <div className="bg-[#FAF0E6]/30 p-4 rounded-2xl border border-[#EADDCD]/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#8D6E53] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Đánh giá của bạn:
          </div>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${
                  s <= existingReview.rating
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
        {existingReview.quick_tags && existingReview.quick_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {existingReview.quick_tags.map((tag: string, tid: number) => (
              <span
                key={tid}
                className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-lg bg-white border border-[#EADDCD] text-[#8D6E53] shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {existingReview.comment && (
          <div className="bg-white/60 p-3 rounded-xl border border-[#EADDCD]/40 text-xs text-gray-700 italic font-medium leading-relaxed mt-2">
            &ldquo;{existingReview.comment}&rdquo;
          </div>
        )}
        <p className="text-[11px] text-[#8D6E53] italic font-semibold pt-1">
          Cảm ơn sự đóng góp ý kiến quý báu từ quý khách để giúp Min Nail & Hair ngày càng hoàn thiện hơn!
        </p>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="flex items-center justify-between bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/60">
        <div className="flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-emerald-900">Liệu trình hoàn thành xuất sắc!</p>
            <p className="text-[11px] text-gray-500 font-medium">Hãy chia sẻ trải nghiệm thư giãn của bạn nhé.</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-[11px] font-bold uppercase tracking-wider text-white bg-[#8D6E53] hover:bg-[#5C4033] px-3.5 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer hover:shadow"
        >
          Đánh giá ngay
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF0E6]/30 p-4 rounded-2xl border border-[#EADDCD] space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-bold uppercase tracking-wider text-[#3A2E2B] flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> Đánh giá dịch vụ
        </h5>
        <button
          onClick={() => setShowForm(false)}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600"
        >
          Huỷ
        </button>
      </div>

      {/* Stars Selector */}
      <div className="flex flex-col items-center gap-1 py-2 bg-white border border-[#EADDCD]/40 rounded-xl">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => {
            const active = hoverRating !== null ? s <= hoverRating : s <= rating;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-1 transition-transform active:scale-90 cursor-pointer"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    active
                      ? 'text-amber-500 fill-amber-500 drop-shadow-sm'
                      : 'text-gray-200'
                  }`}
                />
              </button>
            );
          })}
        </div>
        <p className="text-[11px] font-bold text-[#8D6E53] uppercase tracking-widest mt-1">
          {rating === 5 && 'Rất Hài Lòng ⭐⭐⭐⭐⭐'}
          {rating === 4 && 'Hài Lòng ⭐⭐⭐⭐'}
          {rating === 3 && 'Tạm Ổn ⭐⭐⭐'}
          {rating === 2 && 'Chưa Hài Lòng ⭐⭐'}
          {rating === 1 && 'Cần Cải Thiện ⭐'}
        </p>
      </div>

      {/* Quick Tags Selector */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase font-bold text-[#8D6E53] tracking-wider">Chọn nhận xét nhanh:</div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#5C4033] border-[#5C4033] text-white shadow-sm'
                    : 'bg-white border-[#EADDCD] text-gray-600 hover:border-[#8D6E53]'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Text Comment Input Area */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-[#8D6E53] tracking-wider block">Ý kiến đóng góp khác (Nếu có):</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Nhập ý kiến đóng góp của bạn để salon cải thiện chất lượng dịch vụ tốt hơn..."
          className="w-full text-xs p-3 bg-white border border-[#EADDCD] rounded-xl focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent outline-none transition-all font-semibold text-[#3A2E2B]"
          rows={2}
        />
      </div>

      {submitError && (
        <p className="text-xs font-semibold text-rose-600 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 text-center">
          ⚠️ {submitError}
        </p>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full bg-[#5C4033] hover:bg-[#3A2E2B] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isSubmitting ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
        Gửi phản hồi của bạn
      </button>
    </div>
  );
}

function CancelAppointmentManager({ apptId, startTime, onCancelled }: { apptId: string; startTime: string; onCancelled: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await cancelAppointmentByCustomer(apptId);
      if (res.success) {
        onCancelled();
      } else {
        setError(res.error || "Gặp lỗi ngoài ý muốn khi hủy lịch.");
      }
    } catch (err) {
      setError("Lỗi kết nối máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200/60 mt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
        <div className="flex gap-2 text-rose-800">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold font-display">Xác nhận hủy đặt lịch</p>
            <p className="text-[11px] text-gray-500 leading-normal font-medium">
              Bạn có chắc muốn hủy lịch hẹn lúc <strong className="text-rose-900">{format(new Date(startTime), 'HH:mm')} ngày {format(new Date(startTime), 'dd/MM')}</strong> không? Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>
        {error && (
          <p className="text-[10px] text-rose-700 font-bold bg-white px-2.5 py-1.5 rounded-lg border border-rose-100">{error}</p>
        )}
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all"
          >
            Giữ lại lịch
          </button>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-wider cursor-pointer shadow-sm active:scale-95 transition-all flex items-center gap-1"
          >
            {isSubmitting ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Xác nhận hủy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end pt-1">
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="text-[10px] font-bold uppercase tracking-widest text-[#8D6E53] hover:text-white bg-[#FAF0E6] hover:bg-rose-600 px-3.5 py-1.5 rounded-xl transition-all border border-[#EADDCD] hover:border-rose-600 cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Hủy lịch đặt này
      </button>
    </div>
  );
}

function AiPostCareAdviceCard({ services }: { services: { name: string }[] }) {
  const [advice, setAdvice] = useState<string>("");

  useEffect(() => {
    const tips: string[] = [];
    let hasNail = false;
    let hasHair = false;
    let hasMassage = false;

    services.forEach(s => {
      const name = s.name.toLowerCase();
      if (name.includes('móng') || name.includes('nail') || name.includes('sơn') || name.includes('gel') || name.includes('gót') || name.includes('da')) {
        hasNail = true;
      }
      if (name.includes('gội') || name.includes('tóc') || name.includes('dưỡng sinh') || name.includes('đầu')) {
        hasHair = true;
      }
      if (name.includes('massage') || name.includes('body') || name.includes('xoa bóp')) {
        hasMassage = true;
      }
    });

    if (hasNail) {
      tips.push("• Hạn chế tiếp xúc trực tiếp với hóa chất rửa mạnh để giữ độ bền lâu bóng cho móng.");
      tips.push("• Nên bôi dầu dưỡng biểu bì hoặc kem dưỡng tay mỗi tối trước khi đi ngủ.");
    }
    if (hasHair) {
      tips.push("• Không gội đầu bằng nước quá nóng để khóa độ ẩm gốc tóc, ngăn hư tổn xơ xác.");
      tips.push("• Hãy sấy khô triệt để chân tóc ở mức gió vừa phải để tránh ẩm mốc da đầu.");
    }
    if (hasMassage) {
      tips.push("• Bổ sung một ly nước ấm sau khi massage body để hỗ trợ quá trình lưu thông khí huyết.");
      tips.push("• Tránh bê vác hoặc vận động tư thế mạnh làm ảnh hưởng vùng cơ vừa được đả thông.");
    }

    if (tips.length === 0) {
      tips.push("• Chăm sóc bảo vệ làn da của bạn luôn đủ ẩm và tránh nắng trực tiếp sau khi làm dịch vụ.");
    }

    setAdvice(tips.join('\n'));
  }, [services]);

  return (
    <div className="bg-[#FAF6F0]/60 p-4 rounded-2xl border border-[#EADDCD]/50 mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#8D6E53] fill-[#8D6E53]/20" />
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#8D6E53]">Cẩm Nang Dưỡng Tại Nhà (Tư Vấn Bởi Chuyên Viên)</h5>
      </div>
      <div className="text-[11px] text-[#5C4033] space-y-1 bg-white p-3.5 rounded-xl border border-[#EADDCD]/30 leading-relaxed font-semibold whitespace-pre-line animate-in fade-in duration-200">
        {advice}
      </div>
    </div>
  );
}

export default function AppointmentLookup() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    success: boolean;
    customerName?: string;
    appointments?: any[];
    error?: string;
  } | null>(null);

  const handleReviewSubmitted = (apptId: string, rating: number, quickTags: string[], comment?: string) => {
    if (!results || !results.appointments) return;
    const updated = results.appointments.map((appt: any) => {
      if (appt.id === apptId) {
        return {
          ...appt,
          review: { rating, quick_tags: quickTags, comment: comment || null }
        };
      }
      return appt;
    });
    setResults({
      ...results,
      appointments: updated
    });
  };

  const handleAppointmentCancelled = (apptId: string) => {
    if (!results || !results.appointments) return;
    const updated = results.appointments.map((appt: any) => {
      if (appt.id === apptId) {
        return {
          ...appt,
          status: 'CANCELLED'
        };
      }
      return appt;
    });
    setResults({
      ...results,
      appointments: updated
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (cleanPhone.length < 9) {
      setResults({ success: false, error: 'Số điện thoại không hợp lệ. Vui lòng nhập ít nhất 9 chữ số.' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await lookupAppointmentsByPhone(cleanPhone);
      setResults(res);
    } catch (err) {
      setResults({ success: false, error: 'Đã xảy ra hệ thống ngoài ý muốn. Vui lòng thử lại sau.' });
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setPhone('');
    setResults(null);
  };

  return (
    <div id="appointment-lookup" className="bg-white rounded-3xl border border-[#EADDCD] p-6 md:p-8 shadow-sm transition-all relative overflow-hidden">
      {/* Decorative Warm Accent Blur */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#FAF0E6]/40 blur-2xl rounded-full pointer-events-none -z-10" />
      
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3 justify-center md:justify-start">
          <div className="w-10 h-10 rounded-full bg-[#FAF0E6] flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 text-[#8D6E53]" />
          </div>
          <div className="text-left">
            <h3 className="font-display font-semibold text-lg text-[#3A2E2B]">Tra Cứu Lịch Hẹn Trực Tuyến</h3>
            <p className="text-xs text-gray-500">Nhập đúng số điện thoại của bạn để cập nhật tình trạng lịch chi tiết</p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="tel"
              placeholder="Nhập số điện thoại đã đặt lịch (VD: 0934323878)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-5 py-3.5 bg-[#FAF6F0]/50 border border-[#EADDCD] rounded-2xl text-sm focus:outline-none focus:border-[#8D6E53] focus:bg-white text-[#3A2E2B] transition-all font-mono font-medium placeholder:text-gray-400 placeholder:font-sans"
              required
            />
            {phone && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#5C4033] p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto bg-[#5C4033] hover:bg-[#3A2E2B] text-white px-8 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Tra cứu ngay
          </button>
        </form>

        {/* Results Container */}
        <AnimatePresence mode="wait">
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="pt-4 border-t border-[#FAF6F0] space-y-6"
            >
              {results.success ? (
                <>
                  {/* Customer Welcome Header */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-[#FAF0E6]/40 p-4 rounded-2xl border border-[#EADDCD]/60 gap-2">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Khách hàng thành viên</p>
                      <h4 className="font-display font-bold text-base text-[#3A2E2B] uppercase mt-0.5">
                        ✨ {results.customerName}
                      </h4>
                    </div>
                    <div className="text-xs text-[#8D6E53] font-bold bg-white border border-[#EADDCD] px-3.5 py-1.5 rounded-full inline-block self-start shadow-sm">
                      Tổng cộng: {results.appointments?.length || 0} lượt hẹn
                    </div>
                  </div>

                  {/* Appointments Timeline / List */}
                  {results.appointments && results.appointments.length > 0 ? (
                    <div className="space-y-6">
                      {results.appointments.map((appt: any, idx: number) => {
                        const statusInfo = STATUS_CONFIG[appt.status] || STATUS_CONFIG['PENDING_RANDOM'];
                        const isCancelled = appt.status === 'CANCELLED';
                        const isCompleted = appt.status === 'COMPLETED';
                        
                        return (
                          <div
                            key={appt.id}
                            className="bg-white border border-[#EADDCD] rounded-2xl p-5 shadow-sm space-y-4 hover:border-[#8D6E53] transition-all"
                          >
                            {/* Appt top summary bar */}
                            <div className="flex flex-wrap justify-between items-start gap-4">
                              <div className="space-y-1">
                                <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-[#8D6E53]" />
                                  <span>{format(new Date(appt.startTime), 'EEEE, d MMMM yyyy', { locale: vi })}</span>
                                </div>
                                <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                                  <Clock className="w-3.5 h-3.5 text-[#8D6E53]" />
                                  <span className="font-semibold text-gray-800">
                                    {format(new Date(appt.startTime), 'HH:mm')} - {format(new Date(appt.endTime), 'HH:mm')}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-normal">| {appt.staffName}</span>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div className={`px-3 py-1.5 rounded-full border text-xs font-bold ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border} tracking-wide uppercase select-none`}>
                                {statusInfo.label}
                              </div>
                            </div>

                            {/* Services List in Appointment */}
                            <div className="border-t border-[#FAF6F0] pt-3.5">
                              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Dịch vụ đã đặt:</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                {appt.services.map((srv: any, sIdx: number) => (
                                  <div key={sIdx} className="bg-[#FAF6F0]/40 px-3.5 py-2.5 rounded-xl border border-[#EADDCD]/40 flex justify-between items-center text-xs">
                                    <span className="font-semibold text-gray-700">{srv.name}</span>
                                    <span className="font-mono text-[#8D6E53] font-bold">{Number(srv.price).toLocaleString('vi-VN')}₫</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Elegant Progress/Status Timeline (Only for non-cancelled & non-completed appointments) */}
                            {!isCancelled && !isCompleted && (
                              <div className="pt-2">
                                <div className="relative w-full py-4 px-2 md:px-8">
                                  {/* Progress Line */}
                                  <div className="absolute top-[32px] left-[10%] right-[10%] h-[3px] bg-gray-100 -z-10 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-amber-400 to-[#8D6E53] transition-all duration-700"
                                      style={{ width: `${((statusInfo.step - 1) / 3) * 100}%` }}
                                    />
                                  </div>

                                  {/* Milestone Steps */}
                                  <div className="flex justify-between items-center relative text-center">
                                    {[
                                      { step: 1, label: 'Đã nhận lịch', activeLabel: 'Hệ thống nhận' },
                                      { step: 2, label: 'Đã xác nhận', activeLabel: 'Xác nhận KTV' },
                                      { step: 3, label: 'Đang phục vụ', activeLabel: 'Đang thư giãn' },
                                      { step: 4, label: 'Hoàn thành', activeLabel: 'Hoàn tất' }
                                    ].map((s) => {
                                      const isPassed = statusInfo.step >= s.step;
                                      const isCurrent = statusInfo.step === s.step;

                                      return (
                                        <div key={s.step} className="flex flex-col items-center flex-1">
                                          <div
                                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-300 ${
                                              isPassed
                                                ? 'bg-[#5C4033] border-[#5C4033] text-white shadow-md'
                                                : 'bg-white border-gray-200 text-gray-400'
                                            } ${isCurrent ? 'ring-4 ring-[#EADDCD]' : ''}`}
                                          >
                                            {isPassed && statusInfo.step > s.step ? (
                                              <Check className="w-4 h-4 text-white" />
                                            ) : (
                                              s.step
                                            )}
                                          </div>
                                          <span
                                            className={`text-[10px] mt-2 font-bold uppercase tracking-wider block ${
                                              isCurrent ? 'text-[#8D6E53]' : isPassed ? 'text-gray-700' : 'text-gray-400'
                                            }`}
                                          >
                                            {isCurrent ? s.activeLabel : s.label}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Status Helper Description */}
                            <div className="bg-[#FAF0E6]/30 p-3 rounded-xl border border-[#EADDCD]/40 flex items-start gap-2.5">
                              {isCancelled ? (
                                <ShieldAlert className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                              ) : isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                              ) : (
                                <BadgeInfo className="w-4 h-4 text-[#8D6E53] mt-0.5 shrink-0" />
                              )}
                              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                {statusInfo.desc}
                              </p>
                            </div>

                            {!isCancelled && !isCompleted && (appt.status === 'PENDING_RANDOM' || appt.status === 'CONFIRMED') && (
                              <CancelAppointmentManager
                                apptId={appt.id}
                                startTime={appt.startTime}
                                onCancelled={() => handleAppointmentCancelled(appt.id)}
                              />
                            )}

                            {isCompleted && (
                              <div className="space-y-4">
                                <AppointmentReviewSection
                                  apptId={appt.id}
                                  existingReview={appt.review}
                                  onReviewSubmitted={(rating, tags, comment) => handleReviewSubmitted(appt.id, rating, tags, comment)}
                                />
                                <AiPostCareAdviceCard services={appt.services} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 text-center space-y-2">
                      <p className="text-sm font-semibold text-amber-800">Không tìm thấy lịch hẹn</p>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Số điện thoại này hiện chưa đăng ký lịch hẹn sắp tới nào của Min Salon. Bạn click &quot;Booking&quot; ở trên nhé!
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-200 text-center space-y-1">
                  <p className="text-xs font-semibold text-rose-800">{results.error}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
