'use client'

import React from 'react';
import { DraggableApptCard, DroppableSlotCell } from './ScheduleDndComponents';

interface StaffInfo {
  id: string; full_name: string; username: string; is_virtual: boolean; is_present: boolean;
}
export interface ApptInfo {
  id: string; customers?: { full_name?: string; phone?: string }; staff_id?: string;
  appointment_services?: { service_id: string; services?: { name?: string } }[];
  start_time: string; end_time?: string; status: string;
  actual_start_time?: string | null; actual_end_time?: string | null;
}

interface GridViewProps {
  activeTimeSlots: string[];
  displayStaffList: StaffInfo[];
  getSlotAppointment: (_staffId: string, _slot: string) => ApptInfo | null;
  getSlotLock: (_staffId: string, _slot: string) => object | null;
  getStatusStyle: (_appt: ApptInfo) => string;
  isCascadeShifted: (_appt: ApptInfo) => boolean;
  mode: 'READ_ONLY' | 'STAFF' | 'ADMIN';
  handleSelectAppt: (_appt: ApptInfo) => void;
}

export default React.memo(function MasterScheduleGrid({
  activeTimeSlots,
  displayStaffList,
  getSlotAppointment,
  getSlotLock,
  getStatusStyle,
  isCascadeShifted,
  mode,
  handleSelectAppt,
}: GridViewProps) {
  if (activeTimeSlots.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-400 bg-[#FAF6F0]/40 rounded-2xl italic border border-[#EADDCD]/30">
        Hôm nay chưa có lịch hẹn nào. Chọn ngày khác hoặc kiểm tra lại sau.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#EADDCD] rounded-2xl scrollbar-thin relative">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white/80 to-transparent z-10 md:hidden" />
      <table className="w-full border-collapse text-left min-w-[800px] table-fixed">
        <thead>
          <tr className="bg-[#FAF6F0] border-b border-[#EADDCD]">
            <th className="sticky left-0 bg-[#FAF6F0] z-10 p-3 text-xs font-bold uppercase tracking-wider text-gray-500 w-36 border-r border-[#EADDCD]">
              Kỹ Thuật Viên
            </th>
            {activeTimeSlots.map((slot) => (
              <th key={slot} className="p-3 text-center text-[10px] font-bold text-gray-400 border-r border-[#EADDCD]/60">
                {slot}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayStaffList.length === 0 ? (
            <tr>
              <td colSpan={activeTimeSlots.length + 1} className="p-8 text-center text-sm text-gray-400">
                Chưa có thợ nào ghi nhận làm việc vào ngày này.
              </td>
            </tr>
          ) : (
            displayStaffList.map((staff: StaffInfo) => (
              <tr key={staff.id} className="border-b border-[#EADDCD]/40 hover:bg-[#FAF6F0]/20 transition-all">
                <td className="sticky left-0 bg-white z-10 p-3 pr-4 border-r border-[#EADDCD] font-bold text-xs text-[#3A2E2B]">
                  <div className="truncate">{staff.full_name || staff.username}</div>
                  {staff.is_virtual ? (
                     <span className="text-[9px] font-medium text-amber-600 flex items-center gap-1 mt-0.5 bg-amber-50 w-max px-1.5 py-0.5 rounded transition-colors duration-300">
                       <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                       Chờ gán thợ
                     </span>
                   ) : staff.is_present ? (
                     <span className="text-[9px] font-medium text-emerald-600 flex items-center gap-1 mt-0.5 bg-emerald-50 w-max px-1.5 py-0.5 rounded transition-colors duration-300">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                       Đã trực
                     </span>
                   ) : (
                     <span className="text-[9px] font-medium text-gray-400 flex items-center gap-1 mt-0.5 bg-gray-50 w-max px-1.5 py-0.5 rounded transition-colors duration-300">
                       <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                       Chưa điểm danh
                     </span>
                   )}
                </td>

                {activeTimeSlots.map((slot) => {
                  const appt = getSlotAppointment(staff.id, slot);
                  const lock = getSlotLock(staff.id, slot);
                  return (
                    <DroppableSlotCell
                      key={slot}
                      id={`slot-${staff.id}-${slot}`}
                      staffId={staff.id}
                      className={`p-1 border-r border-[#EADDCD]/40 text-center relative h-14 transition-all duration-200`}
                    >
                      {appt ? (
                        <DraggableApptCard
                          appt={appt}
                          mode={mode}
                          onClick={() => handleSelectAppt(appt)}
                          className={`w-full h-full rounded-xl border border-l-4 flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                            mode === 'ADMIN' ? 'cursor-grab hover:scale-[1.02] active:scale-95' : ''
                          } ${getStatusStyle(appt)} ${isCascadeShifted(appt) ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                        >
                          <span className="text-[11px] font-bold truncate max-w-full block leading-snug">
                            {mode === 'READ_ONLY' ? 'Lịch bận' : appt.customers?.full_name || 'Khách lẻ'}
                          </span>
                          {mode !== 'READ_ONLY' && (
                            <span className="text-[10px] opacity-80 truncate max-w-full block">
                              {appt.appointment_services?.[0]?.services?.name || 'Chi tiết'}
                            </span>
                          )}
                          {isCascadeShifted(appt) && (
                            <span className="text-[7px] font-bold text-amber-700 mt-0.5">⬆ Đã dời</span>
                          )}
                        </DraggableApptCard>
                      ) : lock ? (
                        <div className={`w-full h-full flex items-center justify-center text-[10px] font-bold rounded-xl border-2 border-dashed cursor-not-allowed ${
                          mode === 'READ_ONLY'
                            ? 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 border-gray-400 text-gray-500'
                            : 'bg-gray-100/60 border-gray-300 text-gray-400'
                        }`}>
                          <span>🔒 Khóa</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400 bg-gray-50/50 rounded-xl hover:bg-gray-100/80 transition-colors">
                          Rảnh
                        </div>
                      )}
                    </DroppableSlotCell>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});
