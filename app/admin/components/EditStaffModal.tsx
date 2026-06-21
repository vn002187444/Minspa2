"use client";

import { useState } from "react";
import { toast } from 'sonner';
import { Key } from "lucide-react";
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { updateStaff, resetStaffPassword, deleteStaffSafely } from "../actions";

export default function EditStaffModal({ staff, userRole, onClose, onReload }: any) {
  const trapRef = useFocusTrap(true);
  const [form, setForm] = useState({
    fullName: staff.full_name || "",
    username: staff.username || "",
    cccd: staff.cccd || "",
    role: staff.role || "STAFF",
  });
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    const res = await updateStaff(staff.id, {
      full_name: form.fullName,
      username: form.username,
      cccd: form.cccd,
      role: form.role,
    });
    if (res.success) {
      onReload();
      onClose();
    } else {
      setErrorMsg("Lỗi: " + res.error);
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setResetting(true);
    const res = await resetStaffPassword(staff.id);
    if (res.success) {
      setSuccessMsg("Đã đặt lại mật khẩu thành '123456'");
    } else {
      setErrorMsg("Lỗi reset mật khẩu: " + res.error);
    }
    setResetting(false);
  };

  return (
    <div ref={trapRef} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Sửa thông tin nhân viên">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-in zoom-in-95">
        <h3 className="font-display font-bold text-lg text-gray-900 mb-6">
          Sửa thông tin nhân viên
        </h3>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold">
            {successMsg}
          </div>
        )}

        <div className="mb-6 pb-6 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-700 font-medium">Bảo mật tài khoản:</span>
          <button
            onClick={handleResetPassword}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            {resetting ? "Đang xử lý..." : "🔒 Reset Mật khẩu"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên
            </label>
            <input
              required
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Đăng nhập (Username)
            </label>
            <input
              required
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số CCCD {form.role === 'STAFF' && <span className="text-red-500">(*Bắt buộc)</span>}
            </label>
            <input
              required={form.role === 'STAFF'}
              type="text"
              value={form.cccd}
              onChange={(e) => setForm({ ...form, cccd: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-sm font-mono tracking-wide"
              placeholder="Nhập 12 số CCCD"
            />
          </div>
          {userRole === 'ADMIN' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phân quyền
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none text-sm"
            >
              <option value="STAFF">Nhân viên (STAFF)</option>
              <option value="MANAGER">Quản lý (MANAGER)</option>
            </select>
          </div>
          )}
          <div className="pt-4 flex justify-between gap-3 border-t border-gray-100">
            {userRole === 'ADMIN' ? (
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  const res = await deleteStaffSafely(staff.id, staff.full_name);
                  if (res.success) {
                    toast.success('Đã ẩn/xóa nhân viên');
                    onReload();
                      onClose();
                    } else {
                      setErrorMsg("Lỗi: " + res.error);
                      setLoading(false);
                  }}}
                  className="px-4 py-2 text-red-500 hover:text-red-700 font-medium text-sm transition-colors cursor-pointer"
              >
                Xóa nhân viên
              </button>
            ) : (
              <div></div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-black transition-transform active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
