"use client";

import { useState, useEffect, startTransition } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
} from "lucide-react";
import { getAttendanceLogs } from "../actions";

export default function TabAttendance() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "PRESENT" | "ABSENT" | "LATE">("ALL");

  const loadLogs = async () => {
    startTransition(() => setLoading(true));
    try {
      const data = await getAttendanceLogs(startDate, endDate);
      startTransition(() => setLogs(data || []));
    } catch (e) {
      console.error(e);
      startTransition(() => setLogs([]));
    }
    startTransition(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = logs.filter((l) => {
    if (filter === "ALL") return true;
    return l.status === filter;
  });

  const present = logs.filter((l) => l.status === "PRESENT").length;
  const absent = logs.filter((l) => l.status === "ABSENT").length;
  const late = logs.filter((l) => l.status === "LATE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-display">Điểm Danh Nhân Viên</h2>
          <p className="text-sm text-gray-500 mt-1">Theo dõi trạng thái điểm danh của nhân viên</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-semibold">Có mặt</span>
          </div>
          <p className="text-2xl font-bold text-green-800 mt-1">{present}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-100">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-4 h-4" />
            <span className="text-xs font-semibold">Vắng</span>
          </div>
          <p className="text-2xl font-bold text-red-700 mt-1">{absent}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
          <div className="flex items-center gap-2 text-yellow-700">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold">Đi muộn</span>
          </div>
          <p className="text-2xl font-bold text-yellow-800 mt-1">{late}</p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="att_start_date" className="block text-xs font-semibold text-gray-500 mb-1">Từ ngày</label>
            <input
              id="att_start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent"
              suppressHydrationWarning
            />
          </div>
          <div>
            <label htmlFor="att_end_date" className="block text-xs font-semibold text-gray-500 mb-1">Đến ngày</label>
            <input
              id="att_end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent"
              suppressHydrationWarning
            />
          </div>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="px-4 py-2 bg-[#8D6E53] text-white rounded-lg text-sm font-semibold hover:bg-[#7A5F47] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? "Đang tải..." : "Tra cứu"}
          </button>
        </div>

        {/* Status Chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {(["ALL", "PRESENT", "ABSENT", "LATE"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 min-h-[44px] rounded-full text-xs font-semibold transition-colors flex items-center justify-center ${
                filter === s
                  ? "bg-[#8D6E53] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "ALL" && "Tất cả"}
              {s === "PRESENT" && "Có mặt"}
              {s === "ABSENT" && "Vắng"}
              {s === "LATE" && "Đi muộn"}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Table — Desktop */}
      <div className="hidden md:block">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4 pl-6">Nhân viên</th>
                <th className="p-4">Ngày</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 pr-6">Giờ check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">Đang tải dữ liệu...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    {logs.length === 0 ? "Chưa có dữ liệu điểm danh trong khoảng ngày này." : "Không có bản ghi phù hợp."}
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-gray-900">
                      {log.users?.full_name || log.users?.username || "N/A"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {format(new Date(log.date + "T00:00:00"), "dd/MM/yyyy")}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          log.status === "PRESENT"
                            ? "bg-green-50 text-green-700"
                            : log.status === "LATE"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {log.status === "PRESENT" && <CheckCircle2 className="w-3 h-3" />}
                        {log.status === "LATE" && <Clock className="w-3 h-3" />}
                        {log.status === "ABSENT" && <XCircle className="w-3 h-3" />}
                        {log.status === "PRESENT" && "Có mặt"}
                        {log.status === "LATE" && "Đi muộn"}
                        {log.status === "ABSENT" && "Vắng"}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-gray-500">
                      {log.check_in_time
                        ? format(new Date(log.check_in_time), "HH:mm")
                        : "---"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Mobile card view */}
      <div className="mt-4 space-y-3 md:hidden">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">Đang tải dữ liệu...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
            {logs.length === 0 ? "Chưa có dữ liệu điểm danh trong khoảng ngày này." : "Không có bản ghi phù hợp."}
          </div>
        ) : (
          filtered.map((log) => (
            <div key={log.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="font-bold text-gray-900">{log.users?.full_name || log.users?.username || "N/A"}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Ngày</span>
                  <span className="flex items-center gap-1 text-gray-700">
                    <CalendarDays className="w-3 h-3" />
                    {format(new Date(log.date + "T00:00:00"), "dd/MM/yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Check-in</span>
                  <span>{log.check_in_time ? format(new Date(log.check_in_time), "HH:mm") : "---"}</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-gray-400">Trạng thái</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      log.status === "PRESENT"
                        ? "bg-green-50 text-green-700"
                        : log.status === "LATE"
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {log.status === "PRESENT" && <CheckCircle2 className="w-3 h-3" />}
                    {log.status === "LATE" && <Clock className="w-3 h-3" />}
                    {log.status === "ABSENT" && <XCircle className="w-3 h-3" />}
                    {log.status === "PRESENT" && "Có mặt"}
                    {log.status === "LATE" && "Đi muộn"}
                    {log.status === "ABSENT" && "Vắng"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
