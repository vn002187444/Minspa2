'use client';

import { useState } from "react";
import { XIcon } from "lucide-react";
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { saveTreatmentPackage } from "../actions";
import { Button } from "@/components/ui/Button";

interface EditPackageModalPkg {
  id?: string;
  name?: string;
  service_id?: string;
  buy_count?: number;
  free_count?: number;
  price?: number;
  commission_percentage?: number | null;
  is_active?: boolean;
}

interface EditPackageModalService {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
}

interface EditPackageModalProps {
  pkg: EditPackageModalPkg;
  services: EditPackageModalService[];
  onClose: () => void;
  onReload: () => void;
}

export default function EditPackageModal({ pkg, services, onClose, onReload }: EditPackageModalProps) {
  const trapRef = useFocusTrap(true);
  const [form, setForm] = useState({
    id: pkg.id || "",
    name: pkg.name || "",
    service_id: pkg.service_id || "",
    buy_count: pkg.buy_count || 5,
    free_count: pkg.free_count || 1,
    price: pkg.price || 0,
    commission_percentage: pkg.commission_percentage !== undefined && pkg.commission_percentage !== null ? pkg.commission_percentage : 10,
    is_active: pkg.is_active !== false,
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeServices = services.filter((s) => s.is_active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!form.name || !form.service_id || form.buy_count <= 0 || form.price <= 0) {
      setErrorMsg("Vui lòng điền đầy đủ và hợp lệ các thông tin!");
      return;
    }
    setLoading(true);
    try {
      const submitData: any = { ...form };
      if (!submitData.id) delete submitData.id;

      const res = await saveTreatmentPackage(submitData);
      if (res.success) {
        onReload();
        onClose();
      } else {
        setErrorMsg("Lỗi: " + res.error);
      }
    } catch (err: unknown) {
      setErrorMsg("Lỗi: " + (err instanceof Error ? err.message : 'Lỗi không xác định'));
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["price", "buy_count", "free_count", "commission_percentage"].includes(name) ? Number(value) : value,
    }));
  };

  return (
    <div ref={trapRef} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-label={pkg.id ? "Sửa gói liệu trình" : "Thêm gói mới"}>
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <h3 className="text-xl font-bold text-gray-900 font-display">
            {pkg.id ? "Sửa Gói Liệu Trình" : "Thêm Gói Mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:bg-white hover:shadow-sm p-2 rounded-xl transition-all cursor-pointer"
            aria-label="Đóng modal"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label htmlFor="pkg-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tên gói <span className="text-red-500">*</span>
            </label>
            <input
              id="pkg-name"
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#8D6E53]/20 focus:border-[#8D6E53] outline-none transition-all text-sm font-medium"
              placeholder="VD: Combo 5 Buổi Gội An Yên"
            />
          </div>

          <div>
            <label htmlFor="pkg-serviceId" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Dịch vụ áp dụng <span className="text-red-500">*</span>
            </label>
            <select
              id="pkg-serviceId"
              name="service_id"
              required
              value={form.service_id}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#8D6E53]/20 focus:border-[#8D6E53] outline-none transition-all text-sm font-medium bg-white"
            >
              <option value="">-- Chọn dịch vụ --</option>
              {activeServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({Number(s.price).toLocaleString("vi")}đ)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pkg-buyCount" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Số buổi Mua <span className="text-red-500">*</span>
              </label>
              <input
                id="pkg-buyCount"
                type="number"
                name="buy_count"
                required
                min={1}
                value={form.buy_count}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#8D6E53]/20 focus:border-[#8D6E53] outline-none transition-all text-sm font-medium"
              />
            </div>
            <div>
              <label htmlFor="pkg-freeCount" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Số buổi Tặng thêm
              </label>
              <input
                id="pkg-freeCount"
                type="number"
                name="free_count"
                min={0}
                value={form.free_count}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#8D6E53]/20 focus:border-[#8D6E53] outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="bg-[#FAF0E6] p-4 rounded-xl border border-[#EADDCD] flex justify-between items-center">
            <span className="text-sm font-bold text-[#8D6E53]">Tổng số buổi khách được nhận:</span>
            <span className="text-xl font-black text-emerald-700">{form.buy_count + form.free_count}</span>
          </div>

          <div>
            <label htmlFor="pkg-price" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Giá Mua Trọn Gói (VNĐ) <span className="text-red-500">*</span>
            </label>
            <input
              id="pkg-price"
              type="number"
              name="price"
              required
              min={1000}
              value={form.price}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#8D6E53]/20 focus:border-[#8D6E53] outline-none transition-all text-sm font-medium font-mono mb-4"
              placeholder="VD: 700000"
            />
          </div>

          <div>
            <label htmlFor="pkg-commissionPercent" className="block text-sm font-semibold text-gray-700 mb-1.5">
              % Hoa hồng bán gói (%) <span className="text-red-500">*</span>
            </label>
            <input
              id="pkg-commissionPercent"
              type="number"
              name="commission_percentage"
              required
              min={0}
              max={100}
              value={form.commission_percentage}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#8D6E53]/20 focus:border-[#8D6E53] outline-none transition-all text-sm font-medium font-mono"
              placeholder="VD: 10"
            />
            <p className="text-[11px] text-gray-400 mt-1">Khi nhân viên bán thành công gói này, thợ được nhận: <strong className="text-pink-600">{Math.round((Number(form.price) || 0) * (Number(form.commission_percentage) || 0) / 100).toLocaleString("vi")}đ</strong> hoa hồng.</p>
          </div>

          {pkg.id && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <input type="checkbox" id="pkg_is_active" checked={form.is_active !== false} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-[#8D6E53] focus:ring-[#8D6E53] cursor-pointer" />
              <label htmlFor="pkg_is_active" className="text-sm font-medium text-gray-700 cursor-pointer">Gói đang kích hoạt (hiển thị trên website)</label>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu Gói Liệu Trình"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
