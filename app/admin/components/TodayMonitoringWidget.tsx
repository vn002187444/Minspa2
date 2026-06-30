'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ApptItem {
  id: string;
  status: string;
  start_time: string;
  customers?: { full_name: string; phone: string } | null;
  users?: { full_name: string } | null;
  appointment_services?: { services?: { name: string } | null }[] | null;
  total_amount?: number;
}

export default function TodayMonitoringWidget({ appointments, onReload }: { appointments: ApptItem[]; onReload: () => void }) {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('PENDING');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const pending = appointments.filter((a) => a.status === 'PENDING_RANDOM' || a.status === 'CONFIRMED');
  const inProgress = appointments.filter((a) => a.status === 'IN_PROGRESS');
  const completed = appointments.filter((a) => a.status === 'COMPLETED');
  const cancelled = appointments.filter((a) => a.status === 'CANCELLED');

  const getFilteredList = () => {
    switch (activeTab) {
      case 'PENDING': return pending;
      case 'IN_PROGRESS': return inProgress;
      case 'COMPLETED': return completed;
      case 'CANCELLED': return cancelled;
    }
  };

  const list = getFilteredList();

  const handleStatusUpdate = async (id: string, nextStatus: string) => {
    setUpdatingId(id);
    try {
      const { updateAppointmentStatus } = await import('../../staff/actions');
      const res = await updateAppointmentStatus(id, nextStatus);
      if (res.success) { onReload(); toast.success('Cập nhật trạng thái thành công'); }
      else toast.error('Lỗi: ' + res.error);
    } catch (err: unknown) { console.error(err); }
    finally { setUpdatingId(null); }
  };

  const formatTime = (isoString: string) => {
    try { return format(new Date(isoString), 'HH:mm'); }
    catch { return '--:--'; }
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-base font-bold text-gray-900 font-display uppercase tracking-wider">Giám sát Đơn hàng hôm nay ({appointments.length})</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Bao quát các đơn đặt hẹn phục vụ và trạng thái phòng máy trong ngày hôm nay.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-1.5 border-b border-gray-100 pb-3">
        {[
          { id: 'PENDING' as const, label: 'Chờ xử lý / Sắp đến', count: pending.length, activeClass: 'bg-[#8D6E53] text-white shadow-xs' },
          { id: 'IN_PROGRESS' as const, label: 'Đang làm', count: inProgress.length, activeClass: 'bg-blue-600 text-white shadow-xs' },
          { id: 'COMPLETED' as const, label: 'Đã hoàn thành', count: completed.length, activeClass: 'bg-emerald-600 text-white shadow-xs' },
          { id: 'CANCELLED' as const, label: 'Đã hủy', count: cancelled.length, activeClass: 'bg-rose-600 text-white shadow-xs' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] flex items-center ${activeTab === tab.id ? tab.activeClass : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-xs italic">Không có đơn đặt hẹn nào hôm nay trong mục này.</div>
      ) : (
        <div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-gray-50 text-[#8D6E53] font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="p-3">Họ tên khách</th>
                  <th className="p-3">Khung Giờ</th>
                  <th className="p-3">Thợ đảm nhận</th>
                  <th className="p-3 text-right">Tổng thanh toán</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  <th className="p-3 text-right">Cập nhật nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150/50 font-medium text-gray-700">
                {list.map((appt) => (
                  <tr key={appt.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-bold text-gray-900">{appt.customers?.full_name || 'Khách lẻ'}</td>
                    <td className="p-3 font-mono font-bold text-gray-800">{formatTime(appt.start_time)}</td>
                    <td className="p-3"><span className="bg-gray-100 px-2.5 py-1 rounded-lg text-gray-700 font-bold text-[11px] border border-gray-200/50">{appt.users?.full_name || 'Chưa phân thợ'}</span></td>
                    <td className="p-3 text-right font-mono font-black text-[#5C4033]">{(appt.total_amount || 0).toLocaleString('vi')} đ</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        appt.status === 'PENDING_RANDOM' ? 'bg-amber-100 text-amber-800 border border-amber-200/50' :
                        appt.status === 'CONFIRMED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        appt.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        appt.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-red-50 text-red-750 border border-red-200'
                      }`}>
                        {appt.status === 'PENDING_RANDOM' ? 'CHỜ PHÂN PHỐI' : appt.status === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' : appt.status === 'IN_PROGRESS' ? 'ĐANG LÀM' : appt.status === 'COMPLETED' ? 'HOÀN THÀNH' : 'ĐÃ HỦY'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {updatingId === appt.id ? (
                          <span className="text-gray-400 text-[11px] animate-pulse">Lưu trạng thái...</span>
                        ) : (
                          <>
                            {(appt.status === 'PENDING_RANDOM' || appt.status === 'CONFIRMED') && (
                              <>
                                <button onClick={() => handleStatusUpdate(appt.id, 'IN_PROGRESS')} className="px-2 py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-[11px] font-extrabold cursor-pointer transition-colors min-h-[44px] flex items-center">Bắt đầu làm</button>
                                <button onClick={() => handleStatusUpdate(appt.id, 'CANCELLED')} className="px-2 py-2.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 text-[11px] font-extrabold cursor-pointer transition-colors min-h-[44px] flex items-center">Hủy lịch</button>
                              </>
                            )}
                            {appt.status === 'IN_PROGRESS' && (
                              <>
                                <button onClick={() => handleStatusUpdate(appt.id, 'COMPLETED')} className="px-2 py-2.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 text-[11px] font-extrabold cursor-pointer transition-colors min-h-[44px] flex items-center">Hoàn thành</button>
                                <button onClick={() => handleStatusUpdate(appt.id, 'CANCELLED')} className="px-2 py-2.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 text-[11px] font-extrabold cursor-pointer transition-colors min-h-[44px] flex items-center">Hủy lịch</button>
                              </>
                            )}
                            {appt.status === 'COMPLETED' && <span className="text-gray-400 text-[10px] font-bold">Hoàn tất</span>}
                            {appt.status === 'CANCELLED' && <span className="text-rose-500 text-[10px] font-bold">Đã hủy bỏ</span>}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {list.map((appt) => (
              <div key={appt.id} className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base leading-tight">{appt.customers?.full_name || 'Khách lẻ'}</h4>
                    <p className="text-xs text-[#8D6E53] font-mono font-bold mt-0.5">Khung giờ: {formatTime(appt.start_time)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${/* status colors */ ''}`}>
                    {appt.status === 'PENDING_RANDOM' ? 'CHỜ CHỈ ĐỊNH' : appt.status === 'CONFIRMED' ? 'XÁC NHẬN' : appt.status === 'IN_PROGRESS' ? 'ĐANG LÀM' : appt.status === 'COMPLETED' ? 'HOÀN THÀNH' : 'ĐÃ HỦY'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-150/50 font-medium">
                  <div><span className="text-gray-400 font-bold block text-[10px] uppercase">Kỹ thuật viên</span><span className="font-bold text-gray-800 text-sm">{appt.users?.full_name || 'Chưa phân thợ'}</span></div>
                  <div className="text-right"><span className="text-gray-400 font-bold block text-[10px] uppercase">Thanh toán dự kiến</span><span className="font-black text-[#5C4033] text-sm font-mono">{(appt.total_amount || 0).toLocaleString('vi')} đ</span></div>
                </div>
                <div className="flex justify-end gap-1.5 pt-2 border-t border-gray-150/50">
                  {updatingId === appt.id ? (
                    <span className="text-gray-400 text-sm font-bold animate-pulse">Đang cập nhật...</span>
                  ) : (
                    <>
                      {(appt.status === 'PENDING_RANDOM' || appt.status === 'CONFIRMED') && (
                        <><button onClick={() => handleStatusUpdate(appt.id, 'IN_PROGRESS')} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center">Bắt đầu làm</button><button onClick={() => handleStatusUpdate(appt.id, 'CANCELLED')} className="px-3 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center">Hủy</button></>
                      )}
                      {appt.status === 'IN_PROGRESS' && (
                        <><button onClick={() => handleStatusUpdate(appt.id, 'COMPLETED')} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center">Hoàn thành</button><button onClick={() => handleStatusUpdate(appt.id, 'CANCELLED')} className="px-3 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center">Hủy</button></>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
