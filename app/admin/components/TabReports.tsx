'use client'

import { useState, useEffect, useCallback, startTransition } from 'react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import {
  BarChart3, TrendingUp, Users, DollarSign, ShoppingBag,
  User, Activity, ChevronDown, RefreshCw,
  ArrowUpRight, ArrowDownRight, FileText, FileSpreadsheet, Download,
} from 'lucide-react'
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false })
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false })
import { getAdvancedRevenueReport, getCustomerAnalytics, getGrowthComparison, getTaxReport } from '../actions'

const SUBTABS = ['TỔNG_QUAN', 'DOANH_THU', 'DICH_VU', 'NHAN_VIEN', 'KHACH_HANG', 'TANG_TRUONG', 'THUE'] as const
type SubTab = typeof SUBTABS[number]

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#14b8a6', '#f97316', '#6366f1', '#a855f7']

type FmtFn = (_n: number) => string

interface RevenueByDayItem { date: string; value: number }
interface RevenueByServiceItem { name: string; revenue: number; count: number }
interface RevenueByStaffItem { name: string; revenue: number; tip: number; count: number }
interface RevenueData {
  totalRevenue: number;
  totalTip: number;
  totalAppointments: number;
  totalDiscount: number;
  revenueByDay: RevenueByDayItem[];
  revenueByService: RevenueByServiceItem[];
  revenueByStaff: RevenueByStaffItem[];
}

interface CustomerStats {
  total: number;
  newCount: number;
  returningCount: number;
  avgVisits: number;
}
interface TopCustomerItem { name: string; phone: string; totalSpent: number; visits: number }
interface CustomerData {
  customerStats: CustomerStats;
  topCustomers: TopCustomerItem[];
}

interface GrowthPeriod {
  revenue: number;
  count: number;
  byDay: { date: string; value: number }[];
}
interface GrowthData {
  current: GrowthPeriod;
  previous: GrowthPeriod;
  revenueChange: number;
  countChange: number;
}

interface TaxMonthItem { month: string; revenue: number; orders: number; commission: number; tip: number }
interface TaxData {
  totalRevenue: number;
  totalOrders: number;
  months: TaxMonthItem[];
}

export default function TabReports() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('TỔNG_QUAN')
  const [rangeType, setRangeType] = useState<'week' | 'month' | 'last_month' | 'custom' | 'year'>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [compareEnabled, setCompareEnabled] = useState(false)
  const [compareStartDate, _setCompareStartDate] = useState('')
  const [compareEndDate, _setCompareEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [revenueData, setRevenueData] = useState<any>(null)
  const [customerData, setCustomerData] = useState<any>(null)
  const [growthData, setGrowthData] = useState<any>(null)
  const [taxYear, setTaxYear] = useState(0)
  useEffect(() => { setTaxYear(new Date().getFullYear()); }, []);
  const [taxData, setTaxData] = useState<any>(null)
  const [taxLoading, setTaxLoading] = useState(false)
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
    startTransition(() => { setLoading(true) })
    const { start, end } = getDateRange()
    if (!start || !end) { startTransition(() => { setLoading(false) }); return }
    try {
      const [rev, cust] = await Promise.all([
        getAdvancedRevenueReport(start, end),
        getCustomerAnalytics(start, end),
      ])
      startTransition(() => {
        setRevenueData(rev)
        setCustomerData(cust)
      })
      if (compareEnabled) {
        const comp = getCompareRange()
        const growth = await getGrowthComparison(start, end, comp.start, comp.end)
        startTransition(() => { setGrowthData(growth) })
      } else {
        startTransition(() => { setGrowthData(null) })
      }
    } catch (err: unknown) {
      startTransition(() => {
        toast.error(err instanceof Error ? err.message : 'Lỗi tải báo cáo')
      })
    } finally {
      startTransition(() => { setLoading(false) })
    }
  }, [getDateRange, compareEnabled, getCompareRange])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (activeSubTab !== 'THUE') return
    startTransition(() => { setTaxLoading(true) })
    getTaxReport(taxYear)
      .then((data) => startTransition(() => { setTaxData(data) }))
      .catch((err: unknown) => startTransition(() => { toast.error(err instanceof Error ? err.message : 'Lỗi tải báo cáo thuế') }))
      .finally(() => startTransition(() => { setTaxLoading(false) }))
  }, [activeSubTab, taxYear])

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
    const ExcelJS = await import('exceljs')
    const wb = new ExcelJS.Workbook()
    const { start, end } = getDateRange()
    if (revenueData) {
      const ws1 = wb.addWorksheet('TheoNgay')
      ws1.columns = [{ header: 'Ngày', key: 'date' }, { header: 'DoanhThu', key: 'value' }]
      ws1.addRows(revenueData.revenueByDay)
      const ws2 = wb.addWorksheet('TheoDichVu')
      ws2.columns = [{ header: 'DichVu', key: 'name' }, { header: 'DoanhThu', key: 'revenue' }, { header: 'SoLuot', key: 'count' }]
      ws2.addRows(revenueData.revenueByService)
      const ws3 = wb.addWorksheet('TheoNhanVien')
      ws3.columns = [{ header: 'NhanVien', key: 'name' }, { header: 'DoanhThu', key: 'revenue' }, { header: 'Tip', key: 'tip' }, { header: 'SoDon', key: 'count' }]
      ws3.addRows(revenueData.revenueByStaff)
    }
    if (customerData) {
      const ws4 = wb.addWorksheet('KhachHang')
      ws4.columns = [{ header: 'Ten', key: 'name' }, { header: 'SDT', key: 'phone' }, { header: 'TongChiTieu', key: 'totalSpent' }, { header: 'SoLanDen', key: 'visits' }]
      ws4.addRows(customerData.topCustomers)
    }
    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `baocao_minspa_${start}_${end}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xuất dữ liệu');
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
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 hidden group-hover:block group-focus-within:block p-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
               <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase">Appointments</div>
               <div className="grid grid-cols-2 gap-1">
                 <button onClick={() => handleRawExport('appointments', 'csv')} className="px-2 py-2.5 min-h-[44px] bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 rounded-lg text-left transition-colors">CSV</button>
                 <button onClick={() => handleRawExport('appointments', 'json')} className="px-2 py-2.5 min-h-[44px] bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 rounded-lg text-left transition-colors">JSON</button>
               </div>
               <div className="border-t border-gray-100 my-1"></div>
               <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase">Customers</div>
               <div className="grid grid-cols-2 gap-1">
                 <button onClick={() => handleRawExport('customers', 'csv')} className="px-2 py-2.5 min-h-[44px] bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 rounded-lg text-left transition-colors">CSV</button>
                 <button onClick={() => handleRawExport('customers', 'json')} className="px-2 py-2.5 min-h-[44px] bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 rounded-lg text-left transition-colors">JSON</button>
               </div>
               <div className="border-t border-gray-100 my-1"></div>
               <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase">Services</div>
               <div className="grid grid-cols-2 gap-1">
                 <button onClick={() => handleRawExport('services', 'csv')} className="px-2 py-2.5 min-h-[44px] bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 rounded-lg text-left transition-colors">CSV</button>
                 <button onClick={() => handleRawExport('services', 'json')} className="px-2 py-2.5 min-h-[44px] bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 rounded-lg text-left transition-colors">JSON</button>
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
              className={`px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                rangeType === r ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r === 'week' ? '7 ngày' : r === 'month' ? 'Tháng này' : r === 'last_month' ? 'Tháng trước' : r === 'year' ? 'Năm nay' : 'Tùy chọn'}
            </button>
          ))}
        </div>
        {rangeType === 'custom' && (
          <div className="flex items-center gap-3">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold min-h-[44px]" />
            <span className="text-gray-400">→</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold min-h-[44px]" />
          </div>
        )}
        <label htmlFor="reports-compare" className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
          <input id="reports-compare" type="checkbox" checked={compareEnabled} onChange={(e) => setCompareEnabled(e.target.checked)} className="rounded" />
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
            {st === 'TỔNG_QUAN' ? '📊 Tổng quan' : st === 'DOANH_THU' ? '📈 Doanh thu' : st === 'DICH_VU' ? '💇 Dịch vụ' : st === 'NHAN_VIEN' ? '👤 Nhân viên' : st === 'KHACH_HANG' ? '👥 Khách hàng' : st === 'TANG_TRUONG' ? '📈 Tăng trưởng' : '🧾 Thuế'}
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
          {activeSubTab === 'THUE' && (
            <TaxTab taxData={taxData} taxYear={taxYear} setTaxYear={setTaxYear} taxLoading={taxLoading} fmt={fmt} fmtCurrency={fmtCurrency} />
          )}
        </>
      )}

      {/* Drill-down Modal (5.10) */}
      {drillDown && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-gray-150 p-6 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-gray-900">{drillDown.label}</h3>
              <button onClick={() => setDrillDown(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><ChevronDown className="w-5 h-5 rotate-180" /></button>
            </div>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {Object.keys(drillDown.data[0] || {}).map((k) => (
                      <th key={k} className="text-left p-2 text-xs font-bold text-gray-500 uppercase">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drillDown.data.map((row, i: number) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                       {Object.values(row).map((v: any, j: number) => (
                        <td key={j} className="p-2 font-semibold text-gray-800">{typeof v === 'number' ? fmt(v) : v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-3 md:hidden">
              {drillDown.data.map((row, i: number) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                  {Object.entries(row).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-sm">
                      <span className="text-xs font-bold text-gray-500 uppercase">{k}</span>
                      <span className="font-semibold text-gray-800">{typeof v === 'number' ? fmt(v) : String(v)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OverviewTab({ revenueData, customerData, fmt, fmtCurrency }: {
  revenueData: RevenueData;
  customerData: CustomerData | null;
  fmt: FmtFn;
  fmtCurrency: FmtFn;
}) {
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
            {revenueData.revenueByService.slice(0, 5).map((s, i: number) => (
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
            {revenueData.revenueByStaff.slice(0, 5).map((s, i: number) => (
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

function RevenueTab({ revenueData, fmt, fmtCurrency }: {
  revenueData: RevenueData;
  fmt: FmtFn;
  fmtCurrency: FmtFn;
}) {
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

function ServiceTab({ revenueData, fmt: _fmt, fmtCurrency }: {
  revenueData: RevenueData;
  fmt: FmtFn;
  fmtCurrency: FmtFn;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-gray-900 mb-3 text-sm">Phân bố doanh thu theo dịch vụ</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={revenueData.revenueByService.slice(0, 8)} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ percent }: { percent?: number }) => `${((percent || 0) * 100).toFixed(0)}%`}>
                {revenueData.revenueByService.slice(0, 8).map((_, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => fmtCurrency(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-2 text-xs font-bold text-gray-500">Dịch vụ</th>
                  <th className="text-right p-2 text-xs font-bold text-gray-500">Doanh thu</th>
                  <th className="text-right p-2 text-xs font-bold text-gray-500">Lượt</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.revenueByService.slice(0, 10).map((s, i: number) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-2 font-semibold text-gray-800">{s.name}</td>
                    <td className="p-2 text-right font-bold text-gray-900">{fmtCurrency(s.revenue)}</td>
                    <td className="p-2 text-right font-semibold text-gray-600">{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-3 md:hidden">
            {revenueData.revenueByService.slice(0, 10).map((s, i: number) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Dịch vụ</p>
                    <p className="font-semibold text-gray-800">{s.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Doanh thu</p>
                    <p className="font-bold text-gray-900">{fmtCurrency(s.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Lượt</p>
                    <p className="font-semibold text-gray-600">{s.count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StaffTab({ revenueData, fmt: _fmt, fmtCurrency }: {
  revenueData: RevenueData;
  fmt: FmtFn;
  fmtCurrency: FmtFn;
}) {
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
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hidden md:block">
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
            {revenueData.revenueByStaff.map((s, i: number) => (
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
      <div className="mt-4 space-y-3 md:hidden">
        {revenueData.revenueByStaff.map((s, i: number) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <div>
                <p className="text-xs text-gray-500">Nhân viên</p>
                <p className="font-semibold text-gray-800">{s.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Doanh thu</p>
                <p className="font-bold text-gray-900">{fmtCurrency(s.revenue)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tip</p>
                <p className="font-bold text-pink-600">{fmtCurrency(s.tip)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Đơn</p>
                <p className="font-semibold text-gray-600">{s.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CustomerTab({ customerData, fmt, fmtCurrency }: {
  customerData: CustomerData;
  fmt: FmtFn;
  fmtCurrency: FmtFn;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Tổng KH" value={fmt(customerData.customerStats.total)} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={User} label="KH mới" value={fmt(customerData.customerStats.newCount)} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={Activity} label="KH quay lại" value={fmt(customerData.customerStats.returningCount)} color="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={TrendingUp} label="TB lượt/KH" value={String(customerData.customerStats.avgVisits)} color="text-amber-600" bg="bg-amber-50" />
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hidden md:block">
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
            {customerData.topCustomers.slice(0, 15).map((c, i: number) => (
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
      <div className="mt-4 space-y-3 md:hidden">
        {customerData.topCustomers.slice(0, 15).map((c, i: number) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <div>
                <p className="text-xs text-gray-500">Tên</p>
                <p className="font-semibold text-gray-800">{c.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">SĐT</p>
                <p className="text-gray-500">{c.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tổng chi</p>
                <p className="font-bold text-gray-900">{fmtCurrency(c.totalSpent)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Lượt</p>
                <p className="font-semibold text-gray-600">{c.visits}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GrowthTab({ growthData, fmt, fmtCurrency }: {
  growthData: GrowthData;
  fmt: FmtFn;
  fmtCurrency: FmtFn;
}) {
  const mergedDays = [...new Set([...growthData.current.byDay.map((d) => d.date), ...growthData.previous.byDay.map((d) => d.date)])].sort()
  const chartData = mergedDays.map((day) => ({
    date: day,
    current: growthData.current.byDay.find((d) => d.date === day)?.value || 0,
    previous: growthData.previous.byDay.find((d) => d.date === day)?.value || 0,
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

function TaxTab({ taxData, taxYear, setTaxYear, taxLoading, fmt, fmtCurrency }: {
  taxData: TaxData | null;
  taxYear: number;
  setTaxYear: (_year: number) => void;
  taxLoading: boolean;
  fmt: FmtFn;
  fmtCurrency: FmtFn;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label htmlFor="reports-taxYear" className="text-xs font-bold text-gray-500">Năm:</label>
        <select
          id="reports-taxYear"
          value={taxYear}
          onChange={(e) => setTaxYear(Number(e.target.value))}
          className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm font-semibold bg-white"
          suppressHydrationWarning
        >
          {taxYear > 0 && Array.from({ length: 5 }, (_, i) => taxYear - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {taxLoading ? (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
          Đang tải báo cáo thuế...
        </div>
      ) : taxData ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tổng doanh thu năm</p>
              <p className="text-xl font-extrabold text-gray-900 mt-1">{fmtCurrency(taxData.totalRevenue)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tổng số đơn</p>
              <p className="text-xl font-extrabold text-gray-900 mt-1">{fmt(taxData.totalOrders)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm bg-emerald-50/30">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Thuế GTGT ước tính (8%)</p>
              <p className="text-xl font-extrabold text-emerald-700 mt-1">
                {fmtCurrency(Math.round(taxData.totalRevenue * 0.08))}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm bg-amber-50/30">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Thuế TNCN ước tính (2%)</p>
              <p className="text-xl font-extrabold text-amber-700 mt-1">
                {fmtCurrency(Math.round(taxData.totalRevenue * 0.02))}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-3 text-sm">Doanh thu & Thuế theo tháng</h4>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-2 font-bold text-gray-500">Tháng</th>
                    <th className="text-right p-2 font-bold text-gray-500">Doanh thu</th>
                    <th className="text-right p-2 font-bold text-gray-500">Số đơn</th>
                    <th className="text-right p-2 font-bold text-gray-500">Hoa hồng</th>
                    <th className="text-right p-2 font-bold text-gray-500">Tip</th>
                    <th className="text-right p-2 font-bold text-gray-500">Thuế GTGT (8%)</th>
                    <th className="text-right p-2 font-bold text-gray-500">Thuế TNCN (2%)</th>
                  </tr>
                </thead>
                <tbody>
                  {taxData.months.map((m) => (
                    <tr key={m.month} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-2 font-bold text-gray-800">
                        {new Date(m.month + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="p-2 text-right font-bold text-gray-900">{fmtCurrency(m.revenue)}</td>
                      <td className="p-2 text-right font-semibold text-gray-600">{fmt(m.orders)}</td>
                      <td className="p-2 text-right font-semibold text-gray-600">{fmtCurrency(m.commission)}</td>
                      <td className="p-2 text-right font-semibold text-pink-600">{fmtCurrency(m.tip)}</td>
                      <td className="p-2 text-right font-bold text-emerald-700">{fmtCurrency(Math.round(m.revenue * 0.08))}</td>
                      <td className="p-2 text-right font-bold text-amber-700">{fmtCurrency(Math.round(m.revenue * 0.02))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                    <td className="p-2 text-gray-900">Tổng năm</td>
                    <td className="p-2 text-right text-gray-900">{fmtCurrency(taxData.totalRevenue)}</td>
                    <td className="p-2 text-right text-gray-900">{fmt(taxData.totalOrders)}</td>
                    <td className="p-2 text-right text-gray-900">—</td>
                    <td className="p-2 text-right text-gray-900">—</td>
                    <td className="p-2 text-right text-emerald-800">{fmtCurrency(Math.round(taxData.totalRevenue * 0.08))}</td>
                    <td className="p-2 text-right text-amber-800">{fmtCurrency(Math.round(taxData.totalRevenue * 0.02))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div className="mt-4 space-y-3 md:hidden">
            {taxData.months.map((m) => (
              <div key={m.month} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                <p className="font-bold text-gray-800 text-sm">
                  {new Date(m.month + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Doanh thu</p>
                    <p className="font-bold text-gray-900">{fmtCurrency(m.revenue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Số đơn</p>
                    <p className="font-semibold text-gray-600">{fmt(m.orders)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hoa hồng</p>
                    <p className="font-semibold text-gray-600">{fmtCurrency(m.commission)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Tip</p>
                    <p className="font-semibold text-pink-600">{fmtCurrency(m.tip)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Thuế GTGT (8%)</p>
                    <p className="font-bold text-emerald-700">{fmtCurrency(Math.round(m.revenue * 0.08))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Thuế TNCN (2%)</p>
                    <p className="font-bold text-amber-700">{fmtCurrency(Math.round(m.revenue * 0.02))}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
            <p className="font-bold mb-1">⚠️ Lưu ý về thuế</p>
            <p>Các con số trên chỉ mang tính chất tham khảo. Vui lòng tham khảo ý kiến kế toán viên để biết nghĩa vụ thuế chính xác. 
            Thuế GTGT (VAT) 8% áp dụng cho dịch vụ làm đẹp theo Nghị định 44/2023/NĐ-CP. 
            Thuế TNCN 2% là mức ước tính cho hộ kinh doanh cá thể.</p>
          </div>
        </>
      ) : (
        <div className="text-center py-16 text-gray-400 italic">
          Không có dữ liệu thuế.
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
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
