"use client";

import { useState } from "react";
import { X, Star, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { submitReview } from "@/app/staff/actions";
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface Props {
  appointmentId: string;
  customerName: string;
  onClose: () => void;
}

export default function ReviewCustomerModal({ appointmentId, customerName, onClose }: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trapRef = useFocusTrap(true);

  const QUICK_TAGS = [
    "Thân thiện", "Đúng giờ", "Dễ tính", "Yêu cầu kỹ", 
    "Khách quen", "Khó tính", "Góp ý nhiều", "Hài lòng"
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitReview(
        appointmentId,
        rating,
        selectedTags,
        comment
      );
      if (!res.success) throw new Error(res.error || "Submit failed");
      toast.success("Đã gửi đánh giá khách hàng");
      onClose();
    } catch (err: unknown) {
      toast.error("Lỗi gửi đánh giá: " + (err instanceof Error ? err.message : String(err) || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={trapRef} role="dialog" aria-modal="true" aria-label="Đánh giá khách hàng" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 font-display">Đánh giá khách hàng</h3>
              <p className="text-xs text-gray-500 font-medium">Khách hàng: {customerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">Bạn đánh giá khách hàng này như thế nào?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-2 transition-all active:scale-90 cursor-pointer"
                >
                  <Star 
                    className={`w-8 h-8 ${star <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} 
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-gray-400">{rating === 5 ? "Tuyệt vời!" : rating === 1 ? "Rất khó khăn" : "Bình thường"}</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 ml-1">Ghi chú chi tiết</label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ghi chú về thói quen, yêu cầu đặc biệt của khách..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 ml-1">Đặc điểm khách hàng</label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 min-h-[44px] flex items-center justify-center rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                    selectedTags.includes(tag) 
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                      : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Đang gửi..." : (
              <>
                <Send className="w-4 h-4" /> Gửi đánh giá
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
