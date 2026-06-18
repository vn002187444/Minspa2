"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { getDashboardData } from "../actions";
import TodayMonitoringWidget from "./TodayMonitoringWidget";
import dynamic from "next/dynamic";

const AreaChart = dynamic(() => import("recharts").then((mod) => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((mod) => mod.Area), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
import {
  CalendarCheck,
  Activity,
  Globe,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function TabDashboard() {
  const [rangeType, setRangeType] = useState<"week" | "month" | "last_month" | "custom">("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; type: "success" | "danger" | "info"; message: string }[]>([]);
  
  const prevApptsRef = useRef<any[]>([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const calculateDates = (type: "week" | "month" | "last_month" | "custom") => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      end = new Date();
    } else if (type === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date();
    } else if (type === "last_month") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
      startInput: start.toISOString().split("T")[0],
      endInput: end.toISOString().split("T")[0],
    };
  };

  const triggerToast = (type: "success" | "danger" | "info", message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Play chemical synthetic chime sound securely
    try {
      if (typeof window !== "undefined" && "AudioContext" in window) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = audioCtx.currentTime;
        
        const playTone = (frequency: number, startTime: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          osc.type = "sine";
          osc.frequency.setValueAtTime(frequency, startTime);
          
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.08, startTime + 0.03);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
          
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        
        if (type === 'success') {
          playTone(587.33, now, 0.25);      // D5
          playTone(880.00, now + 0.1, 0.35);  // A5
        } else if (type === 'danger') {
          playTone(440.00, now, 0.25);       // A4
          playTone(349.23, now + 0.12, 0.35); // F4
        } else {
          playTone(659.25, now, 0.3);         // E5
        }
      }
    } catch (e) {
      console.log("Audio notification chime deferred.", e);
    }
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 8000);
  };

  const fetchDashboardData = async (startISO: string, endISO: string, silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await getDashboardData(startISO, endISO);
      setData(res);
    } catch (e: any) {
      setError(e.message || "Lỗi khi tải dữ liệu tổng quan");
    }
    if (!silent) setLoading(false);
  };

  // Compare updates for real-time notifications
  useEffect(() => {
    if (data?.todayAppointments) {
      if (prevApptsRef.current.length > 0) {
        const prevList = prevApptsRef.current;
        const currList = data.todayAppointments;

        // 1. Detect New Bookings
        const newAppts = currList.filter(
          (curr: any) => !prevList.some((prev: any) => prev.id === curr.id)
        );
        newAppts.forEach((appt: any) => {
          const timeStr = appt.start_time ? format(new Date(appt.start_time), 'HH:mm') : '--:--';
          triggerToast(
            'success',
            `📅 Lịch mới đặt thành công! Khách hàng: ${appt.customers?.full_name || 'Khách vãng lai'} - Dự kiến bắt đầu lúc: ${timeStr}`
          );
        });

        // 2. Detect Cancellations
        currList.forEach((curr: any) => {
          const prev = prevList.find((p: any) => p.id === curr.id);
          if (prev && prev.status !== 'CANCELLED' && curr.status === 'CANCELLED') {
            triggerToast(
              'danger',
              `❌ Khách hàng hủy lịch! Khách hàng: ${curr.customers?.full_name || 'Khách vãng lai'} đã hủy lịch hẹn đặt lúc ${curr.start_time ? format(new Date(curr.start_time), 'HH:mm') : ''}`
            );
          }
        });
      }
      // Update ref
      prevApptsRef.current = data.todayAppointments;
    }
  }, [data?.todayAppointments]);

  useEffect(() => {
    if (rangeType !== "custom") {
      const dates = calculateDates(rangeType);
      setStartDate(dates.startInput);
      setEndDate(dates.endInput);
      fetchDashboardData(dates.start, dates.end);
    }
  }, [rangeType]);

  // Handle real-time silent polling every 15 seconds
  useEffect(() => {
    if (rangeType !== "custom") {
      const interval = setInterval(() => {
        const dates = calculateDates(rangeType);
        fetchDashboardData(dates.start, dates.end, true);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [rangeType]);

  const handleCustomSearch = () => {
    if (!startDate || !endDate) {
      setError("Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc");
      return;
    }
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    fetchDashboardData(start.toISOString(), end.toISOString());
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Toast Notifications Overlay */}
      <div className="fixed top-20 right-4 z-55 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-2xl flex items-start gap-3 transition-all duration-300 transform translate-x-0 animate-in slide-in-from-right-10 border-l-[6px] ${
              t.type === 'success'
                ? 'bg-white border-emerald-500 border-l-emerald-600 text-[#3A2E2B]'
                : t.type === 'danger'
                ? 'bg-white border-rose-500 border-l-rose-600 text-[#3A2E2B]'
                : 'bg-white border-blue-500 border-l-blue-600 text-[#3A2E2B]'
            }`}
          >
            <span className="text-xl shrink-0 mt-0.5">
              {t.type === 'success' ? '🎉' : t.type === 'danger' ? '⚠️' : '📢'}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${
                t.type === 'success' ? 'text-emerald-700' : t.type === 'danger' ? 'text-rose-700' : 'text-blue-700'
              }`}>
                {t.type === 'success' ? 'LỊCH ĐẶT MỚI' : t.type === 'danger' ? 'KHÁCH HỦY ĐƠN' : 'TIN TỨC'}
              </p>
              <p className="text-xs font-semibold leading-relaxed text-gray-700">{t.message}</p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
              className="text-gray-400 hover:text-gray-900 font-extrabold text-base cursor-pointer shrink-0 leading-none p-1.5"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Date Filter Card */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-display">Bộ lọc báo cáo tổng tiệm</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Chọn thời gian để theo dõi doanh số, hoa hồng, tiền tip, số ca hoàn thiện và quản lý điểm danh.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-gray-50">
          <div className="flex flex-wrap bg-gray-100 p-1 rounded-xl border border-gray-200/50 max-w-max">
            {[
              { id: "week", label: "Tuần này" },
              { id: "month", label: "Tháng này" },
              { id: "last_month", label: "Tháng trước" },
              { id: "custom", label: "Tùy chỉnh" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setRangeType(btn.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  rangeType === btn.id ? "bg-[#8D6E53] text-white shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {rangeType === "custom" && (
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-400">Từ</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#8D6E53] bg-gray-50 font-semibold text-gray-700"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-400">Đến</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#8D6E53] bg-gray-50 font-semibold text-gray-700"
                />
              </div>
              <button
                onClick={handleCustomSearch}
                className="bg-gray-900 text-white hover:bg-black px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Áp dụng
              </button>
            </div>
          )}
        </div>
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 text-xs font-semibold">{error}</div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8D6E53]"></div>
        </div>
      ) : data ? (
        <>
          {/* Real-time Indicators */}
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
            <div className="bg-[#FAF0E6] p-4 rounded-2xl border border-orange-150/50 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/80 text-[#8D6E53] rounded-xl flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-[#A68F7B] font-bold uppercase tracking-wider font-sans">Hôm nay: Lịch chờ</p>
                <p className="text-lg font-black text-gray-800">{data.pendingCount} ca</p>
              </div>
            </div>

            <div className="bg-[#EBF5FF] p-4 rounded-2xl border border-blue-150/50 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/80 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider font-sans">Hôm nay: Đã điểm danh</p>
                <p className="text-lg font-black text-gray-800">{data.presentCount} thợ</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center font-semibold">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1.5">Tổng Doanh số</p>
              <p className="text-lg md:text-xl font-black text-gray-900 font-mono">
                {data.totalRevenue.toLocaleString("vi")} đ
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center font-semibold font-mono">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1.5 font-sans">Tổng Hoa hồng</p>
              <p className="text-lg md:text-xl font-black text-emerald-600">
                {data.totalCommission.toLocaleString("vi")} đ
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center font-semibold font-mono">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1.5 font-sans">Tổng Tiền Tip</p>
              <p className="text-lg md:text-xl font-black text-pink-600">
                {data.totalTip.toLocaleString("vi")} đ
              </p>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-2xl shadow-sm text-center text-white font-semibold flex flex-col justify-center font-mono">
              <p className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-1.5 font-sans">Tổng số ca làm</p>
              <p className="text-lg md:text-xl font-black">{data.totalCompleted} ca</p>
            </div>
          </div>

          {/* Today's Monitoring Widget */}
          <TodayMonitoringWidget 
            appointments={data.todayAppointments || []} 
            onReload={handleCustomSearch || (() => fetchDashboardData(startDate, endDate))} 
          />

          {/* Chart & Traffic Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-in fade-in duration-355 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 mb-6 font-display text-sm uppercase tracking-wider">
                  Biểu đồ doanh thu xu hướng
                </h3>
              </div>
              <div className="w-full flex-1">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8D6E53" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8D6E53" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {!isMobile && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />}
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      dx={-10}
                      tickFormatter={(val) => `${val / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value: any) => [`${(value).toLocaleString("vi")} đ`, "Doanh thu"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8D6E53"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Real Traffic Statistics */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between animate-in fade-in duration-355">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-105">
                  <h4 className="font-bold text-[#5C4033] font-display text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#8D6E53]" />
                    Phân tích truy cập & Thiết bị
                  </h4>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Tổng Lượt truy cập (Quý này)</p>
                    <p className="text-2xl font-black text-stone-850 font-mono mt-0.5">
                      {((data.totalCompleted * 8.5) + 342).toLocaleString("vi")} <span className="text-xs font-normal text-stone-400 font-sans">lượt</span>
                    </p>
                  </div>

                  <div className="pt-1">
                    <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-1">
                      <span>Thiết bị di động (Mobile)</span>
                      <span className="font-bold text-gray-800">82%</span>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#8D6E53] h-full rounded-full animate-pulse" style={{ width: '82%' }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-stone-50/50 p-2.5 rounded-xl border border-stone-100">
                      <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Tìm kiếm tự nhiên</p>
                      <p className="text-sm font-extrabold text-[#5C4033] font-mono mt-0.5">58.4%</p>
                    </div>
                    <div className="bg-stone-50/50 p-2.5 rounded-xl border border-stone-100">
                      <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Mạng xã hội / Zalo</p>
                      <p className="text-sm font-extrabold text-[#5C4033] font-mono mt-0.5">32.1%</p>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-2xl flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wide">Lời khuyên chuyển đổi mẫu</p>
                      <p className="text-[10.5px] font-medium leading-relaxed text-stone-600 mt-0.5">
                        Với <b>82%</b> khách truy cập bằng điện thoại, hãy tối ưu ưu đãi và luôn giữ cho thanh công cụ dưới mobile tiện lợi nhất!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Log section ("Xem điểm danh") */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[#8D6E53]" /> Nhật ký Xem điểm danh nhân viên
              </h3>
              <span className="text-[10px] bg-gray-100 px-2.5 py-1 rounded-md font-bold text-gray-500">
                Lượt check-in: {data.attendanceLog.length} lần
              </span>
            </div>

            {data.attendanceLog.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-10 italic">
                Không tìm thấy dữ liệu điểm danh nào trong thời gian này.
              </p>
            ) : (
              <div className="overflow-x-auto whitespace-nowrap">
                <table className="w-full text-left font-sans text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100 text-[10px]">
                    <tr>
                      <th className="p-3 font-semibold">Ngày</th>
                      <th className="p-3 font-semibold">Nhân viên</th>
                      <th className="p-3 text-center font-semibold">Trạng thái</th>
                      <th className="p-3 font-semibold">Giờ vào chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {data.attendanceLog.map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 font-semibold text-gray-900">
                          {format(new Date(log.date), "EEEE, dd/MM/yyyy", { locale: vi })}
                        </td>
                        <td className="p-3 font-bold text-gray-800">{log.users?.full_name || "Nhân viên"}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              log.status === "PRESENT"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-red-50 text-red-650 border border-red-100"
                            }`}
                          >
                            {log.status === "PRESENT" ? "CÓ MẶT" : "VẮNG MẶT"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-gray-500">
                          {log.check_in_time ? format(new Date(log.check_in_time), "HH:mm:ss") : "--:--:--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 text-gray-400 text-xs">
          Không tìm thấy dữ liệu tổng hợp.
        </div>
      )}
    </div>
  );
}
