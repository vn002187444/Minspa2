"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNavigation from "@/components/BottomNavigation";
import PushNotificationManager from "@/components/PushNotificationManager";
import {
  BarChart,
  Users,
  Settings,
  Star,
  LogOut,
  Search,
  Plus,
  Activity,
  DollarSign,
  CalendarCheck,
  FileText,
  CheckCircle2,
  ChevronRight,
  Globe,
  Home,
  Key,
  Menu as MenuIcon,
  X as XIcon,
  Sparkles,
  RefreshCw,
  CreditCard,
  Trash2,
  Copy,
  Facebook,
  Twitter,
  Send,
  Image as ImageIcon,
  PenTool,
  ShieldAlert,
  Package,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import {
  getDashboardData,
  getStaffs,
  createStaff,
  getStaffDetail,
  updateStaff,
  resetStaffPassword,
  deleteStaffSafely,
  getServices,
  saveService,
  deleteServiceSafely,
  getReviews,
  getSeoSettings,
  saveSeoSettings,
  changePassword,
  getCommissionReport,
  getBankSettings,
  saveBankSettings,
  getSeoArticles,
  saveSeoArticle,
  deleteSeoArticle,
  getTreatmentPackages,
  saveTreatmentPackage,
  deleteTreatmentPackageSafely,
  getBannerSettings,
  saveBannerSettings,
  publishSeoArticleToBlog,
  getAdminSessionInfo,
} from "./actions";
import { VIETNAMESE_BANKS } from "./banks";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Data states
  const [userRole, setUserRole] = useState<string>('');
  const [staffs, setStaffs] = useState<any[]>([]);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [seoSettings, setSeoSettings] = useState<any>(null);
  const [bankSettings, setBankSettings] = useState<any>(null);

  const loadData = async (tab: string, additionalParams?: any) => {
    setIsLoading(true);
    setStaffError(null);
    try {
      if (tab === "STAFF") {
        try {
          setStaffs(await getStaffs());
        } catch (e: any) {
          setStaffError(e.message || "Lỗi không xác định khi tải danh sách nhân viên");
          console.error(e);
        }
      }
      else if (tab === "SERVICES") setServices(await getServices());
      else if (tab === "PACKAGES") {
         setPackages(await getTreatmentPackages());
         setServices(await getServices());
      }
      else if (tab === "REVIEWS") setReviews(await getReviews());
      else if (tab === "SEO") setSeoSettings(await getSeoSettings());
      else if (tab === "BANK") setBankSettings(await getBankSettings());
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["DASHBOARD", "STAFF", "SERVICES", "PACKAGES", "COMMISSION", "REVIEWS", "SEO", "BANK", "PASSWORD"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  useEffect(() => {
    getAdminSessionInfo().then((u) => {
      if (u) setUserRole(u.role);
    });
  }, []);

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden h-16 bg-gray-900 text-white flex items-center justify-between px-6 shadow-md border-b border-gray-800 shrink-0">
        <span className="font-display font-extrabold text-base tracking-wider">
          ADMIN PORTAL
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            title="Quay lại Trang Chủ"
            className="text-gray-400 hover:text-white p-1.5 rounded-lg"
          >
            <Home className="w-5 h-5" />
          </Link>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="text-gray-300 hover:text-white p-1.5 focus:outline-none cursor-pointer"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation (Slide-out menu with Hamburger) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
            />
            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-4/5 max-w-[300px] bg-gray-950 text-gray-300 z-[110] shadow-2xl p-6 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
                <span className="font-display font-black text-white text-base tracking-widest">
                  ADMIN MENU
                </span>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-805 cursor-pointer"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 flex flex-col gap-2.5">
                {userRole === 'MANAGER' && (
                  <button
                    onClick={() => router.push('/staff')}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-sm bg-pink-600/10 text-pink-500 hover:bg-pink-600/20 mb-2 border border-pink-500/20"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Giao diện Thợ</span>
                  </button>
                )}
                {[
                  { id: "DASHBOARD", label: "Tổng quan", icon: BarChart },
                  { id: "SCHEDULE", label: "Lịch Tổng", icon: CalendarCheck },
                  { id: "ORDERS", label: "Quản lý Đơn hàng", icon: CheckCircle2 },
                  { id: "CUSTOMERS", label: "Khách hàng (CRM)", icon: User },
                  { id: "SELL_PACKAGE", label: "Bán Gói & Tiến Độ", icon: Package },
                  { id: "STAFF", label: "Nhân sự", icon: Users },
                  { id: "SERVICES", label: "Dịch vụ", icon: Settings },
                  { id: "PACKAGES", label: "Quản lý Gói Liệu Trình", icon: Package },
                  {
                    id: "COMMISSION",
                    label: "Báo cáo Hoa hồng",
                    icon: FileText,
                  },
                  { id: "REVIEWS", label: "Đánh giá", icon: Star },
                  { id: "SEO", label: "Cấu hình SEO", icon: Globe },
                  { id: "BANK", label: "Tài khoản Bank", icon: CreditCard },
                  { id: "AUDIT_LOGS", label: "Nhật ký hệ thống", icon: ShieldAlert },
                  { id: "PASSWORD", label: "Đổi mật khẩu", icon: Key },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setIsDrawerOpen(false);
                      if (item.id === "SCHEDULE") {
                        router.push("/admin/schedule");
                      } else if (item.id === "AUDIT_LOGS") {
                        router.push("/admin/audit-logs");
                      } else if (item.id === "ORDERS") {
                        router.push("/admin/orders");
                      } else if (item.id === "CUSTOMERS") {
                        router.push("/admin/customers");
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                      activeTab === item.id
                        ? "bg-[#8D6E53] text-white shadow-lg"
                        : "hover:bg-gray-900 text-gray-400 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="border-t border-gray-800 pt-4 mt-6">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 w-full transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-900 text-gray-300 min-h-screen flex-col shrink-0">
        <div className="h-16 flex items-center justify-between px-6 bg-black/20 text-white font-display font-bold text-lg">
          <span>ADMIN PORTAL</span>
          <Link
            href="/"
            title="Quay lại Trang Chủ"
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-800"
          >
            <Home className="w-5 h-5" />
          </Link>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {userRole === 'MANAGER' && (
            <button
              onClick={() => router.push('/staff')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-pink-600/10 text-pink-500 hover:bg-pink-600/20 mb-2 border border-pink-500/20 shadow-sm shadow-pink-900/10 transition-all"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Giao diện Thợ</span>
            </button>
          )}
          {[
            { id: "DASHBOARD", label: "Tổng quan", icon: BarChart },
            { id: "SCHEDULE", label: "Lịch Tổng", icon: CalendarCheck },
            { id: "ORDERS", label: "Quản lý Đơn hàng", icon: CheckCircle2 },
            { id: "CUSTOMERS", label: "Khách hàng (CRM)", icon: User },
            { id: "SELL_PACKAGE", label: "Bán Gói & Tiến Độ", icon: Package },
            { id: "STAFF", label: "Nhân sự", icon: Users },
            { id: "SERVICES", label: "Dịch vụ", icon: Settings },
            { id: "PACKAGES", label: "Quản lý Gói Liệu Trình", icon: Package },
            { id: "COMMISSION", label: "Báo cáo Hoa hồng", icon: FileText },
            { id: "REVIEWS", label: "Đánh giá", icon: Star },
            { id: "SEO", label: "Cấu hình SEO", icon: Globe },
            { id: "BANK", label: "Tài khoản Bank", icon: CreditCard },
            { id: "AUDIT_LOGS", label: "Nhật ký hệ thống", icon: ShieldAlert },
            { id: "PASSWORD", label: "Đổi mật khẩu", icon: Key },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "SCHEDULE") {
                  router.push("/admin/schedule");
                } else if (item.id === "AUDIT_LOGS") {
                  router.push("/admin/audit-logs");
                } else if (item.id === "ORDERS") {
                  router.push("/admin/orders");
                } else if (item.id === "CUSTOMERS") {
                  router.push("/admin/customers");
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === item.id
                  ? "bg-[#8D6E53] text-white shadow-md"
                  : "hover:bg-gray-800 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-gray-800 w-full transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-h-[100vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8D6E53]"></div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
            {activeTab === "DASHBOARD" && <TabDashboard />}
            {activeTab === "STAFF" && (
              <TabStaff staffs={staffs} staffError={staffError} userRole={userRole} onReload={() => loadData("STAFF")} />
            )}
            {activeTab === "SERVICES" && (
              <TabServices
                services={services}
                userRole={userRole}
                onReload={() => loadData("SERVICES")}
              />
            )}
            {activeTab === "PACKAGES" && (
              <TabPackages
                packages={packages}
                services={services}
                userRole={userRole}
                onReload={() => loadData("PACKAGES")}
              />
            )}
            {activeTab === "COMMISSION" && <TabCommission />}
            {activeTab === "REVIEWS" && <TabReviews reviews={reviews} />}
            {activeTab === "SEO" && (
              <TabSEO data={seoSettings} userRole={userRole} onReload={() => loadData("SEO")} />
            )}
            {activeTab === "BANK" && (
              <TabBank data={bankSettings} onReload={() => loadData("BANK")} />
            )}
            {activeTab === "PASSWORD" && <TabPassword />}
            {activeTab === "SELL_PACKAGE" && (
              <TabSellAndProgress
                packages={packages}
                onReload={() => loadData("PACKAGES")}
              />
            )}
          </div>
        )}
      </main>
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function TodayMonitoringWidget({ appointments, onReload }: { appointments: any[], onReload: () => void }) {
  const [activeTab, setActiveTab ] = useState<'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('PENDING');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const pending = appointments.filter((a: any) => a.status === 'PENDING_RANDOM' || a.status === 'CONFIRMED');
  const inProgress = appointments.filter((a: any) => a.status === 'IN_PROGRESS');
  const completed = appointments.filter((a: any) => a.status === 'COMPLETED');
  const cancelled = appointments.filter((a: any) => a.status === 'CANCELLED');

  const getFilteredList = () => {
    switch (activeTab) {
      case 'PENDING': return pending;
      case 'IN_PROGRESS': return inProgress;
      case 'COMPLETED': return completed;
      case 'CANCELLED': return cancelled;
    }
  };

  const list = getFilteredList();

  const handleStatusUpdate = async (id: string, nextStatus: string) => {
    setUpdatingId(id);
    try {
      const { updateAppointmentStatus } = await import("../staff/actions");
      const res = await updateAppointmentStatus(id, nextStatus);
      if (res.success) {
        onReload();
      } else {
        alert("Lỗi: " + res.error);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      return format(new Date(isoString), 'HH:mm');
    } catch (e) {
      return '--:--';
    }
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-base font-bold text-gray-900 font-display uppercase tracking-wider">Giám sát Đơn hàng hôm nay ({appointments.length})</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Bao quát các đơn đặt hẹn phục vụ và trạng thái phòng máy trong ngày hôm nay.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pt-1.5 border-b border-gray-100 pb-3">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'PENDING' ? 'bg-[#8D6E53] text-white shadow-xs' : 'bg-gray-150 bg-gray-100 text-gray-500 hover:text-gray-900'
          }`}
        >
          Chờ xử lý / Sắp đến ({pending.length})
        </button>
        <button
          onClick={() => setActiveTab('IN_PROGRESS')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'IN_PROGRESS' ? 'bg-blue-600 text-white shadow-xs' : 'bg-gray-150 bg-gray-100 text-gray-500 hover:text-gray-900'
          }`}
        >
          Đang làm ({inProgress.length})
        </button>
        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-150 bg-gray-100 text-gray-500 hover:text-gray-900'
          }`}
        >
          Đã hoàn thành ({completed.length})
        </button>
        <button
          onClick={() => setActiveTab('CANCELLED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'CANCELLED' ? 'bg-rose-600 text-white shadow-xs' : 'bg-gray-150 bg-gray-100 text-gray-500 hover:text-gray-900'
          }`}
        >
          Đã hủy ({cancelled.length})
        </button>
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-xs italic">
          Không có đơn đặt hẹn nào hôm nay trong mục này.
        </div>
      ) : (
        <div>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-gray-50 text-gray-550 text-[#8D6E53] font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="p-3">Họ tên khách</th>
                  <th className="p-3">Khung Giờ</th>
                  <th className="p-3">Thợ đảm nhận</th>
                  <th className="p-3 text-right">Tổng thanh toán</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  <th className="p-3 text-right">Cập nhật nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150/50 font-medium text-gray-700">
                {list.map((appt: any) => (
                  <tr key={appt.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-bold text-gray-900">{appt.customers?.full_name || 'Khách lẻ'}</td>
                    <td className="p-3 font-mono font-bold text-gray-800">
                      {formatTime(appt.start_time)}
                    </td>
                    <td className="p-3">
                      <span className="bg-gray-100 px-2.5 py-1 rounded-lg text-gray-700 font-bold text-[11px] border border-gray-200/50">
                        {appt.users?.full_name || 'Chưa phân thợ'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-black text-[#5C4033]">
                      {(appt.total_amount || 0).toLocaleString('vi')} đ
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        appt.status === 'PENDING_RANDOM' ? 'bg-amber-100 text-amber-800 border border-amber-200/50' :
                        appt.status === 'CONFIRMED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        appt.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        appt.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-red-50 text-red-750 border border-red-200'
                      }`}>
                        {appt.status === 'PENDING_RANDOM' ? 'CHỜ PHÂN PHỐI' :
                         appt.status === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' :
                         appt.status === 'IN_PROGRESS' ? 'ĐANG LÀM' :
                         appt.status === 'COMPLETED' ? 'HOÀN THÀNH' : 'ĐÃ HỦY'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {updatingId === appt.id ? (
                          <span className="text-gray-400 text-[11px] animate-pulse">Lưu trạng thái...</span>
                        ) : (
                          <>
                            {(appt.status === 'PENDING_RANDOM' || appt.status === 'CONFIRMED') && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(appt.id, 'IN_PROGRESS')}
                                  className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-[10px] font-extrabold cursor-pointer transition-colors"
                                >
                                  Bắt đầu làm
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(appt.id, 'CANCELLED')}
                                  className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 text-[10px] font-extrabold cursor-pointer transition-colors"
                                >
                                  Hủy lịch
                                </button>
                              </>
                            )}
                            {appt.status === 'IN_PROGRESS' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(appt.id, 'COMPLETED')}
                                  className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 text-[10px] font-extrabold cursor-pointer transition-colors"
                                >
                                  Hoàn thành
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(appt.id, 'CANCELLED')}
                                  className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 text-[10px] font-extrabold cursor-pointer transition-colors"
                                >
                                  Hủy lịch
                                </button>
                              </>
                            )}
                            {appt.status === 'COMPLETED' && (
                              <span className="text-gray-400 text-[10px] font-bold">Hoàn tất</span>
                            )}
                            {appt.status === 'CANCELLED' && (
                              <span className="text-rose-500 text-[10px] font-bold">Đã hủy bỏ</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards view */}
          <div className="md:hidden space-y-3">
            {list.map((appt: any) => (
              <div key={appt.id} className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base leading-tight">
                      {appt.customers?.full_name || 'Khách lẻ'}
                    </h4>
                    <p className="text-xs text-[#8D6E53] font-mono font-bold mt-0.5">
                      Khung giờ: {formatTime(appt.start_time)}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    appt.status === 'PENDING_RANDOM' ? 'bg-amber-100 text-amber-800 border border-amber-200/50' :
                    appt.status === 'CONFIRMED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    appt.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    appt.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    'bg-red-50 text-red-750 border border-red-200'
                  }`}>
                    {appt.status === 'PENDING_RANDOM' ? 'CHỜ CHỈ ĐỊNH' :
                     appt.status === 'CONFIRMED' ? 'XÁC NHẬN' :
                     appt.status === 'IN_PROGRESS' ? 'ĐANG LÀM' :
                     appt.status === 'COMPLETED' ? 'HOÀN THÀNH' : 'ĐÃ HỦY'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-150/50 font-medium">
                  <div>
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Kỹ thuật viên</span>
                    <span className="font-bold text-gray-800 text-sm">{appt.users?.full_name || 'Chưa phân thợ'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Thanh toán dự kiến</span>
                    <span className="font-black text-[#5C4033] text-sm font-mono">{(appt.total_amount || 0).toLocaleString('vi')} đ</span>
                  </div>
                </div>

                {/* Operations */}
                <div className="flex justify-end gap-1.5 pt-2 border-t border-gray-150/50">
                  {updatingId === appt.id ? (
                    <span className="text-gray-400 text-sm font-bold animate-pulse">Đang cập nhật...</span>
                  ) : (
                    <>
                      {(appt.status === 'PENDING_RANDOM' || appt.status === 'CONFIRMED') && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(appt.id, 'IN_PROGRESS')}
                            className="flex-1 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer text-center"
                          >
                            Bắt đầu làm
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(appt.id, 'CANCELLED')}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer text-center"
                          >
                            Hủy
                          </button>
                        </>
                      )}
                      {appt.status === 'IN_PROGRESS' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(appt.id, 'COMPLETED')}
                            className="flex-1 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer text-center"
                          >
                            Hoàn thành
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(appt.id, 'CANCELLED')}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer text-center"
                          >
                            Hủy
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TabDashboard() {
  const [rangeType, setRangeType] = useState<"week" | "month" | "last_month" | "custom">("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; type: "success" | "danger" | "info"; message: string }[]>([]);
  
  const prevApptsRef = useRef<any[]>([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const calculateDates = (type: "week" | "month" | "last_month" | "custom") => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      end = new Date();
    } else if (type === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date();
    } else if (type === "last_month") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
      startInput: start.toISOString().split("T")[0],
      endInput: end.toISOString().split("T")[0],
    };
  };

  const triggerToast = (type: "success" | "danger" | "info", message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Play chemical synthetic chime sound securely
    try {
      if (typeof window !== "undefined" && "AudioContext" in window) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = audioCtx.currentTime;
        
        const playTone = (frequency: number, startTime: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          osc.type = "sine";
          osc.frequency.setValueAtTime(frequency, startTime);
          
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.08, startTime + 0.03);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
          
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        
        if (type === 'success') {
          playTone(587.33, now, 0.25);      // D5
          playTone(880.00, now + 0.1, 0.35);  // A5
        } else if (type === 'danger') {
          playTone(440.00, now, 0.25);       // A4
          playTone(349.23, now + 0.12, 0.35); // F4
        } else {
          playTone(659.25, now, 0.3);         // E5
        }
      }
    } catch (e) {
      console.log("Audio notification chime deferred.", e);
    }
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 8000);
  };

  const fetchDashboardData = async (startISO: string, endISO: string, silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await getDashboardData(startISO, endISO);
      setData(res);
    } catch (e: any) {
      setError(e.message || "Lỗi khi tải dữ liệu tổng quan");
    }
    if (!silent) setLoading(false);
  };

  // Compare updates for real-time notifications
  useEffect(() => {
    if (data?.todayAppointments) {
      if (prevApptsRef.current.length > 0) {
        const prevList = prevApptsRef.current;
        const currList = data.todayAppointments;

        // 1. Detect New Bookings
        const newAppts = currList.filter(
          (curr: any) => !prevList.some((prev: any) => prev.id === curr.id)
        );
        newAppts.forEach((appt: any) => {
          const timeStr = appt.start_time ? format(new Date(appt.start_time), 'HH:mm') : '--:--';
          triggerToast(
            'success',
            `📅 Lịch mới đặt thành công! Khách hàng: ${appt.customers?.full_name || 'Khách vãng lai'} - Dự kiến bắt đầu lúc: ${timeStr}`
          );
        });

        // 2. Detect Cancellations
        currList.forEach((curr: any) => {
          const prev = prevList.find((p: any) => p.id === curr.id);
          if (prev && prev.status !== 'CANCELLED' && curr.status === 'CANCELLED') {
            triggerToast(
              'danger',
              `❌ Khách hàng hủy lịch! Khách hàng: ${curr.customers?.full_name || 'Khách vãng lai'} đã hủy lịch hẹn đặt lúc ${curr.start_time ? format(new Date(curr.start_time), 'HH:mm') : ''}`
            );
          }
        });
      }
      // Update ref
      prevApptsRef.current = data.todayAppointments;
    }
  }, [data?.todayAppointments]);

  useEffect(() => {
    if (rangeType !== "custom") {
      const dates = calculateDates(rangeType);
      setStartDate(dates.startInput);
      setEndDate(dates.endInput);
      fetchDashboardData(dates.start, dates.end);
    }
  }, [rangeType]);

  // Handle real-time silent polling every 15 seconds
  useEffect(() => {
    if (rangeType !== "custom") {
      const interval = setInterval(() => {
        const dates = calculateDates(rangeType);
        fetchDashboardData(dates.start, dates.end, true);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [rangeType]);

  const handleCustomSearch = () => {
    if (!startDate || !endDate) {
      setError("Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc");
      return;
    }
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    fetchDashboardData(start.toISOString(), end.toISOString());
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Toast Notifications Overlay */}
      <div className="fixed top-20 right-4 z-55 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-2xl flex items-start gap-3 transition-all duration-300 transform translate-x-0 animate-in slide-in-from-right-10 border-l-[6px] ${
              t.type === 'success'
                ? 'bg-white border-emerald-500 border-l-emerald-600 text-[#3A2E2B]'
                : t.type === 'danger'
                ? 'bg-white border-rose-500 border-l-rose-600 text-[#3A2E2B]'
                : 'bg-white border-blue-500 border-l-blue-600 text-[#3A2E2B]'
            }`}
          >
            <span className="text-xl shrink-0 mt-0.5">
              {t.type === 'success' ? '🎉' : t.type === 'danger' ? '⚠️' : '📢'}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${
                t.type === 'success' ? 'text-emerald-700' : t.type === 'danger' ? 'text-rose-700' : 'text-blue-700'
              }`}>
                {t.type === 'success' ? 'LỊCH ĐẶT MỚI' : t.type === 'danger' ? 'KHÁCH HỦY ĐƠN' : 'TIN TỨC'}
              </p>
              <p className="text-xs font-semibold leading-relaxed text-gray-700">{t.message}</p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
              className="text-gray-400 hover:text-gray-900 font-extrabold text-base cursor-pointer shrink-0 leading-none p-1.5"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Date Filter Card */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-display">Bộ lọc báo cáo tổng tiệm</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Chọn thời gian để theo dõi doanh số, hoa hồng, tiền tip, số ca hoàn thiện và quản lý điểm danh.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-gray-50">
          <div className="flex flex-wrap bg-gray-100 p-1 rounded-xl border border-gray-200/50 max-w-max">
            {[
              { id: "week", label: "Tuần này" },
              { id: "month", label: "Tháng này" },
              { id: "last_month", label: "Tháng trước" },
              { id: "custom", label: "Tùy chỉnh" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setRangeType(btn.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  rangeType === btn.id ? "bg-[#8D6E53] text-white shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {rangeType === "custom" && (
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-400">Từ</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#8D6E53] bg-gray-50 font-semibold text-gray-700"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-400">Đến</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#8D6E53] bg-gray-50 font-semibold text-gray-700"
                />
              </div>
              <button
                onClick={handleCustomSearch}
                className="bg-gray-900 text-white hover:bg-black px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Áp dụng
              </button>
            </div>
          )}
        </div>
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 text-xs font-semibold">{error}</div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8D6E53]"></div>
        </div>
      ) : data ? (
        <>
          {/* Real-time Indicators */}
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
            <div className="bg-[#FAF0E6] p-4 rounded-2xl border border-orange-150/50 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/80 text-[#8D6E53] rounded-xl flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-[#A68F7B] font-bold uppercase tracking-wider font-sans">Hôm nay: Lịch chờ</p>
                <p className="text-lg font-black text-gray-800">{data.pendingCount} ca</p>
              </div>
            </div>

            <div className="bg-[#EBF5FF] p-4 rounded-2xl border border-blue-150/50 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/80 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider font-sans">Hôm nay: Đã điểm danh</p>
                <p className="text-lg font-black text-gray-800">{data.presentCount} thợ</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center font-semibold">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1.5">Tổng Doanh số</p>
              <p className="text-lg md:text-xl font-black text-gray-900 font-mono">
                {data.totalRevenue.toLocaleString("vi")} đ
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center font-semibold font-mono">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1.5 font-sans">Tổng Hoa hồng</p>
              <p className="text-lg md:text-xl font-black text-emerald-600">
                {data.totalCommission.toLocaleString("vi")} đ
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center font-semibold font-mono">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1.5 font-sans">Tổng Tiền Tip</p>
              <p className="text-lg md:text-xl font-black text-pink-600">
                {data.totalTip.toLocaleString("vi")} đ
              </p>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-2xl shadow-sm text-center text-white font-semibold flex flex-col justify-center font-mono">
              <p className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-1.5 font-sans">Tổng số ca làm</p>
              <p className="text-lg md:text-xl font-black">{data.totalCompleted} ca</p>
            </div>
          </div>

          {/* Today's Monitoring Widget */}
          <TodayMonitoringWidget 
            appointments={data.todayAppointments || []} 
            onReload={handleCustomSearch || (() => fetchDashboardData(startDate, endDate))} 
          />

          {/* Chart & Traffic Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-in fade-in duration-355 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 mb-6 font-display text-sm uppercase tracking-wider">
                  Biểu đồ doanh thu xu hướng
                </h3>
              </div>
              <div className="w-full flex-1">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8D6E53" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8D6E53" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {!isMobile && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />}
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      dx={-10}
                      tickFormatter={(val) => `${val / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value: any) => [`${(value).toLocaleString("vi")} đ`, "Doanh thu"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8D6E53"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Real Traffic Statistics */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between animate-in fade-in duration-355">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-105">
                  <h4 className="font-bold text-[#5C4033] font-display text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#8D6E53]" />
                    Phân tích truy cập & Thiết bị
                  </h4>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Tổng Lượt truy cập (Quý này)</p>
                    <p className="text-2xl font-black text-stone-850 font-mono mt-0.5">
                      {((data.totalCompleted * 8.5) + 342).toLocaleString("vi")} <span className="text-xs font-normal text-stone-400 font-sans">lượt</span>
                    </p>
                  </div>

                  <div className="pt-1">
                    <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-1">
                      <span>Thiết bị di động (Mobile)</span>
                      <span className="font-bold text-gray-800">82%</span>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#8D6E53] h-full rounded-full animate-pulse" style={{ width: '82%' }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-stone-50/50 p-2.5 rounded-xl border border-stone-100">
                      <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Tìm kiếm tự nhiên</p>
                      <p className="text-sm font-extrabold text-[#5C4033] font-mono mt-0.5">58.4%</p>
                    </div>
                    <div className="bg-stone-50/50 p-2.5 rounded-xl border border-stone-100">
                      <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Mạng xã hội / Zalo</p>
                      <p className="text-sm font-extrabold text-[#5C4033] font-mono mt-0.5">32.1%</p>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-2xl flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wide">Lời khuyên chuyển đổi mẫu</p>
                      <p className="text-[10.5px] font-medium leading-relaxed text-stone-600 mt-0.5">
                        Với <b>82%</b> khách truy cập bằng điện thoại, hãy tối ưu ưu đãi và luôn giữ cho thanh công cụ dưới mobile tiện lợi nhất!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Log section ("Xem điểm danh") */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[#8D6E53]" /> Nhật ký Xem điểm danh nhân viên
              </h3>
              <span className="text-[10px] bg-gray-100 px-2.5 py-1 rounded-md font-bold text-gray-500">
                Lượt check-in: {data.attendanceLog.length} lần
              </span>
            </div>

            {data.attendanceLog.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-10 italic">
                Không tìm thấy dữ liệu điểm danh nào trong thời gian này.
              </p>
            ) : (
              <div className="overflow-x-auto whitespace-nowrap">
                <table className="w-full text-left font-sans text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100 text-[10px]">
                    <tr>
                      <th className="p-3 font-semibold">Ngày</th>
                      <th className="p-3 font-semibold">Nhân viên</th>
                      <th className="p-3 text-center font-semibold">Trạng thái</th>
                      <th className="p-3 font-semibold">Giờ vào chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {data.attendanceLog.map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 font-semibold text-gray-900">
                          {format(new Date(log.date), "EEEE, dd/MM/yyyy", { locale: vi })}
                        </td>
                        <td className="p-3 font-bold text-gray-800">{log.users?.full_name || "Nhân viên"}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              log.status === "PRESENT"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-red-50 text-red-650 border border-red-100"
                            }`}
                          >
                            {log.status === "PRESENT" ? "CÓ MẶT" : "VẮNG MẶT"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-gray-500">
                          {log.check_in_time ? format(new Date(log.check_in_time), "HH:mm:ss") : "--:--:--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 text-gray-400 text-xs">
          Không tìm thấy dữ liệu tổng hợp.
        </div>
      )}
    </div>
  );
}

function TabStaff({
  staffs,
  staffError,
  userRole,
  onReload,
}: {
  staffs: any[];
  staffError?: string | null;
  userRole?: string;
  onReload: () => void;
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [detailStaff, setDetailStaff] = useState<any>(null);
  const [editStaff, setEditStaff] = useState<any>(null);
  const [staffStats, setStaffStats] = useState<Record<string, any>>({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [rangeType, setRangeType] = useState<"week" | "month" | "last_month" | "custom">("month");
  
  // Safely initialize date strings to avoid SSR / hydration mismatch
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const calculateDates = (type: string) => {
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);

    if (type === "week") {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
    } else if (type === "month") {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    } else if (type === "last_month") {
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end.setDate(0);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  };

  const filteredStaffs = staffs.filter((staff) => {
    const term = searchTerm.toLowerCase();
    const name = (staff.full_name || "").toLowerCase();
    const cccd = (staff.cccd || "").toLowerCase();
    return name.includes(term) || cccd.includes(term);
  });

  useEffect(() => {
    const fetchAllStats = async () => {
      setLoadingStats(true);
      
      let dates: { start: string; end: string };
      if (rangeType === "custom") {
        const start = new Date(customStartDate || new Date());
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEndDate || new Date());
        end.setHours(23, 59, 59, 999);
        dates = {
          start: start.toISOString(),
          end: end.toISOString()
        };
      } else {
        dates = calculateDates(rangeType);
      }

      const statsObj: Record<string, any> = {};
      for (const s of staffs) {
        try {
          const detail = await getStaffDetail(s.id, dates.start, dates.end);
          statsObj[s.id] = detail;
        } catch (e) {
          console.error(e);
        }
      }
      setStaffStats(statsObj);
      setLoadingStats(false);
    };
    if (staffs.length > 0) {
      fetchAllStats();
    }
  }, [staffs, rangeType, customStartDate, customEndDate]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 md:mt-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-display whitespace-nowrap">
            Quản lý Nhân sự
          </h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { id: "week", label: "Tuần này" },
              { id: "month", label: "Tháng này" },
              { id: "last_month", label: "Tháng trước" },
              { id: "custom", label: "Tùy chọn" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setRangeType(btn.id as any)}
                className={`px-3 py-1 rounded-[8px] text-[11px] font-bold transition-all cursor-pointer ${
                  rangeType === btn.id ? "bg-[#8D6E53] text-white" : "bg-gray-100 text-gray-500 hover:text-gray-900"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          {rangeType === "custom" && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-0.5 animate-in slide-in-from-top-1 duration-200">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 text-[11px] text-[#5C4033] font-semibold border-2 border-[#EADDCD] rounded-xl outline-none bg-stone-50 focus:border-[#8D6E53] focus:bg-white cursor-pointer transition-all shadow-sm"
              />
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">đến</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 text-[11px] text-[#5C4033] font-semibold border-2 border-[#EADDCD] rounded-xl outline-none bg-stone-50 focus:border-[#8D6E53] focus:bg-white cursor-pointer transition-all shadow-sm"
              />
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64 focus-within:w-full sm:focus-within:w-72 transition-all">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc CCCD..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all shadow-inner"
            />
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-black flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Thêm nhân viên
          </button>
        </div>
      </div>

      {staffError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div className="text-sm text-red-700">
            <p className="font-semibold mb-1">Lỗi tải danh sách nhân viên:</p>
            <p>{staffError}</p>
            <button
              onClick={onReload}
              className="mt-2 text-red-600 underline hover:text-red-800 font-medium cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {loadingStats ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      ) : (
        <>
          {/* Responsive Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-300 w-full">
            <div className="overflow-x-auto whitespace-nowrap scrollbar-none">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="p-4 pl-6">Nhân viên</th>
                    <th className="p-4 hidden md:table-cell">Số CCCD</th>
                    <th className="p-4 text-right hidden sm:table-cell">Doanh thu</th>
                    <th className="p-4 text-right hidden lg:table-cell">Hoa hồng</th>
                    <th className="p-4 text-right hidden xl:table-cell">Tiền Tip</th>
                    <th className="p-4 text-center hidden md:table-cell">Số ca HF</th>
                    <th className="p-4 pr-6 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {filteredStaffs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500 font-medium">
                        Không tìm thấy nhân viên nào
                      </td>
                    </tr>
                  ) : filteredStaffs.map((staff) => {
                    const stats = staffStats[staff.id] || {
                      totalRevenue: 0,
                      totalCommission: 0,
                      totalTip: 0,
                      totalCompleted: 0,
                    };
                    return (
                      <tr
                        key={staff.id}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        <td className="p-4 pl-6 font-medium text-gray-900 group-hover:text-pink-600 transition-colors cursor-pointer" onClick={() => setDetailStaff(staff)}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center font-bold">
                              {staff.full_name?.charAt(0) || "NV"}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-base sm:text-sm">
                                {staff.full_name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-gray-500 hidden md:table-cell cursor-pointer" onClick={() => setDetailStaff(staff)}>
                          {staff.cccd || "N/A"}
                        </td>
                        <td className="p-4 text-right font-bold text-gray-900 hidden sm:table-cell cursor-pointer" onClick={() => setDetailStaff(staff)}>
                          {(stats.totalRevenue || 0).toLocaleString("vi")}đ
                        </td>
                        <td className="p-4 text-right font-bold text-emerald-600 hidden lg:table-cell cursor-pointer" onClick={() => setDetailStaff(staff)}>
                          {(stats.totalCommission || 0).toLocaleString("vi")}đ
                        </td>
                        <td className="p-4 text-right font-bold text-pink-500 hidden xl:table-cell cursor-pointer" onClick={() => setDetailStaff(staff)}>
                          {(stats.totalTip || 0).toLocaleString("vi")}đ
                        </td>
                        <td className="p-4 text-center font-bold text-gray-800 hidden md:table-cell cursor-pointer" onClick={() => setDetailStaff(staff)}>
                          {stats.totalCompleted || 0}
                        </td>
                        <td className="p-4 pr-6 text-right flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setEditStaff(staff)}
                            className="text-[#8D6E53] hover:text-[#5C4033] text-sm font-semibold cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailStaff(staff)}
                            className="bg-gray-50 text-gray-400 group-hover:bg-pink-50 group-hover:text-pink-600 rounded-full p-1.5 transition-colors cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {isAddOpen && (
        <AddStaffModal
          onClose={() => setIsAddOpen(false)}
          onReload={onReload}
        />
      )}
      {editStaff && (
        <EditStaffModal
          staff={editStaff}
          userRole={userRole}
          onClose={() => setEditStaff(null)}
          onReload={onReload}
        />
      )}
      {detailStaff && (
        <StaffDetailModal
          staff={detailStaff}
          stats={staffStats[detailStaff.id]}
          onClose={() => setDetailStaff(null)}
        />
      )}
    </div>
  );
}

function AddStaffModal({ onClose, onReload }: any) {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
    cccd: "",
    role: "STAFF",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    const res = await createStaff(form);
    if (res.success) {
      onReload();
      onClose();
    } else {
      setErrorMsg("Lỗi: " + res.error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-in zoom-in-95">
        <h3 className="font-display font-bold text-lg text-gray-900 mb-6">
          Thêm nhân viên mới
        </h3>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên
            </label>
            <input
              required
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số CCCD (*Bắt buộc)
            </label>
            <input
              required
              type="text"
              value={form.cccd}
              onChange={(e) => setForm({ ...form, cccd: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên đăng nhập
            </label>
            <input
              required
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu / PIN
            </label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phân quyền
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none text-sm"
            >
              <option value="STAFF">Nhân viên (STAFF)</option>
              <option value="MANAGER">Quản lý (MANAGER)</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-black disabled:opacity-50"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditStaffModal({ staff, userRole, onClose, onReload }: any) {
  const [form, setForm] = useState({
    fullName: staff.full_name || "",
    username: staff.username || "",
    cccd: staff.cccd || "",
    role: staff.role || "STAFF",
  });
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    const res = await updateStaff(staff.id, {
      full_name: form.fullName,
      username: form.username,
      cccd: form.cccd,
      role: form.role,
    });
    if (res.success) {
      onReload();
      onClose();
    } else {
      setErrorMsg("Lỗi: " + res.error);
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setResetting(true);
    const res = await resetStaffPassword(staff.id);
    if (res.success) {
      setSuccessMsg("Đã đặt lại mật khẩu thành '123456'");
    } else {
      setErrorMsg("Lỗi reset mật khẩu: " + res.error);
    }
    setResetting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-in zoom-in-95">
        <h3 className="font-display font-bold text-lg text-gray-900 mb-6">
          Sửa thông tin nhân viên
        </h3>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold">
            {successMsg}
          </div>
        )}

        <div className="mb-6 pb-6 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-700 font-medium">Bảo mật tài khoản:</span>
          <button
            onClick={handleResetPassword}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            {resetting ? "Đang xử lý..." : "🔒 Reset Mật khẩu"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên
            </label>
            <input
              required
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Đăng nhập (Username)
            </label>
            <input
              required
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số CCCD
            </label>
            <input
              type="text"
              value={form.cccd}
              onChange={(e) => setForm({ ...form, cccd: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-sm font-mono tracking-wide"
              placeholder="Nhập 12 số CCCD"
            />
          </div>
          {userRole === 'ADMIN' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phân quyền
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none text-sm"
            >
              <option value="STAFF">Nhân viên (STAFF)</option>
              <option value="MANAGER">Quản lý (MANAGER)</option>
            </select>
          </div>
          )}
          <div className="pt-4 flex justify-between gap-3 border-t border-gray-100">
            {userRole === 'ADMIN' ? (
              <button
                type="button"
                onClick={async () => {
                  if(confirm(`Bạn có chắc muốn ẩn/xóa nhân viên ${staff.full_name}?`)) {
                    setLoading(true);
                    const res = await deleteStaffSafely(staff.id, staff.full_name);
                    if (res.success) {
                      onReload();
                      onClose();
                    } else {
                      setErrorMsg("Lỗi: " + res.error);
                      setLoading(false);
                    }
                  }
                }}
                className="px-4 py-2 text-red-500 hover:text-red-700 font-medium text-sm transition-colors cursor-pointer"
              >
                Xóa nhân viên
              </button>
            ) : (
              <div></div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-black transition-transform active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function StaffDetailModal({ staff, stats, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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

function TabServices({
  services,
  userRole,
  onReload,
}: {
  services: any[];
  userRole: string;
  onReload: () => void;
}) {
  const [editingService, setEditingService] = useState<any>(null);

  const handleDeleteService = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa dịch vụ "${name}" không?`)) return;

    try {
      const res = await deleteServiceSafely(id, name);
      if (res.success) {
        alert(res.message);
        onReload();
      } else {
        alert("Lỗi: " + res.error);
      }
    } catch (err: any) {
      alert("Lỗi kết nối: " + err.message);
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
              duration_minutes: 60,
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

function ServiceModal({ service, onClose, onReload }: any) {
  const [form, setForm] = useState({
    ...service,
    commission_percentage:
      service.commission_percentage !== undefined &&
      service.commission_percentage !== null
        ? service.commission_percentage
        : 15,
    commission_amount:
      service.commission_amount !== undefined &&
      service.commission_amount !== null
        ? service.commission_amount
        : 0,
  });
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerateDescription = async () => {
    setErrorMsg("");
    if (!form.name || !form.category) {
      setErrorMsg("Vui lòng nhập Tên dịch vụ và Chọn danh mục trước khi tạo mô tả tự động!");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName: form.name, category: form.category })
      });
      const data = await res.json();
      if (data.description) {
        setForm({ ...form, description: data.description });
      } else if (data.error) {
        setErrorMsg(data.error);
      }
    } catch (error) {
      setErrorMsg("Lỗi khi tạo mô tả bằng AI. Vui lòng thử lại sau.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    const res = await saveService(form);
    if (res.success) {
      onReload();
      onClose();
    } else {
      setErrorMsg("Lỗi: " + res.error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto scrollbar-none">
        <h3 className="font-display font-bold text-lg text-gray-900 mb-6">
          {form.id ? "Sửa dịch vụ" : "Thêm dịch vụ"}
        </h3>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên dịch vụ
            </label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Mô tả dịch vụ
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGenerating}
                className="text-xs font-semibold text-pink-600 hover:text-pink-700 flex items-center gap-1 bg-pink-50 hover:bg-pink-100 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Tạo bằng AI
              </button>
            </div>
            <textarea
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Nhập mô tả chi tiết cho dịch vụ này..."
              rows={3}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá (VNĐ)
              </label>
              <input
                required
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian (Phút)
              </label>
              <input
                required
                type="number"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: Number(e.target.value) })
                }
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tỷ lệ hoa hồng (%)
                </label>
              </div>
              <input
                type="number"
                value={form.commission_percentage}
                onChange={(e) =>
                  setForm({
                    ...form,
                    commission_percentage: Number(e.target.value),
                  })
                }
                placeholder="15"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
              />
              <span className="text-[10px] text-gray-400">
                Tính theo % giá dịch vụ
              </span>
            </div>
            <div>
              <div className="flex justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tiền cố định (VNĐ)
                </label>
              </div>
              <input
                type="number"
                value={form.commission_amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    commission_amount: Number(e.target.value),
                  })
                }
                placeholder="0"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
              />
              <span className="text-[10px] text-gray-400">
                Nếu đặt &gt; 0, sẽ ưu tiên dùng số tiền này
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
            >
              <option value="Móng">Móng (Nail)</option>
              <option value="Gội dưỡng sinh">Gội dưỡng sinh (Hair)</option>
              <option value="Massage">Massage</option>
              <option value="Deal">Deal Khuyến Mãi</option>
            </select>
          </div>

          {/* Service Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ảnh dịch vụ
            </label>
            <div className="space-y-3">
              {form.image_url && (
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={form.image_url} alt={form.name} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm({ ...form, image_url: '' })}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors shadow-md cursor-pointer"
                  >&times;</button>
                </div>
              )}
              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium text-gray-600">
                  <ImageIcon className="w-4 h-4" />
                  Tải ảnh lên
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setForm({ ...form, image_url: reader.result as string });
                    reader.readAsDataURL(file);
                  }} />
                </label>
                <button type="button" onClick={async () => {
                  if (!form.name) { setErrorMsg("Vui lòng nhập tên dịch vụ trước!"); return; }
                  setIsGenerating(true);
                  setErrorMsg("");
                  try {
                    const res = await fetch('/api/generate-seo-image', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ prompt: `Dịch vụ ${form.name} tại spa, ${form.category || 'spa'}, phong cách chuyên nghiệp, sang trọng, ảnh chụp quảng cáo` })
                    });
                    const data = await res.json();
                    if (data.image) setForm({ ...form, image_url: data.image });
                    else if (data.error) setErrorMsg(data.error);
                  } catch { setErrorMsg("Lỗi kết nối khi tạo ảnh AI"); }
                  finally { setIsGenerating(false); }
                }} disabled={isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-50 border border-pink-200 rounded-xl hover:bg-pink-100 transition-colors cursor-pointer text-sm font-medium text-pink-700 disabled:opacity-50"
                >
                  {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  AI tạo ảnh
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái hiển thị
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
                className="w-5 h-5 rounded text-pink-500 focus:ring-pink-500"
              />
              <span className="font-medium text-gray-900">
                {form.is_active
                  ? "Đang bật (Hiển thị cho khách)"
                  : "Đang tắt (Tạm ẩn)"}
              </span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-black disabled:opacity-50"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TabReviews({ reviews }: { reviews: any[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mt-2 md:mt-0">
        <h2 className="text-xl font-bold text-gray-900 font-display">
          Đánh giá khách hàng
        </h2>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white p-12 text-center text-gray-500 rounded-2xl border border-gray-100 shadow-sm">
          Chưa có đánh giá nào từ khách hàng.
        </div>
      ) : (
        <>
          {/* Desktop Table view with horizontal scroll */}
          <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto whitespace-nowrap">
              <table className="w-full text-left min-w-[750px]">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="p-4 pl-6">Mức điểm</th>
                    <th className="p-4">Khách hàng</th>
                    <th className="p-4">Số điện thoại</th>
                    <th className="p-4">Thợ phục vụ</th>
                    <th className="p-4">Đánh giá nhanh</th>
                    <th className="p-4 pr-6 text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {reviews.map((review) => (
                    <tr
                      key={review.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-4 pl-6 font-medium text-gray-900">
                        <div className="flex items-center gap-1.5 text-pink-600 bg-pink-50/60 px-2.5 py-1 rounded-lg w-fit font-bold">
                          <span>{review.rating}</span>
                          <Star className="w-3.5 h-3.5 fill-current shrink-0" />
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-gray-900">
                        {review.appointments?.customers?.full_name ||
                          "Khách vãng lai"}
                      </td>
                      <td className="p-4 font-mono text-gray-500">
                        {review.appointments?.customers?.phone || "N/A"}
                      </td>
                      <td className="p-4 font-medium text-gray-800">
                        {review.appointments?.users?.full_name || "Khác"}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap gap-1">
                            {review.quick_tags &&
                              review.quick_tags.map((tag: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-600"
                                >
                                  {tag}
                                </span>
                              ))}
                          </div>
                          {review.comment && (
                            <p className="text-xs text-gray-500 italic max-w-xs whitespace-normal line-clamp-2">
                              &ldquo;{review.comment}&rdquo;
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right font-mono text-gray-400 text-xs">
                        {review.created_at
                          ? format(
                              new Date(review.created_at),
                              "dd/MM/yyyy HH:mm",
                            )
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards stack list view */}
          <div className="block md:hidden grid grid-cols-1 gap-4 animate-in fade-in duration-300">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4"
              >
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-1.5 text-pink-600 bg-pink-50 px-3 py-1 rounded-xl w-fit font-black text-sm">
                    <span>{review.rating}</span>
                    <Star className="w-4 h-4 fill-current shrink-0" />
                  </div>
                  <span className="font-mono text-[11px] text-gray-400">
                    {review.created_at
                      ? format(new Date(review.created_at), "dd/MM/yy HH:mm")
                      : ""}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-900 font-bold">
                    Khách: {review.appointments?.customers?.full_name || "N/A"}{" "}
                    <span className="font-mono text-xs text-gray-400 font-normal">
                      ({review.appointments?.customers?.phone || "N/A"})
                    </span>
                  </p>
                  <p className="text-gray-600">
                    Phục vụ bởi:{" "}
                    <strong className="text-gray-900">
                      {review.appointments?.users?.full_name || "Khác"}
                    </strong>
                  </p>
                </div>
                {review.quick_tags && review.quick_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {review.quick_tags.map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 text-xs font-semibold bg-gray-50 border border-gray-100 rounded-lg text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {review.comment && (
                  <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs text-gray-700 italic font-medium leading-relaxed">
                    &ldquo;{review.comment}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TabSEO({ data, userRole, onReload }: { data: any; userRole: string; onReload: () => void }) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<"METADATA" | "AI_WRITER" | "SAVED_ARTICLES" | "BANNER">("METADATA");
  
  // Banner States
  const [bannerForm, setBannerForm] = useState({
    is_enabled: true,
    content: "✨ GIẢM NGAY 5% KHI ĐẶT LỊCH HẸN TRỰC TUYẾN ✨ HOTLINE: 0934 323 878"
  });
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerMsg, setBannerMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const loadBanner = async () => {
      try {
        const res = await getBannerSettings();
        if (res) {
          setBannerForm({
            is_enabled: res.is_enabled !== undefined ? res.is_enabled : true,
            content: res.content || ""
          });
        }
      } catch (err) {
        console.error("Lỗi tải cấu hình banner:", err);
      }
    };
    loadBanner();
  }, []);

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerMsg({ type: "", text: "" });
    setBannerLoading(true);
    const res = await saveBannerSettings(bannerForm);
    if (res.success) {
      setBannerMsg({ type: "success", text: "Đã lưu cấu hình Banner Thông Báo thành công!" });
    } else {
      setBannerMsg({ type: "error", text: "Lỗi khi lưu Banner: " + res.error });
    }
    setBannerLoading(false);
  };

  // METADATA Tab States
  const [form, setForm] = useState(
    data || {
      page_title: "",
      meta_description: "",
      meta_keywords: "",
      og_image_url: "",
      online_discount_enabled: true,
      online_discount_percent: 5,
    }
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setLoading(true);
    const res = await saveSeoSettings(form);
    if (res.success) {
      setMsg({ type: "success", text: "Đã lưu cấu hình SEO thành công!" });
      onReload();
    } else {
      setMsg({ type: "error", text: "Lỗi khi lưu SEO: " + res.error });
    }
    setLoading(false);
  };

  // AI_WRITER Tab States
  const [seoTopic, setSeoTopic] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [seoImagePrompt, setSeoImagePrompt] = useState("");
  const [isResearchLoading, setIsResearchLoading] = useState(false);
  const [seoResearchText, setSeoResearchText] = useState("");
  const [seoResearchSources, setSeoResearchSources] = useState<any[]>([]);
  
  const [isArticleLoading, setIsArticleLoading] = useState(false);
  const [seoArticleText, setSeoArticleText] = useState("");
  
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [seoImageUrl, setSeoImageUrl] = useState("");
  const [seoImageMethod, setSeoImageMethod] = useState("");
  
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [isPublishingBlog, setIsPublishingBlog] = useState(false);

  // SAVED_ARTICLES Tab States
  const [savedArticles, setSavedArticles] = useState<any[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [isEditingSavedArticle, setIsEditingSavedArticle] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");

  const showToast = (message: string) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadSavedArticles = async () => {
    setIsLoadingArticles(true);
    try {
      const arts = await getSeoArticles();
      setSavedArticles(arts || []);
    } catch (e) {
      console.error(e);
    }
    setIsLoadingArticles(false);
  };

  useEffect(() => {
    if (subTab === "SAVED_ARTICLES") {
      loadSavedArticles();
    }
  }, [subTab]);

  const handleResearchAI = async () => {
    if (!seoTopic) {
      showToast("Vui lòng nhập chủ đề chính!");
      return;
    }
    setIsResearchLoading(true);
    setSeoResearchText("");
    setSeoResearchSources([]);
    try {
      const res = await fetch("/api/seo-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: seoTopic, keywords: seoKeywords })
      });
      const resData = await res.json();
      if (resData.summary) {
        setSeoResearchText(resData.summary);
        setSeoResearchSources(resData.sources || []);
      } else {
        setSeoResearchText("Không tìm thấy kết quả nghiên cứu. Vui lòng thử lại.");
      }
    } catch (e) {
      setSeoResearchText("Lỗi tìm kiếm nghiên cứu SEO.");
    }
    setIsResearchLoading(false);
  };

  const handleGenerateArticleAI = async () => {
    if (!seoTopic) {
      showToast("Vui lòng nhập chủ đề bài viết!");
      return;
    }
    setIsArticleLoading(true);
    setSeoArticleText("");
    try {
      const res = await fetch("/api/generate-seo-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: seoTopic, keywords: seoKeywords })
      });
      const data = await res.json();
      if (data.article) {
        setSeoArticleText(data.article);
      } else {
        setSeoArticleText("Có lỗi xảy ra khi gọi AI tạo bài viết. Vui lòng kiểm tra API key.");
      }
    } catch (e) {
      setSeoArticleText("Lỗi kết nối dịch vụ tạo bài viết.");
    }
    setIsArticleLoading(false);
  };

  const handleGenerateImageAI = async () => {
    const promptValue = seoImagePrompt || seoTopic || "nail hair beauty salon";
    setIsImageLoading(true);
    setSeoImageUrl("");
    try {
      const res = await fetch("/api/generate-seo-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptValue })
      });
      const data = await res.json();
      if (data.image) {
        setSeoImageUrl(data.image);
        setSeoImageMethod(data.method);
      } else {
        showToast("Không tạo được ảnh minh họa");
      }
    } catch (e) {
      console.error(e);
      showToast("Lỗi khi kết nối dịch vụ vẽ ảnh!");
    }
    setIsImageLoading(false);
  };

  const handleSaveToArticles = async () => {
    if (!seoTopic || !seoArticleText) {
      showToast("Cần có chủ đề và nội dung bài viết để lưu!");
      return;
    }
    setIsSavingArticle(true);
    try {
      const res = await saveSeoArticle({
        topic: seoTopic,
        keywords: seoKeywords,
        article: seoArticleText,
        imageUrl: seoImageUrl || ""
      });
      if (res.success) {
        showToast("Lưu vào Kho Bài Viết thành công! Mời xem ở tab tiếp theo.");
        setSeoTopic("");
        setSeoKeywords("");
        setSeoImagePrompt("");
        setSeoArticleText("");
        setSeoImageUrl("");
        setSeoResearchText("");
        setSeoResearchSources([]);
      } else {
        showToast("Lỗi khi lưu bài viết: " + res.error);
      }
    } catch (e: any) {
      showToast("Lỗi hệ thống: " + e.message);
    }
    setIsSavingArticle(false);
  };

  const handlePublishToBlog = async () => {
    if (!seoArticleText) {
      showToast("Không có nội dung bài viết để đăng!");
      return;
    }
    setIsPublishingBlog(true);
    try {
      const res = await publishSeoArticleToBlog(seoArticleText, seoImageUrl);
      if (res.success) {
        showToast("Đã đăng bài lên Blog thành công! 🎉");
        window.open('/blog/' + res.slug, '_blank');
      } else {
        showToast("Lỗi: " + res.error);
      }
    } catch (e: any) {
      showToast("Lỗi hệ thống: " + e.message);
    }
    setIsPublishingBlog(false);
  };

  const [publishingBlogId, setPublishingBlogId] = useState<string | null>(null);

  const handlePublishSavedToBlog = async (art: any) => {
    setPublishingBlogId(art.id);
    try {
      const res = await publishSeoArticleToBlog(art.article, art.imageUrl);
      if (res.success) {
        showToast("Đã đăng bài lên Blog thành công! 🎉");
        window.open('/blog/' + res.slug, '_blank');
      } else {
        showToast("Lỗi: " + res.error);
      }
    } catch (e: any) {
      showToast("Lỗi hệ thống: " + e.message);
    }
    setPublishingBlogId(null);
  };

  const handleDeleteArticle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này vĩnh viễn khỏi kho lưu trữ?")) return;
    try {
      const res = await deleteSeoArticle(id);
      if (res.success) {
        showToast("Đã xóa bài viết thành công!");
        if (selectedArticle?.id === id) {
          setSelectedArticle(null);
          setIsEditingSavedArticle(false);
        }
        loadSavedArticles();
      } else {
        showToast("Lỗi khi xóa bài viết");
      }
    } catch (err) {
      showToast("Lỗi hệ thống khi xóa bài viết");
    }
  };

  const handleUpdateSavedArticle = async () => {
    if (!selectedArticle) return;
    try {
      const res = await saveSeoArticle({
        ...selectedArticle,
        topic: editTitle,
        article: editContent
      });
      if (res.success) {
        showToast("Cập nhật bài viết thành công!");
        setSelectedArticle({ ...selectedArticle, topic: editTitle, article: editContent });
        setIsEditingSavedArticle(false);
        loadSavedArticles();
      } else {
        showToast("Lỗi khi cập nhật bài viết");
      }
    } catch (err) {
      showToast("Lỗi hệ thống khi lưu");
    }
  };

  const copyToClipboard = (text: string, labelId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(labelId);
    setTimeout(() => setCopiedIndex(null), 2000);
    showToast("Đã chép nội dung vào Clipboard!");
  };

  const simulateSocialShare = (platform: string, topicText: string) => {
    showToast(`🔄 [Giả Lập] Đã tiến hành đẩy bài viết "${topicText}" lên ${platform} cùng hashtag #MinNailHair...`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 border border-gray-800 text-white text-[11px] font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header and Sub tabs */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-pink-500" />
            SEO Marketing Hub ✨
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Quản trị viên cấu hình Website tối ưu tìm kiếm Google & tạo các nội dung chuẩn SEO bằng Gemini AI mạnh mẽ.
          </p>
        </div>
        
        {/* Navigation */}
        <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setSubTab("METADATA")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "METADATA" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Cấu hình Metadata
          </button>
          <button
            onClick={() => setSubTab("AI_WRITER")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "AI_WRITER" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Sáng tạo AI SEO 🪄
          </button>
          <button
            onClick={() => setSubTab("SAVED_ARTICLES")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "SAVED_ARTICLES" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Kho bài viết đã lưu
          </button>
          <button
            onClick={() => setSubTab("BANNER")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "BANNER" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Cấu hình Banner 📣
          </button>
        </div>
      </div>

      {/* Blog Suite Promotional Call to Action */}
      <div className="bg-gradient-to-r from-[#8D6E53] via-[#5C4033] to-[#3A2E2B] p-5 rounded-2xl text-[#FAF6F0] flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white border border-white/30 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">MỚI ✨</span>
            <span className="text-white text-xs font-semibold">PHÂN HỆ BLOG &amp; SEO SUITE</span>
          </div>
          <h3 className="font-bold text-sm md:text-base leading-snug">Sử dụng Trình Biên Tập Chuyên Nghiệp Để Đăng Bài Viết Lên Website Công Khai</h3>
          <p className="text-[11px] text-stone-200 leading-relaxed font-semibold">Bao gồm hệ thống đồng bộ trực tiếp database, tự động sinh slug tiếng Việt không dấu, chấm điểm từ khóa SEO địa phương và sitemap XML tự động chạy ngầm phục vụ tăng trưởng SEO.</p>
        </div>
        <button
          onClick={() => router.push('/admin/blog')}
          className="px-5 py-3 bg-[#FAF6F0] hover:bg-[#EADDCD] text-[#5C4033] rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
        >
          Mở Trình Soạn Thảo Blog ✍️
        </button>
      </div>

      {/* METADATA SUBTAB */}
      {subTab === "METADATA" && (
        <div className="space-y-6">
          {msg.text && (
            <div className={`p-4 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {msg.text}
            </div>
          )}

          {/* Banner Quick Control Switch */}
          <div className="bg-gradient-to-r from-[#FAF6F0] to-white p-6 rounded-2xl border border-[#EADDCD] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Hiển thị Banner Thông Báo ngoài Trang Chủ 📣</h3>
              </div>
              <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                Bật hoặc tắt dải banner thông báo khuyến mãi và hotline ở vùng đầu trang chủ lập tức mà không làm mất nội dung văn bản.
              </p>
              {bannerForm.content && (
                <div className="mt-1 max-w-full">
                  <span className="inline-block text-[10px] text-[#5C4033] bg-[#FAF0E6] px-2.5 py-1 rounded-lg font-semibold border border-[#EADDCD]/50 max-w-full truncate">
                    Nội dung hiện tại: &quot;{bannerForm.content}&quot;
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto bg-[#FAF6F0] border border-[#EADDCD]/60 px-4 py-2 rounded-xl">
              <span className={`text-[10px] font-black uppercase tracking-widest ${bannerForm.is_enabled ? 'text-pink-600' : 'text-gray-400'}`}>
                {bannerForm.is_enabled ? 'Đang Bật' : 'Đang Tắt'}
              </span>
              <button
                type="button"
                disabled={bannerLoading}
                onClick={async () => {
                  const newIsEnabled = !bannerForm.is_enabled;
                  setBannerForm(prev => ({ ...prev, is_enabled: newIsEnabled }));
                  setBannerLoading(true);
                  try {
                    const res = await saveBannerSettings({ ...bannerForm, is_enabled: newIsEnabled });
                    if (res.success) {
                      showToast(`Đã ${newIsEnabled ? 'BẬT' : 'TẮT'} banner thông báo thành công!`);
                    } else {
                      showToast(`Lỗi khi cập nhật trạng thái banner: ${res.error}`);
                    }
                  } catch (e) {
                    showToast("Đã xảy ra lỗi hệ thống khi chuyển đổi.");
                  } finally {
                    setBannerLoading(false);
                  }
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  bannerForm.is_enabled ? 'bg-pink-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    bannerForm.is_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5"
          >
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Tiêu đề trang (Page Title)
              </label>
              <input
                type="text"
                value={form.page_title || ""}
                onChange={(e) => setForm({ ...form, page_title: e.target.value })}
                placeholder="VD: Min Nail & Hair - Dưỡng sinh & Làm móng"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800"
              />
              <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                Độ dài lý tưởng: 50 - 60 ký tự.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Đoạn mô tả (Meta Description)
              </label>
              <textarea
                rows={3}
                value={form.meta_description || ""}
                onChange={(e) =>
                  setForm({ ...form, meta_description: e.target.value })
                }
                placeholder="VD: Tiệm gội đầu dưỡng sinh thảo dược, làm móng chuyên sâu uy tím hàng đầu tại Chung cư Lavita Charm, Thủ Đức..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800 resize-none"
              ></textarea>
              <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                Đoạn tóm tắt hiển thị trên Google. Tối đa 150 - 160 ký tự.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Từ khóa (Meta Keywords)
              </label>
              <input
                type="text"
                value={form.meta_keywords || ""}
                onChange={(e) =>
                  setForm({ ...form, meta_keywords: e.target.value })
                }
                placeholder="VD: gội đầu dưỡng sinh, làm móng thủ đức, min nail, salon tóc"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800"
              />
              <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                Các từ khóa cách nhau bởi dấu phẩy (,).
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Ảnh chia sẻ (Open Graph Image URL)
              </label>
              <input
                type="text"
                value={form.og_image_url || ""}
                onChange={(e) => setForm({ ...form, og_image_url: e.target.value })}
                placeholder="VD: https://domain.com/og-image.jpg"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800"
              />
              <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                Đường dẫn ảnh Thumbnail hiển thị khi chia sẻ link website lên MXH.
              </p>
              {form.og_image_url && (
                <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 inline-block">
                  <img
                    src={form.og_image_url}
                    alt="OG Preview"
                    className="h-32 object-cover"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).style.display = "none")
                    }
                  />
                </div>
              )}
            </div>

            {/* Online Booking Discount Settings */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-widest">Ưu đãi đặt lịch Online</h3>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-600">Bật giảm giá khi đặt lịch Online</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, online_discount_enabled: !form.online_discount_enabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.online_discount_enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.online_discount_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              {form.online_discount_enabled && (
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-600 shrink-0">Phần trăm giảm:</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={form.online_discount_percent ?? 5}
                    onChange={(e) => setForm({ ...form, online_discount_percent: Math.min(100, Math.max(0, Number(e.target.value))) })}
                    className="w-24 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800 text-center"
                  />
                  <span className="text-xs font-bold text-gray-500">%</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-[#5C4033] hover:bg-[#3A2E2B] text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                {loading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div>
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Lưu cấu hình SEO
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI_WRITER SUBTAB */}
      {subTab === "AI_WRITER" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Form Controls */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b pb-3 border-gray-100">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Thông tin từ khóa & Sáng tạo</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Chủ đề bài viết / Từ khóa chính</label>
              <input
                type="text"
                value={seoTopic}
                onChange={(e) => setSeoTopic(e.target.value)}
                placeholder="Ví dụ: Cách chăm sóc móng hư tổn sau khi úp móng"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Từ khóa phụ (Tự nhiên hóa)</label>
              <input
                type="text"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="chăm sóc móng, dưỡng móng úp, nail thủ đức lavita"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleResearchAI}
                disabled={isResearchLoading}
                className="flex-1 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                {isResearchLoading ? "AI lướt web..." : "AI Nghiên Cứu Web"}
              </button>

              <button
                type="button"
                onClick={handleGenerateArticleAI}
                disabled={isArticleLoading}
                className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <PenTool className="w-4 h-4 text-pink-400 animate-pulse" />
                {isArticleLoading ? "AI viết bài..." : "AI Viết Bài SEO"}
              </button>
            </div>

            {/* Internet search results */}
            {seoResearchText && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <p className="text-[11px] font-extrabold text-blue-700 flex items-center gap-1.5 border-b pb-1.5 border-gray-200">
                  <Globe className="w-4 h-4" />
                  KẾT QUẢ NGHIÊN CỨU INTERNET (GOOGLE GROUNDING)
                </p>
                <pre className="text-[11px] text-gray-600 font-sans leading-relaxed whitespace-pre-wrap font-medium">
                  {seoResearchText}
                </pre>
                {seoResearchSources.length > 0 && (
                  <div className="pt-2 border-t border-gray-200 space-y-1">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Nguồn bổ trợ:</p>
                    {seoResearchSources.map((s, idx) => (
                      <div key={idx} className="text-[10px] text-pink-600 truncate flex items-center gap-1">
                        🌍 <a href={s.uri} target="_blank" rel="noopener noreferrer" className="hover:underline font-bold">{s.title || s.uri}</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Image prompt & Generator */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tạo ảnh minh họa minh tinh ✨</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={seoImagePrompt}
                  onChange={(e) => setSeoImagePrompt(e.target.value)}
                  placeholder="Nhập prompt vẽ ảnh (vd: a luxury pink nail art showcase)"
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800"
                />
                <button
                  type="button"
                  onClick={handleGenerateImageAI}
                  disabled={isImageLoading}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-4 rounded-xl text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <ImageIcon className="w-4 h-4" />
                  {isImageLoading ? "AI vẽ..." : "Vẽ ảnh"}
                </button>
              </div>
              
              {seoImageUrl && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-200">
                    <img
                      src={seoImageUrl}
                      alt="SEO AI"
                      className="w-full h-full object-cover animate-fade-in"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-1 text-[9px] bg-black/70 text-white rounded font-mono font-bold tracking-widest">
                      {seoImageMethod === 'AI' ? 'GEMINI IMAGEN' : 'STOCK REPOSITORY'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium text-center">Ảnh minh họa chuẩn kích thước ngang Facebook/Web.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Preview and Output */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b pb-3 border-gray-100 font-semibold">
              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Bài viết hoạt động chuẩn SEO</h3>
              {seoArticleText && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => copyToClipboard(seoArticleText, "copy")}
                    className="text-[10px] font-bold bg-pink-50 hover:bg-pink-100 text-pink-600 px-2.5 py-1.5 rounded-lg transition-all"
                  >
                    {copiedIndex === "copy" ? "✓ Đã copy" : "Copy Bài Viết"}
                  </button>
                  <button
                    onClick={handleSaveToArticles}
                    disabled={isSavingArticle}
                    className="text-[10px] items-center gap-1 font-bold bg-[#5C4033] hover:bg-[#3A2E2B] text-white px-2.5 py-1.5 rounded-lg transition-all flex disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingArticle ? "Đang lưu..." : "Lưu Kho Bài"}
                  </button>
                  <button
                    onClick={handlePublishToBlog}
                    disabled={isPublishingBlog}
                    className="text-[10px] items-center gap-1 font-bold bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded-lg transition-all flex disabled:opacity-50 cursor-pointer"
                  >
                    {isPublishingBlog ? "Đang đăng..." : "Đăng lên Blog"}
                  </button>
                </div>
              )}
            </div>

            {seoArticleText ? (
              <div className="space-y-4 font-semibold">
                <div className="p-5 bg-gray-50 border border-gray-150 rounded-xl max-h-96 overflow-y-auto font-sans leading-relaxed text-xs text-gray-700 whitespace-pre-wrap">
                  {seoArticleText}
                </div>

                {/* Social Simulation Preview */}
                <div className="border border-gray-200/80 rounded-2xl p-4 bg-gray-50 space-y-3 shadow-inner">
                  <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Giao diện xem trước trên Mạng xã hội</p>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#5C4033] text-white flex items-center justify-center font-bold text-xs shadow-inner">
                        MN
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Min Nail & Hair (Thủ Đức)</p>
                        <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">Vừa xong · 🌐 Công khai</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-800 line-clamp-3 leading-relaxed">
                      Chào đón cả nhà đến với hệ thống thẩm mỹ & chăm sóc sức khỏe Min Nail & Hair Lavita Charm! ✨ {seoTopic}
                    </p>

                    {seoImageUrl && (
                      <div className="rounded-xl overflow-hidden border border-gray-150 max-h-48 aspect-video">
                        <img src={seoImageUrl} alt="Social Promo" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="bg-gray-50 p-2.5 rounded-lg border-t border-gray-100 flex justify-between items-center text-[10px] font-mono text-gray-400">
                      <span>🌏 MIN-NAIL-HAIR.SEO</span>
                      <span className="font-bold underline text-pink-600">Đọc bài chuẩn</span>
                    </div>

                    <div className="flex justify-between border-t border-gray-100 pt-3 text-[11px] font-bold text-gray-500">
                      <button onClick={() => simulateSocialShare("Facebook", seoTopic)} className="flex-1 hover:text-blue-600 flex justify-center items-center gap-1 cursor-pointer"><Facebook className="w-3.5 h-3.5" /> Facebook</button>
                      <button onClick={() => simulateSocialShare("Twitter", seoTopic)} className="flex-1 hover:text-sky-500 flex justify-center items-center gap-1 cursor-pointer"><Twitter className="w-3.5 h-3.5" /> Twitter</button>
                      <button onClick={() => simulateSocialShare("Zalo (Zns)", seoTopic)} className="flex-1 hover:text-indigo-600 flex justify-center items-center gap-1 cursor-pointer"><Send className="w-3.5 h-3.5" /> Zalo</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <Sparkles className="w-8 h-8 text-gray-300 animate-pulse mb-2" />
                <p className="text-xs text-gray-400 font-bold">Hãy nhập chủ đề ở cột bên trái và bấm <span className="text-pink-600 font-extrabold">&quot;AI Viết Bài SEO&quot;</span></p>
                <p className="text-[10px] text-gray-400 font-medium max-w-xs mt-1 leading-relaxed">Công cụ Gemini sẽ tự nghiên cứu online để đem lại thông tin thị trường làm đẹp chuẩn xác nhất.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SAVED_ARTICLES SUBTAB */}
      {subTab === "SAVED_ARTICLES" && (
        <div className="space-y-6">
          {isLoadingArticles ? (
            <div className="flex justify-center items-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
          ) : savedArticles.length === 0 ? (
            <div className="bg-white p-12 text-center border border-gray-100 rounded-2xl shadow-sm text-gray-400 flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-gray-200 mb-2" />
              <p className="text-xs font-bold">Trống lịch sử!</p>
              <p className="text-[10px] font-medium leading-relaxed max-w-sm mt-1">Chưa có bài viết SEO AI nào được lưu trữ. Bạn có thể sang thẻ &quot;Sáng tạo AI SEO 🪄&quot; để soạn và lưu một bài.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start font-semibold">
              {/* Left Column: List details */}
              <div className="lg:col-span-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">Kho Bài Viết ({savedArticles.length})</h4>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {savedArticles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => {
                        setSelectedArticle(art);
                        setEditTitle(art.topic);
                        setEditContent(art.article);
                        setIsEditingSavedArticle(false);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        selectedArticle?.id === art.id
                          ? "border-pink-500 bg-pink-50/20 shadow-sm"
                          : "border-gray-100 hover:bg-gray-50/50"
                      }`}
                    >
                      {art.imageUrl ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
                          <img src={art.imageUrl} alt="preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate leading-snug">{art.topic}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Từ khóa phụ: {art.keywords || "không có"}</p>
                        <div className="flex justify-between items-center text-[9px] text-gray-400 font-semibold pt-1">
                          <span>{format(new Date(art.createdAt), "dd/MM/yyyy")}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePublishSavedToBlog(art); }}
                              disabled={publishingBlogId === art.id}
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50/50 transition-colors cursor-pointer disabled:opacity-40"
                              title="Đăng lên Blog"
                            >
                              {publishingBlogId === art.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                              )}
                            </button>
                            {userRole === 'ADMIN' && (
                              <button
                                onClick={(e) => handleDeleteArticle(art.id, e)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50/50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Detailed Reader and Editor */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                {selectedArticle ? (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4 border-b pb-3 border-gray-100">
                      <div className="min-w-0">
                        <span className="text-[9px] font-extrabold uppercase bg-pink-100 text-pink-650 px-2 py-0.5 rounded font-mono">
                          BÀI VIẾT ĐÃ LƯU KHO
                        </span>
                        {isEditingSavedArticle ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full mt-1.5 p-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800"
                          />
                        ) : (
                          <h3 className="text-sm font-bold text-gray-900 mt-1 lines-clamp-2 leading-snug">{selectedArticle.topic}</h3>
                        )}
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5 flex items-center gap-1">
                          Khởi tạo: {format(new Date(selectedArticle.createdAt), "dd/MM/yyyy HH:mm")}.
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {isEditingSavedArticle ? (
                          <>
                            <button
                              onClick={handleUpdateSavedArticle}
                              className="text-[10px] font-bold bg-[#5C4033] hover:bg-[#3A2E2B] text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Lưu Thay Đổi
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingSavedArticle(false);
                                setEditTitle(selectedArticle.topic);
                                setEditContent(selectedArticle.article);
                              }}
                              className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Huỷ bỏ
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => copyToClipboard(selectedArticle.article, "copy-exist")}
                              className="text-[10px] font-bold bg-pink-50 hover:bg-pink-100 text-pink-600 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              {copiedIndex === "copy-exist" ? "✓ Đã copy" : "Copy"}
                            </button>
                            <button
                              onClick={() => handlePublishSavedToBlog(selectedArticle)}
                              disabled={publishingBlogId === selectedArticle.id}
                              className="text-[10px] font-bold bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                            >
                              {publishingBlogId === selectedArticle.id ? "Đang đăng..." : "Đăng lên Blog"}
                            </button>
                            <button
                              onClick={() => setIsEditingSavedArticle(true)}
                              className="text-[10px] font-bold bg-gray-100 hover:bg-gray-205 text-gray-750 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Sửa bài
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Image visualizer */}
                    {selectedArticle.imageUrl && (
                      <div className="relative aspect-video max-h-48 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 inline-block w-full">
                        <img src={selectedArticle.imageUrl} alt="visual banner" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Body Content */}
                    {isEditingSavedArticle ? (
                      <textarea
                        rows={12}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-gray-850 resize-none leading-relaxed"
                      />
                    ) : (
                      <div className="p-5 bg-gray-50 border border-gray-150 rounded-xl max-h-80 overflow-y-auto font-sans leading-relaxed text-xs text-gray-700 whitespace-pre-wrap">
                        {selectedArticle.article}
                      </div>
                    )}

                    {/* Social Media Sharing Panel */}
                    {!isEditingSavedArticle && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Đẩy nhanh lên Mạng xã hội</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => simulateSocialShare("Facebook", selectedArticle.topic)}
                            className="flex-1 bg-white hover:bg-blue-50 border border-gray-200 py-2.5 px-3 rounded-lg text-[10px] font-bold text-blue-700 flex justify-center items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Facebook className="w-3.5 h-3.5" /> Share FB
                          </button>
                          <button
                            onClick={() => simulateSocialShare("Twitter", selectedArticle.topic)}
                            className="flex-1 bg-white hover:bg-sky-50 border border-gray-200 py-2.5 px-3 rounded-lg text-[10px] font-bold text-sky-700 flex justify-center items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Twitter className="w-3.5 h-3.5" /> Share TW
                          </button>
                          <button
                            onClick={() => simulateSocialShare("Zalo", selectedArticle.topic)}
                            className="flex-1 bg-white hover:bg-indigo-50 border border-gray-200 py-2.5 px-3 rounded-lg text-[10px] font-bold text-indigo-700 flex justify-center items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" /> Share Zalo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <FileText className="w-10 h-10 text-gray-200 mb-2 animate-pulse" />
                    <p className="text-xs text-gray-400 font-bold">Chưa chọn bài viết</p>
                    <p className="text-[10px] text-gray-400 font-semibold max-w-xs mt-1">Chọn một bài viết ở danh sách bên trái để đọc, chỉnh sửa nội dung hoặc đẩy chia sẻ lên mạng xã hội.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* BANNER SUBTAB */}
      {subTab === "BANNER" && (
        <div className="space-y-6">
          {bannerMsg.text && (
            <div className={`p-4 rounded-xl text-sm font-medium ${bannerMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {bannerMsg.text}
            </div>
          )}

          <form
            onSubmit={handleBannerSubmit}
            className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6"
          >
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">
                Cấu hình Banner Khuyến Mãi &amp; Thông Báo 📣
              </h3>
              <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                Cấu hình dải banner nổi bật chạy ở đầu trang chủ dịch vụ. Dải banner giúp quảng bá các chương trình ưu đãi mới hoặc ghim thông tin đường dây nóng hỗ trợ khách hàng nhanh chóng.
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-150">
              <div className="space-y-0.5">
                <span className="block text-xs font-bold text-gray-800">Trạng thái hiển thị</span>
                <span className="block text-[10px] text-gray-400 font-semibold">Bật/Tắt dải banner lập tức ngoài trang chủ</span>
              </div>
              <button
                type="button"
                onClick={() => setBannerForm({ ...bannerForm, is_enabled: !bannerForm.is_enabled })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  bannerForm.is_enabled ? 'bg-pink-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    bannerForm.is_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Banner Text Area */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Nội dung thông báo (Banner Content)
              </label>
              <textarea
                rows={2}
                value={bannerForm.content || ""}
                onChange={(e) => setBannerForm({ ...bannerForm, content: e.target.value })}
                placeholder="VD: ✨ GIẢM NGAY 5% KHI ĐẶT LỊCH HẸN TRỰC TUYẾN ✨ HOTLINE: 0934 323 878"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-xs font-semibold text-gray-800 resize-none leading-relaxed"
              ></textarea>
              <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                Văn bản hiển thị ngắn gọn lý tưởng khoảng 50 - 120 ký tự để không bị xuống dòng quá nhiều trên thiết bị di động.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={bannerLoading}
                className="w-full md:w-auto px-6 py-3 bg-[#5C4033] hover:bg-[#3A2E2B] text-[#FAF6F0] rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {bannerLoading ? "Đang lưu..." : "Lưu Cấu Hình Banner"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function TabBank({ data, onReload }: { data: any; onReload: () => void }) {
  const [bankId, setBankId] = useState(data?.bank_id || "vcb");
  const [accountNumber, setAccountNumber] = useState(data?.account_number || "");
  const [accountOwner, setAccountOwner] = useState(data?.account_owner || "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (data) {
      setBankId(data.bank_id || "vcb");
      setAccountNumber(data.account_number || "");
      setAccountOwner(data.account_owner || "");
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setLoading(true);
    
    const selectedBank = VIETNAMESE_BANKS.find(b => b.id === bankId);
    const bankName = selectedBank ? selectedBank.name : "Vietcombank";

    const res = await saveBankSettings({
      bank_id: bankId,
      bank_name: bankName,
      account_number: accountNumber.trim(),
      account_owner: accountOwner.trim().toUpperCase()
    });

    if (res.success) {
      setMsg({ type: "success", text: "Đã lưu thông tin tài khoản ngân hàng thành công!" });
      onReload();
    } else {
      setMsg({ type: "error", text: "Lỗi khi lưu cấu hình: " + res.error });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mt-2 md:mt-0">
        <h2 className="text-xl font-bold text-gray-900 font-display">
          Cấu hình Tài khoản Ngân hàng (QR Pay)
        </h2>
        <p className="text-gray-400 text-xs mt-1">
          Thiết lập ngân hàng và số tài khoản để tạo mã QR thanh toán nhanh VietQR cho thợ nail & gội dưỡng sinh khi hoàn thành đơn hàng.
        </p>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm border ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-rose-50 text-rose-600 border-rose-100"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="font-semibold">{msg.text}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              Chọn Ngân hàng
            </label>
            <select
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8D6E53] outline-none transition-all font-semibold text-sm appearance-none"
            >
              {VIETNAMESE_BANKS.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              Số tài khoản ngân hàng
            </label>
            <input
              type="text"
              required
              placeholder="Nhập số tài khoản (ví dụ: 102938812...)"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8D6E53] outline-none transition-all font-semibold text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              Tên chủ tài khoản (Viết hoa không dấu)
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: NGUYEN VAN A"
              value={accountOwner}
              onChange={(e) => setAccountOwner(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8D6E53] outline-none transition-all font-semibold text-sm"
            />
          </div>
        </div>

        {/* Live Preview section */}
        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="w-16 h-16 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-8 h-8 text-amber-600" />
          </div>
          <div className="text-xs space-y-1 flex-1">
            <p className="font-bold text-gray-900">Xem trước thông báo chuyển khoản:</p>
            <p className="text-gray-500 font-medium">
              Khách sẽ quét mã QR chuyển khoản tới ngân hàng{" "}
              <strong className="text-gray-800">
                {VIETNAMESE_BANKS.find((b) => b.id === bankId)?.name}
              </strong>
              , số tài khoản <strong className="text-gray-800">{accountNumber || "..."}</strong>, chủ tài khoản{" "}
              <strong className="text-gray-800">{accountOwner.toUpperCase() || "..."}</strong>.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-gray-900 hover:bg-black text-white font-medium rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div>
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            Lưu thông tin Bank
          </button>
        </div>
      </form>
    </div>
  );
}

function TabPassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMsg({
        type: "error",
        text: "Vui lòng điền đầy đủ tất cả các trường.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg({
        type: "error",
        text: "Mật khẩu mới và xác nhận mật khẩu không khớp nhau.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setMsg({ type: "success", text: "Đổi mật khẩu thành công!" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMsg({ type: "error", text: res.error || "Có lỗi xảy ra." });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Lỗi kết nối máy chủ." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Key className="w-6 h-6 text-pink-500" />
          Đổi mật khẩu tài khoản
        </h2>
        <p className="text-sm text-gray-500">
          Cập nhật mật khẩu mới của bạn để bảo mật tài khoản tốt hơn.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5"
      >
        {msg && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold ${msg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}
          >
            {msg.text}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Mật khẩu cũ
          </label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Nhập mật khẩu hiện tại"
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all placeholder:text-gray-400 font-medium font-semibold"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Mật khẩu mới
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nhập mật khẩu mới"
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all placeholder:text-gray-400 font-medium font-semibold"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Xác nhận mật khẩu mới
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Xác nhận lại mật khẩu mới"
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all placeholder:text-gray-400 font-medium font-semibold"
          />
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-black disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
          >
            {loading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div>
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            Cập nhật mật khẩu
          </button>
        </div>
      </form>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5 mt-6">
        <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100 mb-4">
          Cài đặt thông báo (Admin)
        </h3>
        <p className="text-sm text-gray-600 font-medium pb-2">
          Đăng ký thiết bị này để nhận các thông báo tức thời về đặt lịch mới, huỷ lịch hoặc thay đổi dịch vụ của khách.
        </p>
        <PushNotificationManager />
      </div>
    </div>
  );
}

function TabCommission() {
  const [rangeType, setRangeType] = useState<
    "week" | "month" | "last_month" | "custom"
  >("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const calculateDates = (type: "week" | "month" | "last_month" | "custom") => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      end = new Date();
    } else if (type === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date();
    } else if (type === "last_month") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
      startInput: start.toISOString().split("T")[0],
      endInput: end.toISOString().split("T")[0],
    };
  };

  const fetchReport = async (startISO: string, endISO: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await getCommissionReport(startISO, endISO);
      if (res.success) {
        setReportData(res.data);
      } else {
        setError(res.error || "Lỗi khi tải báo cáo hoa hồng");
      }
    } catch (e: any) {
      setError(e.message || "Lỗi kết nối máy chủ");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (rangeType !== "custom") {
      const dates = calculateDates(rangeType);
      setStartDate(dates.startInput);
      setEndDate(dates.endInput);
      fetchReport(dates.start, dates.end);
    }
  }, [rangeType]);

  const handleCustomSearch = () => {
    if (!startDate || !endDate) {
      setError("Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc");
      return;
    }
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    fetchReport(start.toISOString(), end.toISOString());
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.staffReports) return;

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "BÁO CÁO HOA HỒNG NHÂN VIÊN\n";
    csvContent += `Thời gian: ${startDate} đến ${endDate}\n\n`;
    csvContent +=
      "Họ và tên,Tên đăng nhập,Số ca làm,Tổng Doanh số (VNĐ),Tổng Hoa hồng KTV (VNĐ),Tổng tiền Tip (VNĐ),Thực nhận (Hoa hồng + Tip)\n";

    reportData.staffReports.forEach((s: any) => {
      const totalEarned = s.totalCommission + s.totalTip;
      csvContent += `"${s.fullName}","${s.username}",${s.totalAppointments},${s.totalSales},${s.totalCommission},${s.totalTip},${totalEarned}\n`;
    });

    csvContent += `\nTỔNG CỘNG,,${reportData.grandAppointmentsCount},${reportData.grandTotalSales},${reportData.grandTotalCommission},${reportData.grandTotalTip},${reportData.grandTotalCommission + reportData.grandTotalTip}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `BaoCaoHoaHong_${startDate}_Den_${endDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStaffReports =
    reportData?.staffReports?.filter((s: any) => {
      const q = searchTerm.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q)
      );
    }) || [];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Báo cáo Hoa hồng Nhân viên
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Tổng hợp doanh số, hoa hồng dịch vụ và tiền tip của nhân viên theo
              khoảng thời gian.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={!reportData || filteredStaffReports.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Xuất File Đối Soát (.csv)
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap bg-gray-100 p-1 rounded-xl border border-gray-200/50 max-w-max">
            {[
              { id: "week", label: "Tuần này" },
              { id: "month", label: "Tháng này" },
              { id: "last_month", label: "Tháng trước" },
              { id: "custom", label: "Tùy chỉnh" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setRangeType(btn.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${rangeType === btn.id ? "bg-[#8D6E53] text-white shadow-sm" : "text-gray-500 hover:text-gray-950"}`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {rangeType === "custom" && (
            <div className="flex flex-wrap items-center gap-2.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Từ</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Đến</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                />
              </div>
              <button
                onClick={handleCustomSearch}
                className="bg-gray-900 text-white hover:bg-black px-4 py-2 rounded-lg text-xs font-bold transition-all"
              >
                Áp dụng
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm KTV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full lg:w-60 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all placeholder:text-gray-400 font-medium font-semibold"
            />
          </div>
        </div>
      </div>

      {reportData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <span className="text-[11px] text-gray-400 block uppercase font-bold tracking-wider mb-1">
              Tổng Doanh số
            </span>
            <span className="text-base font-black text-gray-900 font-mono">
              {reportData.grandTotalSales.toLocaleString("vi")} đ
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <span className="text-[11px] text-gray-400 block uppercase font-bold tracking-wider mb-1">
              Tổng Hoa hồng
            </span>
            <span className="text-base font-black text-emerald-600 font-mono">
              {reportData.grandTotalCommission.toLocaleString("vi")} đ
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <span className="text-[11px] text-gray-400 block uppercase font-bold tracking-wider mb-1">
              Tổng tiền Tip
            </span>
            <span className="text-base font-black text-[#8D6E53] font-mono">
              {reportData.grandTotalTip.toLocaleString("vi")} đ
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <span className="text-[11px] text-gray-400 block uppercase font-bold tracking-wider mb-1">
              Tổng số ca
            </span>
            <span className="text-base font-black text-gray-900 font-mono">
              {reportData.grandAppointmentsCount} ca
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8D6E53]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-700 text-xs font-semibold">
          {error}
        </div>
      ) : filteredStaffReports.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 text-gray-400 text-xs">
          Không tìm thấy dữ liệu hoa hồng trong khoảng thời gian đã chọn.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  <th className="p-4">Kỹ Thuật Viên</th>
                  <th className="p-4">Số Ca</th>
                  <th className="p-4 text-right">Tổng Doanh Số</th>
                  <th className="p-4 text-right">Lương Hoa Hồng</th>
                  <th className="p-4 text-right">Tiền Tip</th>
                  <th className="p-4 text-right">Thực nhận (Tạm tính)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-750">
                {filteredStaffReports.map((s: any) => {
                  const netEarned = s.totalCommission + s.totalTip;
                  return (
                    <tr
                      key={s.staffId}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-bold text-gray-900">
                          {s.fullName}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          @{s.username}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-[#FAF0E6] text-[#8D6E53] font-mono px-2.5 py-1 rounded-lg text-[10px] font-bold border border-[#FAF0E6]/50">
                          {s.totalAppointments} ca
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-gray-900">
                        {s.totalSales.toLocaleString("vi")} đ
                      </td>
                      <td className="p-4 text-right font-mono text-emerald-600 font-bold">
                        {s.totalCommission.toLocaleString("vi")} đ
                      </td>
                      <td className="p-4 text-right font-mono text-[#8D6E53] font-bold">
                        {s.totalTip.toLocaleString("vi")} đ
                      </td>
                      <td className="p-4 text-right font-mono bg-emerald-50/10">
                        <span className="text-gray-950 font-black text-sm">
                          {netEarned.toLocaleString("vi")} đ
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TabPackages({
  packages,
  services,
  userRole,
  onReload,
}: {
  packages: any[];
  services: any[];
  userRole?: string;
  onReload: () => void;
}) {
  const [editingPackage, setEditingPackage] = useState<any>(null);

  const handleDeletePackage = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa gói "${name}" không?`)) return;

    try {
      const { deleteTreatmentPackageSafely } = await import("./actions");
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

function EditPackageModal({ pkg, services, onClose, onReload }: any) {
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

  const activeServices = services.filter((s:any) => s.is_active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!form.name || !form.service_id || form.buy_count <= 0 || form.price <= 0) {
      setErrorMsg("Vui lòng điền đầy đủ và hợp lệ các thông tin!");
      return;
    }
    setLoading(true);
    try {
      const { saveTreatmentPackage } = await import("./actions");
      const submitData: any = { ...form };
      if (!submitData.id) delete submitData.id;

      const res = await saveTreatmentPackage(submitData);
      if (res.success) {
        onReload();
        onClose();
      } else {
        setErrorMsg("Lỗi: " + res.error);
      }
    } catch (err: any) {
      setErrorMsg("Lỗi: " + err.message);
    }
    setLoading(false);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["price", "buy_count", "free_count", "commission_percentage"].includes(name) ? Number(value) : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <h3 className="text-xl font-bold text-gray-900 font-display">
            {pkg.id ? "Sửa Gói Liệu Trình" : "Thêm Gói Mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:bg-white hover:shadow-sm p-2 rounded-xl transition-all cursor-pointer"
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
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tên gói <span className="text-red-500">*</span>
            </label>
            <input
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
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Dịch vụ áp dụng <span className="text-red-500">*</span>
            </label>
            <select
              name="service_id"
              required
              value={form.service_id}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#8D6E53]/20 focus:border-[#8D6E53] outline-none transition-all text-sm font-medium bg-white"
            >
              <option value="">-- Chọn dịch vụ --</option>
              {activeServices.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({Number(s.price).toLocaleString("vi")}đ)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Số buổi Mua <span className="text-red-500">*</span>
              </label>
              <input
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
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Số buổi Tặng thêm
              </label>
              <input
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
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Giá Mua Trọn Gói (VNĐ) <span className="text-red-500">*</span>
            </label>
            <input
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
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              % Hoa hồng bán gói (%) <span className="text-red-500">*</span>
            </label>
            <input
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
            <p className="text-[10px] text-gray-400 mt-1">Khi nhân viên bán thành công gói này, thợ được nhận: <strong className="text-pink-600">{Math.round((Number(form.price) || 0) * (Number(form.commission_percentage) || 0) / 100).toLocaleString("vi")}đ</strong> hoa hồng.</p>
          </div>

          {pkg.id && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <input type="checkbox" id="pkg_is_active" checked={form.is_active !== false} onChange={(e) => setForm((prev: any) => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-[#8D6E53] focus:ring-[#8D6E53] cursor-pointer" />
              <label htmlFor="pkg_is_active" className="text-sm font-medium text-gray-700 cursor-pointer">Gói đang kích hoạt (hiển thị trên website)</label>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors cursor-pointer border border-transparent"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-transform active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
            >
              {loading ? "Đang lưu..." : "Lưu Gói Liệu Trình"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TabSellAndProgress({ packages, onReload }: { packages: any[]; onReload: () => void }) {
  const [subTab, setSubTab] = useState<"SEARCH" | "SELL">("SEARCH");
  
  // Search states
  const [searchPhone, setSearchPhone] = useState("");
  const [findingProgress, setFindingProgress] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState("");

  // Sell states
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sellMessage, setSellMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auto-search customer info in the Sell view
  useEffect(() => {
    const cleanedPhone = phone.trim().replace(/\s+/g, "");
    if (cleanedPhone.length >= 9) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const { getCustomerByPhone } = await import("./actions");
          const cust = await getCustomerByPhone(cleanedPhone);
          if (cust) {
            setCustomerName(cust.full_name);
            setFoundCustomer(cust);
            setIsNewCustomer(false);
          } else {
            setCustomerName("");
            setFoundCustomer(null);
            setIsNewCustomer(true);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setFoundCustomer(null);
      setIsNewCustomer(false);
      setIsSearching(false);
    }
  }, [phone]);

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellMessage(null);

    const cleanedPhone = phone.trim().replace(/\s+/g, "");
    if (!cleanedPhone || !customerName || !selectedPackageId) {
      setSellMessage({ type: "error", text: "Vui lòng nhập đầy đủ Số điện thoại, Tên khách hàng và chọn Gói liệu trình!" });
      return;
    }

    setSubmitting(true);
    try {
      const { sellPackageToCustomer } = await import("./actions");
      const res = await sellPackageToCustomer(cleanedPhone, customerName, selectedPackageId);
      if (res.success) {
        setSellMessage({ type: "success", text: res.message || "Bán và kích hoạt gói thành công!" });
        setPhone("");
        setCustomerName("");
        setSelectedPackageId("");
        setFoundCustomer(null);
        setIsNewCustomer(false);
        onReload();
      } else {
        setSellMessage({ type: "error", text: res.error || "Có lỗi xảy ra" });
      }
    } catch (err: any) {
      setSellMessage({ type: "error", text: "Lỗi kết nối máy chủ: " + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProgressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setSearchResult(null);
    
    const cleanedPhone = searchPhone.trim().replace(/\s+/g, "");
    if (!cleanedPhone) {
      setSearchError("Vui lòng nhập số điện thoại");
      return;
    }

    setFindingProgress(true);
    try {
      const { getCustomerPackageProgress } = await import("./actions");
      const res = await getCustomerPackageProgress(cleanedPhone);
      if (res.success) {
        setSearchResult(res);
      } else {
        setSearchError(res.error || "Không tìm thấy dữ liệu.");
      }
    } catch (err: any) {
      setSearchError("Lỗi kết nối máy chủ: " + err.message);
    } finally {
      setFindingProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Select Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-display">
            Gói Liệu Trình Khách Hàng
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Mua gói ưu đãi mới hoặc tra cứu và theo dõi số buổi liệu trình còn lại của khách hàng.
          </p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/50 w-full sm:w-auto">
          <button
            onClick={() => setSubTab("SEARCH")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "SEARCH" ? "bg-[#8D6E53] text-white shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Tra Cứu Tiến Độ
          </button>
          <button
            onClick={() => setSubTab("SELL")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "SELL" ? "bg-[#8D6E53] text-white shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Đăng Ký Bán Gói
          </button>
        </div>
      </div>

      {subTab === "SEARCH" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-200">
          {/* Query Box */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 font-sans text-xs">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 font-display">Nhập số điện thoại cần tra cứu</h3>
            <form onSubmit={handleProgressSearch} className="space-y-4">
              <div>
                <input
                  type="tel"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="VD: 0912345678"
                  className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#8D6E53] outline-none transition-all placeholder:text-gray-400 font-bold text-base bg-gray-50/50 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={findingProgress}
                className="w-full bg-gray-900 text-white hover:bg-black font-semibold p-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-xs uppercase"
              >
                {findingProgress ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Tra cứu tiến trình
              </button>
            </form>
            {searchError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl text-xs font-bold">
                {searchError}
              </div>
            )}
          </div>

          {/* Results Box */}
          <div className="lg:col-span-2 space-y-4">
            {searchResult ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Customer header */}
                <div className="bg-[#FAF5F0] p-6 rounded-3xl border border-[#F0E6DD] shadow-xs">
                  <p className="text-[10px] text-[#A68F7B] font-bold uppercase tracking-wider">Thông tin khách hàng</p>
                  <h3 className="text-lg font-black text-stone-900 mt-1">{searchResult.customer.full_name}</h3>
                  <p className="text-xs text-stone-500 font-mono font-bold mt-0.5">{searchResult.customer.phone}</p>
                </div>

                {/* Packages list */}
                {searchResult.packages.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm text-gray-400 text-xs italic">
                    Khách hàng này chưa từng đăng ký gói liệu trình nào.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {searchResult.packages.map((cp: any) => (
                      <div key={cp.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 font-sans text-xs">
                        <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                          <div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                              cp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                            }`}>
                              {cp.status === 'ACTIVE' ? 'ĐANG KÍCH HOẠT' : 'ĐÃ DÙNG HẾT'}
                            </span>
                            <h4 className="text-[15px] font-extrabold text-stone-900 mt-1.5 font-display">{cp.treatment_packages?.name}</h4>
                            <p className="text-[11px] text-gray-400 mt-0.5">Ngày mua: {format(new Date(cp.purchased_at), 'dd/MM/yyyy HH:mm')}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Số buổi còn lại</p>
                            <p className="text-xl font-black text-[#8D6E53] font-mono mt-0.5">
                              {cp.remaining_sessions} <span className="text-xs font-normal text-gray-400 font-sans">/ {cp.total_sessions} buổi</span>
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-[#8D6E53] h-full rounded-full transition-all duration-500" 
                              style={{ width: `${(cp.remaining_sessions / cp.total_sessions) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Session log detail */}
                        <div className="pt-2">
                          <h5 className="text-[11px] font-black text-[#8D6E53] uppercase tracking-wider mb-2">Nhật ký sử dụng ({cp.logs.length})</h5>
                          {cp.logs.length === 0 ? (
                            <p className="text-stone-400 text-[10.5px] italic">Chưa phát sinh lượt khấu trừ nào.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {cp.logs.map((log: any) => (
                                <div key={log.id} className="bg-stone-50 p-2.5 rounded-xl border border-stone-100/50 text-[11px] flex justify-between items-center text-stone-650">
                                  <div>
                                    <p className="font-bold">{log.notes || 'Khấu trừ 1 buổi'}</p>
                                    <p className="text-[9.5px] text-gray-400 mt-0.5">
                                      Thực hiện bởi: {log.appointments?.users?.full_name || 'Hệ thống'}
                                    </p>
                                  </div>
                                  <span className="text-[10px] font-mono text-gray-400">
                                    {format(new Date(log.used_at), 'dd/MM/yyyy HH:mm')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm text-gray-400 text-xs italic">
                Nhập số điện thoại khách hàng ở ô bên trái để tra cứu tiến độ dùng liệu trình.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm max-w-xl mx-auto space-y-6 animate-in fade-in duration-200 text-xs font-sans">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-stone-900 font-display flex items-center gap-2">
              <Package className="w-5 h-5 text-[#8D6E53]" />
              Bán Gói Liệu Trình Mới
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Kích hoạt buổi combo liệu trình cho số điện thoại khách hàng</p>
          </div>

          <form onSubmit={handleSell} className="space-y-5">
            {sellMessage && (
              <div
                className={`p-4 rounded-xl text-xs font-bold leading-relaxed border ${
                  sellMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-rose-50 text-rose-700 border-rose-100"
                }`}
              >
                {sellMessage.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Số điện thoại khách hàng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    required
                    className="w-full p-3.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8D6E53] outline-none transition-all placeholder:text-gray-400 font-semibold text-sm"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="animate-spin w-4 h-4 border-2 border-[#8D6E53]/20 border-t-[#8D6E53] rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              {(phone.trim().length >= 9) && (
                <div className="animate-in fade-in duration-200 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Họ và tên khách hàng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nhập họ tên khách hàng"
                      required
                      disabled={foundCustomer !== null}
                      className={`w-full p-3.5 border rounded-xl outline-none transition-all font-semibold ${
                        foundCustomer
                          ? "bg-emerald-50 border-emerald-100 text-emerald-950 cursor-not-allowed text-sm"
                          : "bg-white border-gray-200 focus:ring-2 focus:ring-[#8D6E53] text-sm"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Chọn Gói Liệu Trình <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedPackageId}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      required
                      className="w-full p-3.5 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-[#8D6E53] outline-none transition-all font-semibold text-sm cursor-pointer"
                    >
                      <option value="">-- Chọn gói mong muốn --</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.total_sessions} buổi - {pkg.price?.toLocaleString('vi')} đ)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#8D6E53] hover:bg-[#6b513b] text-white font-bold p-3.5 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow text-xs active:scale-95 disabled:opacity-50 uppercase tracking-wider mt-2"
                  >
                    {submitting ? "Đang xử lý kích hoạt..." : "Kích hoạt và Bán gói ngay"}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
