"use client";

import { useState, useEffect } from "react";
import { toast } from 'sonner';
import { Search, Plus, ShieldAlert, ChevronRight } from "lucide-react";
import { getStaffDetail, toggleStaffActive } from "../actions";
import AddStaffModal from "./AddStaffModal";
import EditStaffModal from "./EditStaffModal";
import StaffDetailModal from "./StaffDetailModal";

export default function TabStaff({
  staffs,
  staffError,
  userRole,
  onReload,
}: {
  staffs: any[];
  staffError?: string | null;
  userRole?: string;
  onReload: () => void;
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [detailStaff, setDetailStaff] = useState<any>(null);
  const [editStaff, setEditStaff] = useState<any>(null);
  const [staffStats, setStaffStats] = useState<Record<string, any>>({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  
  const [rangeType, setRangeType] = useState<"week" | "month" | "last_month" | "custom">("month");
  
  // Safely initialize date strings to avoid SSR / hydration mismatch
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const calculateDates = (type: string) => {
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);

    if (type === "week") {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
    } else if (type === "month") {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    } else if (type === "last_month") {
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end.setDate(0);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  };

  const filteredStaffs = (staffs || []).filter((staff) => {
    const term = searchTerm.toLowerCase();
    const name = (staff.full_name || "").toLowerCase();
    const cccd = (staff.cccd || "").toLowerCase();
    const matchesSearch = name.includes(term) || cccd.includes(term);
    const isStaffActive = staff.is_active !== false;
    if (statusFilter === "active") return matchesSearch && isStaffActive;
    if (statusFilter === "inactive") return matchesSearch && !isStaffActive;
    return matchesSearch;
  });

  useEffect(() => {
    const fetchAllStats = async () => {
      setLoadingStats(true);
      
      let dates: { start: string; end: string };
      if (rangeType === "custom") {
        const start = new Date(customStartDate || new Date());
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEndDate || new Date());
        end.setHours(23, 59, 59, 999);
        dates = {
          start: start.toISOString(),
          end: end.toISOString()
        };
      } else {
        dates = calculateDates(rangeType);
      }

      const statsObj: Record<string, any> = {};
      for (const s of staffs) {
        try {
          const detail = await getStaffDetail(s.id, dates.start, dates.end);
          statsObj[s.id] = detail;
        } catch (e) {
          console.error(e);
        }
      }
      setStaffStats(statsObj);
      setLoadingStats(false);
    };
    if (staffs.length > 0) {
      fetchAllStats();
    }
  }, [staffs, rangeType, customStartDate, customEndDate]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 md:mt-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-display whitespace-nowrap">
            Quản lý Nhân sự
          </h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { id: "week", label: "Tuần này" },
              { id: "month", label: "Tháng này" },
              { id: "last_month", label: "Tháng trước" },
              { id: "custom", label: "Tùy chọn" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setRangeType(btn.id as any)}
                className={`px-3 py-1 rounded-[8px] text-[11px] font-bold transition-all cursor-pointer ${
                  rangeType === btn.id ? "bg-[#8D6E53] text-white" : "bg-gray-100 text-gray-500 hover:text-gray-900"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          {rangeType === "custom" && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-0.5 animate-in slide-in-from-top-1 duration-200">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 text-[11px] text-[#5C4033] font-semibold border-2 border-[#EADDCD] rounded-xl outline-none bg-stone-50 focus:border-[#8D6E53] focus:bg-white cursor-pointer transition-all shadow-sm"
              />
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">đến</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 text-[11px] text-[#5C4033] font-semibold border-2 border-[#EADDCD] rounded-xl outline-none bg-stone-50 focus:border-[#8D6E53] focus:bg-white cursor-pointer transition-all shadow-sm"
              />
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-48 focus-within:w-full sm:focus-within:w-56 transition-all">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc CCCD..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all shadow-inner"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
          >
            <option value="all">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Đã vô hiệu hóa</option>
          </select>
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-black flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Thêm nhân viên
          </button>
        </div>
      </div>

      {staffError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div className="text-sm text-red-700">
            <p className="font-semibold mb-1">Lỗi tải danh sách nhân viên:</p>
            <p>{staffError}</p>
            <button
              onClick={onReload}
              className="mt-2 text-red-600 underline hover:text-red-800 font-medium cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {loadingStats ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      ) : (
        <>
          {/* Responsive Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-300 w-full">
            <div className="overflow-x-auto whitespace-nowrap scrollbar-none">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="p-4 pl-6">Nhân viên</th>
                    <th className="p-4 text-center">Trạng thái</th>
                    <th className="p-4 hidden md:table-cell">Số CCCD</th>
                    <th className="p-4 text-right hidden sm:table-cell">Doanh thu</th>
                    <th className="p-4 text-right hidden lg:table-cell">Hoa hồng</th>
                    <th className="p-4 text-right hidden xl:table-cell">Tiền Tip</th>
                    <th className="p-4 text-center hidden md:table-cell">Số ca HF</th>
                    <th className="p-4 pr-6 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {filteredStaffs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500 font-medium">
                        Không tìm thấy nhân viên nào
                      </td>
                    </tr>
                  ) : filteredStaffs.map((staff) => {
                    const stats = staffStats[staff.id] || {
                      totalRevenue: 0,
                      totalCommission: 0,
                      totalTip: 0,
                      totalCompleted: 0,
                    };
                    return (
                      <tr
                        key={staff.id}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        <td className="p-4 pl-6 font-medium text-gray-900 group-hover:text-pink-600 transition-colors cursor-pointer" onClick={() => setDetailStaff(staff)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setDetailStaff(staff)}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center font-bold">
                              {staff.full_name?.charAt(0) || "NV"}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-base sm:text-sm">
                                {staff.full_name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {staff.is_active !== false ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              Đã vô hiệu hóa
                            </span>
                          )}
                        </td>
                          <td className="p-4 font-mono text-gray-500 hidden md:table-cell cursor-pointer" onClick={() => setDetailStaff(staff)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setDetailStaff(staff)}>
                          {staff.cccd || "N/A"}
                        </td>
                        <td className="p-4 text-right font-bold text-gray-900 hidden sm:table-cell cursor-pointer" onClick={() => setDetailStaff(staff)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setDetailStaff(staff)}>
                          {(stats.totalRevenue || 0).toLocaleString("vi")}đ
                        </td>
                        <td className="p-4 text-right font-bold text-emerald-600 hidden lg:table-cell cursor-pointer" onClick={() => setDetailStaff(staff)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setDetailStaff(staff)}>
                          {(stats.totalCommission || 0).toLocaleString("vi")}đ
                        </td>
                        <td className="p-4 text-right font-bold text-pink-500 hidden xl:table-cell cursor-pointer" onClick={() => setDetailStaff(staff)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setDetailStaff(staff)}>
                          {(stats.totalTip || 0).toLocaleString("vi")}đ
                        </td>
                        <td className="p-4 text-center font-bold text-gray-800 hidden md:table-cell cursor-pointer" onClick={() => setDetailStaff(staff)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setDetailStaff(staff)}>
                          {stats.totalCompleted || 0}
                        </td>
                        <td className="p-4 pr-6 text-right flex items-center justify-end gap-1.5">
                          {userRole === 'ADMIN' && (
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await toggleStaffActive(staff.id, staff.is_active === false);
                                if (res.success) { onReload(); toast.success(staff.is_active !== false ? 'Đã vô hiệu hóa' : 'Đã kích hoạt'); }
                                else toast.error(res.error);
                              }}
                              className={`text-[11px] font-semibold px-2 py-1 rounded-lg cursor-pointer transition-all ${
                                staff.is_active !== false
                                  ? 'text-red-500 hover:bg-red-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {staff.is_active !== false ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditStaff(staff)}
                            className="text-[#8D6E53] hover:text-[#5C4033] text-sm font-semibold cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailStaff(staff)}
                            aria-label="Xem chi tiết nhân viên"
                            className="bg-gray-50 text-gray-400 group-hover:bg-pink-50 group-hover:text-pink-600 rounded-full p-1.5 transition-colors cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {isAddOpen && (
        <AddStaffModal
          onClose={() => setIsAddOpen(false)}
          onReload={onReload}
        />
      )}
      {editStaff && (
        <EditStaffModal
          staff={editStaff}
          userRole={userRole}
          onClose={() => setEditStaff(null)}
          onReload={onReload}
        />
      )}
      {detailStaff && (
        <StaffDetailModal
          staff={detailStaff}
          stats={staffStats[detailStaff.id]}
          onClose={() => setDetailStaff(null)}
        />
      )}
    </div>
  );
}
