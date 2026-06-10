"use client";

import { useState, useEffect } from "react";
import { getCustomers, getCustomerStats } from "./actions";
import { Search, ChevronLeft, ChevronRight, BarChart2, Star, Calendar, Clock, DollarSign, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function CustomerCRM() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 15;
  const totalPages = Math.ceil(totalCount / limit);

  // Modal / Detail state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [page, searchTerm]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, count } = await getCustomers(page, limit, searchTerm);
      setCustomers(data);
      setTotalCount(count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page
    fetchCustomers();
  };

  const openCustomerStats = async (customerId: string) => {
    setSelectedCustomerId(customerId);
    setLoadingStats(true);
    try {
      const data = await getCustomerStats(customerId);
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const closeCustomerStats = () => {
    setSelectedCustomerId(null);
    setStats(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* 1. GIAO DIỆN DANH SÁCH KHÁCH HÀNG */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
          <h2 className="text-xl font-bold text-gray-900 font-display">Danh sách khách hàng ({totalCount})</h2>
          
          <form onSubmit={handleSearch} className="w-full md:w-auto flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Tìm tên hoặc SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full md:w-64 text-gray-700"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Số điện thoại</th>
                <th className="px-6 py-4">Lần ghé gần nhất</th>
                <th className="px-6 py-4 text-right">Phân tích</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">Đang tải dữ liệu...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">Không tìm thấy khách hàng nào.</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{c.full_name}</td>
                    <td className="px-6 py-4 text-gray-600">{c.phone}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {c.last_visit ? format(new Date(c.last_visit), "dd/MM/yyyy", { locale: vi }) : "Chưa có"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openCustomerStats(c.id)}
                        className="inline-flex items-center justify-center px-4 py-2 bg-[#FAF0E6] text-[#8D6E53] hover:bg-[#F0E6DA] font-semibold rounded-lg text-xs transition-colors"
                      >
                        <BarChart2 className="w-3.5 h-3.5 mr-1.5" />
                        Xem Hồ Sơ Chi Tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Trang {page} / {totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. GIAO DIỆN HỒ SƠ CHI TIẾT & PHÂN TÍCH (Modal) */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="sticky top-0 bg-white/95 backdrop-blur z-10 p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold font-display text-gray-900">
                  {stats?.customer?.full_name || "Hồ sơ khách hàng"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{stats?.customer?.phone}</p>
              </div>
              <button
                onClick={closeCustomerStats}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {loadingStats ? (
                <div className="py-20 text-center animate-pulse text-gray-400">
                  <BarChart2 className="w-10 h-10 mx-auto mb-4 opacity-50" />
                  Đang phân tích dữ liệu CRM...
                </div>
              ) : stats ? (
                <div className="space-y-8">
                  {/* A & B: Thống kê Vận hành & Tài chính */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50">
                      <div className="flex items-center text-blue-800 mb-2">
                        <Calendar className="w-5 h-5 mr-2" />
                        <h4 className="font-semibold">Lượt Ghé Tiệm</h4>
                      </div>
                      <p className="text-3xl font-bold text-blue-900">{stats.totalVisits}</p>
                      <p className="text-sm text-blue-700/80 mt-1">Tổng số đơn hoàn thành</p>
                    </div>

                    <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/50">
                      <div className="flex items-center text-emerald-800 mb-2">
                        <DollarSign className="w-5 h-5 mr-2" />
                        <h4 className="font-semibold">Tổng Chi Tiêu (LTV)</h4>
                      </div>
                      <p className="text-3xl font-bold text-emerald-900">{formatCurrency(stats.totalSpent)}</p>
                      <p className="text-sm text-emerald-700/80 mt-1">Lifetime Value</p>
                    </div>

                    <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-100/50">
                      <div className="flex items-center text-purple-800 mb-2">
                        <Clock className="w-5 h-5 mr-2" />
                        <h4 className="font-semibold">Tần Suất Ghé Thăm</h4>
                      </div>
                      <p className="text-3xl font-bold text-purple-900">
                        {stats.avgDaysBetweenVisits ? `${stats.avgDaysBetweenVisits} ngày` : "N/A"}
                      </p>
                      <p className="text-sm text-purple-700/80 mt-1">Chu kỳ trung bình</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* C. Phân tích Thói quen Dịch vụ */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                        <Star className="w-5 h-5 mr-2 text-yellow-500" />
                        Dịch vụ yêu thích
                      </h4>
                      {stats.topServices && stats.topServices.length > 0 ? (
                        <div className="space-y-3">
                          {stats.topServices.map((srv: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
                              <span className="font-medium text-gray-800">{srv.name}</span>
                              <span className="text-sm bg-white px-2.5 py-1 rounded-full text-gray-600 font-bold shadow-sm">{srv.count} lần</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Chưa có đủ dữ liệu lịch sử.</p>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                        <BarChart2 className="w-5 h-5 mr-2 text-indigo-500" />
                        Chi tiêu các tháng 
                      </h4>
                      {stats.chartData && stats.chartData.length > 0 ? (
                        <div className="space-y-3">
                          {stats.chartData.map((data: any, idx: number) => (
                            <div key={idx} className="flex flex-col space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-600">Tháng {data.month}</span>
                                <span className="font-semibold text-gray-900">{formatCurrency(data.amount)}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div 
                                  className="bg-indigo-400 h-2 rounded-full" 
                                  style={{ width: `${Math.min(100, (data.amount / stats.totalSpent) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Chưa có hóa đơn nào.</p>
                      )}
                    </div>
                  </div>

                  {/* D. Nhật ký Hóa đơn (Bill History) */}
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-gray-600" />
                      Nhật ký Hóa đơn gần đây
                    </h4>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      {stats.recentBills && stats.recentBills.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                          {stats.recentBills.map((bill: any) => (
                            <div key={bill.id} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-bold text-gray-900 text-sm">
                                    {format(new Date(bill.start_time), "dd/MM/yyyy HH:mm")}
                                  </p>
                                  <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                    <User className="w-3 h-3 mr-1" />
                                    Thợ: {bill.users?.full_name || "Không rõ"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-[#8D6E53]">{formatCurrency(bill.total_amount || 0)}</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {bill.appointment_services?.map((as: any, aidx: number) => (
                                  <span key={aidx} className="inline-flex text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                                    {as.services?.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-500 text-sm">Chưa có hóa đơn nào.</div>
                      )}
                    </div>
                  </div>

                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
