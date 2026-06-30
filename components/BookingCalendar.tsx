'use client'

import { useMemo, memo } from 'react';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { SlotInfo } from '@/app/booking/actions/slots';
import { addDays, format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface BookingCalendarProps {
  slotAvailability: SlotInfo[];
  selectedDate: string;
  selectedTime: string;
  onSelectDate: (_date: string) => void;
  onSelectTime: (_time: string) => void;
  totalDuration: number;
}



export default memo(function BookingCalendar({
  slotAvailability,
  selectedDate,
  selectedTime,
  onSelectDate: _onSelectDate,
  onSelectTime,
  totalDuration,
}: BookingCalendarProps) {
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const _dates = useMemo(() => {
    const now = new Date();
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = addDays(now, i);
      days.push(format(d, 'yyyy-MM-dd'));
    }
    return days;
  }, []);

  const visibleSlots = useMemo(() =>
    slotAvailability.filter(s => s.status !== 'past'),
    [slotAvailability]
  );

  const stats = useMemo(() => {
    const total = visibleSlots.length;
    const full = visibleSlots.filter(s => s.status === 'fully_booked' || s.status === 'no_staff_present').length;
    const available = visibleSlots.filter(s => s.status === 'all_available' || s.status === 'some_available').length;
    const recommended = visibleSlots.filter(s => s.isRecommended).length;
    return { total, full, available, recommended };
  }, [visibleSlots]);

  if (slotAvailability.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#EADDCD] p-6 text-center">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Clock className="w-8 h-8" />
          <p className="text-sm font-medium">Chọn ngày để xem khung giờ trống</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stats.available === 0 && visibleSlots.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Hôm nay đã hết khung giờ trống. Vui lòng chọn ngày khác.
        </div>
      )}

      {stats.recommended > 0 && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            Còn <strong>{stats.recommended}</strong> khung giờ được đề xuất (nhiều nhân viên rảnh)
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#EADDCD] overflow-hidden">
        <div className="p-3 bg-[#FAF6F0] border-b border-[#EADDCD] flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5" suppressHydrationWarning>
            <Clock className="w-3.5 h-3.5" />
            {selectedDate === todayStr ? 'Hôm nay' : format(new Date(selectedDate), 'EEEE, dd/MM', { locale: vi })}
            {totalDuration > 0 && (
              <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                {totalDuration} phút
              </span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 p-3 max-h-48 overflow-y-auto">
          {visibleSlots.map((slot) => {
            const isFull = slot.status === 'fully_booked' || slot.status === 'no_staff_present';
            const isSelected = selectedTime === slot.time;
            const isRecommended = slot.isRecommended && !isFull;

            let cellStyle = 'bg-white border-[#EADDCD] text-gray-600';
            let label = slot.time;

            if (isFull) {
              cellStyle = 'bg-red-50/80 border-red-200 text-red-400 cursor-not-allowed';
            } else if (isSelected) {
              cellStyle = 'bg-amber-500 border-amber-500 text-white shadow-md scale-105 ring-2 ring-amber-300';
            } else if (isRecommended && slot.status === 'all_available') {
              cellStyle = 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 font-bold';
            } else if (slot.status === 'some_available') {
              const ratio = slot.availableStaff / Math.max(slot.totalStaff, 1);
              if (ratio >= 0.5) {
                cellStyle = 'bg-emerald-50/60 border-emerald-200 text-emerald-600 hover:bg-emerald-100 font-semibold';
              } else {
                cellStyle = 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100';
              }
            }

            return (
              <button
                key={slot.time}
                type="button"
                disabled={isFull}
                onClick={() => !isFull && onSelectTime(slot.time)}
                className={`relative py-2.5 px-2 text-xs font-bold rounded-xl border transition-all duration-150 min-h-[44px] ${cellStyle} ${
                  !isFull ? 'hover:shadow-sm active:scale-95 cursor-pointer' : 'cursor-not-allowed'
                }`}
                title={
                  isFull ? 'Không còn nhân viên trống' :
                  slot.availableStaffNames.length > 0
                    ? `Còn ${slot.availableStaff}/${slot.totalStaff} nhân viên: ${slot.availableStaffNames.join(', ')}`
                    : `Còn ${slot.availableStaff} nhân viên trống`
                }
              >
                {label}
                {isRecommended && (
                  <span className="absolute -top-2 -right-2 text-[10px] drop-shadow-sm">⭐</span>
                )}
                {slot.availableStaff > 0 && !isFull && (
                  <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs ${
                    isRecommended ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    {slot.availableStaff}
                  </span>
                )}
                {isRecommended && (
                  <span className="block text-[8px] text-amber-600 font-extrabold mt-0.5 leading-none">⭐ Gợi ý</span>
                )}
              </button>
            );
          })}
        </div>

        {slotAvailability.length > 0 && (
          <div className="px-3 py-2 bg-[#FAF6F0]/50 border-t border-[#EADDCD] flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-emerald-500"></div>
              <span>Rảnh</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-amber-500"></div>
              <span>Giới hạn</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-red-300"></div>
              <span>Hết chỗ</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-gray-200"></div>
              <span>Đã qua</span>
            </div>
          </div>
        )}
      </div>

      {selectedTime && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-600" />
          Đã chọn: <strong>{selectedTime}</strong>
          {totalDuration > 0 && (
            <> · Kết thúc dự kiến: <strong>{
              (() => {
                const [h, m] = selectedTime.split(':').map(Number);
                const endMin = h * 60 + m + totalDuration;
                const endH = Math.floor(endMin / 60);
                const endM = endMin % 60;
                return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
              })()
            }</strong></>
          )}
        </div>
      )}
    </div>
  );
});
