'use client'
import dynamic from 'next/dynamic';
const BottomNavigation = dynamic(() => import('@/components/BottomNavigation'), { ssr: false });
const AdminEditTipModal = dynamic(() => import('./AdminEditTipModal'), { ssr: false });

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Filter, ClipboardCheck, Trash2, 
  CheckCircle2, Clock, X, AlertTriangle, ShieldAlert, Star, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { getFilteredAppointments, deleteAppointment, getAdminSessionInfo } from '../actions';
import LoadingButton from '@/components/LoadingButton';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function AdminOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  
  // Advanced filters state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('today');
  const [startDateStr, setStartDateStr] = useState<string>('');
  const [endDateStr, setEndDateStr] = useState<string>('');

  // Operations and dialog state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editTipModal, setEditTipModal] = useState<{ isOpen: boolean; appt: any }>({ isOpen: false, appt: null });

  const handleFetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFilteredAppointments({
        status: statusFilter,
        dateRange: dateRangeFilter,
        startDate: startDateStr || undefined,
        endDate: endDateStr || undefined
      });
      setAppointments(data);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage("Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateRangeFilter, startDateStr, endDateStr]);

  // Load session user
  useEffect(() => {
    async function init() {
      try {
        const user = await getAdminSessionInfo();
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
          router.push('/login');
          return;
        }
        setSessionUser(user);
      } catch (err) {
        console.error(err);
        router.push('/login');
      }
    }
    init();
  }, [router]);

  // Fetch when filters or sessionUser changes
  useEffect(() => {
    if (sessionUser) {
      const tid = setTimeout(() => {
        handleFetch();
      }, 0);
      return () => clearTimeout(tid);
    }
  }, [statusFilter, dateRangeFilter, startDateStr, endDateStr, sessionUser, handleFetch]);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleStatusUpdate = async (id: string, nextStatus: string) => {
    setUpdatingId(id);
    clearMessages();
    try {
      const { updateAppointmentStatus } = await import("../../staff/actions");
      const res = await updateAppointmentStatus(id, nextStatus);
      if (res.success) {
        setSuccessMessage("Đã cập nhật trạng thái đơn hàng thành công!");
        await handleFetch();
      } else {
        setErrorMessage("Lỗi: " + res.error);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage("Không thể cập nhật trạng thái đơn.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    clearMessages();
    try {
      const res = await deleteAppointment(deleteConfirmId);
      if (res.success) {
        setSuccessMessage("Đã xóa vĩnh viễn đơn đặt hẹn thành công!");
        setDeleteConfirmId(null);
        await handleFetch();
      } else {
        setErrorMessage("Lỗi: " + res.error);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage("Gặp lỗi trong quá trình xóa đơn hàng.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return format(d, 'dd/MM/yyyy HH:mm');
    } catch {
      return '--/--/---- --:--';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_RANDOM':
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">
            Chờ chỉ định
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="bg-yellow-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">
            Đã xác nhận
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">
            Đang tiến hành
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">
            Đồng ý/Xong
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">
            Đã hủy bỏ
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-700 border border-gray-250 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] p-4 sm:p-6 text-[#3A2E2B] font-sans">
      <div className="max-w-7xl xxl:max-w-[1500px] mx-auto space-y-6">
        {/* Navigation & Header */}
        <button 
          onClick={() => router.push('/admin')} 
          className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#8D6E53] hover:text-[#5C4033] transition-colors"
          id="btn-back-dashboard"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Dashboard
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#EADDCD] shadow-sm animate-in fade-in duration-300">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-[#5C4033]">Lịch sử và Quản lý Đơn hàng</h1>
            <p className="text-xs text-gray-500 mt-1">Truy cứu nhanh, điều phối trạng thái hoặc xóa bỏ các giao dịch lịch hẹn của salon</p>
          </div>
          {sessionUser && (
            <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 border border-gray-100 rounded-2xl">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-gray-600">
                Vai trò: {sessionUser.role === 'ADMIN' ? 'Quản trị viên (ADMIN)' : 'Quản lý (MANAGER)'}
              </span>
            </div>
          )}
        </div>

        {/* Global Alert Messages */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-900">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-900">{successMessage}</p>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters and Search Bar Container */}
        <div className="bg-white p-5 rounded-3xl border border-[#EADDCD] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#8D6E53] border-b border-gray-50 pb-2">
            <Filter className="w-4 h-4" />
            <span>Bộ lọc nâng cao</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div className="space-y-1.5">
              <label htmlFor="order-statusFilter" className="text-xs font-bold uppercase tracking-wider text-gray-500">Trạng thái đơn</label>
              <select
                id="order-statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý / Sắp đến</option>
                <option value="IN_PROGRESS">Đang làm</option>
                <option value="COMPLETED">Đã hoàn thành</option>
                <option value="CANCELLED">Đã hủy lịch</option>
              </select>
            </div>

            {/* Date Range Selector */}
            <div className="space-y-1.5">
              <label htmlFor="order-dateRange" className="text-xs font-bold uppercase tracking-wider text-gray-500 font-sans">Khoảng thời gian</label>
              <select
                id="order-dateRange"
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value as "today" | "week" | "month" | "custom" | "all")}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]"
              >
                <option value="today">Sản phẩm Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="custom">Tùy chọn ngày cụ thể</option>
                <option value="all">Tất cả thời gian</option>
              </select>
            </div>

            {/* Start Date picker (Custom range only) */}
            {dateRangeFilter === 'custom' && (
              <div className="space-y-1.5 animate-in slide-in-from-top duration-200">
                <label htmlFor="order-startDate" className="text-xs font-bold uppercase tracking-wider text-gray-500">Từ ngày</label>
                <input
                  id="order-startDate"
                  type="date"
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]"
                />
              </div>
            )}

            {/* End Date picker (Custom range only) */}
            {dateRangeFilter === 'custom' && (
              <div className="space-y-1.5 animate-in slide-in-from-top duration-200">
                <label htmlFor="order-endDate" className="text-xs font-bold uppercase tracking-wider text-gray-500">Đến ngày</label>
                <input
                  id="order-endDate"
                  type="date"
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8D6E53]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Results List */}
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center text-gray-400 font-bold space-y-3 animate-pulse">
            <Clock className="w-8 h-8 text-amber-500 mx-auto animate-spin" />
            <p className="text-sm">Đang tải và đồng bộ danh sách đơn hàng...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center text-gray-500 space-y-2">
            <ClipboardCheck className="w-12 h-12 mx-auto text-gray-300" />
            <p className="font-bold text-base">Không tìm thấy đơn đặt lịch nào.</p>
            <p className="text-xs text-gray-450 text-gray-400">Hãy thay đổi bộ lọc hoặc chọn khoảng thời gian rộng hơn.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs font-black text-[#5C4033] tracking-widest uppercase">
              Tìm thấy {appointments.length} đơn đặt hẹn
            </div>

            {/* Desktop View Table */}
            <div className="hidden md:block bg-white rounded-3xl border border-[#EADDCD] shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#FAF6F0] text-[#8D6E53] font-bold uppercase text-[10px] tracking-wider border-b border-[#EADDCD]">
                  <tr>
                    <th className="p-4">Khách hàng / SDT</th>
                    <th className="p-4">Khung Giờ Đặt</th>
                    <th className="p-4">Dịch vụ đã chọn</th>
                    <th className="p-4">Kỹ thuật viên</th>
                    <th className="p-4 text-right">Tổng Tiền</th>
                    <th className="p-4 text-right">Tip</th>
                    <th className="p-4">Đánh giá</th>
                    <th className="p-4 text-center">Trạng thái</th>
                    <th className="p-4 text-right">Thao tác nâng cao</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 font-medium text-gray-700">
                  {appointments.map((appt: any) => (
                    <tr key={appt.id} className="hover:bg-gray-50/75 transition-colors">
                      {/* Name & Phone */}
                      <td className="p-4">
                        <p className="font-bold text-gray-900 text-sm">{appt.customers?.full_name || 'Khách lẻ'}</p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{appt.customers?.phone || 'Không có số'}</p>
                      </td>
                      {/* Hour */}
                      <td className="p-4">
                        <p className="font-bold text-gray-800">{formatDateTime(appt.start_time)}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {appt.id}</p>
                      </td>
                      {/* Services nested details */}
                      <td className="p-4 max-w-[220px]">
                        <div className="flex flex-wrap gap-1">
                          {appt.appointment_services && appt.appointment_services.length > 0 ? (
                            appt.appointment_services.map((as: any, idx: number) => (
                              <span key={idx} className="bg-amber-50 text-amber-900 px-2 py-0.5 rounded text-[11px] font-bold border border-amber-100">
                                {as.services?.name || 'Dịch vụ'}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Không có chi tiết</span>
                          )}
                        </div>
                      </td>
                      {/* Staff */}
                      <td className="p-4">
                        <span className="bg-gray-100 px-2.5 py-1 rounded-lg text-gray-800 border border-gray-200/50 font-bold text-[11px]">
                          {appt.users?.full_name || 'Chưa phân thợ'}
                        </span>
                      </td>
                      {/* Amount */}
                      <td className="p-4 text-right font-mono font-black text-[#5C4033] text-sm">
                        {(appt.total_amount || 0).toLocaleString('vi')} đ
                      </td>
                      {/* Tip */}
                      <td className="p-4 text-right">
                        <span className="font-mono font-bold text-pink-600 text-sm">
                          {(appt.tip_amount || 0).toLocaleString('vi')} đ
                        </span>
                      </td>
                      {/* Review */}
                      <td className="p-4 max-w-[200px]">
                        {appt.reviews && appt.reviews.length > 0 ? (() => {
                          const r = appt.reviews[0];
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="text-amber-500 font-black text-sm">{r.rating}</span>
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              </div>
                              {r.quick_tags && r.quick_tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {r.quick_tags.map((tag: string, i: number) => (
                                    <span key={i} className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded font-semibold text-gray-600">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {r.comment && (
                                <p className="text-[10px] text-gray-500 italic leading-relaxed line-clamp-2">
                                  &ldquo;{r.comment}&rdquo;
                                </p>
                              )}
                            </div>
                          );
                        })() : (
                          <span className="text-gray-400 italic text-[11px]">Chưa đánh giá</span>
                        )}
                      </td>
                      {/* Status */}
                      <td className="p-4 text-center">
                        {getStatusBadge(appt.status)}
                      </td>
                      {/* Control Operations */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <>
                            {(appt.status === 'PENDING_RANDOM' || appt.status === 'CONFIRMED') && (
                              <>
                                <LoadingButton
                                  onClick={() => handleStatusUpdate(appt.id, 'IN_PROGRESS')}
                                  className="px-2 py-2.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-105 hover:bg-blue-100 text-[11px] font-extrabold cursor-pointer transition-colors min-h-[44px] flex items-center"
                                  title="Bắt đầu phục vụ"
                                  isLoading={updatingId === appt.id}
                                  loadingText="Đang cập nhật..."
                                  variant="ghost"
                                  size="sm"
                                >
                                  Bắt đầu làm
                                </LoadingButton>
                                <LoadingButton
                                  onClick={() => handleStatusUpdate(appt.id, 'CANCELLED')}
                                  className="px-2 py-2.5 bg-rose-50 text-rose-500 rounded hover:bg-rose-100 text-[11px] font-extrabold cursor-pointer transition-colors min-h-[44px] flex items-center"
                                  title="Hủy đơn"
                                  isLoading={updatingId === appt.id}
                                  loadingText="Đang cập nhật..."
                                  variant="ghost"
                                  size="sm"
                                >
                                  Hủy lịch
                                </LoadingButton>
                              </>
                            )}
                            {appt.status === 'IN_PROGRESS' && (
                              <>
                                <LoadingButton
                                  onClick={() => handleStatusUpdate(appt.id, 'COMPLETED')}
                                  className="px-2 py-2.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 text-[11px] font-extrabold cursor-pointer transition-colors min-h-[44px] flex items-center"
                                  title="Hoàn thành lịch"
                                  isLoading={updatingId === appt.id}
                                  loadingText="Đang cập nhật..."
                                  variant="ghost"
                                  size="sm"
                                >
                                  Hoàn thành
                                </LoadingButton>
                                <LoadingButton
                                  onClick={() => handleStatusUpdate(appt.id, 'CANCELLED')}
                                  className="px-2 py-2.5 bg-rose-50 text-rose-500 rounded hover:bg-rose-100 text-[11px] font-extrabold cursor-pointer transition-colors min-h-[44px] flex items-center"
                                  title="Hủy đơn"
                                  isLoading={updatingId === appt.id}
                                  loadingText="Đang cập nhật..."
                                  variant="ghost"
                                  size="sm"
                                >
                                  Hủy lịch
                                </LoadingButton>
                              </>
                            )}
                            {appt.status === 'COMPLETED' && (
                              <div className="flex items-center gap-1">
                                <span className="text-gray-400 text-[10px] font-bold">Xong</span>
                                <button
                                  onClick={() => setEditTipModal({ isOpen: true, appt })}
                                  className="px-2 py-2.5 bg-pink-50 text-pink-600 rounded hover:bg-pink-100 text-[11px] font-extrabold cursor-pointer transition-colors min-h-[44px] flex items-center"
                                  title="Sửa tiền tip"
                                >
                                  <DollarSign className="w-3 h-3 inline" /> Tip
                                </button>
                              </div>
                            )}
                            {appt.status === 'CANCELLED' && (
                              <span className="text-gray-400 text-[10px] font-bold">Đã hủy</span>
                            )}

                            {/* Delete permanently (strictly restricted to state check userRole === 'ADMIN') */}
                            {sessionUser && sessionUser.role === 'ADMIN' && (
                              <LoadingButton
                                onClick={() => setDeleteConfirmId(appt.id)}
                                className="p-1 px-1.5 bg-rose-600 text-white rounded hover:bg-rose-700 text-[10.5px] font-black cursor-pointer ml-1 text-center transition-colors flex items-center justify-center"
                                title="Xóa vĩnh viễn"
                                variant="danger"
                                size="sm"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </LoadingButton>
                            )}
                          </>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards (Optimized with padding, font-size >= text-base, clear contrast) */}
            <div className="md:hidden space-y-4">
              {appointments.map((appt: any) => (
                <div key={appt.id} className="bg-white p-5 rounded-3xl border border-[#EADDCD] space-y-4 shadow-sm animate-in fade-in duration-200">
                  
                  {/* Top line Name & Phone */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-extrabold text-gray-950 text-base leading-tight">
                        {appt.customers?.full_name || 'Khách lẻ'}
                      </h3>
                      <p className="text-sm text-gray-500 font-mono mt-0.5">{appt.customers?.phone || 'Không có số'}</p>
                    </div>
                    <div>
                      {getStatusBadge(appt.status)}
                    </div>
                  </div>

                  {/* Body data rows with size text-sm/base */}
                  <div className="space-y-2 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 text-sm">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs text-gray-400 font-bold uppercase">Giờ hẹn</span>
                      <span className="font-bold text-gray-800">{formatDateTime(appt.start_time)}</span>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs text-gray-400 font-bold uppercase">Kỹ thuật viên</span>
                      <span className="font-bold text-gray-800">{appt.users?.full_name || 'Chưa phân thợ'}</span>
                    </div>

                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs text-gray-400 font-bold uppercase pt-0.5">Dịch vụ đặt</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[65%]">
                        {appt.appointment_services && appt.appointment_services.length > 0 ? (
                          appt.appointment_services.map((as: any, idx: number) => (
                            <span key={idx} className="bg-amber-50 text-amber-900 border border-amber-100 px-2 py-0.5 rounded text-[11px] font-bold">
                              {as.services?.name || 'Dịch vụ'}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">Không có</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs text-gray-400 font-bold uppercase">Tiền Tip</span>
                      <span className="font-mono font-bold text-pink-600 text-sm">
                        {(appt.tip_amount || 0).toLocaleString('vi')} đ
                        {appt.status === 'COMPLETED' && (
                          <button
                            onClick={() => setEditTipModal({ isOpen: true, appt })}
                            className="ml-2 px-2 py-0.5 bg-pink-50 text-pink-600 rounded hover:bg-pink-100 text-[9px] font-extrabold cursor-pointer"
                          >
                            <DollarSign className="w-2.5 h-2.5 inline" /> Sửa
                          </button>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2 pt-1 border-t border-gray-150/50">
                      <span className="text-xs text-gray-400 font-bold uppercase">Tổng dự tính</span>
                      <span className="font-black text-rose-800 font-mono text-base">
                        {(appt.total_amount || 0).toLocaleString('vi')} đ
                      </span>
                    </div>
                  </div>

                  {/* Review Section - Mobile */}
                  {appt.reviews && appt.reviews.length > 0 && (() => {
                    const r = appt.reviews[0];
                    return (
                      <div className="bg-amber-50/30 p-3 rounded-2xl border border-amber-100/50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Đánh giá khách hàng</span>
                          <div className="flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-lg">
                            <span className="font-black text-amber-800 text-xs">{r.rating}</span>
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          </div>
                        </div>
                        {r.quick_tags && r.quick_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {r.quick_tags.map((tag: string, i: number) => (
                              <span key={i} className="text-[9px] bg-white border border-amber-100 px-1.5 py-0.5 rounded font-bold text-amber-800">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {r.comment && (
                          <p className="text-[11px] text-gray-600 italic leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Mobile Actions - easy to interact */}
                  <div className="flex flex-wrap gap-2 items-center justify-end pt-2 border-t border-gray-100">
                    <>
                      {(appt.status === 'PENDING_RANDOM' || appt.status === 'CONFIRMED') && (
                        <>
                          <LoadingButton
                            onClick={() => handleStatusUpdate(appt.id, 'IN_PROGRESS')}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold font-sans active:scale-95 transition-all cursor-pointer text-center"
                            isLoading={updatingId === appt.id}
                            loadingText="Đang cập nhật..."
                            variant="primary"
                            size="md"
                          >
                            Bắt đầu dịch vụ
                          </LoadingButton>
                          <LoadingButton
                            onClick={() => handleStatusUpdate(appt.id, 'CANCELLED')}
                            className="px-3.5 py-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer text-center"
                            isLoading={updatingId === appt.id}
                            loadingText="Đang cập nhật..."
                            variant="ghost"
                            size="md"
                          >
                            Hủy
                          </LoadingButton>
                        </>
                      )}
                      {appt.status === 'IN_PROGRESS' && (
                        <>
                          <LoadingButton
                            onClick={() => handleStatusUpdate(appt.id, 'COMPLETED')}
                            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold font-sans active:scale-95 transition-all cursor-pointer text-center"
                            isLoading={updatingId === appt.id}
                            loadingText="Đang cập nhật..."
                            variant="primary"
                            size="md"
                          >
                            Hoàn thành
                          </LoadingButton>
                          <LoadingButton
                            onClick={() => handleStatusUpdate(appt.id, 'CANCELLED')}
                            className="px-3.5 py-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer text-center"
                            isLoading={updatingId === appt.id}
                            loadingText="Đang cập nhật..."
                            variant="ghost"
                            size="md"
                          >
                            Hủy
                          </LoadingButton>
                        </>
                      )}

                      {/* Delete button on mobile for Admin */}
                      {sessionUser && sessionUser.role === 'ADMIN' && (
                        <LoadingButton
                          onClick={() => setDeleteConfirmId(appt.id)}
                          className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                          title="Xóa vĩnh viễn"
                          variant="danger"
                          size="md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </LoadingButton>
                      )}
                    </>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Structured Deletion Confirmation Modal: Safe, beautiful and completely robust for iframe rendering */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-150 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-gray-900 font-display">Cảnh báo: Xóa vĩnh viễn</h3>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed font-sans">
              Bạn đang yêu cầu xóa vĩnh viễn lịch hẹn <strong className="font-mono bg-gray-100 px-1 py-0.5 rounded text-rose-600 text-xs">ID: {deleteConfirmId}</strong> khỏi hệ thống Supabase. 
              Hành động này <span className="font-extrabold text-rose-600">KHÔNG THỂ hoàn tác</span>. Mọi liên kết, chi tiết dịch vụ cũng sẽ bị xoá đồng thời.
            </p>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Hoạt động xóa này sẽ được ghi dấu vĩnh viễn vào nhật ký kiểm toán hệ thống (Audit Logs) cùng tên tài khoản Admin của bạn.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <LoadingButton
                disabled={deleteLoading}
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer text-center transition-all"
                variant="ghost"
                size="md"
              >
                Hủy bỏ
              </LoadingButton>
              <LoadingButton
                disabled={deleteLoading}
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold text-white cursor-pointer text-center shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2"
                isLoading={deleteLoading}
                loadingText="Đang xóa..."
                variant="danger"
                size="md"
              >
                Xác nhận xóa
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
      {editTipModal.isOpen && (
        <AdminEditTipModal
          appt={editTipModal.appt}
          onClose={() => setEditTipModal({ isOpen: false, appt: null })}
          onSaved={() => {
            handleFetch();
            setEditTipModal({ isOpen: false, appt: null });
          }}
        />
      )}
      <LoadingOverlay isVisible={deleteLoading} message="Đang xóa dữ liệu, vui lòng chờ..." />
      <BottomNavigation />
    </div>
  );
}


