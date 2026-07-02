"use client";

import { useState, useEffect, startTransition } from "react";
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
  Wallet,
  HelpCircle,
  BookOpen,
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
const TabPayroll = dynamic(() => import('./components/TabPayroll'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });
const TabFAQ = dynamic(() => import('./components/TabFAQ'), { loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /> });

type MenuItem = { id: string; label: string; icon: React.ComponentType<{ className?: string }>; isLink?: boolean };

const menuGroups: { groupLabel: string; items: MenuItem[] }[] = [
  {
    groupLabel: 'ĐIỀU HÀNH',
    items: [
      { id: "DASHBOARD", label: "Tổng quan", icon: BarChart },
      { id: "SCHEDULE", label: "Lịch Tổng", icon: CalendarCheck, isLink: true },
      { id: "ORDERS", label: "Đơn hàng", icon: CheckCircle2, isLink: true },
      { id: "CUSTOMERS", label: "Khách hàng (CRM)", icon: User, isLink: true },
      { id: "SELL_PACKAGE", label: "Bán Gói & Tiến Độ", icon: Package },
    ],
  },
  {
    groupLabel: 'NHÂN SỰ',
    items: [
      { id: "STAFF", label: "Nhân sự", icon: Users },
      { id: "TASKS", label: "Công việc", icon: ListTodo },
      { id: "ATTENDANCE", label: "Điểm danh", icon: CalendarDays },
    ],
  },
  {
    groupLabel: 'DỊCH VỤ',
    items: [
      { id: "SERVICES", label: "Dịch vụ", icon: Settings },
      { id: "PACKAGES", label: "Gói Liệu Trình", icon: Package },
    ],
  },
  {
    groupLabel: 'TÀI CHÍNH',
    items: [
      { id: "REPORTS", label: "Báo cáo nâng cao", icon: BarChart },
      { id: "COMMISSION", label: "Báo cáo Hoa hồng", icon: FileText },
      { id: "CASH_REGISTER", label: "Sổ quỹ", icon: DollarSign },
      { id: "PAYROLL", label: "Bảng lương", icon: Wallet },
    ],
  },
  {
    groupLabel: 'CẤU HÌNH',
    items: [
      { id: "FAQS", label: "FAQ", icon: HelpCircle },
      { id: "REVIEWS", label: "Đánh giá", icon: Star },
      { id: "SEO", label: "Cấu hình SEO", icon: Globe },
      { id: "SEO_ARTICLES", label: "Bài viết SEO", icon: BookOpen, isLink: true },
      { id: "BANK", label: "Tài khoản Bank", icon: CreditCard },
      { id: "AUDIT_LOGS", label: "Nhật ký hệ thống", icon: ShieldAlert, isLink: true },
      { id: "SETTINGS", label: "Cấu hình hệ thống", icon: Activity },
      { id: "PASSWORD", label: "Đổi mật khẩu", icon: Key },
    ],
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [configCollapsed, setConfigCollapsed] = useState(true);

  // Data states
  const [userRole, setUserRole] = useState<string>('');
  const [staffs, setStaffs] = useState<any[]>([]);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [seoSettings, setSeoSettings] = useState<any>(null);
  const [bankSettings, setBankSettings] = useState<any>(null);

  const allTabIds = menuGroups.flatMap(g => g.items.map(i => i.id));

  const loadData = async (tab: string, _additionalParams?: any) => {
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
      if (tabParam && allTabIds.includes(tabParam)) {
        startTransition(() => {
          setActiveTab(tabParam);
        });
      }
    }
  }, [allTabIds]);

  useEffect(() => {
    getAdminSessionInfo().then((u) => {
      if (u) startTransition(() => { setUserRole(u.role); });
    });
  }, []);

  useEffect(() => {
    startTransition(() => {
      loadData(activeTab);
    });
  }, [activeTab]);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  const handleNavClick = (item: MenuItem, closeDrawer?: () => void) => {
    if (closeDrawer) closeDrawer();
    if (item.isLink) {
      router.push(`/admin/${item.id.toLowerCase()}`);
    } else {
      setActiveTab(item.id);
    }
  };

  const renderMenuItem = (item: MenuItem, variant: 'drawer' | 'sidebar', onClick: () => void) => {
    const isActive = activeTab === item.id;
    if (variant === 'drawer') {
      return (
        <button key={item.id} onClick={onClick}
          className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            isActive ? "bg-[#8D6E53] text-white shadow-lg" : "hover:bg-gray-900 text-gray-400 hover:text-white"
          }`}
        >
          <item.icon className="w-5 h-5 shrink-0" />
          <span>{item.label}</span>
        </button>
      );
    }
    return (
      <button key={item.id} onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap cursor-pointer ${
          isActive ? "bg-[#8D6E53] text-white shadow-md" : "hover:bg-gray-800 hover:text-white"
        }`}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        <span>{item.label}</span>
      </button>
    );
  };

  const renderGroup = (group: typeof menuGroups[0], variant: 'drawer' | 'sidebar') => (
    <div key={group.groupLabel}>
      <div className={`${variant === 'drawer' ? 'text-[11px] tracking-[0.15em] text-gray-600 font-bold uppercase px-4 pt-4 pb-1.5' : 'text-[9px] tracking-[0.15em] text-gray-500 font-bold uppercase px-3 pt-3 pb-1'}`}>
        {group.groupLabel}
      </div>
      {group.items.map(item => renderMenuItem(item, variant, () => handleNavClick(item, variant === 'drawer' ? () => setIsDrawerOpen(false) : undefined)))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden h-16 bg-gray-900 text-white flex items-center justify-between px-6 shadow-md border-b border-gray-800 shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', minHeight: 'calc(4rem + env(safe-area-inset-top, 0px))' }}>
        <span className="font-display font-extrabold text-sm tracking-wider bg-[#8D6E53] text-white px-2 py-0.5 rounded-lg">
          MIN
        </span>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link href="/" aria-label="Về trang chủ" className="text-gray-400 hover:text-white p-1.5 rounded-lg">
            <Home className="w-5 h-5" />
          </Link>
          <button onClick={() => setIsDrawerOpen(true)} aria-label="Mở menu" className="text-gray-300 hover:text-white p-1.5 focus:outline-none cursor-pointer">
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            />
            <motion.div className="fixed top-0 right-0 h-dvh w-4/5 max-w-[300px] bg-gray-950 text-gray-300 z-[110] shadow-2xl p-6 flex flex-col md:hidden overflow-y-auto"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4 shrink-0">
                <span className="font-display font-black text-white text-base tracking-widest">ADMIN MENU</span>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-805 cursor-pointer" aria-label="Đóng menu">
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
                {userRole === 'MANAGER' && (
                  <button onClick={() => { setIsDrawerOpen(false); router.push('/staff'); }}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-sm bg-pink-600/10 text-pink-500 hover:bg-pink-600/20 mb-1 border border-pink-500/20 shrink-0"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Giao diện Thợ</span>
                  </button>
                )}
                {menuGroups.map(group => {
                  if (group.groupLabel === 'CẤU HÌNH') {
                    return (
                      <div key={group.groupLabel}>
                        <button onClick={() => setConfigCollapsed(!configCollapsed)}
                          className="flex items-center justify-between w-full text-[11px] tracking-[0.15em] text-gray-600 font-bold uppercase px-4 pt-4 pb-1.5 cursor-pointer hover:text-gray-400 transition-colors"
                        >
                          <span>{group.groupLabel}</span>
                          <span className={`transition-transform duration-200 ${configCollapsed ? '' : 'rotate-180'}`}>▾</span>
                        </button>
                        {!configCollapsed && group.items.map(item => renderMenuItem(item, 'drawer', () => handleNavClick(item, () => setIsDrawerOpen(false))))}
                      </div>
                    );
                  }
                  return renderGroup(group, 'drawer');
                })}
              </nav>
              <div className="border-t border-gray-800 pt-4 mt-4 shrink-0">
                <button onClick={() => { setIsDrawerOpen(false); handleLogout(); }}
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
          <Link href="/" aria-label="Về trang chủ" className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-800">
            <Home className="w-5 h-5" />
          </Link>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          {userRole === 'MANAGER' && (
            <button onClick={() => router.push('/staff')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-pink-600/10 text-pink-500 hover:bg-pink-600/20 mb-2 border border-pink-500/20 shadow-sm shadow-pink-900/10 transition-all shrink-0"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Giao diện Thợ</span>
            </button>
          )}
          {menuGroups.map(group => renderGroup(group, 'sidebar'))}
        </nav>
        <div className="p-4 shrink-0">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-gray-800 w-full transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-h-[100dvh] overflow-y-auto relative">
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
            {activeTab === "FAQS" && <TabFAQ />}
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
            {activeTab === "PAYROLL" && <TabPayroll />}
            {activeTab === "SETTINGS" && <TabSettings />}
          </motion.div>
        )}
      </main>
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} onMenuClick={() => setIsDrawerOpen(true)} />
    </div>
  );
}


