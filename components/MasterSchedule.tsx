'use client'

import { useState, useEffect, useMemo } from 'react';
import { getScheduleData } from '@/app/admin/schedule/actions';
import { swapAppointment, updateAppointmentByStaffOrAdmin } from '@/app/staff/actions';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, User, Phone, CheckCircle, Info, X, RefreshCw, Sparkles, Filter, Edit, Trash2 } from 'lucide-react';

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
  } catch (e) {
    const d = new Date(dateStr);
    return { hour: d.getHours(), minute: d.getMinutes() };
  }
}

function getVNTimeStr(dateStr: string) {
  try {
    const comps = getVNTimeComponents(dateStr);
    return `${comps.hour.toString().padStart(2, '0')}:${comps.minute.toString().padStart(2, '0')}`;
  } catch (e) {
    return '09:00';
  }
}

import { DndContext, useDraggable, useDroppable, DragOverlay, DragStartEvent, DragEndEvent } from '@dnd-kit/core';

// Drag & Drop wrapper components

function DraggableApptCard({ appt, mode, className, children, onClick }: any) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: appt.id,
    data: { appt }
  });

  if (mode !== 'ADMIN') {
    return <div className={className} onClick={onClick}>{children}</div>;
  }

  return (
    <div 
      ref={setNodeRef} 
      className={`${className} ${isDragging ? 'opacity-50' : ''}`} 
      onClick={onClick}
      {...listeners} 
      {...attributes}
    >
       {children}
    </div>
  );
}

function DroppableSlotCell({ id, staffId, children, className }: any) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { staffId }
  });

  return (
    <td 
      ref={setNodeRef}
      className={className + (isOver ? ' bg-amber-50 ring-2 ring-dashed ring-amber-500 rounded-xl z-20 shadow-inner' : '')}
    >
      {children}
    </td>
  );
}

function DroppableStaffCard({ staffId, children, className }: any) {
  const { isOver, setNodeRef } = useDroppable({
    id: `staff-${staffId}`,
    data: { staffId }
  });

  return (
    <div 
      ref={setNodeRef}
      className={className + (isOver ? ' border-amber-500 bg-amber-50/50 ring-2 ring-amber-500 ring-opacity-50' : ' border-[#EADDCD]')}
    >
      {children}
    </div>
  );
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
      setSelectedDate(todayStr);
    }
    setIsMounted(true);
  }, [dateOverride]);

  useEffect(() => {
    if (dateOverride) {
      setSelectedDate(dateOverride);
    }
  }, [dateOverride]);
  const [data, setData] = useState<any>({ staffList: [], appointments: [], allServices: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [newStaffId, setNewStaffId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [listGroupType, setListGroupType] = useState<'time' | 'staff'>('time');
  const [hideEmptySlots, setHideEmptySlots] = useState(true);
  const [filterStaffId, setFilterStaffId] = useState('');

  // Editing states for appointment
  const [isEditingSelected, setIsEditingSelected] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStaffId, setEditStaffId] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editServiceIds, setEditServiceIds] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Derive staff list including unassigned virtual rows
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

  const handleSelectAppt = (appt: any) => {
    setSelectedAppt(appt);
    setIsEditingSelected(false);
    setEditFullName(appt.customers?.full_name || '');
    setEditPhone(appt.customers?.phone || '');
    setEditStaffId(appt.staff_id || '_unassigned');
    
    try {
      setEditStartTime(getVNTimeStr(appt.start_time));
    } catch (e) {
      setEditStartTime('09:00');
    }
    
    const sIds = appt.appointment_services?.map((as: any) => as.service_id).filter(Boolean) || [];
    setEditServiceIds(sIds);
    setEditStatus(appt.status);
  };
  
  // DND Kit states
  const [activeDragAppt, setActiveDragAppt] = useState<any>(null);

  const handleDragStart = (e: DragStartEvent) => {
    const { active } = e;
    setActiveDragAppt(active.data.current?.appt || null);
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
      } catch (err) {
        setMessage({ type: 'error', text: 'Lỗi kết nối máy chủ' });
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewType('list');
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadData();
    }
  }, [selectedDate]);

  async function loadData() {
    setIsLoading(true);
    try {
      const res = await getScheduleData(selectedDate);
      setData(res);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  }

  // Generate 30-minute intervals: 09:00, 09:30, …, 20:30
  const timeSlots: string[] = [];
  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  // Include final hour slots
  timeSlots.push(`${END_HOUR}:00`);
  timeSlots.push(`${END_HOUR}:30`);

  // Pre-parse the start/end minutes for optimization to avoid redundant parsing inside high-density slots
  const parsedAppointments = useMemo(() => {
    if (!data.appointments) return [];
    return data.appointments.map((appt: any) => {
      const vnStart = getVNTimeComponents(appt.start_time);
      const vnEnd = getVNTimeComponents(appt.end_time);
      
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

  // Helper to check if an appointment covers a specific 30-min slot
  function getSlotAppointment(staffId: string, slotStr: string) {
    const [sh, sm] = slotStr.split(':').map(Number);
    const slotMinutes = sh * 60 + sm;

    return parsedAppointments.find((appt: any) => {
      const apptStaffId = appt.staff_id || '_unassigned';
      if (apptStaffId !== staffId) return false;
      return slotMinutes >= appt._startMins && slotMinutes < appt._endMins;
    });
  }

  function getStatusStyle(appt: any) {
    if (mode === 'READ_ONLY') {
      return 'bg-amber-100/90 hover:bg-amber-200 border-amber-200 text-amber-900 font-bold';
    }
    
    const status = appt.status;
    if (status === 'CONFIRMED') return 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600';
    if (status === 'IN_PROGRESS') return 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700';
    if (status === 'COMPLETED') return 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700';
    return 'bg-neutral-500 text-white border-neutral-600 hover:bg-neutral-600';
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
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi server' });
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
    } catch (err) {
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
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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

        {/* Date Selector and Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Custom Date Picker for past/future range */}
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
                className="text-xs font-bold bg-transparent border-none outline-none cursor-pointer text-[#3A2E2B] focus:ring-0"
              />
            </div>
          )}

          {/* Quick Date Selector Sliding Windows */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
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
          </div>
        </div>
      </div>

      {/* View Selection & Legend Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAF6F0]/60 p-4 rounded-2xl border border-[#EADDCD]">
        {/* Toggle Mode (Desktop Only) */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chế độ xem:</span>
          <div className="flex bg-white p-1 rounded-xl border border-[#EADDCD]/60 shadow-sm w-auto">
            <button 
              type="button"
              onClick={() => setViewType('grid')} 
              className={`flex-1 sm:flex-initial text-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === 'grid' ? 'bg-[#5C4033] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Biểu đồ ngang
            </button>
            <button 
              type="button"
              onClick={() => setViewType('list')} 
              className={`flex-1 sm:flex-initial text-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === 'list' ? 'bg-[#5C4033] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              📱 Biểu đồ đứng (Mobile)
            </button>
          </div>
        </div>

        {/* Legend Block */}
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
          </div>
        ) : (
          <div className="text-xs text-gray-500 italic">Nhấn vào lịch để xem chi tiết ca làm</div>
        )}
      </div>

      {/* Grid Container */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
          <div className="animate-spin w-8 h-8 border-2 border-[#8D6E53] border-t-transparent rounded-full" />
          <span className="text-xs">Đang tải biểu đồ thời gian...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Grid View (Horizontal table) - Only visible on md screens and up when viewType is 'grid' */}
          <div className={`${viewType === 'grid' ? 'hidden md:block' : 'hidden'} overflow-x-auto border border-[#EADDCD] rounded-2xl scrollbar-thin`}>
            <table className="w-full border-collapse text-left min-w-[800px] table-fixed">
              <thead>
                <tr className="bg-[#FAF6F0] border-b border-[#EADDCD]">
                  <th className="sticky left-0 bg-[#FAF6F0] z-10 p-3 text-xs font-bold uppercase tracking-wider text-gray-500 w-36 border-r border-[#EADDCD]">
                    Kỹ Thuật Viên
                  </th>
                  {timeSlots.map((slot) => (
                    <th key={slot} className="p-3 text-center text-[10px] font-bold text-gray-400 border-r border-[#EADDCD]/60">
                      {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayStaffList.length === 0 ? (
                  <tr>
                    <td colSpan={timeSlots.length + 1} className="p-8 text-center text-sm text-gray-400">
                      Chưa có thợ nào ghi nhận làm việc vào ngày này.
                    </td>
                  </tr>
                ) : (
                  displayStaffList.map((staff: any) => (
                    <tr key={staff.id} className="border-b border-[#EADDCD]/40 hover:bg-[#FAF6F0]/20 transition-all">
                      {/* Staff identity sticky card */}
                      <td className="sticky left-0 bg-white z-10 p-3 pr-4 border-r border-[#EADDCD] font-bold text-xs text-[#3A2E2B]">
                        <div className="truncate">{staff.full_name || staff.username}</div>
                        {staff.is_virtual ? (
                          <span className="text-[9px] font-medium text-amber-600 flex items-center gap-1 mt-0.5 bg-amber-50 w-max px-1.5 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            Chờ gán thợ
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-emerald-600 flex items-center gap-1 mt-0.5 bg-emerald-50 w-max px-1.5 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Đã trực
                          </span>
                        )}
                      </td>

                      {/* Time slots columns */}
                      {timeSlots.map((slot) => {
                        const appt = getSlotAppointment(staff.id, slot);
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
                                className={`w-full h-full rounded-xl border flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                                  mode === 'ADMIN' ? 'cursor-grab hover:scale-[1.02] active:scale-95' : ''
                                } ${getStatusStyle(appt)}`}
                              >
                                <span className="text-[10px] font-bold truncate max-w-full block leading-snug">
                                  {mode === 'READ_ONLY' ? 'Lịch bận' : appt.customers?.full_name || 'Khách lẻ'}
                                </span>
                                {mode !== 'READ_ONLY' && (
                                  <span className="text-[8px] opacity-80 truncate max-w-full block">
                                    {appt.appointment_services?.[0]?.services?.name || 'Chi tiết'}
                                  </span>
                                )}
                              </DraggableApptCard>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-emerald-600/80 bg-emerald-50/10 rounded-xl hover:bg-emerald-50/40 transition-colors">
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

          {/* List View / Timeline Mode (Stacked cards & Vertial timeline) - Always visible on mobile, or on md and up when viewType is 'list' */}
          <div className={viewType === 'list' ? 'block space-y-6' : 'block md:hidden space-y-6'}>
            {/* Sub-Filters and controls for the Mobile / List View */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF6F0]/40 p-3 rounded-2xl border border-[#EADDCD]/45">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#EADDCD]/60 shadow-xs max-w-max">
                <button
                  type="button"
                  onClick={() => setListGroupType('time')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    listGroupType === 'staff'
                      ? 'bg-[#5C4033] text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  👤 Theo Kỹ Thuật Viên
                </button>
              </div>

              {/* Extra filtering only for the vertical timeline 'time' view */}
              {listGroupType === 'time' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHideEmptySlots(!hideEmptySlots)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
                    {displayStaffList.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name || s.username}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Actual list content implementation */}
            {listGroupType === 'time' ? (
              /* Vertical Timeline Mode (By Time Slot) */
              <div className="bg-white rounded-3xl border border-[#EADDCD]/50 p-4 sm:p-6 shadow-xs">
                {displayStaffList.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400 bg-[#FAF6F0]/25 rounded-2xl italic">
                    Chưa có kỹ thuật viên nào trực ngày này.
                  </div>
                ) : (
                  (() => {
                    const filteredStaffList = filterStaffId
                      ? displayStaffList.filter((s: any) => s.id === filterStaffId)
                      : displayStaffList;

                    const renderedSlots = timeSlots.filter((slot) => {
                      if (!hideEmptySlots) return true;
                      return filteredStaffList.some((staff: any) => getSlotAppointment(staff.id, slot));
                    });

                    if (renderedSlots.length === 0) {
                      return (
                        <div className="p-12 text-center text-xs text-gray-400 italic">
                          Không tìm thấy khung giờ bận nào khớp với bộ lọc.
                        </div>
                      );
                    }

                    return (
                      <div className="relative border-l-2 border-[#EADDCD]/50 ml-3.5 pl-6 space-y-6">
                        {renderedSlots.map((slot) => {
                          const slotAppointments = filteredStaffList
                            .map((staff: any) => {
                              const appt = getSlotAppointment(staff.id, slot);
                              return appt ? { staff, appt } : null;
                            })
                            .filter(Boolean) as { staff: any; appt: any }[];

                          const activeStaffIds = slotAppointments.map((sa) => sa.staff.id);
                          const freeStaff = filteredStaffList.filter((staff: any) => !activeStaffIds.includes(staff.id));

                          const isBusy = slotAppointments.length > 0;
                          const dotColor = isBusy ? 'bg-[#8D6E53] border-white' : 'bg-emerald-500 border-white';

                          return (
                            <div key={slot} id={`slot-${slot}`} className="relative group animate-in fade-in duration-200">
                              {/* Dot on the vertical line */}
                              <div className={`absolute -left-[32px] top-3.5 w-3 h-3 rounded-full border-2 ${dotColor} shadow-xs z-10`} />

                              <div className="space-y-2.5">
                                {/* Hour identifier label */}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-[#5C4033] bg-[#FAF0E6] px-2.5 py-1 rounded-xl max-w-max font-mono shadow-xs border border-[#EADDCD]/20">
                                    {slot}
                                  </span>
                                  <div className="h-[1px] bg-gray-100 flex-1"></div>
                                </div>

                                {/* Stack of occupied cards */}
                                {isBusy ? (
                                  <div className="grid grid-cols-1 gap-2">
                                    {slotAppointments.map(({ staff, appt }) => {
                                      const servicesText =
                                        appt.appointment_services?.map((as: any) => as.services?.name).join(', ') || 'Chi tiết';
                                      const start = getVNTimeStr(appt.start_time);
                                      const end = getVNTimeStr(appt.end_time);

                                      return (
                                        <DraggableApptCard
                                          key={`${staff.id}-${appt.id}`}
                                          appt={appt}
                                          mode={mode}
                                          onClick={() => handleSelectAppt(appt)}
                                          className={`bg-white border border-[#EADDCD]/40 rounded-2xl p-4 shadow-3xs hover:border-[#8D6E53] hover:translate-x-0.5 cursor-pointer transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${mode === 'ADMIN' ? 'active:cursor-grabbing' : ''}`}
                                        >
                                          <div className="space-y-1 flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span
                                                className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wider ${
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

                                              <span className="text-xs font-extrabold text-gray-800 bg-gray-55 border border-gray-100 px-2 py-0.5 rounded-md">
                                                KTV: {staff.full_name || staff.username}
                                              </span>

                                              <span className="text-[10px] text-gray-400 font-bold font-mono">
                                                ({start} - {end})
                                              </span>
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
                                              {Math.round(
                                                (new Date(appt.end_time).getTime() - new Date(appt.start_time).getTime()) /
                                                  (1000 * 60)
                                              )}{' '}
                                              phút
                                            </span>
                                          </div>
                                        </DraggableApptCard>
                                      );
                                    })}
                                  </div>
                                ) : null}

                                {/* Available staff banner list */}
                                {!hideEmptySlots && freeStaff.length > 0 && (
                                  <div className="bg-emerald-50/20 border border-emerald-100/50 px-3 py-2 rounded-2xl flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                    <p className="text-xs font-bold text-emerald-800 font-sans">
                                      {freeStaff.length === filteredStaffList.length
                                        ? 'Tất cả thợ đều rảnh'
                                        : `Sẵn sàng (${freeStaff.length}): `}
                                      {freeStaff.length < filteredStaffList.length && (
                                        <span className="font-semibold text-emerald-700">
                                          {freeStaff.map((s: any) => s.full_name || s.username).join(', ')}
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
                    );
                  })()
                )}
              </div>
            ) : (
              /* Traditional Staff-wise timeline lists for mobile */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {displayStaffList.length === 0 ? (
                  <div className="p-8 text-center text-sm col-span-full text-gray-400 bg-gray-50 rounded-2xl">
                    Chưa có thợ nào ghi nhận làm việc vào ngày này.
                  </div>
                ) : (
                  displayStaffList.map((staff: any) => {
                    const staffAppts = data.appointments
                      .filter((appt: any) => {
                        const apptStaffId = appt.staff_id || '_unassigned';
                        return apptStaffId === staff.id;
                      })
                      .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

                    return (
                      <DroppableStaffCard
                        key={staff.id}
                        staffId={staff.id}
                        className={`bg-[#FAF6F0]/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs animate-in fade-in duration-300 transition-all border`}
                      >
                        <div className="flex justify-between items-center border-b border-[#EADDCD]/50 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="font-bold text-sm text-[#3A2E2B]">{staff.full_name || staff.username}</span>
                          </div>
                          <span className="text-[10px] bg-white px-2.5 py-1 rounded-full text-gray-500 border border-[#EADDCD]/40">
                            {staffAppts.length} ca đặt hẹn
                          </span>
                        </div>

                        {staffAppts.length === 0 ? (
                          <p className="text-xs text-gray-400 italic py-4 pl-3">Trống lịch - Có thể thả phân công vào đây</p>
                        ) : (
                          <div className="relative border-l-2 border-[#EADDCD]/60 ml-2.5 pl-4 py-1 space-y-4">
                            {staffAppts.map((appt: any) => {
                              const start = getVNTimeStr(appt.start_time);
                              const end = getVNTimeStr(appt.end_time);
                              const servicesText =
                                appt.appointment_services?.map((as: any) => as.services?.name).join(', ') || 'Chi tiết';

                              // Status colors for timeline nodes
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
                                  {/* Chronological Connector Dot */}
                                  <div
                                    className={`absolute -left-[21px] top-4 w-2.5 h-2.5 rounded-full ring-4 ${dotColor} transition-all duration-300`}
                                  />

                                  {/* Card Content block */}
                                  <DraggableApptCard
                                    appt={appt}
                                    mode={mode}
                                    onClick={() => handleSelectAppt(appt)}
                                    className={`bg-white hover:bg-gray-50/80 p-3.5 rounded-xl border border-[#EADDCD]/60 shadow-xs cursor-pointer transition-all hover:translate-x-0.5 flex justify-between items-center gap-4 animate-in fade-in duration-200 ${mode === 'ADMIN' ? 'active:cursor-grabbing' : ''}`}
                                  >
                                    <div className="space-y-1 sm:space-y-1.5 min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] font-extrabold text-[#5C4033] bg-[#FAF0E6] px-2 py-0.5 rounded-md font-mono shrink-0">
                                          {start} - {end}
                                        </span>
                                        <span className="text-xs font-bold text-gray-900 truncate">
                                          {mode === 'READ_ONLY' ? 'Lịch bận' : appt.customers?.full_name || 'Khách lẻ'}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-gray-500 truncate max-w-full">
                                        {mode === 'READ_ONLY' ? 'Dịch vụ bảo mật' : servicesText}
                                      </p>
                                    </div>

                                    <span
                                      className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase shrink-0 tracking-wider ${
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
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popover / Appointment Details Sidebar */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedAppt(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header banner */}
            <div className="p-5 border-b border-[#FAF6F0] bg-[#FAF6F0] flex items-center justify-between">
              <h4 className="font-semibold text-[#5C4033] flex items-center gap-1.5 text-xs uppercase tracking-wider font-sans">
                <Info className="w-4 h-4 text-[#8D6E53]" />
                {isEditingSelected ? '📅 Sửa thông tin đặt lịch' : '📋 Chi Tiết Lịch Hướng Dẫn'}
              </h4>
              <button onClick={() => setSelectedAppt(null)} className="p-1.5 text-gray-400 hover:text-gray-900 bg-white shadow-xs rounded-full transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isEditingSelected ? (
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Tên khách hàng */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Tên Khách Hàng</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full p-2.5 p-y-2.5 text-xs bg-white border border-[#EADDCD] rounded-xl font-semibold outline-none focus:ring-2 focus:ring-[#8D6E53]"
                    required
                  />
                </div>

                {/* Số điện thoại */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Số Điện Thoại</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-[#EADDCD] rounded-xl font-semibold outline-none focus:ring-2 focus:ring-[#8D6E53]"
                    required
                  />
                </div>

                {/* Kỹ thuật viên */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Chọn Kỹ Thuật Viên</label>
                  <select
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

                {/* Giờ hẹn */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Giờ Đặt Lịch</label>
                  <select
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

                {/* Trạng thái đơn đặt */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Trạng Thế Đơn Hàng</label>
                  <select
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

                {/* Dịch vụ checkboxes */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Chọn dịch vụ sử dụng</label>
                  <div className="max-h-36 overflow-y-auto border border-[#EADDCD]/40 rounded-2xl p-3 bg-[#FAF6F0]/20 space-y-2.5">
                    {(data.allServices || []).map((srv: any) => {
                      const isChecked = editServiceIds.includes(srv.id);
                      return (
                        <label key={srv.id} className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                          <input
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

                {/* Save and Cancel Form buttons */}
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
                {/* Customer */}
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

                  {/* Actions for authorized views */}
                  {mode !== 'READ_ONLY' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setIsEditingSelected(true)}
                        title="Chỉnh sửa thông tin đơn hàng"
                        className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl border border-amber-100 transition-all cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelAppt}
                        title="Hủy lịch hẹn"
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-100 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Timing */}
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

                {/* Service */}
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

                {/* Swap/Transfer Section for Staff or Admin */}
                {mode !== 'READ_ONLY' && (
                  <div className="pt-4 border-t border-gray-150 space-y-2.5">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Giao Việc / Đổi Kỹ Thuật Viên</span>
                    <div className="flex gap-2">
                      <select
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
