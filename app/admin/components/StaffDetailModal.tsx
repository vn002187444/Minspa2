"use client";

import { useFocusTrap } from '@/hooks/useFocusTrap';

export default function StaffDetailModal({ staff, stats, onClose }: any) {
  const trapRef = useFocusTrap(true);
  return (
    <div ref={trapRef} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Chi tiết nhân viên: ${staff.full_name}`}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
          <div>
            <h3 className="font-display font-bold text-xl">
              {staff.full_name}
            </h3>
            <p className="text-sm text-gray-400 font-mono">
              CCCD: {staff.cccd}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng modal"
            className="text-gray-400 hover:text-white font-bold text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!stats ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                  <p className="text-gray-500 text-xs mb-1">Tổng doanh thu</p>
                  <p className="text-xl font-bold text-gray-900">
                    {(stats.totalRevenue / 1000).toLocaleString("vi")}k
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                  <p className="text-gray-500 text-xs mb-1">Hoa hồng</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {(stats.totalCommission / 1000).toLocaleString("vi")}k
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                  <p className="text-gray-500 text-xs mb-1">Tiền Tip</p>
                  <p className="text-xl font-bold text-pink-600">
                    {(stats.totalTip / 1000).toLocaleString("vi")}k
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                  <p className="text-gray-500 text-xs mb-1">Làm / Nghỉ</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.daysPresent}{" "}
                    <span className="text-gray-400 text-sm font-normal">
                      / {stats.daysAbsent}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">
                    Top Dịch Vụ Mũi Nhọn
                  </h4>
                  <div className="space-y-2">
                    {stats.topServices.length === 0 && (
                      <p className="text-gray-500 text-sm">Chưa có dữ liệu</p>
                    )}
                    {stats.topServices.map((s: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="text-gray-700">{s.name}</span>
                        <span className="font-bold text-gray-900">
                          {s.count} lượt
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">
                    Khách Hàng Thường Xuyên
                  </h4>
                  <div className="space-y-2">
                    {stats.topCustomers.length === 0 && (
                      <p className="text-gray-500 text-sm">Chưa có dữ liệu</p>
                    )}
                    {stats.topCustomers.map((c: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="text-gray-700">{c.name}</span>
                        <span className="font-bold text-gray-900">
                          {c.count} lần
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
