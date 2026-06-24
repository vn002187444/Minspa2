'use client'

import { User, Clock, CheckCircle, Info, X, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface SelectedAppt {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  total_amount: number;
  customers?: { full_name?: string; phone?: string } | null;
  appointment_services?: { services?: { name?: string } | null }[] | null;
  users?: { full_name?: string } | null;
  staff_id?: string;
}

interface AppointmentModalProps {
  selectedAppt: SelectedAppt | null;
  setSelectedAppt: (v: SelectedAppt | null) => void;
  isEditingSelected: boolean;
  setIsEditingSelected: (v: boolean) => void;
  mode: 'READ_ONLY' | 'STAFF' | 'ADMIN';
  data: { staffList?: { id: string; full_name?: string; username?: string }[]; allServices?: { id: string; name?: string; price?: number }[] };
  timeSlots: string[];
  editFullName: string;
  setEditFullName: (v: string) => void;
  editPhone: string;
  setEditPhone: (v: string) => void;
  editStaffId: string;
  setEditStaffId: (v: string) => void;
  editStartTime: string;
  setEditStartTime: (v: string) => void;
  editServiceIds: string[];
  setEditServiceIds: (v: string[]) => void;
  editStatus: string;
  setEditStatus: (v: string) => void;
  handleSaveEdit: (e: React.FormEvent) => Promise<void>;
  handleCancelAppt: () => Promise<void>;
  handleSwap: () => Promise<void>;
  isSavingEdit: boolean;
  isSwapping: boolean;
  newStaffId: string;
  setNewStaffId: (v: string) => void;
  getVNTimeStr: (dateStr: string) => string;
}

export default function AppointmentDetailModal({
  selectedAppt,
  setSelectedAppt,
  isEditingSelected,
  setIsEditingSelected,
  mode,
  data,
  timeSlots,
  editFullName,
  setEditFullName,
  editPhone,
  setEditPhone,
  editStaffId,
  setEditStaffId,
  editStartTime,
  setEditStartTime,
  editServiceIds,
  setEditServiceIds,
  editStatus,
  setEditStatus,
  handleSaveEdit,
  handleCancelAppt,
  handleSwap,
  isSavingEdit,
  isSwapping,
  newStaffId,
  setNewStaffId,
  getVNTimeStr,
}: AppointmentModalProps) {
  const trapRef = useFocusTrap(!!selectedAppt);

  if (!selectedAppt) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={isEditingSelected ? 'Sửa thông tin đặt lịch' : 'Chi tiết lịch hẹn'}
      onClick={() => setSelectedAppt(null)}
      onKeyDown={(e) => e.key === 'Escape' && setSelectedAppt(null)}
    >
      <div ref={trapRef} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header banner */}
        <div className="p-5 border-b border-[#FAF6F0] bg-[#FAF6F0] flex items-center justify-between">
          <h4 className="font-semibold text-[#5C4033] flex items-center gap-1.5 text-xs uppercase tracking-wider font-sans">
            <Info className="w-4 h-4 text-[#8D6E53]" />
            {isEditingSelected ? 'Sửa thông tin đặt lịch' : 'Chi Tiết Lịch Hẹn'}
          </h4>
          <button onClick={() => setSelectedAppt(null)} aria-label="Đóng modal" className="p-1.5 text-gray-400 hover:text-gray-900 bg-white shadow-xs rounded-full transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isEditingSelected ? (
          <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[80dvh] overflow-y-auto">
            <div className="space-y-1">
              <label htmlFor="detail-fullName" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Tên Khách Hàng</label>
              <input
                id="detail-fullName"
                type="text"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full p-2.5 p-y-2.5 text-xs bg-white border border-[#EADDCD] rounded-xl font-semibold outline-none focus:ring-2 focus:ring-[#8D6E53]"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="detail-phone" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Số Điện Thoại</label>
              <input
                id="detail-phone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-[#EADDCD] rounded-xl font-semibold outline-none focus:ring-2 focus:ring-[#8D6E53]"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="detail-staffId" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Chọn Kỹ Thuật Viên</label>
              <select
                id="detail-staffId"
                value={editStaffId}
                onChange={(e) => setEditStaffId(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-[#EADDCD] rounded-xl font-semibold outline-none focus:ring-2 focus:ring-[#8D6E53] cursor-pointer"
              >
                <option value="_unassigned">⚠️ Chưa Assign / Chờ Phân Bổ Ngẫu Nhiên</option>
                {data.staffList?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    🌟 {s.full_name || s.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="detail-startTime" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Giờ Đặt Lịch</label>
              <select
                id="detail-startTime"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-[#EADDCD] rounded-xl font-semibold outline-none focus:ring-2 focus:ring-[#8D6E53] cursor-pointer"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    ⏰ {slot}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="detail-status" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Trạng Thế Đơn Hàng</label>
              <select
                id="detail-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-[#EADDCD] rounded-xl font-semibold outline-none focus:ring-2 focus:ring-[#8D6E53] cursor-pointer"
              >
                <option value="CONFIRMED"> CONFIRMED (Xác Nhận)</option>
                <option value="IN_PROGRESS"> IN_PROGRESS (Đang Làm)</option>
                <option value="COMPLETED"> COMPLETED (Hoàn Thành)</option>
                <option value="CANCELLED"> CANCELLED (Đã Hủy Đơn / Đổi Ý)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Chọn dịch vụ sử dụng</label>
              <div className="max-h-36 overflow-y-auto border border-[#EADDCD]/40 rounded-2xl p-3 bg-[#FAF6F0]/20 space-y-2.5">
                {(data.allServices || []).map((srv: any) => {
                  const isChecked = editServiceIds.includes(srv.id);
                  return (
                    <label key={srv.id} htmlFor={`detail-service-${srv.id}`} className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                      <input
                        id={`detail-service-${srv.id}`}
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditServiceIds([...editServiceIds, srv.id]);
                          } else {
                            setEditServiceIds(editServiceIds.filter((id) => id !== srv.id));
                          }
                        }}
                        className="rounded text-[#8D6E53] focus:ring-[#8D6E53] w-4 h-4 border-[#EADDCD] cursor-pointer"
                      />
                      <span>{srv.name} ({(srv.price || 0).toLocaleString()}đ)</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[#FAF6F0]">
              <button
                type="button"
                onClick={() => setIsEditingSelected(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-bold text-xs p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
              >
                Hủy sửa
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="flex-1 bg-[#8D6E53] hover:bg-[#5C4033] text-white font-bold text-xs p-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSavingEdit ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#FAF0E6] rounded-xl flex items-center justify-center shrink-0 border border-[#EADDCD]">
                  <User className="w-5 h-5 text-[#8D6E53]" />
                </div>
                <div>
                  <h5 className="font-bold text-gray-900 text-base">{selectedAppt.customers?.full_name}</h5>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedAppt.customers?.phone}</p>
                </div>
              </div>

              {mode !== 'READ_ONLY' && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setIsEditingSelected(true)}
                    aria-label="Chỉnh sửa thông tin đơn hàng"
                    className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl border border-amber-100 transition-all cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelAppt}
                    aria-label="Hủy lịch hẹn"
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-100 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#FAF6F0]/50 border border-[#EADDCD]/20 rounded-2xl">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Thời Gian</div>
                <p className="text-xs font-black text-gray-700 mt-1 flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-[#8D6E53]" />
                  {getVNTimeStr(selectedAppt.start_time)} - {getVNTimeStr(selectedAppt.end_time)}
                </p>
              </div>
              <div className="p-3.5 bg-[#FAF6F0]/50 border border-[#EADDCD]/20 rounded-2xl">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Trạng Thái</div>
                <p className="text-xs font-extrabold text-[#8D6E53] mt-1 flex items-center gap-1.5 uppercase">
                  <CheckCircle className="w-3.5 h-3.5 text-[#8D6E53]" />
                  {selectedAppt.status}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Dịch Vụ Đã Đăng Ký</span>
              <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1.5">
                {selectedAppt.appointment_services?.map((as: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-white rounded-xl text-xs font-bold text-[#5C4033] flex justify-between border border-[#EADDCD]/40">
                    <span>{as.services?.name || 'Dịch vụ'}</span>
                  </div>
                ))}
              </div>
            </div>

            {mode !== 'READ_ONLY' && (
              <div className="pt-3 border-t border-[#FAF6F0] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Tổng Thanh Toán</span>
                  <div className="font-extrabold text-lg text-[#8D6E53] font-mono mt-0.5">
                    {Number(selectedAppt.total_amount).toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </div>
            )}

            {mode !== 'READ_ONLY' && (
              <div className="pt-4 border-t border-gray-150 space-y-2.5">
                <label htmlFor="detail-swapStaff" className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Giao Việc / Đổi Kỹ Thuật Viên</label>
                <div className="flex gap-2">
                  <select
                    id="detail-swapStaff"
                    value={newStaffId}
                    onChange={(e) => setNewStaffId(e.target.value)}
                    className="flex-1 p-2.5 text-xs bg-white border border-[#EADDCD] rounded-xl font-semibold outline-none focus:ring-2 focus:ring-[#8D6E53] cursor-pointer"
                  >
                    <option value="">Chọn thợ thay thế...</option>
                    {selectedAppt.staff_id && (
                      <option value="_unassigned">⚠️ Thu hồi ca (Chuyển về Hàng đợi)</option>
                    )}
                    {data.staffList
                      ?.filter((s: any) => s.id !== selectedAppt.staff_id)
                      .map((s: any) => (
                        <option key={s.id} value={s.id}>
                          🌟 {s.full_name || s.username}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={!newStaffId || isSwapping}
                    onClick={handleSwap}
                    className="bg-[#5C4033] hover:bg-[#3A2E2B] disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSwapping ? 'animate-spin' : ''}`} />
                    Cập nhật
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
