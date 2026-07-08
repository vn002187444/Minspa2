'use client'
import { useState } from 'react';
import { toast } from 'sonner';
import { changePassword } from '@/app/staff/actions';

export default function TabPassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMsg({ type: "error", text: "Vui lòng điền đầy đủ tất cả các trường." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg({ type: "error", text: "Mật khẩu mới và xác nhận mật khẩu không khớp nhau." });
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setMsg({ type: "success", text: "Đổi mật khẩu thành công!" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Mật khẩu đã được thay đổi thành công!");
      } else {
        setMsg({ type: "error", text: res.error || "Có lỗi xảy ra." });
      }
    } catch {
      setMsg({ type: "error", text: "Có lỗi xảy ra. Vui lòng thử lại." });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Đổi mật khẩu đăng nhập
        </h2>

        {msg && (
          <div className={`p-4 rounded-xl text-xs font-semibold mb-4 ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="old-password" className="block text-xs font-bold text-gray-500 mb-1">Mật khẩu cũ</label>
            <input id="old-password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all" placeholder="Nhập mật khẩu cũ" />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-xs font-bold text-gray-500 mb-1">Mật khẩu mới</label>
            <input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all" placeholder="Nhập mật khẩu mới" />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-xs font-bold text-gray-500 mb-1">Xác nhận mật khẩu mới</label>
            <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all" placeholder="Xác nhận mật khẩu mới" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl text-xs font-bold tracking-widest uppercase shadow-sm transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
          >
            {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}
