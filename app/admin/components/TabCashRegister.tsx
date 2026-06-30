'use client'

import { useState, useEffect, useCallback, startTransition } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react'
import { getCashRegisterTransactions, addCashTransaction, deleteCashTransaction } from '../actions'

interface CashItem {
  id: string
  type: 'THU' | 'CHI'
  category: string
  amount: number
  description: string
  referenceType: string | null
  referenceId: string | null
  recordedBy: string
  recordedAt: string
}

const CATEGORIES = ['Tiền dịch vụ', 'Tiền gói liệu trình', 'Thu khác', 'Chi mua sắm', 'Chi mặt bằng', 'Chi lương', 'Chi quảng cáo', 'Chi khác']

export default function TabCashRegister() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [data, setData] = useState<{ items: CashItem[]; totalThu: number; totalChi: number; balance: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchData = useCallback(async () => {
    startTransition(() => { setLoading(true) })
    try {
      const result = await getCashRegisterTransactions(month)
      startTransition(() => { setData(result) })
    } catch (e) {
      console.error(e)
    }
    startTransition(() => { setLoading(false) })
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Sổ quỹ tiền mặt</h2>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
            suppressHydrationWarning
          />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ghi sổ
          </button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-100 rounded-2xl" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <ArrowDownCircle className="w-6 h-6 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-800">Tổng thu</span>
              </div>
              <p className="text-2xl font-black text-emerald-700">{data.totalThu.toLocaleString('vi')}đ</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <ArrowUpCircle className="w-6 h-6 text-red-500" />
                <span className="text-sm font-bold text-red-800">Tổng chi</span>
              </div>
              <p className="text-2xl font-black text-red-600">{data.totalChi.toLocaleString('vi')}đ</p>
            </div>
            <div className={`border rounded-2xl p-5 ${data.balance >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
              <div className="flex items-center gap-3 mb-2">
                <Wallet className={`w-6 h-6 ${data.balance >= 0 ? 'text-blue-600' : 'text-amber-600'}`} />
                <span className="text-sm font-bold">Số dư</span>
              </div>
              <p className={`text-2xl font-black ${data.balance >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                {data.balance.toLocaleString('vi')}đ
              </p>
            </div>
          </div>

          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {data.items.length === 0 ? (
              <p className="text-center py-12 text-gray-400 font-semibold">Chưa có giao dịch nào trong tháng này</p>
            ) : data.items.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    item.type === 'THU' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.type === 'THU' ? 'Thu' : 'Chi'}
                  </span>
                  <button
                    onClick={async () => {
                      if (confirm('Xoá giao dịch này?')) {
                        await deleteCashTransaction(item.id)
                        fetchData()
                      }
                    }}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                    title="Xoá"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">{item.category}</span>
                  <span className={`font-bold ${item.type === 'THU' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {item.type === 'THU' ? '+' : '-'}{item.amount.toLocaleString('vi')}đ
                  </span>
                </div>
                <div className="text-xs text-gray-400 flex justify-between">
                  <span>{item.description || '-'}</span>
                  <span>{item.recordedBy} · {format(new Date(item.recordedAt), 'dd/MM HH:mm', { locale: vi })}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Loại</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Danh mục</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Số tiền</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Mô tả</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Ghi bởi</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Ngày</th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400 font-semibold">Chưa có giao dịch nào trong tháng này</td>
                    </tr>
                  ) : data.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.type === 'THU' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.type === 'THU' ? 'Thu' : 'Chi'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700">{item.category}</td>
                      <td className={`px-4 py-3 text-right font-bold ${item.type === 'THU' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {item.type === 'THU' ? '+' : '-'}{item.amount.toLocaleString('vi')}đ
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{item.description || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{item.recordedBy}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {format(new Date(item.recordedAt), 'dd/MM HH:mm', { locale: vi })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={async () => {
                            if (confirm('Xoá giao dịch này?')) {
                              await deleteCashTransaction(item.id)
                              fetchData()
                            }
                          }}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                          title="Xoá"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-400 font-semibold">Không thể tải dữ liệu</div>
      )}

      {showModal && <AddTransactionModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchData() }} />}
    </div>
  )
}

function AddTransactionModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<'THU' | 'CHI'>('THU')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!category || !amount || Number(amount) <= 0) return
    setSaving(true)
    try {
      await addCashTransaction({
        type,
        category,
        amount: Number(amount),
        description: description || undefined,
      })
      onSaved()
    } catch (e: unknown) {
      alert('Lỗi: ' + (e instanceof Error ? e.message : String(e)))
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900">Ghi sổ quỹ</h3>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('THU')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
              type === 'THU' ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-white border-gray-200 text-gray-500'
            }`}
          >
            <ArrowDownCircle className="w-5 h-5 mx-auto mb-1" />
            Thu
          </button>
          <button
            type="button"
            onClick={() => setType('CHI')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
              type === 'CHI' ? 'bg-red-50 border-red-400 text-red-700' : 'bg-white border-gray-200 text-gray-500'
            }`}
          >
            <ArrowUpCircle className="w-5 h-5 mx-auto mb-1" />
            Chi
          </button>
        </div>

        <div>
          <label htmlFor="cash-category" className="block text-sm font-bold text-gray-700 mb-1.5">Danh mục</label>
          <select
            id="cash-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
          >
            <option value="">Chọn danh mục</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="cash-amount" className="block text-sm font-bold text-gray-700 mb-1.5">Số tiền</label>
          <input
            id="cash-amount"
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div>
          <label htmlFor="cash-description" className="block text-sm font-bold text-gray-700 mb-1.5">Mô tả</label>
          <textarea
            id="cash-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ghi chú thêm..."
            rows={2}
            className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 cursor-pointer">
            Huỷ
          </button>
          <button
            onClick={handleSave}
            disabled={!category || !amount || Number(amount) <= 0 || saving}
            className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}
