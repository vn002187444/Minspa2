'use client';

import { useState } from "react";
import { Package, PenTool, XIcon } from "lucide-react";
import { saveTreatmentPackage, deleteTreatmentPackageSafely } from "../actions";
import EditPackageModal from "./EditPackageModal";

export default function TabPackages({ packages, services, userRole, onReload }: { packages: any[]; services: any[]; userRole?: string; onReload: () => void }) {
  const [editingPackage, setEditingPackage] = useState<any>(null);

  const handleDeletePackage = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa gói "${name}" không?`)) return;

    try {
      const res = await deleteTreatmentPackageSafely(id, name);
      if (res.success) {
        alert(res.message);
        onReload();
      } else {
        alert("Lỗi: " + res.error);
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-display">
            Quản lý Gói Liệu Trình
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Thiết lập các ưu đãi bán theo combo buổi cho khách hàng.
          </p>
        </div>
        <button
          onClick={() => setEditingPackage({})}
          className="bg-[#8D6E53] hover:bg-[#6b513b] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Package className="w-4 h-4" />
          Thêm Gói Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden ${!pkg.is_active ? 'opacity-60' : ''}`}
          >
            <div className="absolute top-0 right-0 p-4 flex gap-2">
              {!pkg.is_active && (
                <span className="absolute top-2 left-2 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Đã ẩn</span>
              )}
              <button
                onClick={() => setEditingPackage(pkg)}
                className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors cursor-pointer"
                title="Sửa"
              >
                <PenTool className="w-4 h-4" />
              </button>
              {userRole === 'ADMIN' && (
                <button
                  onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                  className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors cursor-pointer"
                  title="Xóa"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="mb-4 pr-20">
              <h3 className="font-bold text-lg text-gray-900 leading-tight">
                {pkg.name}
              </h3>
              <p className="text-xs font-semibold text-[#8D6E53] mt-1 bg-[#8D6E53]/10 inline-block px-2 py-0.5 rounded">
                Dịch vụ: {pkg.services?.name || 'N/A'}
              </p>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mua gốc:</span>
                <span className="font-semibold text-gray-900">{pkg.buy_count} buổi</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tặng thêm:</span>
                <span className="font-semibold text-emerald-600">+{pkg.free_count} buổi</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-50">
                <span className="text-gray-500 font-medium">Tổng thực nhận:</span>
                <span className="font-bold text-gray-900 bg-gray-100 px-2 rounded">{pkg.total_sessions} buổi</span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="text-gray-500 font-medium">Hoa hồng bán gói:</span>
                <span className="font-bold text-pink-600 bg-pink-50 px-2 rounded-lg">
                  {pkg.commission_percentage !== undefined && pkg.commission_percentage !== null ? pkg.commission_percentage : 10}%
                  {" "}(~{Math.round(Number(pkg.price) * ((pkg.commission_percentage !== undefined && pkg.commission_percentage !== null ? pkg.commission_percentage : 10) / 100)).toLocaleString("vi")}đ)
                </span>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between">
              <div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Giá Trọn Gói</p>
                <p className="text-xl font-black text-gray-900 font-mono tracking-tight">
                  {Number(pkg.price).toLocaleString("vi")}đ
                </p>
              </div>
            </div>
          </div>
        ))}

        {packages.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Chưa có gói liệu trình nào.</p>
          </div>
        )}
      </div>

      {editingPackage && (
        <EditPackageModal
          pkg={editingPackage}
          services={services}
          onClose={() => setEditingPackage(null)}
          onReload={onReload}
        />
      )}
    </div>
  );
}
