'use client'
import { useState, useEffect, startTransition } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getStaffStats } from '@/app/staff/actions';
import { Activity, DollarSign, Star, TrendingUp } from 'lucide-react';

export default function ReportsTab() {
  const [rangeType, setRangeType] = useState<"week" | "month" | "last_month" | "custom">("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const fetchStats = async (startISO: string, endISO: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await getStaffStats(startISO, endISO);
      if (result && "success" in result && result.success) {
        setStats(result);
      } else {
        setError("Không thể lấy báo cáo từ hệ thống...");
      }
    } catch {
      setError("Không thể kết nối tải dữ liệu thống kê.");
    }
    setLoading(false);
  };

  useEffect(() => {
    const d = calculateDates(rangeType);
    setStartDate(d.startInput); // eslint-disable-line react-hooks/set-state-in-effect
    setEndDate(d.endInput);
    if (rangeType !== "custom") {
      startTransition(() => { fetchStats(d.start, d.end); });
    }
  }, [rangeType]);

  const handleCustomSearch = () => {
    if (!startDate || !endDate) {
      toast.error("Vui lòng chọn ngày bắt đầu và kết thúc.");
      return;
    }
    const startISO = new Date(startDate).toISOString();
    const endISO = new Date(endDate + "T23:59:59").toISOString();
    startTransition(() => { fetchStats(startISO, endISO); });
  };

  const formatCurrency = (value: number) => (value || 0).toLocaleString();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["week", "month", "last_month", "custom"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setRangeType(type)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                rangeType === type
                  ? "bg-pink-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {type === "week" ? "Tuần này" : type === "month" ? "Tháng này" : type === "last_month" ? "Tháng trước" : "Tùy chỉnh"}
            </button>
          ))}
        </div>
      </div>

      {rangeType === "custom" && (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="reportStartDate" className="block text-xs font-bold text-gray-500 mb-1">Từ ngày</label>
            <input id="reportStartDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2.5 border border-gray-200 rounded-xl text-xs font-semibold" />
          </div>
          <div>
            <label htmlFor="reportEndDate" className="block text-xs font-bold text-gray-500 mb-1">Đến ngày</label>
            <input id="reportEndDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2.5 border border-gray-200 rounded-xl text-xs font-semibold" />
          </div>
          <button onClick={handleCustomSearch} className="px-5 py-2.5 bg-pink-600 text-white rounded-xl text-xs font-bold cursor-pointer min-h-[44px]">Xem</button>
        </div>
      )}

      {loading && <div className="animate-pulse bg-gray-100 h-40 rounded-2xl" />}
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">{error}</div>}

      {stats?.data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white p-5 rounded-2xl shadow-sm space-y-1">
            <Activity className="w-5 h-5 opacity-80" />
            <p className="text-2xl font-black">{stats.data.totalAppointments || 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Đơn đã phục vụ</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
            <DollarSign className="w-5 h-5 text-green-500" />
            <p className="text-2xl font-black text-gray-900">{formatCurrency(stats.data.totalRevenue)}<span className="text-xs text-gray-400">đ</span></p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tổng doanh thu</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <p className="text-2xl font-black text-gray-900">{formatCurrency(stats.data.tips || 0)}<span className="text-xs text-gray-400">đ</span></p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tips nhận được</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <p className="text-2xl font-black text-gray-900">{stats.data.averageRating ? stats.data.averageRating.toFixed(1) : "—"}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Đánh giá TB</p>
          </div>
        </div>
      )}

      {stats?.recentAppointments && stats.recentAppointments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Lịch sử đơn gần đây</h4>
          <div className="space-y-3">
            {stats.recentAppointments.slice(0, 10).map((a: any) => (
              <div key={a.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-xs font-bold text-gray-800">{a.customers?.full_name || "Khách"}</p>
                  <p className="text-[10px] text-gray-400">{format(new Date(a.start_time), "HH:mm - dd/MM", { locale: vi })}</p>
                </div>
                <span className="text-xs font-bold text-pink-600">{(a.total_price || 0).toLocaleString()}đ</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
