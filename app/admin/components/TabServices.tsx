'use client'

import { useState } from "react";
import { toast } from 'sonner';
import { Plus, ToggleLeft, ToggleRight } from "lucide-react";
import ServiceModal from "./ServiceModal";
import { deleteServiceSafely, saveService } from "../actions";

interface SvcItem2 {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  description?: string | null;
  image_url?: string | null;
  commission_percentage?: number | null;
  commission_amount?: number | null;
  is_active: boolean;
}

export default function TabServices({ services, userRole, onReload }: { services: SvcItem2[]; userRole: string; onReload: () => void }) {
  const [editingService, setEditingService] = useState<any>(null);

  const handleDeleteService = async (id: string, name: string) => {
    if (!confirm(`Xác nhận xóa dịch vụ "${name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      const res = await deleteServiceSafely(id, name);
      if (res.success) {
        toast.success("Đã xóa dịch vụ");
        onReload();
      } else {
        toast.error("Lỗi: " + res.error);
      }
    } catch (err: unknown) {
      toast.error("Lỗi: " + (err instanceof Error ? err.message : 'Lỗi không xác định'));
    }
  };

  const handleToggleActive = async (service: SvcItem2) => {
    try {
      const res = await saveService({ 
        ...service, 
        is_active: !service.is_active, 
        description: service.description ?? undefined,
        image_url: service.image_url ?? undefined,
        commission_percentage: service.commission_percentage ?? undefined,
        commission_amount: service.commission_amount ?? undefined,
      });
      if (res.success) {
        toast.success(service.is_active ? 'Đã ẩn dịch vụ' : 'Đã hiển thị dịch vụ');
        onReload();
      } else {
        toast.error("Lỗi: " + res.error);
      }
    } catch (err: unknown) {
      toast.error("Lỗi: " + (err instanceof Error ? err.message : 'Lỗi không xác định'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Quản lý Dịch vụ</h2>
        <button
          onClick={() =>
            setEditingService({
              name: "",
              description: "",
              price: 0,
              category: "Móng",
              duration: 60,
              is_active: true,
              commission_percentage: 15,
              commission_amount: 0,
            })
          }
          className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-black flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Thêm dịch vụ
        </button>
      </div>

      {/* Mobile card view */}
      <div className="mt-4 space-y-3 md:hidden">
        {services.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-400 text-sm font-medium">Chưa có dịch vụ nào.</p>
            <p className="text-gray-300 text-xs mt-1">Thêm dịch vụ mới để bắt đầu.</p>
          </div>
        ) : services.map((s) => (
          <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="font-bold text-gray-900">{s.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {s.is_active ? 'Hiển thị' : 'Đang ẩn'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Giá</span><span className="font-mono font-bold text-gray-900">{s.price.toLocaleString("vi")}đ</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Thời lượng</span><span>{s.duration} phút</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Danh mục</span><span className="text-gray-500">{s.category}</span></div>
              <div className="flex justify-between">
                <span className="text-gray-400">Hoa hồng</span>
                <span className="font-mono text-xs">
                  <span className="text-gray-900 font-bold">{s.commission_percentage ?? 15}%</span>
                  {s.commission_amount ? <span className="text-emerald-700 font-bold ml-1">+{s.commission_amount.toLocaleString("vi")}đ</span> : null}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1 border-t border-gray-100">
              <button
                onClick={() => setEditingService(s)}
                className="text-[#8D6E53] hover:text-[#5C4033] text-sm font-semibold cursor-pointer min-h-[44px] flex items-center px-2"
              >
                Sửa
              </button>
              {userRole === 'ADMIN' && (
                <button
                  onClick={() => handleDeleteService(s.id, s.name)}
                  className="text-red-500 hover:text-red-700 text-sm font-semibold cursor-pointer min-h-[44px] flex items-center px-2"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hidden md:block">
        <table className="w-full text-left max-w-full">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="p-4 font-medium">Tên dịch vụ</th>
              <th className="p-4 font-medium hidden sm:table-cell">Danh mục</th>
              <th className="p-4 font-medium">Giá (VNĐ)</th>
              <th className="p-4 font-medium hidden md:table-cell">Hoa hồng</th>
              <th className="p-4 font-medium">Trạng thái</th>
              <th className="p-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {services.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                  <p className="font-medium">Chưa có dịch vụ nào.</p>
                  <p className="text-xs mt-1">Thêm dịch vụ mới để bắt đầu.</p>
                </td>
              </tr>
            ) : services.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/50">
                <td className="p-4 font-medium text-gray-900">{s.name}</td>
                <td className="p-4 text-gray-500 hidden sm:table-cell">
                  {s.category}
                </td>
                <td className="p-4 text-gray-900 font-mono">
                  {s.price.toLocaleString("vi")}
                </td>
                <td className="p-4 hidden md:table-cell">
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className="text-gray-500 font-medium">
                      Tỷ lệ:{" "}
                      <strong className="text-gray-900 font-mono font-extrabold">
                        {s.commission_percentage !== undefined &&
                        s.commission_percentage !== null
                          ? s.commission_percentage
                          : 15}
                        %
                      </strong>
                    </span>
                    <span className="text-gray-500 font-medium">
                      Cố định:{" "}
                      <strong className="text-emerald-700 font-mono font-extrabold">
                        {s.commission_amount
                          ? s.commission_amount.toLocaleString("vi")
                          : "0"}
                        đ
                      </strong>
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleToggleActive(s)}
                    className="flex items-center gap-2 cursor-pointer"
                    title={s.is_active ? "Click để ẩn" : "Click để hiển thị"}
                  >
                    {s.is_active ? (
                      <ToggleRight className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                      <span
                        className={`px-3 py-1.5 text-xs font-bold rounded-full min-h-[44px] flex items-center ${s.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                      >
                      {s.is_active ? "Hiển thị" : "Đang ẩn"}
                    </span>
                  </button>
                </td>
                <td className="p-4 text-right flex items-center justify-end gap-3">
                  <button
                    onClick={() => setEditingService(s)}
                    className="text-[#8D6E53] hover:text-[#5C4033] text-sm font-semibold cursor-pointer min-h-[44px] flex items-center px-2"
                  >
                    Sửa
                  </button>
                  {userRole === 'ADMIN' && (
                    <button
                      onClick={() => handleDeleteService(s.id, s.name)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold cursor-pointer min-h-[44px] flex items-center px-2"
                    >
                      Xóa
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingService && (
        <ServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onReload={onReload}
        />
      )}
    </div>
  );
}
