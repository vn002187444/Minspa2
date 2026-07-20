"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, User, CalendarCheck, Package, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react"
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { toast } from "sonner"
import { submitBooking } from "@/app/booking/actions/booking"
import { getCustomerByPhone } from "@/app/admin/actions"
import { getCustomerActivePackages } from "@/app/staff/actions"
import { getSlotAvailability } from "@/app/booking/actions/slots"
import type { SlotInfo } from "@/app/booking/actions/slots"
import BookingCalendar from "@/components/BookingCalendar"
import { Button } from "@/components/ui/Button"
import LoadingButton from "@/components/LoadingButton"

type Props = {
  staffId: string
  allServices: any[]
  staffList: any[]
  onBookingCreated: () => void
}

type CustomerInfo = {
  id: string
  full_name: string
  phone: string
}

export default function StaffBookingTab({ staffId, allServices, staffList, onBookingCreated }: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Customer
  const [phoneSearch, setPhoneSearch] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [foundCustomer, setFoundCustomer] = useState<CustomerInfo | null>(null)
  const [searching, setSearching] = useState(false)

  // Step 2: Services
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])

  // Step 3: Staff
  const [selectedStaffId, setSelectedStaffId] = useState(staffId)

  // Step 4: Date/Time
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [slotAvailability, setSlotAvailability] = useState<SlotInfo[]>([])

  // Step 5: Package / Notes
  const [customerPackages, setCustomerPackages] = useState<any[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState("")
  const [notes, setNotes] = useState("")

  // Step 6: Confirm
  const [confirmed, setConfirmed] = useState(false)

  const totalDuration = selectedServiceIds.reduce((sum, id) => {
    const svc = allServices.find((s) => s.id === id)
    return sum + (svc?.duration || 30)
  }, 0)

  useEffect(() => {
    const init = async () => {
      const today = new Date();
      setSelectedDate(today.toISOString().split("T")[0]);
    };
    init();
  }, []);

  const searchCustomer = useCallback(async () => {
    const phone = phoneSearch.trim()
    if (phone.length < 7) return
    setSearching(true)
    try {
      const cust = await getCustomerByPhone(phone)
      if (cust) {
        setFoundCustomer(cust as CustomerInfo)
        setCustomerName(cust.full_name)
        const pkgs = await getCustomerActivePackages(cust.id)
        setCustomerPackages(pkgs || [])
      } else {
        setFoundCustomer(null)
        setCustomerName("")
        toast.info("Không tìm thấy khách hàng với số điện thoại này. Bạn có thể nhập tên để tạo mới.")
      }
    } catch {
      toast.error("Lỗi tìm kiếm khách hàng")
    } finally {
      setSearching(false)
    }
  }, [phoneSearch])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (phoneSearch.trim().length >= 7) searchCustomer()
    }, 500)
    return () => clearTimeout(timer)
  }, [phoneSearch, searchCustomer])

  useEffect(() => {
    const init = async () => {
      if (selectedDate && selectedServiceIds.length > 0) {
        const slots = await getSlotAvailability(selectedDate, selectedServiceIds, allServices.map((s) => ({ id: s.id, duration: s.duration })))
        setSlotAvailability(slots)
      }
    };
    init();
  }, [selectedDate, selectedServiceIds, allServices])

  useEffect(() => {
    const init = async () => {
      if (foundCustomer) {
        const pkgs = await getCustomerActivePackages(foundCustomer.id);
        setCustomerPackages(pkgs || []);
      }
    };
    init();
  }, [foundCustomer])

  function resetForm() {
    setStep(1)
    setPhoneSearch("")
    setCustomerName("")
    setFoundCustomer(null)
    setSelectedServiceIds([])
    setSelectedStaffId(staffId)
    setSelectedTime("")
    setSelectedPackageId("")
    setNotes("")
    setConfirmed(false)
  }

  async function handleConfirm() {
    if (!foundCustomer && !customerName.trim()) {
      toast.error("Vui lòng nhập tên khách hàng")
      return
    }
    setLoading(true)
    try {
      const res = await submitBooking({
        customerId: foundCustomer?.id || null,
        name: customerName.trim(),
        phone: phoneSearch.trim(),
        serviceIds: selectedServiceIds,
        staffId: selectedStaffId || null,
        date: selectedDate,
        time: selectedTime,
        usePackageId: selectedPackageId || null,
        notes: notes || null,
      })
      if (res.success) {
        setConfirmed(true)
        toast.success("Đã tạo lịch hẹn thành công!")
        onBookingCreated()
      } else {
        toast.error("Lỗi: " + res.error)
      }
    } catch (err: unknown) {
      toast.error("Lỗi hệ thống: " + (err instanceof Error ? err.message : "Không thể tạo lịch"))
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  function renderCustomerStep() {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <div className="w-12 h-12 bg-pink-100 text-pink-500 rounded-2xl mx-auto flex items-center justify-center mb-3">
            <User className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-1">Tìm kiếm khách hàng</h4>
          <p className="text-gray-500 text-sm">Nhập số điện thoại để tra cứu</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="tel"
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
            placeholder="Nhập số điện thoại khách..."
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all font-semibold text-sm"
          />
          {searching && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />}
        </div>

        {foundCustomer && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
              {foundCustomer.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900">{foundCustomer.full_name}</p>
              <p className="text-sm text-gray-500">{foundCustomer.phone}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
          </div>
        )}

        {!foundCustomer && phoneSearch.trim().length >= 7 && (
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Khách hàng mới — nhập tên:</p>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nhập họ tên khách hàng..."
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all font-semibold text-sm"
            />
          </div>
        )}
      </div>
    )
  }

  function renderServicesStep() {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <h4 className="text-lg font-bold text-gray-900 mb-1">Chọn dịch vụ</h4>
          <p className="text-gray-500 text-sm">Khách hàng muốn làm dịch vụ nào?</p>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {allServices.map((svc) => {
            const isSelected = selectedServiceIds.includes(svc.id)
            return (
              <label
                key={svc.id}
                htmlFor={`booking-${svc.id}`}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected ? "bg-pink-50 border-pink-300" : "bg-white border-gray-150 hover:bg-gray-50"
                }`}
              >
                <input
                  id={`booking-${svc.id}`}
                  type="checkbox"
                  className="w-5 h-5 rounded text-pink-600 focus:ring-pink-500 border-gray-300"
                  checked={isSelected}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedServiceIds([...selectedServiceIds, svc.id])
                    else setSelectedServiceIds(selectedServiceIds.filter((id) => id !== svc.id))
                  }}
                />
                <span className="text-sm font-semibold text-gray-700 flex-1">{svc.name}</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-pink-600 block">{svc.price.toLocaleString("vi")}đ</span>
                  <span className="text-[10px] text-gray-400">{svc.duration || 30} phút</span>
                </div>
              </label>
            )
          })}
        </div>

        {selectedServiceIds.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-xl flex justify-between text-sm font-semibold">
            <span className="text-gray-600">{selectedServiceIds.length} dịch vụ</span>
            <span className="text-pink-600 font-bold">
              {selectedServiceIds.reduce((sum, id) => {
                const svc = allServices.find((s) => s.id === id)
                return sum + (svc?.price || 0)
              }, 0).toLocaleString("vi")}đ
            </span>
          </div>
        )}
      </div>
    )
  }

  function renderStaffStep() {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <h4 className="text-lg font-bold text-gray-900 mb-1">Chọn nhân viên thực hiện</h4>
          <p className="text-gray-500 text-sm">Chọn KTV sẽ phục vụ khách</p>
        </div>

        <div className="space-y-2">
          {staffList.map((staff) => (
            <button
              key={staff.id}
              type="button"
              onClick={() => setSelectedStaffId(staff.id)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedStaffId === staff.id
                  ? "bg-pink-50 border-pink-300 text-pink-700"
                  : "bg-white border-gray-150 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                selectedStaffId === staff.id ? "bg-pink-200 text-pink-700" : "bg-gray-100 text-gray-500"
              }`}>
                {staff.full_name?.charAt(0) || "?"}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">{staff.full_name}</p>
                <p className="text-xs text-gray-400">
                  {staff.id === staffId ? "Bạn" : "KTV"}
                </p>
              </div>
              {selectedStaffId === staff.id && <CheckCircle2 className="w-5 h-5 text-pink-500" />}
            </button>
          ))}
        </div>
      </div>
    )
  }

  function renderDateTimeStep() {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <h4 className="text-lg font-bold text-gray-900 mb-1">Chọn ngày & giờ</h4>
          <p className="text-gray-500 text-sm">Xem khung giờ trống và đặt lịch</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 14 }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() + i)
            const dateStr = d.toISOString().split("T")[0]
            const isToday = i === 0
            const isSelected = selectedDate === dateStr
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => { setSelectedDate(dateStr); setSelectedTime("") }}
                className={`shrink-0 py-2.5 px-3 min-w-[44px] min-h-[44px] rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-pink-600 text-white border-pink-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span className="block">{isToday ? "Hôm nay" : d.toLocaleDateString("vi-VN", { weekday: "short" })}</span>
                <span className="block text-[11px] opacity-80">{d.getDate()}/{d.getMonth() + 1}</span>
              </button>
            )
          })}
        </div>

        <BookingCalendar
          slotAvailability={slotAvailability}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onSelectDate={setSelectedDate}
          onSelectTime={setSelectedTime}
          totalDuration={totalDuration}
        />

        {selectedServiceIds.length === 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800 font-semibold text-center">
            Vui lòng chọn dịch vụ trước để xem khung giờ trống
          </div>
        )}
      </div>
    )
  }

  function renderPackageStep() {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <h4 className="text-lg font-bold text-gray-900 mb-1">Gói liệu trình & Ghi chú</h4>
          <p className="text-gray-500 text-sm">Áp dụng gói hoặc thêm ghi chú</p>
        </div>

        {customerPackages.length > 0 && (
          <div>
            <p className="text-sm font-bold text-gray-700 mb-2.5">Gói liệu trình của khách</p>
            <div className="space-y-2">
              {customerPackages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id
                const tp = pkg.treatment_packages?.[0]
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackageId(isSelected ? "" : pkg.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-50 border-amber-300"
                        : "bg-white border-gray-150 hover:bg-gray-50"
                    }`}
                  >
                    <Package className={`w-5 h-5 ${isSelected ? "text-amber-600" : "text-gray-400"}`} />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm text-gray-900">{tp?.name || "Gói liệu trình"}</p>
                      <p className="text-xs text-gray-500">Còn {pkg.remaining_sessions}/{pkg.total_sessions} buổi</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {customerPackages.length === 0 && foundCustomer && (
          <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl text-sm text-gray-500 text-center">
            Khách hàng này chưa có gói liệu trình nào.
          </div>
        )}

        <div>
          <p className="text-sm font-bold text-gray-700 mb-2.5">Ghi chú lịch hẹn</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Yêu cầu đặc biệt, lưu ý về khách hàng..."
            rows={3}
            className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none text-sm font-semibold resize-none transition-all"
          />
        </div>
      </div>
    )
  }

  function renderConfirmStep() {
    const selectedServices = allServices.filter((s) => selectedServiceIds.includes(s.id))
    const selectedStaff = staffList.find((s) => s.id === selectedStaffId)
    const totalPrice = selectedServices.reduce((sum: number, s) => sum + (s.price || 0), 0)
    const selectedPkg = customerPackages.find((p) => p.id === selectedPackageId)
    const endTime = selectedTime ? (() => {
      const [h, m] = selectedTime.split(":").map(Number)
      const endMin = h * 60 + m + totalDuration
      return `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`
    })() : ""

    return (
      <div className="space-y-5">
        <div className="text-center">
          <h4 className="text-lg font-bold text-gray-900 mb-1">Xác nhận đặt lịch</h4>
          <p className="text-gray-500 text-sm">Kiểm tra lại thông tin trước khi tạo</p>
        </div>

        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Khách hàng</span>
            <span className="font-bold">{foundCustomer?.full_name || customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Điện thoại</span>
            <span className="font-bold">{phoneSearch}</span>
          </div>
          <div className="border-t border-gray-200" />
          <div className="flex justify-between">
            <span className="text-gray-500">Dịch vụ</span>
            <span className="font-bold text-right">{selectedServices.map((s) => s.name).join(", ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Thời gian</span>
            <span className="font-bold">{selectedDate} {selectedTime} - {endTime} ({totalDuration}p)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Nhân viên</span>
            <span className="font-bold">{selectedStaff?.full_name || "Chưa chọn"}</span>
          </div>
          {selectedPkg && (
            <div className="flex justify-between text-amber-700">
              <span>Gói liệu trình</span>
              <span className="font-bold">{selectedPkg.treatment_packages?.[0]?.name || "Gói"}</span>
            </div>
          )}
          {notes && (
            <div className="flex justify-between">
              <span className="text-gray-500">Ghi chú</span>
              <span className="font-bold text-right max-w-[200px] truncate">{notes}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-black">
            <span>Tổng tiền</span>
            <span className="text-pink-600">{totalPrice.toLocaleString("vi")}đ</span>
          </div>
        </div>
      </div>
    )
  }

  function renderConfirmed() {
    const selectedServices = allServices.filter((s) => selectedServiceIds.includes(s.id))
    const selectedStaff = staffList.find((s) => s.id === selectedStaffId)
    const totalPrice = selectedServices.reduce((sum: number, s) => sum + (s.price || 0), 0)

    return (
      <div className="space-y-5 text-center">
        <div className="py-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-2xl mx-auto flex items-center justify-center mb-3">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-1">Đã đặt lịch thành công!</h4>
          <p className="text-gray-500 text-sm">Lịch hẹn đã được ghi nhận</p>
        </div>

        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-2 text-sm text-left">
          <div className="flex justify-between">
            <span className="text-gray-500">Khách</span>
            <span className="font-bold">{foundCustomer?.full_name || customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Dịch vụ</span>
            <span className="font-bold">{selectedServices.map((s) => s.name).join(", ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Giờ</span>
            <span className="font-bold">{selectedTime} - {selectedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">KTV</span>
            <span className="font-bold">{selectedStaff?.full_name}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-black">
            <span>Tổng</span>
            <span className="text-emerald-600">{totalPrice.toLocaleString("vi")}đ</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={handlePrint} className="flex-1">
            In
          </Button>
          <Button onClick={resetForm} variant="danger" className="flex-1">
            Đặt thêm
          </Button>
        </div>
      </div>
    )
  }

  function canProceed() {
    switch (step) {
      case 1: return (foundCustomer !== null) || (phoneSearch.trim().length >= 7 && customerName.trim().length > 0)
      case 2: return selectedServiceIds.length > 0
      case 3: return selectedStaffId !== ""
      case 4: return selectedDate !== "" && selectedTime !== "" && selectedServiceIds.length > 0
      case 5: return true
      default: return false
    }
  }

  const trapRef = useFocusTrap(step > 1);
  if (confirmed) return renderConfirmed()

  return (
    <div ref={trapRef} role="region" aria-label="Đặt lịch hẹn cho khách" className="max-w-lg mx-auto">
      <div className="flex items-center justify-center gap-1.5 mb-6">
        {[
          { num: 1, label: "KH" },
          { num: 2, label: "DV" },
          { num: 3, label: "NV" },
          { num: 4, label: "Giờ" },
          { num: 5, label: "GC" },
          { num: 6, label: "XN" },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
               s.num <= step ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-400"
             }`}>
              {s.num < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.num}
            </div>
            <span className={`text-[11px] font-semibold ${s.num <= step ? "text-pink-700" : "text-gray-400"}`}>
              {s.label}
            </span>
            {i < 5 && <div className={`w-3 h-0.5 ${s.num < step ? "bg-pink-500" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
        {step === 1 && renderCustomerStep()}
        {step === 2 && renderServicesStep()}
        {step === 3 && renderStaffStep()}
        {step === 4 && renderDateTimeStep()}
        {step === 5 && renderPackageStep()}
        {step === 6 && renderConfirmStep()}
      </div>

      <div className="flex gap-3 mt-4">
        {step > 1 && !confirmed && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3.5 text-gray-600 font-bold bg-gray-100 rounded-xl active:scale-95 transition-transform cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </button>
        )}
        {step < 6 && !confirmed && (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className={`flex-1 py-3.5 rounded-xl font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
              canProceed()
                ? "bg-pink-600 hover:bg-pink-700 text-white shadow-lg"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Tiếp theo <ChevronRight className="w-4 h-4" />
          </button>
        )}
        {step === 6 && !confirmed && (
          <LoadingButton
            onClick={handleConfirm}
            isLoading={loading}
            loadingText="Đang tạo..."
            className="flex-1 py-3.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform cursor-pointer flex items-center justify-center gap-2"
          >
            <CalendarCheck className="w-5 h-5" /> Xác nhận đặt lịch
          </LoadingButton>
        )}
      </div>
    </div>
  )
}
