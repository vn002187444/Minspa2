'use client'

import { useState } from "react";
import { toast } from 'sonner';
import { Plus, RefreshCw, Sparkles, ImageIcon, XIcon } from "lucide-react";
import { deleteServiceSafely, saveService } from "../actions";
import ServiceModal from "./ServiceModal";

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
    toast.error('Tính năng xóa dịch vụ đang được cập nhật');
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

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
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
            {services.map((s) => (
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
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-full ${s.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                  >
                    {s.is_active ? "Hiển thị" : "Đang ẩn"}
                  </span>
                </td>
                <td className="p-4 text-right flex items-center justify-end gap-3">
                  <button
                    onClick={() => setEditingService(s)}
                    className="text-[#8D6E53] hover:text-[#5C4033] text-sm font-semibold cursor-pointer"
                  >
                    Sửa
                  </button>
                  {userRole === 'ADMIN' && (
                    <button
                      onClick={() => handleDeleteService(s.id, s.name)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold cursor-pointer"
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
