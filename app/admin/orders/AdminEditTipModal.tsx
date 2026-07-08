'use client'
import { useState } from 'react';
import { toast } from 'sonner';
import { TIP_AMOUNTS } from '@/lib/constants';
import { adminUpdateTip } from '@/app/admin/actions';
import LoadingButton from '@/components/LoadingButton';

export default function AdminEditTipModal({ appt, onClose, onSaved }: any) {
  const [tipAmount, setTipAmount] = useState(appt?.tip_amount || 0);
  const [customTip, setCustomTip] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalTip = customTip ? parseInt(customTip.replace(/\D/g, '')) : tipAmount;
      const res = await adminUpdateTip(appt.id, finalTip);
      if (res.success) {
        toast.success(`Đã cập nhật tip: ${res.oldTip}đ → ${res.newTip}đ`);
        onSaved();
      } else {
        toast.error(res.error || 'Lỗi khi cập nhật tip');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi không xác định');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full border border-gray-150 p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <h3 className="font-extrabold text-lg text-gray-900">Sửa tiền Tip</h3>
        <p className="text-sm text-gray-600">
          Đơn của <strong>{appt?.customers?.full_name || 'Khách lẻ'}</strong> — Tip hiện tại: <strong className="text-pink-600">{(appt?.tip_amount || 0).toLocaleString('vi')}đ</strong>
        </p>

        <div className="grid grid-cols-2 gap-3">
          {TIP_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => { setTipAmount(amount); setCustomTip(''); }}
              className={`py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer ${
                tipAmount === amount && !customTip
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {amount.toLocaleString('vi')}đ
            </button>
          ))}
          <div className="col-span-2">
            <label htmlFor="order-customTip" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Số tiền khác</label>
            <input
              id="order-customTip"
              type="text"
              value={customTip}
              onChange={(e) => { setCustomTip(e.target.value); setTipAmount(0); }}
              placeholder="Nhập số tiền tip..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold focus:border-pink-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700 cursor-pointer">
            Hủy
          </button>
          <LoadingButton
            onClick={handleSave}
            isLoading={saving}
            loadingText="Đang lưu..."
            className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 rounded-xl text-sm font-bold text-white cursor-pointer"
          >
            Lưu tip
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
