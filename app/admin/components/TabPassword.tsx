'use client';

import { useState } from 'react';
import { Key } from 'lucide-react';
import { changePassword } from '../actions';
import PushNotificationManager from '@/components/PushNotificationManager';
import { Button } from '@/components/ui/Button';

export default function TabPassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMsg({ type: 'error', text: 'Vui lòng điền đầy đủ tất cả các trường.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Mật khẩu mới và xác nhận mật khẩu không khớp nhau.' });
      return;
    }
    setLoading(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
        setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        setMsg({ type: 'error', text: res.error || 'Có lỗi xảy ra.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Lỗi kết nối máy chủ.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Key className="w-6 h-6 text-pink-500" /> Đổi mật khẩu tài khoản</h2>
        <p className="text-sm text-gray-500">Cập nhật mật khẩu mới của bạn để bảo mật tài khoản tốt hơn.</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
        {msg && (
          <div className={`p-4 rounded-xl text-sm font-semibold ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>{msg.text}</div>
        )}
        <div>
          <label htmlFor="pwd_old" className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu cũ</label>
          <input id="pwd_old" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Nhập mật khẩu hiện tại" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all placeholder:text-gray-400 font-medium font-semibold" />
        </div>
        <div>
          <label htmlFor="pwd_new" className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu mới</label>
          <input id="pwd_new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nhập mật khẩu mới" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all placeholder:text-gray-400 font-medium font-semibold" />
        </div>
        <div>
          <label htmlFor="pwd_confirm" className="block text-sm font-semibold text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
          <input id="pwd_confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Xác nhận lại mật khẩu mới" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all placeholder:text-gray-400 font-medium font-semibold" />
        </div>
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <Button type="submit" disabled={loading} isLoading={loading} className="px-8">
            Cập nhật mật khẩu
          </Button>
        </div>
      </form>
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5 mt-6">
        <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100 mb-4">Cài đặt thông báo (Admin)</h3>
        <p className="text-sm text-gray-600 font-medium pb-2">Đăng ký thiết bị này để nhận các thông báo tức thời về đặt lịch mới, huỷ lịch hoặc thay đổi dịch vụ của khách.</p>
        <PushNotificationManager />
      </div>
    </div>
  );
}
