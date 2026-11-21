'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Wallet,
  Calculator,
  Download,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  HeartHandshake,
  Calendar,
  FileSpreadsheet,
  Edit3,
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import {
  getMonthlyPayroll,
  calculateAndSaveMonthlyPayroll,
  updatePayrollAdjustment,
  generatePayrollExcelBase64
} from '../actions/payroll';
import { PayrollRecord, PayrollSummary, PayrollStatus } from '@/types/payroll';
import { Button } from '@/components/ui/Button';

export default function TabPayroll() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [isPending, startTransition] = useTransition();

  // Adjustment Modal state
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [adjBonus, setAdjBonus] = useState<number>(0);
  const [adjDeduction, setAdjDeduction] = useState<number>(0);
  const [adjNotes, setAdjNotes] = useState<string>('');
  const [adjStatus, setAdjStatus] = useState<PayrollStatus>('DRAFT');

  const loadData = async (m = selectedMonth, y = selectedYear) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getMonthlyPayroll(m, y);
      if (res.success) {
        setRecords(res.records);
        setSummary(res.summary);
      } else {
        setErrorMsg(res.error || 'Không thể tải dữ liệu bảng lương');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const handleRecalculate = () => {
    startTransition(async () => {
      setErrorMsg('');
      setSuccessMsg('');
      const res = await calculateAndSaveMonthlyPayroll(selectedMonth, selectedYear);
      if (res.success) {
        setSuccessMsg(`Đã tính toán và cập nhật bảng lương cho ${res.count || 0} nhân viên!`);
        await loadData(selectedMonth, selectedYear);
      } else {
        setErrorMsg(res.error || 'Lỗi tính toán bảng lương');
      }
    });
  };

  const handleExportExcel = async () => {
    startTransition(async () => {
      setErrorMsg('');
      const res = await generatePayrollExcelBase64(selectedMonth, selectedYear);
      if (res.success && res.base64 && res.filename) {
        const link = document.createElement('a');
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.base64}`;
        link.download = res.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSuccessMsg(`Đã xuất file ${res.filename} thành công!`);
      } else {
        setErrorMsg(res.error || 'Không thể xuất file Excel');
      }
    });
  };

  const openAdjustModal = (rec: PayrollRecord) => {
    setEditingRecord(rec);
    setAdjBonus(rec.bonus_amount || 0);
    setAdjDeduction(rec.deduction_amount || 0);
    setAdjNotes(rec.notes || '');
    setAdjStatus(rec.status || 'DRAFT');
  };

  const handleSaveAdjustment = async () => {
    if (!editingRecord) return;
    startTransition(async () => {
      setErrorMsg('');
      setSuccessMsg('');
      const res = await updatePayrollAdjustment({
        id: editingRecord.id,
        bonus_amount: adjBonus,
        deduction_amount: adjDeduction,
        notes: adjNotes,
        status: adjStatus
      });
      if (res.success) {
        setSuccessMsg(`Đã lưu điều chỉnh cho ${editingRecord.staff?.full_name || 'nhân viên'}`);
        setEditingRecord(null);
        await loadData(selectedMonth, selectedYear);
      } else {
        setErrorMsg(res.error || 'Lỗi lưu điều chỉnh');
      }
    });
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + '₫';
  };

  const filteredRecords = records.filter(r => {
    const name = r.staff?.full_name?.toLowerCase() || '';
    const username = r.staff?.username?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    return name.includes(term) || username.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-[#832729]/10 text-[#832729] rounded-2xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Quản Lý Bảng Lương Nhân Sự</h2>
              <p className="text-xs text-gray-500">Lương cứng + Hoa hồng 20% + Tiền tip + Thưởng - Phạt/Tạm ứng</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month & Year Selectors */}
          <div className="flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-400 ml-2 mr-1" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold text-gray-700 py-1.5 px-2 outline-none cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold text-gray-700 py-1.5 px-2 outline-none cursor-pointer border-l border-gray-200"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            isLoading={isPending}
            className="rounded-2xl border-gray-200 hover:border-[#832729] hover:text-[#832729]"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Tính lại lương
          </Button>

          <Button
            size="sm"
            onClick={handleExportExcel}
            isLoading={isPending}
            className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Xuất Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Salary */}
        <div className="bg-gradient-to-br from-[#832729] to-[#5a1a1b] text-white rounded-3xl p-5 shadow-lg shadow-[#832729]/10 relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-15">
            <Wallet className="w-16 h-16" />
          </div>
          <span className="text-xs uppercase tracking-wider text-rose-200 font-semibold">Tổng Quỹ Lương Thực Nhận</span>
          <p className="text-2xl font-extrabold mt-2 tracking-tight">
            {formatVND(summary?.total_net_salary || 0)}
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-rose-200">
            <span>{summary?.total_staff || 0} nhân sự</span>
            <span>•</span>
            <span>{summary?.total_completed_orders || 0} đơn hoàn thành</span>
          </div>
        </div>

        {/* Total Commission */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Hoa Hồng Dịch Vụ (20%)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">
            {formatVND(summary?.total_commission || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-2">Trích 20% trên tổng giá trị đơn</p>
        </div>

        {/* Total Tips */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Tip Chuyển Khoản (Tiệm thu hộ)</span>
            <div className="p-2 bg-pink-50 text-pink-600 rounded-xl">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-pink-600 mt-2">
            {formatVND(summary?.total_tips || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-2">100% tip chuyển khoản trả lại KTV (tiền mặt không qua tiệm)</p>
        </div>

        {/* Total Base & Adjustments */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Lương Cứng & Thưởng Phạt</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">
            {formatVND(summary?.total_base_salary || 0)}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-emerald-600 font-medium">+{formatVND(summary?.total_bonuses || 0)} thưởng</span>
            <span className="text-gray-300">/</span>
            <span className="text-red-500 font-medium">-{formatVND(summary?.total_deductions || 0)} phạt</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900">Chi Tiết Lương Nhân Viên Tháng {selectedMonth}/{selectedYear}</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              {filteredRecords.length} nhân sự
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#832729]/20 focus:border-[#832729] transition-all"
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#832729]" />
            <p className="text-xs text-gray-400">Đang tính toán dữ liệu bảng lương...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Chưa có bản ghi lương</p>
            <p className="text-xs text-gray-400 mt-1">Bấm "Tính lại lương" ở trên để tổng hợp dữ liệu tháng này</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">Nhân Viên</th>
                  <th className="py-3.5 px-3 text-center">Công</th>
                  <th className="py-3.5 px-3 text-center">Đơn</th>
                  <th className="py-3.5 px-3 text-right">Lương Cứng</th>
                  <th className="py-3.5 px-3 text-right">Hoa Hồng (20%)</th>
                  <th className="py-3.5 px-3 text-right">Tip CK (₫)</th>
                  <th className="py-3.5 px-3 text-right">Thưởng / Phạt</th>
                  <th className="py-3.5 px-4 text-right">Thực Nhận</th>
                  <th className="py-3.5 px-3 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Staff Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#832729]/10 text-[#832729] font-bold text-xs flex items-center justify-center">
                          {r.staff?.full_name?.charAt(0) || 'N'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 leading-tight">{r.staff?.full_name || 'N/A'}</p>
                          <p className="text-xs text-gray-400">@{r.staff?.username || 'user'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Work Days */}
                    <td className="py-3.5 px-3 text-center font-medium text-gray-700">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                        {r.work_days} ngày
                      </span>
                    </td>

                    {/* Orders */}
                    <td className="py-3.5 px-3 text-center font-medium text-gray-700">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold">
                        {r.completed_orders} đơn
                      </span>
                    </td>

                    {/* Base Salary */}
                    <td className="py-3.5 px-3 text-right font-medium text-gray-700">
                      {formatVND(r.base_salary)}
                    </td>

                    {/* Commission */}
                    <td className="py-3.5 px-3 text-right font-semibold text-emerald-600">
                      +{formatVND(r.commission_amount)}
                    </td>

                    {/* Tips */}
                    <td className="py-3.5 px-3 text-right font-medium text-pink-600">
                      +{formatVND(r.tip_amount)}
                    </td>

                    {/* Bonus & Deduction */}
                    <td className="py-3.5 px-3 text-right text-xs">
                      {r.bonus_amount > 0 && (
                        <div className="text-emerald-600 font-semibold">+{formatVND(r.bonus_amount)}</div>
                      )}
                      {r.deduction_amount > 0 && (
                        <div className="text-red-500 font-semibold">-{formatVND(r.deduction_amount)}</div>
                      )}
                      {r.bonus_amount === 0 && r.deduction_amount === 0 && (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Net Salary */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-extrabold text-base text-[#832729]">
                        {formatVND(r.net_salary)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : r.status === 'CONFIRMED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {r.status === 'PAID' ? 'Đã chi trả' : (r.status === 'CONFIRMED' ? 'Đã duyệt' : 'Tạm tính')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => openAdjustModal(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Điều chỉnh
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjustment Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Điều Chỉnh Lương</h3>
                <p className="text-xs text-gray-500">{editingRecord.staff?.full_name} • Tháng {selectedMonth}/{selectedYear}</p>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tiền Thưởng (VND)</label>
                <input
                  type="number"
                  value={adjBonus}
                  onChange={(e) => setAdjBonus(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#832729]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Khấu Trừ / Phạt / Tạm Ứng (VND)</label>
                <input
                  type="number"
                  value={adjDeduction}
                  onChange={(e) => setAdjDeduction(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Trạng Thái Chi Trả</label>
                <select
                  value={adjStatus}
                  onChange={(e) => setAdjStatus(e.target.value as PayrollStatus)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#832729]/20"
                >
                  <option value="DRAFT">Tạm tính (DRAFT)</option>
                  <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
                  <option value="PAID">Đã chi trả thành công (PAID)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi Chú Lý Do</label>
                <textarea
                  rows={2}
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  placeholder="Lý do thưởng/phạt hoặc ghi chú chuyển khoản..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#832729]/20"
                />
              </div>

              {/* Dynamic Preview Calculation */}
              <div className="bg-gray-50 rounded-2xl p-3 text-xs space-y-1">
                <div className="flex justify-between text-gray-500">
                  <span>Lương cứng + Hoa hồng + Tip:</span>
                  <span>{formatVND(editingRecord.base_salary + editingRecord.commission_amount + editingRecord.tip_amount)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#832729] pt-1 border-t border-gray-200">
                  <span>Thực Nhận Dự Kiến:</span>
                  <span>{formatVND(Math.max(0, editingRecord.base_salary + editingRecord.commission_amount + editingRecord.tip_amount + adjBonus - adjDeduction))}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingRecord(null)}>
                  Hủy
                </Button>
                <Button size="sm" onClick={handleSaveAdjustment} isLoading={isPending} className="bg-[#832729] hover:bg-[#681d1f] text-white">
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
