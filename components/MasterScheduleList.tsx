'use client'

import React from 'react';
import type { ApptInfo } from './MasterScheduleGrid';
import { DraggableApptCard, DroppableStaffCard } from './ScheduleDndComponents';

interface StaffInfo {
  id: string; full_name: string; username: string;
}

interface ListViewProps {
  viewType: 'grid' | 'list';
  listGroupType: 'time' | 'staff';
  setListGroupType: (_v: 'time' | 'staff') => void;
  hideEmptySlots: boolean;
  setHideEmptySlots: (_v: boolean) => void;
  filterStaffId: string;
  setFilterStaffId: (_v: string) => void;
  timeSlots: string[];
  displayStaffList: StaffInfo[];
  getSlotAppointment: (_staffId: string, _slot: string) => ApptInfo | null;
  getSlotLock: (_staffId: string, _slot: string) => object | null;
  getStatusStyle: (_appt: ApptInfo) => string;
  isCascadeShifted: (_appt: ApptInfo) => boolean;
  mode: 'READ_ONLY' | 'STAFF' | 'ADMIN';
  handleSelectAppt: (_appt: ApptInfo) => void;
  data: { appointments: ApptInfo[] };
  getVNTimeStr: (_dateStr: string) => string;
  getEffectiveStart: (_appt: ApptInfo) => string;
  getEffectiveEnd: (_appt: ApptInfo) => string;
}

const MasterScheduleList = React.memo(function MasterScheduleList({
  viewType,
  listGroupType,
  setListGroupType,
  hideEmptySlots,
  setHideEmptySlots,
  filterStaffId,
  setFilterStaffId,
  timeSlots,
  displayStaffList,
  getSlotAppointment,
  getStatusStyle,
  isCascadeShifted,
  mode,
  handleSelectAppt,
  data,
  getVNTimeStr,
  getEffectiveStart,
  getEffectiveEnd,
}: ListViewProps) {
  return (
    <div className={viewType === 'list' ? 'block space-y-6' : 'hidden'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF6F0]/40 p-3 rounded-2xl border border-[#EADDCD]/45">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#EADDCD]/60 shadow-xs max-w-max">
          <button
            type="button"
            onClick={() => setListGroupType('time')}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
              listGroupType === 'time'
                ? 'bg-[#5C4033] text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            ⏱️ Theo Khung Giờ
          </button>
          <button
            type="button"
            onClick={() => setListGroupType('staff')}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
              listGroupType === 'staff'
                ? 'bg-[#5C4033] text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            👤 Theo Kỹ Thuật Viên
          </button>
        </div>

        {listGroupType === 'time' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setHideEmptySlots(!hideEmptySlots)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer min-h-[44px] ${
                hideEmptySlots
                  ? 'bg-[#563c30] text-white border-[#563c30]'
                  : 'bg-white text-gray-600 border-[#EADDCD] hover:border-[#8D6E53]'
              }`}
            >
              {hideEmptySlots ? 'Hiện giờ rảnh' : 'Ẩn giờ rảnh'}
            </button>

            <select
              value={filterStaffId}
              onChange={(e) => setFilterStaffId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#EADDCD] outline-none text-gray-700 focus:ring-1 focus:ring-[#8D6E53] cursor-pointer"
            >
              <option value="">Tất cả thợ</option>
              {displayStaffList.map((s: StaffInfo) => (
                <option key={s.id} value={s.id}>
                  {s.full_name || s.username}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {listGroupType === 'time' ? (
        <TimeGroupedView
          timeSlots={timeSlots}
          displayStaffList={displayStaffList}
          filterStaffId={filterStaffId}
          hideEmptySlots={hideEmptySlots}
          getSlotAppointment={getSlotAppointment}
          mode={mode}
          handleSelectAppt={handleSelectAppt}
          isCascadeShifted={isCascadeShifted}
          getStatusStyle={getStatusStyle}
          getVNTimeStr={getVNTimeStr}
          getEffectiveStart={getEffectiveStart}
          getEffectiveEnd={getEffectiveEnd}
        />
      ) : (
        <StaffGroupedView
          displayStaffList={displayStaffList}
          mode={mode}
          handleSelectAppt={handleSelectAppt}
          isCascadeShifted={isCascadeShifted}
          getStatusStyle={getStatusStyle}
          data={data}
          getVNTimeStr={getVNTimeStr}
          getEffectiveStart={getEffectiveStart}
          getEffectiveEnd={getEffectiveEnd}
         />
      )}
    </div>
  );
});

export default MasterScheduleList;

interface TimeGroupedViewProps {
  timeSlots: string[];
  displayStaffList: StaffInfo[];
  filterStaffId: string;
  hideEmptySlots: boolean;
  getSlotAppointment: (_staffId: string, _slot: string) => ApptInfo | null;
  mode: 'READ_ONLY' | 'STAFF' | 'ADMIN';
  handleSelectAppt: (_appt: ApptInfo) => void;
  isCascadeShifted: (_appt: ApptInfo) => boolean;
  getStatusStyle: (_appt: ApptInfo) => string;
  getVNTimeStr: (_dateStr: string) => string;
  getEffectiveStart: (_appt: ApptInfo) => string;
  getEffectiveEnd: (_appt: ApptInfo) => string;
}

function TimeGroupedView({
  timeSlots,
  displayStaffList,
  filterStaffId,
  hideEmptySlots,
  getSlotAppointment,
  mode,
  handleSelectAppt,
  isCascadeShifted,
  getVNTimeStr,
  getEffectiveStart,
  getEffectiveEnd,
}: TimeGroupedViewProps) {
  if (displayStaffList.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#EADDCD]/50 p-4 sm:p-6 shadow-xs">
        <div className="p-8 text-center text-sm text-gray-400 bg-[#FAF6F0]/25 rounded-2xl italic">
          Chưa có kỹ thuật viên nào trực ngày này.
        </div>
      </div>
    );
  }

  const filteredStaffList = filterStaffId
    ? displayStaffList.filter((s: StaffInfo) => s.id === filterStaffId)
    : displayStaffList;

  const renderedSlots = timeSlots.filter((slot: string) => {
    if (!hideEmptySlots) return true;
    return filteredStaffList.some((staff: StaffInfo) => getSlotAppointment(staff.id, slot));
});

  if (renderedSlots.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#EADDCD]/50 p-4 sm:p-6 shadow-xs">
        <div className="p-12 text-center text-xs text-gray-400 italic">
          Không tìm thấy khung giờ bận nào khớp với bộ lọc.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#EADDCD]/50 p-4 sm:p-6 shadow-xs">
      <div className="relative border-l-2 border-[#EADDCD]/50 ml-3.5 pl-6 space-y-6">
        {renderedSlots.map((slot: string) => {
          const slotAppointments = filteredStaffList
            .map((staff: StaffInfo) => {
              const appt = getSlotAppointment(staff.id, slot);
              return appt ? { staff, appt } : null;
            })
            .filter(Boolean) as { staff: StaffInfo; appt: ApptInfo }[];

          const activeStaffIds = slotAppointments.map((sa) => sa.staff.id);
          const freeStaff = filteredStaffList.filter((staff: StaffInfo) => !activeStaffIds.includes(staff.id));

          const isBusy = slotAppointments.length > 0;
          const dotColor = isBusy ? 'bg-[#8D6E53] border-white' : 'bg-emerald-500 border-white';

          return (
            <div key={slot} id={`slot-${slot}`} className="relative group animate-in fade-in duration-200">
              <div className={`absolute -left-[32px] top-3.5 w-3 h-3 rounded-full border-2 ${dotColor} shadow-xs z-10`} />

              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#5C4033] bg-[#FAF0E6] px-2.5 py-1 rounded-xl max-w-max font-mono shadow-xs border border-[#EADDCD]/20">
                    {slot}
                  </span>
                  <div className="h-[1px] bg-gray-100 flex-1"></div>
                </div>

                {isBusy ? (
                  <div className="grid grid-cols-1 gap-2">
                    {slotAppointments.map(({ staff, appt }) => {
                      const servicesText =
                        appt.appointment_services?.map((as) => as.services?.name).join(' · ') || 'Chi tiết';
                      const shifted = isCascadeShifted(appt);
                      const start = getVNTimeStr(getEffectiveStart(appt));
                      const end = getVNTimeStr(getEffectiveEnd(appt));

                      return (
                        <DraggableApptCard
                          key={`${staff.id}-${appt.id}`}
                          appt={appt}
                          mode={mode}
                          onClick={() => handleSelectAppt(appt)}
                          className={`bg-white border border-[#EADDCD]/40 rounded-2xl p-3 sm:p-4 shadow-3xs hover:border-[#8D6E53] hover:translate-x-0.5 cursor-pointer transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${mode === 'ADMIN' ? 'active:cursor-grabbing' : ''}`}
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-[11px] font-extrabold rounded-md uppercase tracking-wider ${
                                  appt.status === 'CONFIRMED'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : appt.status === 'IN_PROGRESS'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : appt.status === 'COMPLETED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-[#FAF6F0] text-gray-700 border border-gray-200'
                                }`}
                              >
                                {appt.status === 'CONFIRMED'
                                  ? 'Sắp đến'
                                  : appt.status === 'IN_PROGRESS'
                                  ? 'Đang làm'
                                  : appt.status === 'COMPLETED'
                                  ? 'Đã xong'
                                  : appt.status}
                              </span>

                              <span className="text-xs font-extrabold text-gray-800 bg-gray-55 border border-gray-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-[#8D6E53] text-white text-[8px] flex items-center justify-center font-bold shrink-0">
                                  {(staff.full_name || staff.username).charAt(0).toUpperCase()}
                                </span>
                                KTV: {staff.full_name || staff.username}
                              </span>

                              <span className="text-xs font-extrabold text-[#5C4033] font-mono">
                                {start} - {end}
                              </span>
                              {shifted && (
                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                  ⬆ Đã dời lên sớm
                                </span>
                              )}
                            </div>

                            <p className="text-sm font-bold text-gray-900 mt-1">
                              {mode === 'READ_ONLY' ? 'Lịch bận khách' : appt.customers?.full_name || 'Khách lẻ'}
                            </p>

                            <p className="text-xs text-gray-500 truncate max-w-full">
                              {mode === 'READ_ONLY' ? 'Dịch vụ bảo mật' : servicesText}
                            </p>
                          </div>

                          <div className="flex sm:flex-col items-start sm:items-end gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                            <span className="text-[10px] text-gray-400">Thời lượng</span>
                            <span className="text-xs font-bold text-[#8D6E53] font-mono">
                              {appt.end_time ? Math.round(
                                (new Date(appt.end_time).getTime() - new Date(appt.start_time).getTime()) /
                                  (1000 * 60)
                              ) : 0}{' '}
                              phút
                            </span>
                          </div>
                        </DraggableApptCard>
                      );
                    })}
                  </div>
                ) : null}

                {!hideEmptySlots && freeStaff.length > 0 && (
                  <div className="bg-emerald-50/20 border border-emerald-100/50 px-3 py-2 rounded-2xl flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <p className="text-xs font-bold text-emerald-800 font-sans">
                      {freeStaff.length === filteredStaffList.length
                        ? 'Tất cả thợ đều rảnh'
                        : `Sẵn sàng (${freeStaff.length}): `}
                      {freeStaff.length < filteredStaffList.length && (
                        <span className="font-semibold text-emerald-700">
                          {freeStaff.map((s: StaffInfo) => s.full_name || s.username).join(', ')}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StaffGroupedViewProps {
  displayStaffList: StaffInfo[];
  mode: 'READ_ONLY' | 'STAFF' | 'ADMIN';
  handleSelectAppt: (_appt: ApptInfo) => void;
  isCascadeShifted: (_appt: ApptInfo) => boolean;
  getStatusStyle: (_appt: ApptInfo) => string;
  data: { appointments: ApptInfo[] };
  getVNTimeStr: (_dateStr: string) => string;
  getEffectiveStart: (_appt: ApptInfo) => string;
  getEffectiveEnd: (_appt: ApptInfo) => string;
}

function StaffGroupedView({
  displayStaffList,
  mode,
  handleSelectAppt,
  isCascadeShifted,
  data,
  getVNTimeStr,
  getEffectiveStart,
  getEffectiveEnd,
}: StaffGroupedViewProps) {
  if (displayStaffList.length === 0) {
    return (
      <div className="p-8 text-center text-sm col-span-full text-gray-400 bg-gray-50 rounded-2xl">
        Chưa có thợ nào ghi nhận làm việc vào ngày này.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {displayStaffList.map((staff: StaffInfo) => {
        const staffAppts = data.appointments
          .filter((appt: ApptInfo) => {
            const apptStaffId = appt.staff_id || '_unassigned';
            return apptStaffId === staff.id;
          })
          .sort((a: ApptInfo, b: ApptInfo) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        return (
          <DroppableStaffCard
            key={staff.id}
            staffId={staff.id}
            className={`bg-[#FAF6F0]/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs animate-in fade-in duration-300 transition-all border`}
          >
            <div className="flex justify-between items-center border-b border-[#EADDCD]/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#8D6E53] text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                    {(staff.full_name || staff.username).charAt(0).toUpperCase()}
                  </span>
                  <span className="font-bold text-sm text-[#3A2E2B]">{staff.full_name || staff.username}</span>
                </div>
              <span className="text-[11px] bg-white px-2.5 py-1 rounded-full text-gray-500 border border-[#EADDCD]/40">
                {staffAppts.length} ca đặt hẹn
              </span>
            </div>

            {staffAppts.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4 pl-3">Trống lịch - Có thể thả phân công vào đây</p>
            ) : (
              <div className="relative border-l-2 border-[#EADDCD]/60 ml-2.5 pl-4 py-1 space-y-4">
                {staffAppts.map((appt: ApptInfo) => {
                  const shiftedStaffView = isCascadeShifted(appt);
                  const servicesText =
                    appt.appointment_services?.map((as) => as.services?.name).join(' · ') || 'Chi tiết';
                  const start = getVNTimeStr(getEffectiveStart(appt));
                  const end = getVNTimeStr(getEffectiveEnd(appt));

                  const dotColor =
                    appt.status === 'CONFIRMED'
                      ? 'bg-amber-500 ring-amber-100'
                      : appt.status === 'IN_PROGRESS'
                      ? 'bg-blue-600 ring-blue-100'
                      : appt.status === 'COMPLETED'
                      ? 'bg-emerald-600 ring-emerald-100'
                      : 'bg-gray-400 ring-gray-100';

                  return (
                    <div key={appt.id} className="relative group">
                      <div
                        className={`absolute -left-[21px] top-4 w-2.5 h-2.5 rounded-full ring-4 ${dotColor} transition-all duration-300`}
                      />

                      <DraggableApptCard
                        appt={appt}
                        mode={mode}
                        onClick={() => handleSelectAppt(appt)}
                        className={`bg-white hover:bg-gray-50/80 p-3.5 rounded-xl border border-[#EADDCD]/60 shadow-xs cursor-pointer transition-all hover:translate-x-0.5 flex justify-between items-center gap-4 animate-in fade-in duration-200 ${mode === 'ADMIN' ? 'active:cursor-grabbing' : ''}`}
                      >
                        <div className="space-y-1 sm:space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-extrabold text-[#5C4033] bg-[#FAF0E6] px-2 py-0.5 rounded-md font-mono shrink-0">
                              {start} - {end}
                            </span>
                            {shiftedStaffView && (
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                                ⬆ Sớm
                              </span>
                            )}
                            <span className="text-xs font-bold text-gray-900 truncate">
                              {mode === 'READ_ONLY' ? 'Lịch bận' : appt.customers?.full_name || 'Khách lẻ'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 truncate max-w-full">
                            {mode === 'READ_ONLY' ? 'Dịch vụ bảo mật' : servicesText}
                          </p>
                        </div>

                        <span
                          className={`px-2 py-0.5 text-[11px] font-extrabold rounded-md uppercase shrink-0 tracking-wider ${
                            appt.status === 'CONFIRMED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : appt.status === 'IN_PROGRESS'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : appt.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-50 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {appt.status === 'CONFIRMED'
                            ? 'SẮP ĐẾN'
                            : appt.status === 'IN_PROGRESS'
                            ? 'ĐANG LÀM'
                            : appt.status === 'COMPLETED'
                            ? 'HOÀN THÀNH'
                            : appt.status}
                        </span>
                      </DraggableApptCard>
                    </div>
                  );
                })}
              </div>
            )}
          </DroppableStaffCard>
        );
      })}
    </div>
  );
}
