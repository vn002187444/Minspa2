'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, CreditCard } from 'lucide-react';
import { saveBankSettings } from '../actions';
import { VIETNAMESE_BANKS } from '../banks';

interface BankData {
  bank_id: string;
  bank_name: string;
  account_number: string;
  account_owner: string;
}

export default function TabBank({ data, onReload }: { data: BankData | null; onReload: () => void }) {
  const [bankId, setBankId] = useState(data?.bank_id || 'vcb');
  const [accountNumber, setAccountNumber] = useState(data?.account_number || '');
  const [accountOwner, setAccountOwner] = useState(data?.account_owner || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (data) {
      setBankId(data.bank_id || 'vcb');
      setAccountNumber(data.account_number || '');
      setAccountOwner(data.account_owner || '');
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setLoading(true);
    const selectedBank = VIETNAMESE_BANKS.find(b => b.id === bankId);
    const res = await saveBankSettings({
      bank_id: bankId,
      bank_name: selectedBank ? selectedBank.name : 'Vietcombank',
      account_number: accountNumber.trim(),
      account_owner: accountOwner.trim().toUpperCase()
    });
    if (res.success) {
      setMsg({ type: 'success', text: 'Đã lưu thông tin tài khoản ngân hàng thành công!' });
      onReload();
    } else {
      setMsg({ type: 'error', text: 'Lỗi khi lưu cấu hình: ' + res.error });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mt-2 md:mt-0">
        <h2 className="text-xl font-bold text-gray-900 font-display">Cấu hình Tài khoản Ngân hàng (QR Pay)</h2>
        <p className="text-gray-400 text-xs mt-1">Thiết lập ngân hàng và số tài khoản để tạo mã QR thanh toán nhanh VietQR cho thợ nail & gội dưỡng sinh khi hoàn thành đơn hàng.</p>
      </div>
      {msg.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm border ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="font-semibold">{msg.text}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bank_select" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Chọn Ngân hàng</label>
            <select id="bank_select" value={bankId} onChange={(e) => setBankId(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8D6E53] outline-none transition-all font-semibold text-sm appearance-none">
              {VIETNAMESE_BANKS.map((bank) => (
                <option key={bank.id} value={bank.id}>{bank.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bank_account" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Số tài khoản ngân hàng</label>
            <input id="bank_account" type="text" required placeholder="Nhập số tài khoản (ví dụ: 102938812...)" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8D6E53] outline-none transition-all font-semibold text-sm" />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="bank_owner" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Tên chủ tài khoản (Viết hoa không dấu)</label>
            <input id="bank_owner" type="text" required placeholder="Ví dụ: NGUYEN VAN A" value={accountOwner} onChange={(e) => setAccountOwner(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8D6E53] outline-none transition-all font-semibold text-sm" />
          </div>
        </div>
        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="w-16 h-16 rounded-xl bg-amber-100 flex items-center justify-center shrink-0"><CreditCard className="w-8 h-8 text-amber-600" /></div>
          <div className="text-xs space-y-1 flex-1">
            <p className="font-bold text-gray-900">Xem trước thông báo chuyển khoản:</p>
            <p className="text-gray-500 font-medium">Khách sẽ quét mã QR chuyển khoản tới ngân hàng <strong className="text-gray-800">{VIETNAMESE_BANKS.find((b) => b.id === bankId)?.name}</strong>, số tài khoản <strong className="text-gray-800">{accountNumber || '...'}</strong>, chủ tài khoản <strong className="text-gray-800">{accountOwner.toUpperCase() || '...'}</strong>.</p>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button type="submit" disabled={loading} className="px-8 py-3.5 bg-gray-900 hover:bg-black text-white font-medium rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer">
            {loading ? <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div> : <CheckCircle2 className="w-5 h-5" />}
            Lưu thông tin Bank
          </button>
        </div>
      </form>
    </div>
  );
}
