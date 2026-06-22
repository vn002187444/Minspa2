'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  BarChart3, TrendingUp, Users, DollarSign, ShoppingBag,
  User, Activity, ChevronDown, RefreshCw,
  ArrowUpRight, ArrowDownRight, FileText, FileSpreadsheet, Download,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { getAdvancedRevenueReport, getCustomerAnalytics, getGrowthComparison } from '../actions'

const SUBTABS = ['TỔNG_QUAN', 'DOANH_THU', 'DICH_VU', 'NHAN_VIEN', 'KHACH_HANG', 'TANG_TRUONG'] as const
type SubTab = typeof SUBTABS[number]

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#14b8a6', '#f97316', '#6366f1', '#a855f7']

export default function TabReports() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('TỔNG_QUAN')
  const [rangeType, setRangeType] = useState<'week' | 'month' | 'last_month' | 'custom' | 'year'>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [compareEnabled, setCompareEnabled] = useState(false)
  const [compareStartDate, setCompareStartDate] = useState('')
  const [compareEndDate, setCompareEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [revenueData, setRevenueData] = useState<any>(null)
  const [customerData, setCustomerData] = useState<any>(null)
  const [growthData, setGrowthData] = useState<any>(null)
  const [drillDown, setDrillDown] = useState<{ type: string; label: string; data: any[] } | null>(null)

  const getDateRange = useCallback(() => {
    const now = new Date()
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    if (rangeType === 'custom') {
      return { start: startDate, end: endDate }
    }
    let start: Date
    switch (rangeType) {
      case 'week':
        start = new Date(end); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0); break
      case 'month':
        start = new Date(end.getFullYear(), end.getMonth(), 1); start.setHours(0, 0, 0, 0); break
      case 'last_month':
        start = new Date(end.getFullYear(), end.getMonth() - 1, 1); start.setHours(0, 0, 0, 0);
        end.setDate(0); end.setHours(23, 59, 59, 999); break
      case 'year':
        start = new Date(end.getFullYear(), 0, 1); start.setHours(0, 0, 0, 0); break
      default:
        start = new Date(end.getFullYear(), end.getMonth(), 1); start.setHours(0, 0, 0, 0)
    }
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
  }, [rangeType, startDate, endDate])

  const getCompareRange = useCallback(() => {
    const { start, end } = getDateRange()
    if (compareStartDate && compareEndDate) return { start: compareStartDate, end: compareEndDate }
    const s = new Date(start)
    const e = new Date(end)
    const diff = e.getTime() - s.getTime()
    const cs = new Date(s.getTime() - diff - 1)
    const ce = new Date(s.getTime() - 86400000)
    return { start: cs.toISOString().slice(0, 10), end: ce.toISOString().slice(0, 10) }
  }, [getDateRange, compareStartDate, compareEndDate])

  const loadData = useCallback(async () => {
    setLoading(true)
    const { start, end } = getDateRange()
    if (!start || !end) { setLoading(false); return }
    try {
      const [rev, cust] = await Promise.all([
        getAdvancedRevenueReport(start, end),
        getCustomerAnalytics(start, end),
      ])
      setRevenueData(rev)
      setCustomerData(cust)
      if (compareEnabled) {
        const comp = getCompareRange()
        const growth = await getGrowthComparison(start, end, comp.start, comp.end)
        setGrowthData(growth)
      } else {
        setGrowthData(null)
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tải báo cáo')
    } finally {
      setLoading(false)
    }
  }, [getDateRange, compareEnabled, getCompareRange])

  useEffect(() => { loadData() }, [loadData])

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n)
  const fmtCurrency = (n: number) => `${fmt(n)}₫`

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    await import('jspdf-autotable')
    const doc = new jsPDF()
    const { start, end } = getDateRange()
    doc.setFontSize(16)
    doc.text('Báo cáo MinSpa', 14, 20)
    doc.setFontSize(10)
    doc.text(`Từ ${start} đến ${end}`, 14, 28)
    let y = 35
    if (revenueData) {
      doc.setFontSize(12)
      doc.text(`Tổng doanh thu: ${fmtCurrency(revenueData.totalRevenue)}`, 14, y); y += 7
      doc.text(`Tổng tiền tip: ${fmtCurrency(revenueData.totalTip)}`, 14, y); y += 7
      doc.text(`Tổng đơn: ${revenueData.totalAppointments}`, 14, y); y += 10
      doc.text('Doanh thu theo dịch vụ:', 14, y); y += 6
      const rows = revenueData.revenueByService.slice(0, 10).map((s: any) => [s.name, fmtCurrency(s.revenue), String(s.count)])
      ;(doc as any).autoTable({ startY: y, head: [['Dịch vụ', 'Doanh thu', 'Số lượt']], body: rows })
      y = (doc as any).lastAutoTable.finalY + 10
      doc.text('Doanh thu theo nhân viên:', 14, y); y += 6
      const staffRows = revenueData.revenueByStaff.map((s: any) => [s.name, fmtCurrency(s.revenue), fmtCurrency(s.tip), String(s.count)])
      ;(doc as any).autoTable({ startY: y, head: [['Nhân viên', 'Doanh thu', 'Tip', 'Đơn']], body: staffRows })
    }
    doc.save(`baocao_minspa_${start}_${end}.pdf`)
    toast.success('Đã xuất PDF')
  }

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    const { start, end } = getDateRange()
    if (revenueData) {
      const ws1 = XLSX.utils.json_to_sheet(revenueData.revenueByDay.map((d: any) => ({ Ngày: d.date, DoanhThu: d.value })))
      XLSX.utils.book_append_sheet(wb, ws1, 'TheoNgay')
      const ws2 = XLSX.utils.json_to_sheet(revenueData.revenueByService.map((s: any) => ({ DichVu: s.name, DoanhThu: s.revenue, SoLuot: s.count })))
      XLSX.utils.book_append_sheet(wb, ws2, 'TheoDichVu')
      const ws3 = XLSX.utils.json_to_sheet(revenueData.revenueByStaff.map((s: any) => ({ NhanVien: s.name, DoanhThu: s.revenue, Tip: s.tip, SoDon: s.count })))
      XLSX.utils.book_append_sheet(wb, ws3, 'TheoNhanVien')
    }
    if (customerData) {
      const ws4 = XLSX.utils.json_to_sheet(customerData.topCustomers.map((c: any) => ({ Ten: c.name, SDT: c.phone, TongChiTieu: c.totalSpent, SoLanDen: c.visits })))
      XLSX.utils.book_append_sheet(wb, ws4, 'KhachHang')
    }
    XLSX.writeFile(wb, `baocao_minspa_${start}_${end}.xlsx`)
    toast.success('Đã xuất Excel')
  }

  const handleRawExport = async (type: string, format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/export?type=${type}&format=${format}`);
      if (!response.ok) throw new Error('Lỗi khi tải dữ liệu');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `min_salon_${type}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Đã xuất ${type} (${format.toUpperCase()})`);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi xuất dữ liệu');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900 font-display flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-pink-500" />
          Báo cáo & Thống kê
        </h2>
         <div className="flex items-center gap-2">
           <button onClick={exportPDF} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer">
             <FileText className="w-4 h-4" /> PDF
           </button>
           <button onClick={exportExcel} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer">
             <FileSpreadsheet className="w-4 h-4" /> Excel
           </button>
           <div className="relative group">
             <button className="px-3 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-black transition-colors shadow-sm">
               <Download className="w-4 h-4" /> Export Raw
             </button>
             <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 hidden group-hover:block p-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
               <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase">Appointments</div>
               <div className="grid grid-cols-2 gap-1">
                 <button onClick={() => handleRawExport('appointments', 'csv')} className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 rounded-lg text-left transition-colors">CSV</button>
                 <button onClick={() => handleRawExport('appointments', 'json')} className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 rounded-lg text-left transition-colors">JSON</button>
               </div>
               <div className="border-t border-gray-100 my-1"></div>
               <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase">Customers</div>
               <div className="grid grid-cols-2 gap-1">
                 <button onClick={() => handleRawExport('customers', 'csv')} className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 rounded-lg text-left transition-colors">CSV</button>
                 <button onClick={() => handleRawExport('customers', 'json')} className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 rounded-lg text-left transition-colors">JSON</button>
               </div>
               <div className="border-t border-gray-100 my-1"></div>
               <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase">Services</div>
               <div className="grid grid-cols-2 gap-1">
                 <button onClick={() => handleRawExport('services', 'csv')} className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 rounded-lg text-left transition-colors">CSV</button>
                 <button onClick={() => handleRawExport('services', 'json')} className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 rounded-lg text-left transition-colors">JSON</button>
               </div>
             </div>
           </div>
           <button onClick={loadData} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 cursor-pointer" title="Làm mới">
             <RefreshCw className="w-4 h-4" />
           </button>
         </div>
      </div>

      {/* Date Range Filter (5.7) */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(['week', 'month', 'last_month', 'year', 'custom'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRangeType(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                rangeType === r ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r === 'week' ? '7 ngày' : r === 'month' ? 'Tháng này' : r === 'last_month' ? 'Tháng trước' : r === 'year' ? 'Năm nay' : 'Tùy chọn'}
            </button>
          ))}
        </div>
        {rangeType === 'custom' && (
          <div className="flex items-center gap-3">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold" />
            <span className="text-gray-400">→</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold" />
          </div>
        )}
        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={compareEnabled} onChange={(e) => setCompareEnabled(e.target.checked)} className="rounded" />
          So sánh với kỳ trước (YoY/MoM/WoW)
        </label>
      </div>

      {/* Subtabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {SUBTABS.map((st) => (
          <button
            key={st}
            onClick={() => setActiveSubTab(st)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeSubTab === st ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {st === 'TỔNG_QUAN' ? '📊 Tổng quan' : st === 'DOANH_THU' ? '📈 Doanh thu' : st === 'DICH_VU' ? '💇 Dịch vụ' : st === 'NHAN_VIEN' ? '👤 Nhân viên' : st === 'KHACH_HANG' ? '👥 Khách hàng' : '📈 Tăng trưởng'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400"><RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />Đang tải...</div>
      ) : (
        <>
          {activeSubTab === 'TỔNG_QUAN' && revenueData && (
            <OverviewTab revenueData={revenueData} customerData={customerData} fmt={fmt} fmtCurrency={fmtCurrency} />
          )}
          {activeSubTab === 'DOANH_THU' && revenueData && (
            <RevenueTab revenueData={revenueData} fmt={fmt} fmtCurrency={fmtCurrency} />
          )}
          {activeSubTab === 'DICH_VU' && revenueData && (
            <ServiceTab revenueData={revenueData} fmt={fmt} fmtCurrency={fmtCurrency} />
          )}
          {activeSubTab === 'NHAN_VIEN' && revenueData && (
            <StaffTab revenueData={revenueData} fmt={fmt} fmtCurrency={fmtCurrency} />
          )}
          {activeSubTab === 'KHACH_HANG' && customerData && (
            <CustomerTab customerData={customerData} fmt={fmt} fmtCurrency={fmtCurrency} />
          )}
          {activeSubTab === 'TANG_TRUONG' && growthData && (
            <GrowthTab growthData={growthData} fmt={fmt} fmtCurrency={fmtCurrency} />
          )}
        </>
      )}

      {/* Drill-down Modal (5.10) */}
      {drillDown && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-gray-150 p-6 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-gray-900">{drillDown.label}</h3>
              <button onClick={() => setDrillDown(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><ChevronDown className="w-5 h-5 rotate-180" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {Object.keys(drillDown.data[0] || {}).map((k) => (
                      <th key={k} className="text-left p-2 text-xs font-bold text-gray-500 uppercase">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drillDown.data.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      {Object.values(row).map((v: any, j: number) => (
                        <td key={j} className="p-2 font-semibold text-gray-800">{typeof v === 'number' ? fmt(v) : v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OverviewTab({ revenueData, customerData, fmt, fmtCurrency }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Tổng doanh thu" value={fmtCurrency(revenueData.totalRevenue)} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={ShoppingBag} label="Tổng đơn" value={fmt(revenueData.totalAppointments)} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={TrendingUp} label="Tiền tip" value={fmtCurrency(revenueData.totalTip)} color="text-pink-600" bg="bg-pink-50" />
        <StatCard icon={Users} label="Khách hàng" value={fmt(customerData?.customerStats?.total || 0)} color="text-purple-600" bg="bg-purple-50" />
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-gray-900 mb-3 text-sm">Xu hướng doanh thu</h4>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueData.revenueByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v?.slice(5) || ''} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: any) => `${(Number(v) / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => fmtCurrency(Number(v))} />
            <Area type="monotone" dataKey="value" stroke="#ec4899" fill="#fce7f3" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <h4 className="font-bold text-gray-900 mb-2 text-sm">Top dịch vụ</h4>
          <div className="space-y-2">
            {revenueData.revenueByService.slice(0, 5).map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{i + 1}. {s.name}</span>
                <span className="text-sm font-bold text-gray-900">{fmtCurrency(s.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <h4 className="font-bold text-gray-900 mb-2 text-sm">Top nhân viên</h4>
          <div className="space-y-2">
            {revenueData.revenueByStaff.slice(0, 5).map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{i + 1}. {s.name}</span>
                <span className="text-sm font-bold text-gray-900">{fmtCurrency(s.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function RevenueTab({ revenueData, fmt, fmtCurrency }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Tổng doanh thu" value={fmtCurrency(revenueData.totalRevenue)} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={ShoppingBag} label="Tổng đơn" value={fmt(revenueData.totalAppointments)} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={TrendingUp} label="Tổng tip" value={fmtCurrency(revenueData.totalTip)} color="text-pink-600" bg="bg-pink-50" />
        <StatCard icon={Activity} label="Giảm giá" value={fmtCurrency(revenueData.totalDiscount)} color="text-red-600" bg="bg-red-50" />
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-gray-900 mb-3 text-sm">Doanh thu theo ngày</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData.revenueByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v?.slice(5) || ''} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: any) => `${(Number(v) / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => fmtCurrency(Number(v))} />
            <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ServiceTab({ revenueData, fmt, fmtCurrency }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-gray-900 mb-3 text-sm">Phân bố doanh thu theo dịch vụ</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={revenueData.revenueByService.slice(0, 8)} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}>
                {revenueData.revenueByService.slice(0, 8).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => fmtCurrency(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-2 text-xs font-bold text-gray-500">Dịch vụ</th>
                  <th className="text-right p-2 text-xs font-bold text-gray-500">Doanh thu</th>
                  <th className="text-right p-2 text-xs font-bold text-gray-500">Lượt</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.revenueByService.slice(0, 10).map((s: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-2 font-semibold text-gray-800">{s.name}</td>
                    <td className="p-2 text-right font-bold text-gray-900">{fmtCurrency(s.revenue)}</td>
                    <td className="p-2 text-right font-semibold text-gray-600">{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StaffTab({ revenueData, fmt, fmtCurrency }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-gray-900 mb-3 text-sm">Hiệu suất nhân viên</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData.revenueByStaff} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: any) => `${(Number(v) / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
            <Tooltip formatter={(v: any) => fmtCurrency(Number(v))} />
            <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left p-2 text-xs font-bold text-gray-500">Nhân viên</th>
              <th className="text-right p-2 text-xs font-bold text-gray-500">Doanh thu</th>
              <th className="text-right p-2 text-xs font-bold text-gray-500">Tip</th>
              <th className="text-right p-2 text-xs font-bold text-gray-500">Đơn</th>
            </tr>
          </thead>
          <tbody>
            {revenueData.revenueByStaff.map((s: any, i: number) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-2 font-semibold text-gray-800">{s.name}</td>
                <td className="p-2 text-right font-bold text-gray-900">{fmtCurrency(s.revenue)}</td>
                <td className="p-2 text-right font-bold text-pink-600">{fmtCurrency(s.tip)}</td>
                <td className="p-2 text-right font-semibold text-gray-600">{s.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CustomerTab({ customerData, fmt, fmtCurrency }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Tổng KH" value={fmt(customerData.customerStats.total)} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={User} label="KH mới" value={fmt(customerData.customerStats.newCount)} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={Activity} label="KH quay lại" value={fmt(customerData.customerStats.returningCount)} color="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={TrendingUp} label="TB lượt/KH" value={String(customerData.customerStats.avgVisits)} color="text-amber-600" bg="bg-amber-50" />
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-gray-900 mb-3 text-sm">Top khách hàng chi tiêu nhiều nhất</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left p-2 text-xs font-bold text-gray-500">#</th>
              <th className="text-left p-2 text-xs font-bold text-gray-500">Tên</th>
              <th className="text-left p-2 text-xs font-bold text-gray-500">SĐT</th>
              <th className="text-right p-2 text-xs font-bold text-gray-500">Tổng chi</th>
              <th className="text-right p-2 text-xs font-bold text-gray-500">Lượt</th>
            </tr>
          </thead>
          <tbody>
            {customerData.topCustomers.slice(0, 15).map((c: any, i: number) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-2 font-bold text-gray-400">{i + 1}</td>
                <td className="p-2 font-semibold text-gray-800">{c.name}</td>
                <td className="p-2 text-gray-500">{c.phone}</td>
                <td className="p-2 text-right font-bold text-gray-900">{fmtCurrency(c.totalSpent)}</td>
                <td className="p-2 text-right font-semibold text-gray-600">{c.visits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GrowthTab({ growthData, fmt, fmtCurrency }: any) {
  const mergedDays = [...new Set([...growthData.current.byDay.map((d: any) => d.date), ...growthData.previous.byDay.map((d: any) => d.date)])].sort()
  const chartData = mergedDays.map((day) => ({
    date: day,
    current: growthData.current.byDay.find((d: any) => d.date === day)?.value || 0,
    previous: growthData.previous.byDay.find((d: any) => d.date === day)?.value || 0,
  }))
  const fmtChange = (v: number) => `${v > 0 ? '+' : ''}${v}%`

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase">Doanh thu kỳ này</div>
          <div className="text-xl font-extrabold text-gray-900 mt-1">{fmtCurrency(growthData.current.revenue)}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase">Doanh thu kỳ trước</div>
          <div className="text-xl font-extrabold text-gray-500 mt-1">{fmtCurrency(growthData.previous.revenue)}</div>
        </div>
        <div className={`bg-white p-4 rounded-2xl border shadow-sm ${growthData.revenueChange >= 0 ? 'border-emerald-100 bg-emerald-50/30' : 'border-red-100 bg-red-50/30'}`}>
          <div className="text-xs font-bold text-gray-500 uppercase">Tăng trưởng</div>
          <div className={`text-xl font-extrabold mt-1 flex items-center gap-1 ${growthData.revenueChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {growthData.revenueChange >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            {fmtChange(growthData.revenueChange)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase">Số đơn kỳ này</div>
          <div className="text-lg font-extrabold text-gray-900 mt-1">{fmt(growthData.current.count)}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase">Số đơn kỳ trước</div>
          <div className="text-lg font-extrabold text-gray-500 mt-1">{fmt(growthData.previous.count)}</div>
          <div className={`text-xs font-bold mt-1 ${growthData.countChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtChange(growthData.countChange)}</div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-gray-900 mb-3 text-sm">So sánh doanh thu</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v?.slice(5) || ''} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: any) => `${(Number(v) / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => fmtCurrency(Number(v))} />
            <Legend />
            <Bar dataKey="current" name="Kỳ này" fill="#ec4899" radius={[4, 4, 0, 0]} />
            <Bar dataKey="previous" name="Kỳ trước" fill="#d1d5db" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
      <div className={`inline-flex p-2 rounded-xl ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="text-xs font-bold text-gray-500">{label}</div>
      <div className={`text-lg font-extrabold ${color}`}>{value}</div>
    </div>
  )
}
