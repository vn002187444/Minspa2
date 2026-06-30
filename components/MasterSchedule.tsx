'use client'

import { useState, useEffect, useMemo, useCallback, startTransition } from 'react';
import { getScheduleData } from '@/app/admin/schedule/actions';
import { swapAppointment, updateAppointmentByStaffOrAdmin } from '@/app/staff/actions';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, Grid3x3, List } from 'lucide-react';
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useScheduleRealtime } from '@/lib/realtime';

import MasterScheduleGrid from './MasterScheduleGrid';
import MasterScheduleList from './MasterScheduleList';
import AppointmentDetailModal from './AppointmentDetailModal';

function getVNTimeComponents(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(date);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    return { hour, minute };
  } catch {
    const d = new Date(dateStr);
    return { hour: d.getHours(), minute: d.getMinutes() };
  }
}

function getVNTimeStr(dateStr: string) {
  try {
    const comps = getVNTimeComponents(dateStr);
    return `${comps.hour.toString().padStart(2, '0')}:${comps.minute.toString().padStart(2, '0')}`;
  } catch {
    return '09:00';
  }
}

function getEffectiveStart(appt: { actual_start_time?: string | null; start_time: string }): string {
  return appt.actual_start_time || appt.start_time;
}

function getEffectiveEnd(appt: { actual_end_time?: string | null; end_time?: string }): string {
  return appt.actual_end_time || appt.end_time || '';
}

interface CascadeAppt {
  start_time: string; end_time?: string;
  actual_start_time?: string | null; actual_end_time?: string | null;
}

function isCascadeShifted(appt: CascadeAppt): boolean {
  return !!(appt.actual_start_time || appt.actual_end_time) &&
    (appt.actual_start_time !== appt.start_time || appt.actual_end_time !== appt.end_time);
}

interface MasterScheduleProps {
  mode: 'READ_ONLY' | 'STAFF' | 'ADMIN';
  dateOverride?: string;
}

const START_HOUR = 9;
const END_HOUR = 20;

export default function MasterSchedule({ mode, dateOverride }: MasterScheduleProps) {
  const [selectedDate, setSelectedDate] = useState<string>(dateOverride || '');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!dateOverride) {
      const todayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
      startTransition(() => { setSelectedDate(todayStr); });
    }
    startTransition(() => { setIsMounted(true); });
  }, [dateOverride]);

  useEffect(() => {
    if (dateOverride) {
      startTransition(() => { setSelectedDate(dateOverride); });
    }
  }, [dateOverride]);

  const [data, setData] = useState<any>({ staffList: [], appointments: [], allServices: [], timeSlotLocks: [] });
  const [dateCache, setDateCache] = useState<Map<string, any>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [newStaffId, setNewStaffId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [listGroupType, setListGroupType] = useState<'time' | 'staff'>('time');
  const [hideEmptySlots, setHideEmptySlots] = useState(true);
  const [filterStaffId, setFilterStaffId] = useState('');

  const [isEditingSelected, setIsEditingSelected] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStaffId, setEditStaffId] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editServiceIds, setEditServiceIds] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const displayStaffList = useMemo(() => {
    if (!data.staffList) return [];
      const hasUnassigned = data.appointments?.some((a: any) => !a.staff_id);
    if (hasUnassigned) {
      return [
        ...data.staffList,
        { id: '_unassigned', full_name: '⚠️ Đơn Chưa Giao / Đặt Ngẫu Nhiên', username: 'unassigned', is_virtual: true }
      ];
    }
    return data.staffList;
  }, [data.staffList, data.appointments]);

  const handleSelectAppt = useCallback((appt: {
    id: string; customers?: { full_name?: string; phone?: string };
    staff_id?: string; start_time: string;
    appointment_services?: { service_id: string }[];
    status: string;
  }) => {
    setSelectedAppt(appt);
    setIsEditingSelected(false);
    setEditFullName(appt.customers?.full_name || '');
    setEditPhone(appt.customers?.phone || '');
    setEditStaffId(appt.staff_id || '_unassigned');
    try {
      setEditStartTime(getVNTimeStr(appt.start_time));
    } catch {
      setEditStartTime('09:00');
    }
    const sIds = appt.appointment_services?.map((as: { service_id: string }) => as.service_id).filter(Boolean) || [];
    setEditServiceIds(sIds);
    setEditStatus(appt.status);
  }, []);

  const [activeDragAppt, setActiveDragAppt] = useState<any>(null);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveDragAppt(e.active.data.current?.appt || null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveDragAppt(null);

    if (!over || !active) return;

    const appt = active.data.current?.appt;
    const targetStaffId = over.data.current?.staffId;

    const currentStaffId = appt.staff_id || '_unassigned';
    if (appt && targetStaffId && currentStaffId !== targetStaffId) {
      setIsLoading(true);
      try {
        const res = await swapAppointment(appt.id, targetStaffId);
        if (res.success) {
          setMessage({ type: 'success', text: 'Đã kéo thả và chuyển giao đơn hàng thành công!' });
          await loadData();
        } else {
          setMessage({ type: 'error', text: res.error || 'Có lỗi xảy ra khi chuyển đơn' });
        }
      } catch {
        setMessage({ type: 'error', text: 'Lỗi kết nối máy chủ' });
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      startTransition(() => { setViewType('list'); });
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  async function loadData() {
    const cached = dateCache.get(selectedDate);
    if (cached) {
      setData(cached);
      return;
    }
    setIsLoading(true);
    try {
      const res = await getScheduleData(selectedDate);
      setData(res);
      setDateCache(prev => new Map(prev).set(selectedDate, res));
    } catch {
      console.error('loadData failed');
    }
    setIsLoading(false);
  }

  const handleRealtimeRefresh = useCallback(() => {
    setDateCache(prev => {
      const next = new Map(prev);
      next.delete(selectedDate);
      return next;
    });
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useScheduleRealtime({ date: selectedDate, onDataChanged: handleRealtimeRefresh, enabled: !!selectedDate });

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    slots.push(`${END_HOUR}:00`);
    slots.push(`${END_HOUR}:30`);
    return slots;
  }, []);

  const parsedAppointments = useMemo(() => {
    if (!data.appointments) return [];
      return data.appointments.map((appt: any) => {
      const effStart = getEffectiveStart(appt);
      const effEnd = getEffectiveEnd(appt);
      const vnStart = getVNTimeComponents(effStart);
      const vnEnd = getVNTimeComponents(effEnd);

      const startMins = vnStart.hour * 60 + vnStart.minute;
      let endMins = vnEnd.hour * 60 + vnEnd.minute;

      if (isNaN(endMins) || endMins <= startMins) {
        endMins = startMins + 60;
      }
      return {
        ...appt,
        _startMins: startMins,
        _endMins: endMins
      };
    });
  }, [data.appointments]);

  const parsedLocks = useMemo(() => {
    if (!data.timeSlotLocks) return [];
      return data.timeSlotLocks.map((lock: any) => {
      const vnStart = getVNTimeComponents(lock.start_time);
      const vnEnd = getVNTimeComponents(lock.end_time);
      return {
        ...lock,
        _startMins: vnStart.hour * 60 + vnStart.minute,
        _endMins: (vnEnd.hour * 60 + vnEnd.minute) || (vnStart.hour * 60 + vnStart.minute + 60),
      };
    });
  }, [data.timeSlotLocks]);

  const apptLookupMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const appt of parsedAppointments) {
      const staffId = appt.staff_id || '_unassigned';
      for (let m = appt._startMins; m < appt._endMins; m += 30) {
        const key = `${staffId}-${m}`;
        if (!map.has(key)) {
          map.set(key, appt);
        }
      }
    }
    return map;
  }, [parsedAppointments]);

  const lockLookupMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const lock of parsedLocks) {
      for (let m = lock._startMins; m < lock._endMins; m += 30) {
        const key = `${lock.staff_id}-${m}`;
        if (!map.has(key)) {
          map.set(key, lock);
        }
      }
    }
    return map;
  }, [parsedLocks]);

  const activeTimeSlots = useMemo(() => {
      const staffIds = new Set(displayStaffList.map((s: any) => s.id));
    const activeSet = new Set<string>();
    for (const [key] of apptLookupMap) {
      const [sid, minsStr] = key.split('-');
      if (staffIds.has(sid)) {
        const mins = Number(minsStr);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        activeSet.add(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    for (const [key] of lockLookupMap) {
      const [sid, minsStr] = key.split('-');
      if (staffIds.has(sid)) {
        const mins = Number(minsStr);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        activeSet.add(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return timeSlots.filter(slot => activeSet.has(slot));
  }, [timeSlots, apptLookupMap, lockLookupMap, displayStaffList]);

  const getSlotAppointment = useCallback((staffId: string, slotStr: string) => {
    const [sh, sm] = slotStr.split(':').map(Number);
    return apptLookupMap.get(`${staffId}-${sh * 60 + sm}`);
  }, [apptLookupMap]);

  const getSlotLock = useCallback((staffId: string, slotStr: string) => {
    const [sh, sm] = slotStr.split(':').map(Number);
    const key = `${staffId}-${sh * 60 + sm}`;
    if (apptLookupMap.has(key)) return null;
    return lockLookupMap.get(key);
  }, [apptLookupMap, lockLookupMap]);

  const getStatusStyle = useCallback((appt: { status: string }) => {
    if (mode === 'READ_ONLY') {
      return 'bg-amber-100/90 hover:bg-amber-200 border-amber-200 text-amber-900 font-bold';
    }
    const status = appt.status;
    if (status === 'CONFIRMED') return 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600';
    if (status === 'IN_PROGRESS') return 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700';
    if (status === 'COMPLETED') return 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700';
    return 'bg-neutral-500 text-white border-neutral-600 hover:bg-neutral-600';
  }, [mode]);

  function goToToday() {
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
    setSelectedDate(todayStr);
  }

  async function handleSwap() {
    if (!selectedAppt || !newStaffId) return;
    setIsSwapping(true);
    setMessage(null);
    try {
      const res = await swapAppointment(selectedAppt.id, newStaffId);
      if (res.success) {
        setMessage({ type: 'success', text: 'Hoán đổi ca làm kỹ thuật viên thành công!' });
        setSelectedAppt(null);
        setNewStaffId('');
        await loadData();
      } else {
        setMessage({ type: 'error', text: res.error || 'Có lỗi xảy ra' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Có lỗi kết nối mạng' });
    }
    setIsSwapping(false);
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;

    setIsSavingEdit(true);
    const datePartStr = format(new Date(selectedAppt.start_time), 'yyyy-MM-dd');
    const startIso = `${datePartStr}T${editStartTime}:00`;

    try {
      const res = await updateAppointmentByStaffOrAdmin(selectedAppt.id, {
        fullName: editFullName,
        phone: editPhone,
        staffId: editStaffId,
        startTime: new Date(startIso).toISOString(),
        status: editStatus,
        serviceIds: editServiceIds
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'Đã cập nhật chi tiết lịch đặt hẹn thành công!' });
        setSelectedAppt(null);
        await loadData();
      } else {
        setMessage({ type: 'error', text: res.error || 'Có lỗi xảy ra khi cập nhật.' });
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Lỗi server' });
    }
    setIsSavingEdit(false);
  };

  const handleCancelAppt = async () => {
    if (!selectedAppt) return;
    if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này không?')) return;

    setIsLoading(true);
    try {
      const res = await updateAppointmentByStaffOrAdmin(selectedAppt.id, {
        status: 'CANCELLED'
      });
      if (res.success) {
        setMessage({ type: 'success', text: 'Đã hủy lịch hẹn thành công!' });
        setSelectedAppt(null);
        await loadData();
      } else {
        setMessage({ type: 'error', text: res.error || 'Lỗi khi hủy đơn' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi server khi hủy đơn' });
    }
    setIsLoading(false);
  };

  if (!isMounted || !selectedDate) {
    return (
      <div className="bg-white rounded-3xl border border-[#EADDCD] p-4 sm:p-6 shadow-sm h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
        <div className="animate-spin w-8 h-8 border-2 border-[#8D6E53] border-t-transparent rounded-full" />
        <span className="text-xs">Đang tải biểu đồ...</span>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="bg-white rounded-3xl border border-[#EADDCD] p-4 sm:p-6 shadow-sm space-y-6">
        {/* Date Navigation Badges */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#3A2E2B] flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-5 h-5 text-[#8D6E53]" />
              Lịch Làm Việc Tiệm Min
            </h3>
            <p className="text-xs text-gray-500">Xem dòng thời gian bận / rảnh của các kỹ thuật viên</p>
            {mode === 'ADMIN' && (
              <span className="text-[10px] text-[#8D6E53] font-bold mt-1 inline-block bg-amber-50 border border-amber-200/50 rounded px-2 py-0.5 animate-pulse">
                💡 Admin: Kéo thả trực tiếp lịch để chuyển ca ngay lập tức!
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {mode === 'ADMIN' && !dateOverride && (
              <div className="flex items-center gap-2 bg-[#FAF6F0] border border-[#EADDCD] px-3.5 py-2.5 rounded-xl shrink-0">
                <CalendarIcon className="w-4 h-4 text-[#8D6E53]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                    }
                  }}
                  aria-label="Chọn ngày"
                  className="text-xs font-bold bg-transparent border-none outline-none cursor-pointer text-[#3A2E2B] focus:ring-0"
                />
              </div>
            )}

            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none items-center">
              {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
                const parts = selectedDate.split('-').map(Number);
                const base = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
                const date = addDays(base, offset);
                const dateStr = format(date, 'yyyy-MM-dd');
                const isSelected = selectedDate === dateStr;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={`flex flex-col items-center justify-center min-w-[56px] h-14 rounded-xl border text-[11px] font-bold transition-all p-1 ${
                      isSelected
                        ? 'bg-[#5C4033] text-white border-[#5C4033] shadow-sm scale-105'
                        : 'bg-[#FAF6F0] text-gray-600 border-[#EADDCD] hover:border-[#8D6E53]'
                    }`}
                  >
                    <span className="text-[8px] uppercase tracking-wider opacity-85">
                      {format(date, 'eee', { locale: vi })}
                    </span>
                    <span className="text-sm mt-0.5 leading-none">{format(date, 'dd/MM')}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={goToToday}
                className="bg-[#8D6E53] text-white text-xs font-bold px-3 py-2 rounded-xl shrink-0 self-center"
              >
                Hôm Nay
              </button>
            </div>
          </div>
        </div>

        {/* View Selection & Legend Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAF6F0]/60 p-4 rounded-2xl border border-[#EADDCD]">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chế độ xem:</span>
            <div className="flex bg-white p-1 rounded-xl border border-[#EADDCD]/60 shadow-sm w-auto">
              <button
                type="button"
                onClick={() => setViewType('grid')}
                className={`flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-lg text-xs font-bold transition-all min-h-[44px] ${viewType === 'grid' ? 'bg-[#5C4033] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Biểu đồ ngang
              </button>
              <button
                type="button"
                onClick={() => setViewType('list')}
                className={`flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-lg text-xs font-bold transition-all min-h-[44px] ${viewType === 'list' ? 'bg-[#5C4033] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                📱 Biểu đồ đứng (Mobile)
              </button>
            </div>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setViewType('grid')}
              aria-label="Xem dạng lưới"
              className={`p-2 rounded-lg transition-all ${viewType === 'grid' ? 'bg-[#5C4033] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 border border-[#EADDCD]/60'}`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewType('list')}
              aria-label="Xem dạng danh sách"
              className={`p-2 rounded-lg transition-all ${viewType === 'list' ? 'bg-[#5C4033] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 border border-[#EADDCD]/60'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {mode !== 'READ_ONLY' ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] sm:text-xs font-semibold text-gray-600">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-500 shrink-0"></div>
                <span>Sắp đến (CONFIRMED)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-600 shrink-0"></div>
                <span>Đang làm (IN_PROGRESS)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-600 shrink-0"></div>
                <span>Đã xong (COMPLETED)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-gray-300 border border-dashed border-gray-400 shrink-0"></div>
                <span>🔒 Khóa (đã dời)</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic">Nhấn vào lịch để xem chi tiết ca làm</div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
            <div className="animate-spin w-8 h-8 border-2 border-[#8D6E53] border-t-transparent rounded-full" />
            <span className="text-xs">Đang tải biểu đồ thời gian...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Grid View */}
            <div className={`${viewType === 'grid' ? 'block' : 'hidden'}`}>
              <MasterScheduleGrid
                activeTimeSlots={activeTimeSlots}
                displayStaffList={displayStaffList}
                getSlotAppointment={getSlotAppointment}
                getSlotLock={getSlotLock}
                getStatusStyle={getStatusStyle}
                isCascadeShifted={isCascadeShifted}
                mode={mode}
                handleSelectAppt={handleSelectAppt}
              />
            </div>

            {/* List View */}
            <MasterScheduleList
              viewType={viewType}
              listGroupType={listGroupType}
              setListGroupType={setListGroupType}
              hideEmptySlots={hideEmptySlots}
              setHideEmptySlots={setHideEmptySlots}
              filterStaffId={filterStaffId}
              setFilterStaffId={setFilterStaffId}
              timeSlots={timeSlots}
              displayStaffList={displayStaffList}
              getSlotAppointment={getSlotAppointment}
              getSlotLock={getSlotLock}
              getStatusStyle={getStatusStyle}
              isCascadeShifted={isCascadeShifted}
              mode={mode}
              handleSelectAppt={handleSelectAppt}
              data={data}
              getVNTimeStr={getVNTimeStr}
              getEffectiveStart={getEffectiveStart}
              getEffectiveEnd={getEffectiveEnd}
            />
          </div>
        )}

        {/* Appointment Modal */}
        {selectedAppt && (
          <AppointmentDetailModal
            selectedAppt={selectedAppt}
            setSelectedAppt={setSelectedAppt}
            isEditingSelected={isEditingSelected}
            setIsEditingSelected={setIsEditingSelected}
            mode={mode}
            data={data}
            timeSlots={timeSlots}
            editFullName={editFullName}
            setEditFullName={setEditFullName}
            editPhone={editPhone}
            setEditPhone={setEditPhone}
            editStaffId={editStaffId}
            setEditStaffId={setEditStaffId}
            editStartTime={editStartTime}
            setEditStartTime={setEditStartTime}
            editServiceIds={editServiceIds}
            setEditServiceIds={setEditServiceIds}
            editStatus={editStatus}
            setEditStatus={setEditStatus}
            handleSaveEdit={handleSaveEdit}
            handleCancelAppt={handleCancelAppt}
            handleSwap={handleSwap}
            isSavingEdit={isSavingEdit}
            isSwapping={isSwapping}
            newStaffId={newStaffId}
            setNewStaffId={setNewStaffId}
            getVNTimeStr={getVNTimeStr}
          />
        )}

        {/* Message feedback */}
        {message && (
          <div className={`p-4 rounded-2xl text-xs font-semibold text-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {message.text}
          </div>
        )}

        {activeDragAppt && (
          <DragOverlay zIndex={9999}>
            <div className={`w-full max-w-[200px] rounded-xl border flex flex-col items-center justify-center p-2 cursor-grabbing shadow-lg opacity-80 rotate-2 ${getStatusStyle(activeDragAppt)}`}>
              <span className="text-[12px] font-bold truncate max-w-full block leading-snug">
                {activeDragAppt.customers?.full_name || 'Khách lẻ'}
              </span>
            </div>
          </DragOverlay>
        )}
      </div>
    </DndContext>
  );
}
