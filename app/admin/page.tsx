"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNavigation from "@/components/BottomNavigation";
import NotificationBell from "@/components/NotificationBell";
import {
  BarChart,
  Users,
  Settings,
  Star,
  LogOut,
  CalendarCheck,
  CalendarDays,
  FileText,
  CheckCircle2,
  Globe,
  Home,
  Key,
  Menu as MenuIcon,
  X as XIcon,
  CreditCard,
  ShieldAlert,
  Package,
  User,
  Activity,
  ListTodo,
  DollarSign,
} from "lucide-react";
import {
  getStaffs,
  getServices,
  getReviews,
  getSeoSettings,
  getBankSettings,
  getTreatmentPackages,
  getAdminSessionInfo,
} from "./actions";
import TodayMonitoringWidget from "./components/TodayMonitoringWidget";
import dynamic from 'next/dynamic';

const TabDashboard = dynamic(() => import('./components/TabDashboard'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });
const TabStaff = dynamic(() => import('./components/TabStaff'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });
const TabServices = dynamic(() => import('./components/TabServices'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });
const TabReviews = dynamic(() => import('./components/TabReviews'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });
const TabSEO = dynamic(() => import('./components/TabSEO'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });
const TabBank = dynamic(() => import('./components/TabBank'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });
const TabPassword = dynamic(() => import('./components/TabPassword'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });
const TabCommission = dynamic(() => import('./components/TabCommission'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });
const TabPackages = dynamic(() => import('./components/TabPackages'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });
const TabSellAndProgress = dynamic(() => import('./components/TabSellAndProgress'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });
const TabAttendance = dynamic(() => import('./components/TabAttendance'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });
const TabSettings = dynamic(() => import('./components/TabSettings'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });
const TabTasks = dynamic(() => import('./components/TabTasks'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });
const TabReports = dynamic(() => import('./components/TabReports'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });
const TabCashRegister = dynamic(() => import('./components/TabCashRegister'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });

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
    if (tab === "ATTENDANCE" || tab === "SETTINGS") return;
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
      if (tabParam && ["DASHBOARD", "STAFF", "SERVICES", "PACKAGES", "COMMISSION", "REVIEWS", "SEO", "BANK", "PASSWORD", "ATTENDANCE", "SETTINGS", "TASKS", "REPORTS", "CASH_REGISTER"].includes(tabParam)) {
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
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link
            href="/"
            aria-label="Về trang chủ"
            className="text-gray-400 hover:text-white p-1.5 rounded-lg"
          >
            <Home className="w-5 h-5" />
          </Link>
          <button
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Mở menu"
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
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            {/* Slide-out Drawer */}
            <motion.div
              className="fixed top-0 right-0 h-full w-4/5 max-w-[300px] bg-gray-950 text-gray-300 z-[110] shadow-2xl p-6 flex flex-col md:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
              <span className="font-display font-black text-white text-base tracking-widest">
                ADMIN MENU
              </span>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-805 cursor-pointer"
                aria-label="Đóng menu"
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
                { id: "REPORTS", label: "Báo cáo nâng cao", icon: BarChart },
                { id: "STAFF", label: "Nhân sự", icon: Users },
                { id: "SERVICES", label: "Dịch vụ", icon: Settings },
                { id: "PACKAGES", label: "Quản lý Gói Liệu Trình", icon: Package },
                {
                  id: "COMMISSION",
                  label: "Báo cáo Hoa hồng",
                  icon: FileText,
                },
                { id: "ATTENDANCE", label: "Điểm danh", icon: CalendarDays },
                { id: "REVIEWS", label: "Đánh giá", icon: Star },
                { id: "SEO", label: "Cấu hình SEO", icon: Globe },
                { id: "BANK", label: "Tài khoản Bank", icon: CreditCard },
                { id: "CASH_REGISTER", label: "Sổ quỹ", icon: DollarSign },
                { id: "AUDIT_LOGS", label: "Nhật ký hệ thống", icon: ShieldAlert },
                { id: "SETTINGS", label: "Cấu hình hệ thống", icon: Activity },
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
        <aside className="hidden md:flex w-64 bg-gray-900 text-gray-300 min-h-screen flex-col shrink-0 font-sans">
        <div className="h-16 flex items-center justify-between px-6 bg-black/20 text-white font-display font-bold text-lg">
          <span>ADMIN PORTAL</span>
          <Link
            href="/"
            aria-label="Về trang chủ"
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
            { id: "REPORTS", label: "Báo cáo nâng cao", icon: BarChart },
            { id: "STAFF", label: "Nhân sự", icon: Users },
            { id: "SERVICES", label: "Dịch vụ", icon: Settings },
            { id: "PACKAGES", label: "Quản lý Gói Liệu Trình", icon: Package },
              { id: "COMMISSION", label: "Báo cáo Hoa hồng", icon: FileText },
                { id: "TASKS", label: "Công việc", icon: ListTodo },
                { id: "ATTENDANCE", label: "Điểm danh", icon: CalendarDays },
            { id: "REVIEWS", label: "Đánh giá", icon: Star },
            { id: "SEO", label: "Cấu hình SEO", icon: Globe },
            { id: "BANK", label: "Tài khoản Bank", icon: CreditCard },
            { id: "CASH_REGISTER", label: "Sổ quỹ", icon: DollarSign },
            { id: "AUDIT_LOGS", label: "Nhật ký hệ thống", icon: ShieldAlert },
            { id: "SETTINGS", label: "Cấu hình hệ thống", icon: Activity },
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
      <main className="flex-1 p-4 md:p-8 max-h-[100vh] overflow-y-auto relative">
        <div className="hidden md:flex absolute top-4 right-4 z-20">
          <NotificationBell />
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8D6E53]"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
             className="animate-in fade-in duration-500 max-w-7xl xxl:max-w-[1500px] mx-auto"
          >
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
            {activeTab === "ATTENDANCE" && <TabAttendance />}
            {activeTab === "TASKS" && <TabTasks />}
            {activeTab === "REPORTS" && <TabReports />}
            {activeTab === "CASH_REGISTER" && <TabCashRegister />}
            {activeTab === "SETTINGS" && <TabSettings />}
          </motion.div>
        )}
      </main>
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}


