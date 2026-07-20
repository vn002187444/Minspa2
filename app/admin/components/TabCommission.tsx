'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { getCommissionReport } from '../actions';
import { Button } from '@/components/ui/Button';

export default function TabCommission() {
  const [rangeType, setRangeType] = useState<'week' | 'month' | 'last_month' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const calculateDates = (type: string) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    if (type === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      end = new Date();
    } else if (type === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date();
    } else if (type === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString(), startInput: start.toISOString().split('T')[0], endInput: end.toISOString().split('T')[0] };
  };

  const fetchReport = async (startISO: string, endISO: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await getCommissionReport(startISO, endISO);
      if (res.success) setReportData(res.data);
      else setError(res.error || 'Lỗi khi tải báo cáo hoa hồng');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối máy chủ');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (rangeType !== 'custom') {
      const dates = calculateDates(rangeType);
      const tid = setTimeout(() => {
        setStartDate(dates.startInput);
        setEndDate(dates.endInput);
        fetchReport(dates.start, dates.end);
      }, 0);
      return () => clearTimeout(tid);
    }
  }, [rangeType]);

  const handleCustomSearch = () => {
    if (!startDate || !endDate) { setError('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc'); return; }
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
    fetchReport(start.toISOString(), end.toISOString());
  };

  const handleExportCSV = () => {
    if (!reportData?.staffReports) return;
    let csv = 'data:text/csv;charset=utf-8,\uFEFF';
    csv += 'BÁO CÁO HOA HỒNG NHÂN VIÊN\n';
    csv += `Thời gian: ${startDate} đến ${endDate}\n\n`;
    csv += 'Họ và tên,Tên đăng nhập,Số ca làm,Tổng Doanh số (VNĐ),Tổng Hoa hồng KTV (VNĐ),Tổng tiền Tip (VNĐ),Thực nhận (Hoa hồng + Tip)\n';
    reportData.staffReports.forEach((s: any) => {
      csv += `"${s.fullName}","${s.username}",${s.totalAppointments},${s.totalSales},${s.totalCommission},${s.totalTip},${s.totalCommission + s.totalTip}\n`;
    });
    csv += `\nTỔNG CỘNG,,${reportData.grandAppointmentsCount},${reportData.grandTotalSales},${reportData.grandTotalCommission},${reportData.grandTotalTip},${reportData.grandTotalCommission + reportData.grandTotalTip}\n`;
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `BaoCaoHoaHong_${startDate}_Den_${endDate}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const filteredStaffReports = reportData?.staffReports?.filter((s: any) => {
    const q = searchTerm.toLowerCase();
    return s.fullName.toLowerCase().includes(q) || s.username.toLowerCase().includes(q);
  }) || [];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Báo cáo Hoa hồng Nhân viên</h2>
            <p className="text-xs text-gray-500 mt-1">Tổng hợp doanh số, hoa hồng dịch vụ và tiền tip của nhân viên theo khoảng thời gian.</p>
          </div>
          <Button onClick={handleExportCSV} disabled={!reportData || filteredStaffReports.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
            Xuất File Đối Soát (.csv)
          </Button>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap bg-gray-100 p-1 rounded-xl border border-gray-200/50 max-w-max">
            {[{ id: 'week', label: 'Tuần này' }, { id: 'month', label: 'Tháng này' }, { id: 'last_month', label: 'Tháng trước' }, { id: 'custom', label: 'Tùy chỉnh' }].map((btn) => (
              <button key={btn.id} onClick={() => setRangeType(btn.id as "week" | "month" | "last_month" | "custom")} className={`px-4 py-2 min-h-[44px] rounded-lg text-xs font-semibold transition-all ${rangeType === btn.id ? 'bg-[#8D6E53] text-white shadow-sm' : 'text-gray-500 hover:text-gray-950'}`}>{btn.label}</button>
            ))}
          </div>
          {rangeType === 'custom' && (
            <div className="flex flex-wrap items-center gap-2.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Từ</span>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Đến</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50" />
              </div>
              <Button onClick={handleCustomSearch} variant="primary" size="sm">Áp dụng</Button>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Tìm KTV..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 w-full lg:w-60 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all placeholder:text-gray-400 font-medium font-semibold min-h-[44px]" />
          </div>
        </div>
      </div>
      {reportData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Tổng Doanh số', value: reportData.grandTotalSales, color: 'text-gray-900' },
            { label: 'Tổng Hoa hồng', value: reportData.grandTotalCommission, color: 'text-emerald-600' },
            { label: 'Tổng tiền Tip', value: reportData.grandTotalTip, color: 'text-[#8D6E53]' },
            { label: 'Tổng số ca', value: reportData.grandAppointmentsCount, color: 'text-gray-900' },
          ].map((item) => (
            <div key={item.label} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[11px] text-gray-400 block uppercase font-bold tracking-wider mb-1">{item.label}</span>
              <span className={`text-base font-black ${item.color} font-mono`}>{item.value.toLocaleString('vi')} {item.label.includes('ca') ? 'ca' : 'đ'}</span>
            </div>
          ))}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8D6E53]"></div></div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-700 text-xs font-semibold">{error}</div>
      ) : filteredStaffReports.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 text-gray-400 text-xs">Không tìm thấy dữ liệu hoa hồng trong khoảng thời gian đã chọn.</div>
      ) : (
        <>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  <th className="p-4">Kỹ Thuật Viên</th>
                  <th className="p-4">Số Ca</th>
                  <th className="p-4 text-right">Tổng Doanh Số</th>
                  <th className="p-4 text-right">Lương Hoa Hồng</th>
                  <th className="p-4 text-right">Tiền Tip</th>
                  <th className="p-4 text-right">Thực nhận (Tạm tính)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-750">
                {filteredStaffReports.map((s: any) => (
                  <tr key={s.staffId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4"><div className="font-bold text-gray-900">{s.fullName}</div><div className="text-[10px] text-gray-400 font-mono">@{s.username}</div></td>
                    <td className="p-4"><span className="bg-[#FAF0E6] text-[#8D6E53] font-mono px-2.5 py-1 rounded-lg text-[10px] font-bold border border-[#FAF0E6]/50">{s.totalAppointments} ca</span></td>
                    <td className="p-4 text-right font-mono text-gray-900">{s.totalSales.toLocaleString('vi')} đ</td>
                    <td className="p-4 text-right font-mono text-emerald-600 font-bold">{s.totalCommission.toLocaleString('vi')} đ</td>
                    <td className="p-4 text-right font-mono text-[#8D6E53] font-bold">{s.totalTip.toLocaleString('vi')} đ</td>
                    <td className="p-4 text-right font-mono bg-emerald-50/10"><span className="text-gray-950 font-black text-sm">{(s.totalCommission + s.totalTip).toLocaleString('vi')} đ</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4 space-y-3 md:hidden">
          {filteredStaffReports.map((s: any) => (
            <div key={s.staffId} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900">{s.fullName}</div>
                  <div className="text-[10px] text-gray-400 font-mono">@{s.username}</div>
                </div>
                <span className="bg-[#FAF0E6] text-[#8D6E53] font-mono px-2.5 py-1 rounded-lg text-[10px] font-bold border border-[#FAF0E6]/50">{s.totalAppointments} ca</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div>
                  <span className="text-gray-400">Doanh số</span>
                  <p className="font-mono text-gray-900 font-bold">{s.totalSales.toLocaleString('vi')} đ</p>
                </div>
                <div>
                  <span className="text-gray-400">Hoa hồng</span>
                  <p className="font-mono text-emerald-600 font-bold">{s.totalCommission.toLocaleString('vi')} đ</p>
                </div>
                <div>
                  <span className="text-gray-400">Tiền Tip</span>
                  <p className="font-mono text-[#8D6E53] font-bold">{s.totalTip.toLocaleString('vi')} đ</p>
                </div>
                <div>
                  <span className="text-gray-400">Thực nhận</span>
                  <p className="font-mono text-gray-950 font-black">{(s.totalCommission + s.totalTip).toLocaleString('vi')} đ</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
