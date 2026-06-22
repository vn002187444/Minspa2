"use client"

import { useState } from "react"
import LoadingButton from "@/components/LoadingButton"

type Props = {
  appt: any
  otherStaff: any[]
  onClose: () => void
  onSwap: (staffId: string) => Promise<void>
}

export default function SwapModal({ appt, otherStaff, onClose, onSwap }: Props) {
  const [selected, setSelected] = useState("")
  const [swapLoading, setSwapLoading] = useState(false)

  return (
    <div className="fixed inset-0 bg-white md:bg-black/60 md:backdrop-blur-sm z-50 flex flex-col md:items-center md:justify-center p-0 md:p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full h-full md:h-auto md:max-w-sm p-6 shadow-2xl rounded-none md:rounded-3xl border-0 md:border border-gray-100 animate-in slide-in-from-bottom-5 duration-300 flex flex-col justify-between md:justify-start">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-display font-medium text-lg text-gray-900">
              Chuyển giao đơn
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-900 font-bold text-2xl p-2"
            >
              &times;
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4 font-normal">
            Chọn đối tác Kỹ thuật viên rảnh để tiến hành đổi đơn hàng này.
          </p>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-6 outline-none focus:bg-white focus:ring-2 focus:ring-pink-500 font-semibold text-sm cursor-pointer"
          >
            <option value="">Chọn thợ nhận ca...</option>
            {otherStaff?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pb-8 md:pb-0">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-gray-600 font-bold bg-gray-100 rounded-xl active:scale-95 transition-transform cursor-pointer"
          >
            Hủy
          </button>
          <LoadingButton
            disabled={!selected}
            onClick={async () => {
              setSwapLoading(true)
              await onSwap(selected)
              setSwapLoading(false)
            }}
            isLoading={swapLoading}
            loadingText="Đang chuyển..."
            className="flex-1 py-4 bg-pink-600 text-white font-bold rounded-xl disabled:opacity-50 active:scale-95 transition-transform cursor-pointer"
          >
            Chuyển
          </LoadingButton>
        </div>
      </div>
    </div>
  )
}
