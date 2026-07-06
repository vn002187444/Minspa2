'use client';

import { useState, useEffect } from 'react';
import { Wallet, Calculator, Save, CheckCircle2, Search, X, Edit2, Banknote } from 'lucide-react';
import { getStaffPayrollInfo, calculatePayroll, getSalaryPayments, savePayrollCalculations, processPayrollPayment, updateStaffSalary } from '../actions';

type RangeType = 'month' | 'last_month' | 'custom';

export default function TabPayroll() {
  const [rangeType, setRangeType] = useState<RangeType>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [calculatedRows, setCalculatedRows] = useState<any[] | null>(null);
  const [savedPayments, setSavedPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Edit staff salary modal
  const [editModal, setEditModal] = useState<{ staff: any } | null>(null);
  const [editBaseSalary, setEditBaseSalary] = useState(0);
  const [editBankAccount, setEditBankAccount] = useState('');
  const [editBankName, setEditBankName] = useState('');

  const calculateDates = (type: string) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    if (type === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date();
    } else if (type === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      startInput: start.toISOString().split('T')[0],
      endInput: end.toISOString().split('T')[0],
    };
  };

  const loadStaff = async () => {
    try {
      const list = await getStaffPayrollInfo();
      setStaffList(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi tải danh sách nhân viên');
    }
  };

  const fetchPayments = async (startInput: string, endInput: string) => {
    try {
      const payments = await getSalaryPayments(startInput, endInput);
      setSavedPayments(payments);
    } catch {
      // silent
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const rows = await calculatePayroll(startDate, endDate);
      setCalculatedRows(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi tính lương');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!calculatedRows || calculatedRows.length === 0) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await savePayrollCalculations(startDate, endDate, calculatedRows);
      setSuccessMsg('Đã lưu bảng lương thành công!');
      setCalculatedRows(null);
      fetchPayments(startDate, endDate);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi lưu bảng lương');
    }
    setSaving(false);
  };

  const handlePay = async (id: string) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await processPayrollPayment(id);
      setSuccessMsg('Đã xác nhận thanh toán!');
      fetchPayments(startDate, endDate);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi thanh toán');
    }
    setLoading(false);
  };

  const openEditModal = (staff: { id: string; baseSalary: number; fullName: string; bankAccount?: string; bankName?: string }) => {
    setEditModal({ staff });
    setEditBaseSalary(staff.baseSalary);
    setEditBankAccount(staff.bankAccount || '');
    setEditBankName(staff.bankName || '');
  };

  const handleSaveStaff = async () => {
    if (!editModal) return;
    setError('');
    setSuccessMsg('');
    try {
      await updateStaffSalary(editModal.staff.id, editBaseSalary, editBankAccount, editBankName);
      setSuccessMsg(`Đã cập nhật lương ${editModal.staff.fullName}`);
      setEditModal(null);
      loadStaff();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi cập nhật');
    }
  };

  useEffect(() => {
    if (rangeType !== 'custom') {
      const dates = calculateDates(rangeType);
      setTimeout(() => {
        setStartDate(dates.startInput);
        setEndDate(dates.endInput);
      }, 0);
      setTimeout(() => {
        loadStaff();
        fetchPayments(dates.startInput, dates.endInput);
      }, 0);
    }
  }, [rangeType]);

  const handleCustomSearch = () => {
    if (!startDate || !endDate) { setError('Chọn ngày'); return; }
    loadStaff();
    fetchPayments(startDate, endDate);
    setCalculatedRows(null);
  };

  const netPay = (row: { baseSalary: number; totalCommission: number; totalTips: number; totalPackageCommission: number }) => row.baseSalary + row.totalCommission + row.totalTips + row.totalPackageCommission;

  const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + '₫';

  const filteredStaff = staffList.filter((s) =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Period Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#8D6E53]" /> Bảng lương
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={rangeType}
            onChange={(e) => setRangeType(e.target.value as RangeType)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="month">Tháng này</option>
            <option value="last_month">Tháng trước</option>
            <option value="custom">Tuỳ chọn</option>
          </select>
          {rangeType === 'custom' && (
            <>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[44px]" />
              <span className="text-gray-400">→</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[44px]" />
              <button onClick={handleCustomSearch} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer">
                Xem
              </button>
            </>
          )}
        </div>
      </div>

      {/* Staff List + Salary Config */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-3">Cấu hình lương nhân viên</h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Tìm nhân viên..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        {/* Mobile card view */}
        <div className="mt-4 space-y-3 md:hidden">
          {filteredStaff.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-6 text-center">
              <p className="text-gray-400 text-sm">Không có nhân viên</p>
            </div>
          ) : filteredStaff.map((s) => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="font-bold text-gray-900">{s.fullName}</span>
                <span className="text-gray-400 text-xs">({s.role})</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Lương CB</span><span>{formatCurrency(s.baseSalary)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Số TK</span><span className="text-gray-500">{s.bankAccount || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Ngân hàng</span><span className="text-gray-500">{s.bankName || '—'}</span></div>
              </div>
              <div className="flex justify-end pt-1 border-t border-gray-100">
                <button onClick={() => openEditModal(s)} className="p-2 text-gray-400 hover:text-[#8D6E53] transition-colors cursor-pointer" title="Sửa lương">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 text-xs font-bold text-gray-500 uppercase">Nhân viên</th>
                <th className="text-right px-3 py-2 text-xs font-bold text-gray-500 uppercase">Lương cơ bản</th>
                <th className="text-left px-3 py-2 text-xs font-bold text-gray-500 uppercase">Số TK</th>
                <th className="text-left px-3 py-2 text-xs font-bold text-gray-500 uppercase">Ngân hàng</th>
                <th className="px-3 py-2 w-12" />
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{s.fullName} <span className="text-gray-400 text-xs">({s.role})</span></td>
                  <td className="px-3 py-2 text-right">{formatCurrency(s.baseSalary)}</td>
                  <td className="px-3 py-2 text-gray-500">{s.bankAccount || '—'}</td>
                  <td className="px-3 py-2 text-gray-500">{s.bankName || '—'}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => openEditModal(s)} className="p-1.5 text-gray-400 hover:text-[#8D6E53] transition-colors cursor-pointer" title="Sửa lương">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-400 text-sm">Không có nhân viên</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculate Payroll */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-[#8D6E53] text-white rounded-xl font-medium hover:bg-[#7a5e47] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Calculator className="w-5 h-5" />
          {loading ? 'Đang tính...' : 'Tính lương'}
        </button>

        {calculatedRows && calculatedRows.length > 0 && (
          <>
            {/* Mobile card view */}
            <div className="mt-4 space-y-3 md:hidden">
              {calculatedRows.map((row) => (
                <div key={row.staffId} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="font-bold text-gray-900">{row.fullName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Lương CB</span><span>{formatCurrency(row.baseSalary)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Hoa hồng</span><span>{formatCurrency(row.totalCommission)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Tip</span><span>{formatCurrency(row.totalTips)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">HH Gói</span><span>{formatCurrency(row.totalPackageCommission)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Tổng đơn</span><span>{formatCurrency(row.totalSales)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Số đơn</span><span>{row.appointmentCount}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Vắng</span><span className={row.absentDays > 0 ? 'text-red-500' : ''}>{row.absentDays > 0 ? row.absentDays : '—'}</span></div>
                    <div className="flex justify-between font-bold"><span className="text-[#8D6E53]">Thực lãnh</span><span className="text-[#8D6E53]">{formatCurrency(netPay(row))}</span></div>
                  </div>
                </div>
              ))}
              {/* Mobile totals */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm font-bold">
                  <div className="flex justify-between"><span className="text-gray-500">Tổng lương</span><span>{formatCurrency(calculatedRows.reduce((s, r) => s + r.baseSalary, 0))}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tổng HH</span><span>{formatCurrency(calculatedRows.reduce((s, r) => s + r.totalCommission, 0))}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tổng Tip</span><span>{formatCurrency(calculatedRows.reduce((s, r) => s + r.totalTips, 0))}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tổng đơn</span><span>{formatCurrency(calculatedRows.reduce((s, r) => s + r.totalSales, 0))}</span></div>
                </div>
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-[#8D6E53] font-black text-base">
                  <span>Tổng thực lãnh</span>
                  <span>{formatCurrency(calculatedRows.reduce((s, r) => s + netPay(r), 0))}</span>
                </div>
              </div>
            </div>

            {/* Desktop table */}
            <div className="overflow-x-auto mt-4 hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-xs font-bold text-gray-500 uppercase">Nhân viên</th>
                    <th className="text-right px-3 py-2 text-xs font-bold text-gray-500 uppercase">Lương CB</th>
                    <th className="text-right px-3 py-2 text-xs font-bold text-gray-500 uppercase">Hoa hồng</th>
                    <th className="text-right px-3 py-2 text-xs font-bold text-gray-500 uppercase">Tip</th>
                    <th className="text-right px-3 py-2 text-xs font-bold text-gray-500 uppercase">HH Gói</th>
                    <th className="text-right px-3 py-2 text-xs font-bold text-gray-500 uppercase">Tổng đơn</th>
                    <th className="text-right px-3 py-2 text-xs font-bold text-gray-500 uppercase">Số đơn</th>
                    <th className="text-center px-3 py-2 text-xs font-bold text-gray-500 uppercase">Vắng</th>
                    <th className="text-right px-3 py-2 text-xs font-bold text-[#8D6E53] uppercase">Thực lãnh</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedRows.map((row) => (
                    <tr key={row.staffId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{row.fullName}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(row.baseSalary)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(row.totalCommission)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(row.totalTips)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(row.totalPackageCommission)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(row.totalSales)}</td>
                      <td className="px-3 py-2 text-right">{row.appointmentCount}</td>
                      <td className="px-3 py-2 text-center text-red-500">{row.absentDays > 0 ? row.absentDays : '—'}</td>
                      <td className="px-3 py-2 text-right font-bold text-[#8D6E53]">{formatCurrency(netPay(row))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td className="px-3 py-2">Tổng</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(calculatedRows.reduce((s, r) => s + r.baseSalary, 0))}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(calculatedRows.reduce((s, r) => s + r.totalCommission, 0))}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(calculatedRows.reduce((s, r) => s + r.totalTips, 0))}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(calculatedRows.reduce((s, r) => s + r.totalPackageCommission, 0))}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(calculatedRows.reduce((s, r) => s + r.totalSales, 0))}</td>
                    <td className="px-3 py-2 text-right">{calculatedRows.reduce((s, r) => s + r.appointmentCount, 0)}</td>
                    <td />
                    <td className="px-3 py-2 text-right text-[#8D6E53]">{formatCurrency(calculatedRows.reduce((s, r) => s + netPay(r), 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Đang lưu...' : 'Lưu bảng lương'}
            </button>
          </>
        )}
        {calculatedRows && calculatedRows.length === 0 && (
          <p className="mt-4 text-gray-400 text-sm">Không có dữ liệu trong kỳ này.</p>
        )}
      </div>

      {/* Saved Payments */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-green-600" /> Bảng lương đã lưu
        </h3>
        {savedPayments.length === 0 ? (
          <p className="text-gray-400 text-sm">Chưa có bảng lương nào được lưu.</p>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="mt-4 space-y-3 md:hidden">
              {savedPayments.map((p) => (
                <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="font-bold text-gray-900">{p.fullName}</span>
                    {p.status === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã trả
                      </span>
                    ) : (
                      <span className="text-yellow-600 text-xs font-medium">Chờ</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Lương CB</span><span>{formatCurrency(p.baseSalary)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Hoa hồng</span><span>{formatCurrency(p.totalCommission)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Tip</span><span>{formatCurrency(p.totalTips)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">HH Gói</span><span>{formatCurrency(p.totalPackageCommission)}</span></div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <span className="font-bold text-green-600">{formatCurrency(p.netPay)}</span>
                    {p.status === 'PENDING' && (
                      <button
                        onClick={() => handlePay(p.id)}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-2.5 min-h-[44px] bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã trả
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-xs font-bold text-gray-500 uppercase">Nhân viên</th>
                    <th className="text-right px-3 py-2 text-xs font-bold text-gray-500 uppercase">Lương CB</th>
                    <th className="text-right px-3 py-2 text-xs font-bold text-gray-500 uppercase">Hoa hồng</th>
                    <th className="text-right px-3 py-2 text-xs font-bold text-gray-500 uppercase">Tip</th>
                    <th className="text-right px-3 py-2 text-xs font-bold text-gray-500 uppercase">HH Gói</th>
                    <th className="text-right px-3 py-2 text-xs font-bold text-gray-500 uppercase">Thực lãnh</th>
                    <th className="text-center px-3 py-2 text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-3 py-2 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {savedPayments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{p.fullName}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(p.baseSalary)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(p.totalCommission)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(p.totalTips)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(p.totalPackageCommission)}</td>
                      <td className="px-3 py-2 text-right font-bold text-green-600">{formatCurrency(p.netPay)}</td>
                      <td className="px-3 py-2 text-center">
                        {p.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã trả
                          </span>
                        ) : (
                          <span className="text-yellow-600 text-xs font-medium">Chờ</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {p.status === 'PENDING' && (
                          <button
                            onClick={() => handlePay(p.id)}
                            disabled={loading}
                            className="flex items-center gap-1 px-3 py-2.5 min-h-[44px] bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã trả
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Edit Staff Salary Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editModal.staff.fullName}</h3>
              <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="payroll-baseSalary" className="block text-sm font-medium text-gray-600 mb-1">Lương cơ bản (VNĐ)</label>
                <input id="payroll-baseSalary" type="number" value={editBaseSalary} onChange={(e) => setEditBaseSalary(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="payroll-bankAccount" className="block text-sm font-medium text-gray-600 mb-1">Số tài khoản</label>
                <input id="payroll-bankAccount" type="text" value={editBankAccount} onChange={(e) => setEditBankAccount(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="payroll-bankName" className="block text-sm font-medium text-gray-600 mb-1">Ngân hàng</label>
                <input id="payroll-bankName" type="text" value={editBankName} onChange={(e) => setEditBankName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditModal(null)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">Huỷ</button>
                <button onClick={handleSaveStaff} className="flex-1 px-4 py-2.5 bg-[#8D6E53] text-white rounded-xl text-sm font-medium hover:bg-[#7a5e47] transition-colors cursor-pointer">Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
