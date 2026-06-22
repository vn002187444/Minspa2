"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, Star, ArrowRight, X, Plus, Minus, Copy } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import Image from "next/image"
import LoadingButton from "@/components/LoadingButton"
import { getCustomerActivePackages } from "@/app/staff/actions"
import { getBankSettings } from "@/app/admin/actions"

type Props = {
  appt: any
  allServices: any[]
  onClose: () => void
  onComplete: (extraServices: string[], tip: number, discountPercent: number, paymentMethod: "CASH" | "BANK") => Promise<{ success: boolean; total?: number; error?: string }>
}

const TIP_AMOUNTS = [10000, 20000, 30000, 50000]
const SUGGESTIONS = [
  "Thợ làm kỹ",
  "Rất nhiệt tình",
  "Không gian sạch đẹp",
  "Móng bền",
  "Gội êm",
  "Giao tiếp vui vẻ",
]

function removeVietnameseTones(str: string) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a")
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i")
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y")
  str = str.replace(/đ/g, "d")
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A")
  str = str.replace(/È|É|Ạ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E")
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I")
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O")
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U")
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y")
  str = str.replace(/Đ/g, "D")
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return str
}

export default function CheckoutModal({ appt, allServices, onClose, onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Edit services
  const [extraServices, setExtraServices] = useState<string[]>([])
  const [discountType, setDiscountType] = useState<"per-order" | "per-item">("per-order")
  const [discountPercent, setDiscountPercent] = useState("")
  const [itemDiscounts, setItemDiscounts] = useState<Record<string, number>>({})

  // Step 2: Review + Tip
  const [rating, setRating] = useState(5)
  const [tip, setTip] = useState(0)
  const [customTip, setCustomTip] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState("")

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK">("BANK")

  // Step 5: QR
  const [bankConfig, setBankConfig] = useState<any>(null)
  const [paidLoading, setPaidLoading] = useState(false)
  const [copiedId, setCopiedId] = useState("")

  // Package info
  const [packageName, setPackageName] = useState("")
  const [coveredServiceId, setCoveredServiceId] = useState<string | null>(null)

  // Result
  const [completedResult, setCompletedResult] = useState<{ total: number; extraServices: string[] } | null>(null)

  useEffect(() => {
    async function loadPkgInfo() {
      if (appt.is_package_session && appt.use_package_id && appt.customer_id) {
        const pkgs = await getCustomerActivePackages(appt.customer_id)
        const pkg = pkgs.find((p: any) => p.id === appt.use_package_id)
        if (pkg) {
          const tp = pkg.treatment_packages?.[0]
          setPackageName(tp?.name || "Gói liệu trình")
          setCoveredServiceId(tp?.service_id || null)
        }
      }
    }
    loadPkgInfo()
  }, [appt])

  async function loadBankConfig() {
    if (!bankConfig) {
      const cfg = await getBankSettings()
      setBankConfig(cfg)
    }
  }

  // Calculate totals
  const baseServices = appt.appointment_services?.map((as: any) => ({
    id: as.service_id || as.services?.id,
    name: as.services?.name || "Dịch vụ",
    price: Number(as.services?.price) || 0,
    isCovered: appt.is_package_session && coveredServiceId && String(as.service_id || as.services?.id) === String(coveredServiceId),
  })) || []

  const extraServiceList = allServices?.filter((s: any) => extraServices.includes(s.id)) || []

  const baseTotal = baseServices.reduce((sum: number, s: any) => sum + (s.isCovered ? 0 : s.price), 0)
  const extraTotal = extraServiceList.reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0)
  const subtotal = baseTotal + extraTotal

  const discValue = Number(discountPercent) || 0
  const totalDiscountAmount = discountType === "per-order"
    ? Math.round(subtotal * (discValue / 100))
    : Object.entries(itemDiscounts).reduce((sum, [, pct]) => {
        const svc = [...baseServices, ...extraServiceList].find((s: any) => String(s.id) === String(pct))
        return sum + (svc ? Math.round((svc.isCovered ? 0 : svc.price) * ((Number(pct) || 0) / 100)) : 0)
      }, 0)

  const grandTotal = Math.max(0, subtotal - totalDiscountAmount)
  const totalWithTip = grandTotal + tip

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(""), 2000)
  }

  // Service names for QR memo
  const coreServiceNames = appt?.appointment_services?.map((as: any) => as.services?.name).filter(Boolean) || []
  const extraNames = extraServiceList.map((s: any) => s.name)
  const allNames = [...coreServiceNames, ...extraNames]
  const rawMemo = allNames.length > 0 ? allNames.join(" ") : "Thanh toan"
  const memoText = removeVietnameseTones(rawMemo)
    .replace(/[^A-Za-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .substring(0, 25)

  const hasBankConfig = bankConfig && bankConfig.bank_id && bankConfig.account_number
  const qrUrl = hasBankConfig
    ? `https://img.vietqr.io/image/${bankConfig.bank_id}-${bankConfig.account_number}-compact2.png?amount=${grandTotal}&addInfo=${encodeURIComponent(memoText)}&accountName=${encodeURIComponent(bankConfig.account_owner || "")}`
    : ""

  async function handleConfirmPayment() {
    setLoading(true)
    try {
      const res = await onComplete(extraServices, tip, discValue, paymentMethod)
      if (res.success) {
        setCompletedResult({ total: res.total || grandTotal, extraServices })
        if (paymentMethod === "CASH") {
          setStep(6)
        } else {
          await loadBankConfig()
          setStep(5)
        }
      } else {
        alert("Lỗi: " + res.error)
      }
    } catch (err: any) {
      alert("Lỗi hệ thống: " + (err.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  function renderStepIndicator() {
    const steps = [
      { num: 1, label: "Dịch vụ" },
      { num: 2, label: "Đánh giá" },
      { num: 3, label: "Biên lai" },
      { num: 4, label: "Thanh toán" },
    ]
    const currentStep = step <= 4 ? step : 4
    return (
      <div className="flex items-center justify-center gap-1.5 mb-4">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-1.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              s.num <= currentStep ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"
            }`}>
              {s.num < currentStep ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-xs font-semibold ${s.num <= currentStep ? "text-emerald-700" : "text-gray-400"}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-6 h-0.5 ${s.num < currentStep ? "bg-emerald-500" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  // Step 1: Edit Services
  function renderStep1() {
    return (
      <div className="space-y-5">
        <div>
          <h4 className="font-bold text-gray-900 text-base mb-3">Dịch vụ đã chọn</h4>
          <div className="space-y-2">
            {baseServices.map((svc: any) => (
              <div key={svc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{svc.name}</p>
                  {svc.isCovered && <span className="text-[10px] font-bold text-amber-600">Gói liệu trình</span>}
                </div>
                <span className={`text-sm font-bold ${svc.isCovered ? "text-amber-500" : "text-gray-800"}`}>
                  {svc.isCovered ? "0đ" : `${svc.price.toLocaleString("vi")}đ`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2.5">
            Thêm dịch vụ phát sinh
          </label>
          <div className="max-h-48 overflow-y-auto border border-gray-150 rounded-2xl p-3 space-y-2 bg-gray-50">
            {allServices?.map((s: any) => {
              const isSelected = extraServices.includes(s.id)
              return (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                    isSelected ? "bg-emerald-50 border-emerald-300" : "bg-white border-gray-150 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) setExtraServices([...extraServices, s.id])
                      else setExtraServices(extraServices.filter((id) => id !== s.id))
                    }}
                  />
                  <span className="text-sm font-semibold text-gray-700 flex-1">{s.name}</span>
                  <span className="text-sm font-bold text-emerald-600">{s.price.toLocaleString("vi")}đ</span>
                </label>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2.5">Giảm giá</label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setDiscountType("per-order")}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                discountType === "per-order"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              % Tổng đơn
            </button>
            <button
              type="button"
              onClick={() => setDiscountType("per-item")}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                discountType === "per-item"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              % Từng DV
            </button>
          </div>
          {discountType === "per-order" ? (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === "" || (Number(val) >= 0 && Number(val) <= 100)) setDiscountPercent(val)
                }}
                placeholder="% giảm toàn đơn"
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-semibold text-sm"
              />
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {[...baseServices, ...extraServiceList].map((svc: any) => (
                <div key={svc.id} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 flex-1 truncate">{svc.name}</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={itemDiscounts[svc.id] || ""}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === "" || (Number(val) >= 0 && Number(val) <= 100)) {
                        setItemDiscounts({ ...itemDiscounts, [svc.id]: val === "" ? "" : Number(val) })
                      }
                    }}
                    placeholder="%"
                    className="w-20 py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-center focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {appt.buy_package_id && (
          <div className="p-4 bg-pink-50 border border-pink-200 text-pink-950 rounded-2xl flex gap-3 text-xs leading-relaxed">
            <span className="text-xl shrink-0">🎁</span>
            <div>
              <p className="font-extrabold text-[#9D174D] uppercase tracking-wider text-[10px] mb-0.5">YÊU CẦU MUA GÓI MỚI</p>
              <p className="font-medium text-gray-800">
                Khách hàng có nhu cầu đăng ký gói mới. Nhớ thu tiền và kích hoạt qua Tab <b>Bán Gói</b> sau ca làm!
              </p>
            </div>
          </div>
        )}

        {appt.is_package_session && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 text-xs leading-relaxed">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <p className="font-extrabold text-[#78350F] uppercase tracking-wider text-[10px] mb-0.5">XÁC NHẬN LIỆU TRÌNH</p>
              <p>Đây là buổi liệu trình. Hệ thống sẽ tự khấu trừ 01 buổi từ gói <b>"{packageName}"</b>.</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Step 2: Review + Tip
  function renderStep2() {
    return (
      <div className="space-y-6 text-center">
        <div>
          <div className="w-16 h-16 bg-pink-100 text-pink-500 rounded-[1.5rem] mx-auto flex items-center justify-center mb-3">
            <Star className="w-8 h-8 fill-current" />
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-1">Đánh giá dịch vụ</h4>
          <p className="text-gray-500 text-sm">Khách hàng có hài lòng không?</p>
        </div>

        <div className="flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              onClick={() => setRating(i)}
              className={`p-1.5 transition-transform hover:scale-110 active:scale-90 cursor-pointer ${i <= rating ? "text-yellow-400" : "text-gray-200"}`}
            >
              <Star className="w-10 h-10 fill-current" />
            </button>
          ))}
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 mb-2.5 uppercase tracking-wider">Gợi ý nhanh</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTags(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag])}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                  tags.includes(tag) ? "bg-pink-500 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Nhập ý kiến đóng góp (nếu có)..."
          rows={2}
          className="w-full p-3.5 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none text-sm font-semibold transition-all resize-none"
        />

        <div className="text-left">
          <p className="text-sm font-bold text-gray-700 mb-3">
            Tiền Tip khách muốn gửi <span className="text-gray-400 font-normal">(không bị giảm giá)</span>
          </p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {TIP_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => { setTip(amount); setCustomTip("") }}
                className={`py-3 rounded-xl text-sm font-bold border transition-all active:scale-95 cursor-pointer ${
                  tip === amount && !customTip
                    ? "border-pink-500 bg-pink-50 text-pink-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {(amount / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₫</span>
            <input
              type="number"
              value={customTip}
              onChange={(e) => { setCustomTip(e.target.value); setTip(0) }}
              placeholder="Nhập số tiền tip khác..."
              className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all font-semibold text-sm"
            />
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Receipt
  function renderStep3() {
    const finalTip = customTip ? Number(customTip) : tip
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h4 className="text-xl font-bold text-gray-900 mb-1">Xác nhận biên lai</h4>
          <p className="text-gray-500 text-sm">Kiểm tra lại thông tin trước khi thanh toán</p>
        </div>

        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-3 text-sm">
          {baseServices.map((svc: any) => {
            const discount = discountType === "per-item" && itemDiscounts[svc.id]
              ? Math.round((svc.isCovered ? 0 : svc.price) * ((Number(itemDiscounts[svc.id]) || 0) / 100))
              : 0
            return (
              <div key={svc.id} className="flex justify-between">
                <span className="text-gray-600">{svc.name}{svc.isCovered ? " (LT)" : ""}</span>
                <span className={`font-semibold ${svc.isCovered ? "text-amber-500" : ""}`}>
                  {svc.isCovered ? "0đ" : `${svc.price.toLocaleString("vi")}đ`}
                  {discount > 0 && <span className="text-pink-500 ml-1">-{discount.toLocaleString("vi")}đ</span>}
                </span>
              </div>
            )
          })}
          {extraServiceList.map((svc: any) => (
            <div key={svc.id} className="flex justify-between text-emerald-700">
              <span>{svc.name} <span className="text-[10px] text-emerald-500">(PS)</span></span>
              <span className="font-semibold">+{Number(svc.price).toLocaleString("vi")}đ</span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2" />
          <div className="flex justify-between text-gray-700">
            <span>Tạm tính</span>
            <span className="font-bold">{subtotal.toLocaleString("vi")}đ</span>
          </div>
          {totalDiscountAmount > 0 && (
            <div className="flex justify-between text-pink-600">
              <span>Giảm giá</span>
              <span className="font-bold">-{totalDiscountAmount.toLocaleString("vi")}đ</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-black text-emerald-600 border-t border-gray-200 pt-2">
            <span>Tổng thanh toán</span>
            <span>{grandTotal.toLocaleString("vi")}đ</span>
          </div>
          {finalTip > 0 && (
            <div className="flex justify-between text-pink-600 border-t border-dashed border-gray-200 pt-2">
              <span>Tiền Tip <span className="text-[10px] text-gray-400">(không KM)</span></span>
              <span className="font-bold">{finalTip.toLocaleString("vi")}đ</span>
            </div>
          )}
          {(finalTip > 0) && (
            <div className="flex justify-between text-base font-black text-gray-900 border-t border-gray-200 pt-2">
              <span>Khách cần trả</span>
              <span className="text-pink-600">{(grandTotal + finalTip).toLocaleString("vi")}đ</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Step 4: Payment
  function renderStep4() {
    const finalTip = customTip ? Number(customTip) : tip
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h4 className="text-xl font-bold text-gray-900 mb-1">Phương thức thanh toán</h4>
          <p className="text-gray-500 text-sm">Chọn cách khách hàng muốn thanh toán</p>
        </div>

        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Tổng dịch vụ</span>
            <span className="font-bold">{grandTotal.toLocaleString("vi")}đ</span>
          </div>
          {finalTip > 0 && (
            <div className="flex justify-between">
              <span>Tip</span>
              <span className="font-bold text-pink-600">{finalTip.toLocaleString("vi")}đ</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black border-t border-gray-200 pt-2">
            <span>Tổng cộng</span>
            <span className="text-emerald-600">{totalWithTip.toLocaleString("vi")}đ</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod("CASH")}
            className={`py-4 px-4 rounded-xl font-bold border transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
              paymentMethod === "CASH"
                ? "border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="text-2xl">💵</span>
            <span className="text-sm font-semibold">Tiền mặt</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("BANK")}
            className={`py-4 px-4 rounded-xl font-bold border transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
              paymentMethod === "BANK"
                ? "border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="text-2xl">💳</span>
            <span className="text-sm font-semibold">Chuyển khoản</span>
          </button>
        </div>
      </div>
    )
  }

  // Step 5: QR (Bank)
  function renderStep5() {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <h4 className="text-xl font-bold text-gray-900 mb-1">Quét mã chuyển khoản</h4>
          <p className="text-gray-500 text-sm">Khách hàng quét mã để thanh toán</p>
        </div>

        {!hasBankConfig ? (
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5 space-y-3 text-sm text-center">
            <p className="font-bold text-amber-800 text-lg">Chưa cấu hình tài khoản nhận!</p>
            <p className="text-amber-700 font-medium">Admin cần cài đặt ngân hàng trong Admin Portal.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-100 rounded-3xl p-4 flex flex-col items-center justify-center">
              <div className="bg-white p-3 rounded-2xl border border-gray-150 shadow-sm max-w-[200px] aspect-square relative flex items-center justify-center">
                <Image src={qrUrl} alt="VietQR" fill className="object-contain" referrerPolicy="no-referrer" unoptimized />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-sm">
              <div className="p-3.5 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ngân hàng</p>
                  <p className="text-sm font-semibold text-gray-800">{bankConfig.bank_name}</p>
                </div>
              </div>
              <div className="p-3.5 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Số tài khoản</p>
                  <p className="text-sm font-extrabold text-gray-900 font-mono tracking-wide">{bankConfig.account_number}</p>
                </div>
                <button
                  onClick={() => copyText(bankConfig.account_number, "acc")}
                  className="text-xs px-3 py-1.5 font-bold rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors cursor-pointer"
                >
                  {copiedId === "acc" ? "Đã chép" : "Sao chép"}
                </button>
              </div>
              <div className="p-3.5 flex justify-between items-center bg-emerald-50/20">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Số tiền</p>
                  <p className="text-base font-black text-emerald-600">{grandTotal.toLocaleString("vi")}đ</p>
                </div>
                <button
                  onClick={() => copyText(String(grandTotal), "amount")}
                  className="text-xs px-3 py-1.5 font-bold rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  {copiedId === "amount" ? "Đã chép" : "Sao chép"}
                </button>
              </div>
              <div className="p-3.5 flex justify-between items-center">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nội dung CK</p>
                  <p className="text-sm font-bold text-pink-600 truncate font-mono">{memoText}</p>
                </div>
                <button
                  onClick={() => copyText(memoText, "memo")}
                  className="text-xs px-3 py-1.5 font-bold rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors shrink-0 cursor-pointer"
                >
                  {copiedId === "memo" ? "Đã chép" : "Sao chép"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Step 6: Thank you
  function renderStep6() {
    const finalTip = customTip ? Number(customTip) : tip
    return (
      <div className="space-y-6 text-center">
        <div className="py-4">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-[2rem] mx-auto flex items-center justify-center mb-4 animate-in zoom-in-95 duration-500">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Cảm ơn đã thực hiện dịch vụ!
          </h3>
          <p className="text-gray-500 text-sm">
            Đơn hàng của <strong>{appt.customers?.full_name || "khách"}</strong> đã hoàn tất.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-2 text-sm text-left">
          <div className="flex justify-between">
            <span className="text-gray-600">Tổng thanh toán</span>
            <span className="font-bold text-emerald-600">{grandTotal.toLocaleString("vi")}đ</span>
          </div>
          {finalTip > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Tiền Tip</span>
              <span className="font-bold text-pink-600">{finalTip.toLocaleString("vi")}đ</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black border-t border-gray-200 pt-2">
            <span>Đã thu</span>
            <span className="text-emerald-600">{totalWithTip.toLocaleString("vi")}đ</span>
          </div>
        </div>
      </div>
    )
  }

  function canProceedFromStep1() {
    return true
  }

  function canProceedFromStep2() {
    return true
  }

  return (
    <div className="fixed inset-0 bg-white md:bg-black/60 md:backdrop-blur-sm z-50 flex flex-col md:items-center md:justify-center p-0 md:p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md flex flex-col overflow-hidden shadow-2xl rounded-none md:rounded-3xl border-0 md:border border-gray-100 animate-in slide-in-from-bottom-5 duration-300">
        {/* Header */}
        <div className={`p-5 shrink-0 flex justify-between items-center ${
          step === 6 ? "bg-emerald-500" : step === 5 ? "bg-pink-600" : "bg-gray-900"
        } text-white`}>
          <div>
            <h3 className="font-bold text-lg">
              {step === 1 && "Chỉnh sửa đơn hàng"}
              {step === 2 && "Đánh giá & Tip"}
              {step === 3 && "Xác nhận biên lai"}
              {step === 4 && "Thanh toán"}
              {step === 5 && "Chuyển khoản"}
              {step === 6 && "Hoàn tất"}
            </h3>
            <p className="text-white/70 text-sm mt-0.5">
              {appt.customers?.full_name || "Khách hàng"}
            </p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white font-bold text-2xl p-2 cursor-pointer">
            &times;
          </button>
        </div>

        {/* Step indicator (only for steps 1-4) */}
        {step <= 4 && (
          <div className="px-5 pt-4 pb-2 bg-white border-b border-gray-100">
            {renderStepIndicator()}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
        </div>

        {/* Footer buttons */}
        <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex gap-3">
          {step === 1 && (
            <>
              <button onClick={onClose} className="flex-1 py-3.5 text-gray-600 font-bold bg-gray-100 rounded-xl active:scale-95 transition-transform cursor-pointer">
                Hủy
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedFromStep1()}
                className="flex-1 py-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
              >
                Tiếp theo
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button onClick={() => setStep(1)} className="flex-1 py-3.5 text-gray-600 font-bold bg-gray-100 rounded-xl active:scale-95 transition-transform cursor-pointer">
                Quay lại
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedFromStep2()}
                className="flex-1 py-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
              >
                Tiếp theo
              </button>
            </>
          )}
          {step === 3 && (
            <>
              <button onClick={() => setStep(2)} className="flex-1 py-3.5 text-gray-600 font-bold bg-gray-100 rounded-xl active:scale-95 transition-transform cursor-pointer">
                Quay lại
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform cursor-pointer"
              >
                Thanh toán
              </button>
            </>
          )}
          {step === 4 && (
            <>
              <button onClick={() => setStep(3)} className="flex-1 py-3.5 text-gray-600 font-bold bg-gray-100 rounded-xl active:scale-95 transition-transform cursor-pointer">
                Quay lại
              </button>
              <LoadingButton
                onClick={handleConfirmPayment}
                isLoading={loading}
                loadingText="Đang xử lý..."
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-150 active:scale-95 transition-transform cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Xác nhận thanh toán
              </LoadingButton>
            </>
          )}
          {step === 5 && (
            <>
              <button onClick={() => setStep(4)} className="flex-1 py-3.5 text-gray-600 font-bold bg-gray-100 rounded-xl active:scale-95 transition-transform cursor-pointer">
                Quay lại
              </button>
              <LoadingButton
                onClick={async () => {
                  setPaidLoading(true)
                  setStep(6)
                  setPaidLoading(false)
                }}
                isLoading={paidLoading}
                loadingText="Đang xác nhận..."
                className="flex-1 py-3.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-100 active:scale-95 transition-transform cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Khách đã trả
              </LoadingButton>
            </>
          )}
          {step === 6 && (
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform cursor-pointer flex items-center justify-center gap-2"
            >
              Đóng <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
