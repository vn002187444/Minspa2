import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CustomerCRM from "./CustomerCRM";

export const metadata = {
  title: "Quản Lý Khách Hàng - Min Nail & Hair",
  description: "Trang Quản lý Hồ sơ và Thống kê Phân tích Khách hàng",
};

export default function CustomersPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin"
              className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Quản Lý & Phân Tích Khách Hàng</h1>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <CustomerCRM />
      </div>
    </div>
  );
}
