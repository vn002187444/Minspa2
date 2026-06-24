"use client";

import { useState } from "react";
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { createStaff } from "../actions";

interface AddStaffModalProps {
  onClose: () => void;
  onReload: () => void;
}

export default function AddStaffModal({ onClose, onReload }: AddStaffModalProps) {
  const trapRef = useFocusTrap(true);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
    cccd: "",
    role: "STAFF",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    const res = await createStaff(form);
    if (res.success) {
      onReload();
      onClose();
    } else {
      setErrorMsg("Lỗi: " + res.error);
      setLoading(false);
    }
  };

  return (
    <div ref={trapRef} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Thêm nhân viên mới">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-in zoom-in-95">
        <h3 className="font-display font-bold text-lg text-gray-900 mb-6">
          Thêm nhân viên mới
        </h3>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="addStaff-fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên
            </label>
            <input
              id="addStaff-fullName"
              required
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="addStaff-cccd" className="block text-sm font-medium text-gray-700 mb-1">
              Số CCCD (*Bắt buộc)
            </label>
            <input
              id="addStaff-cccd"
              required
              type="text"
              value={form.cccd}
              onChange={(e) => setForm({ ...form, cccd: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="addStaff-username" className="block text-sm font-medium text-gray-700 mb-1">
              Tên đăng nhập
            </label>
            <input
              id="addStaff-username"
              required
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="addStaff-password" className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu / PIN
            </label>
            <input
              id="addStaff-password"
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="addStaff-role" className="block text-sm font-medium text-gray-700 mb-1">
              Phân quyền
            </label>
            <select
              id="addStaff-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none text-sm"
            >
              <option value="STAFF">Nhân viên (STAFF)</option>
              <option value="MANAGER">Quản lý (MANAGER)</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-black disabled:opacity-50"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
