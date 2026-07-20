"use client";

import { useState, useEffect, useRef, startTransition } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { TIP_AMOUNTS } from "@/lib/constants";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { sendZalo } from "@/lib/notify";
import { logger } from "@/lib/logger";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  getStaffData,
  checkIn,
  getCustomerHistory,
  takeRandomAppointment,
  swapAppointment,
  updateAppointmentStatus,
  completeAppointment,
  updateTip,
} from "./actions";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  Navigation,
  RefreshCw,
  DollarSign,
  History,
  Info,
  LogOut,
  Activity,
  Home,
  Key,
  ShieldCheck,
  PlusCircle,
  Bell,
  Package,
  ListTodo,
  Menu,
  X,
} from "lucide-react";
import LoadingButton from "@/components/LoadingButton";
import LoadingOverlay from "@/components/LoadingOverlay";
const MasterSchedule = dynamic(() => import("@/components/MasterSchedule"), { ssr: false });
const NotificationBell = dynamic(() => import("@/components/NotificationBell"), { ssr: false });
const ReportsTab = dynamic(() => import("./components/ReportsTab"), { ssr: false });
const TabPassword = dynamic(() => import("./components/TabPassword"), { ssr: false });
const StaffTasksTab = dynamic(() => import("./components/StaffTasksTab"), { ssr: false });
const ManagementTab = dynamic(() => import("./components/ManagementTab"), { ssr: false });
import CheckoutModal from "@/components/staff/CheckoutModal";
import SwapModal from "@/components/staff/SwapModal";
import StaffBookingTab from "@/components/staff/StaffBookingTab";

export default function StaffDashboard() {
  const router = useRouter();
  const [todayDateStr] = useState(format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi }));
  const [activeTab, setActiveTab] = useState<
    "ATTENDANCE" | "SCHEDULE" | "MASTER" | "REPORTS" | "PASSWORD" | "MANAGEMENT" | "SELL_PACKAGE" | "BOOKING" | "TASKS"
  >("SCHEDULE");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // States to track new random appointments alerts
  const [newAppointmentIds, setNewAppointmentIds] = useState<string[]>([]);
  const [hasNewRandomAlert, setHasNewRandomAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const randomIdsRef = useRef<string[]>([]);

  // Real-time Staff Notification toasts and Check-in reminder status states
  const [staffToasts, setStaffToasts] = useState<{ id: string; type: "success" | "danger" | "info" | "warning"; message: string }[]>([]);
  const [showCheckInReminder, setShowCheckInReminder] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [overlayLoading, setOverlayLoading] = useState(false);
  const alertedTenMinutesRef = useRef<Record<string, boolean>>({});

  // Data state
  const [data, setData] = useState<any>(null);

  // Modals state
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    history: any[];
    customerName: string;
  }>({ isOpen: false, history: [], customerName: "" });
  const [completeModal, setCompleteModal] = useState<{
    isOpen: boolean;
    appt: any;
  }>({ isOpen: false, appt: null });
  const [swapModal, setSwapModal] = useState<{ isOpen: boolean; appt: any }>({
    isOpen: false,
    appt: null,
  });
  const [completedDetailModal, setCompletedDetailModal] = useState<{
    isOpen: boolean;
    appt: any;
  }>({ isOpen: false, appt: null });
  const [editTipModal, setEditTipModal] = useState<{
    isOpen: boolean;
    appt: any;
  }>({ isOpen: false, appt: null });

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const staffData = await getStaffData();
      setData(staffData);
    } catch (e) {
      console.error(e);
    }
    if (!silent) setIsLoading(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["ATTENDANCE", "SCHEDULE", "MASTER", "REPORTS", "PASSWORD", "MANAGEMENT", "SELL_PACKAGE", "BOOKING", "TASKS"].includes(tabParam)) {
        startTransition(() => {
          setActiveTab(tabParam as "ATTENDANCE" | "SCHEDULE" | "MASTER" | "REPORTS" | "PASSWORD" | "MANAGEMENT" | "SELL_PACKAGE" | "BOOKING" | "TASKS");
        });
      }
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      loadData();
    });
    
    // Auto-refresh every 5 minutes as fallback (Realtime handles instant updates)
    const intervalId = setInterval(() => {
      startTransition(() => {
        loadData(true);
      });
    }, 300000);
    
    return () => clearInterval(intervalId);
  }, [activeTab]);

  // Supabase Realtime subscription for appointments
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    if (!data?.staffId) return;

    const staffId = data.staffId;

    import('@/utils/supabase/client').then(async ({ createClient }) => {
      const supabase = createClient();
 
      const channel: any = supabase
        .channel('staff_appointments')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `staff_id=eq.${staffId}`,
          },
          () => {
            startTransition(() => {
              loadData(true);
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'appointments',
            filter: `status=in.(PENDING_RANDOM,CONFIRMED)`,
          },
          () => {
            startTransition(() => {
              loadData(true);
            });
          }
        );
 
      try {
        const { safeSubscribe } = await import('@/lib/realtime');
        await safeSubscribe(channel);
      } catch (e) {
        console.warn('[Realtime] staff page subscription failed:', e);
      }
 
      return () => {
        supabase.removeChannel(channel);
      };
    }).catch(e => logger.error('[Realtime] Failed to subscribe to staff appointments', e));
  }, [data?.staffId]);

  // Hook to detect newly placed random/unassigned appointments and alert staff
  useEffect(() => {
    if (data?.randomAppointments) {
      const currentIds = data.randomAppointments.map((appt: any) => appt.id);
      
      // On first load, we just register existing unassigned random appointments without blasting alerts
      if (randomIdsRef.current.length === 0) {
        randomIdsRef.current = currentIds;
      } else {
        const newIds = currentIds.filter((id: string) => !randomIdsRef.current.includes(id));
        if (newIds.length > 0) {
          // Play a beautiful synthetic audio cue to catch their attention, inside a safe try-catch
          try {
            if (typeof window !== "undefined" && "AudioContext" in window) {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              
              // Custom sequence of chime sounds
              const playTone = (frequency: number, startTime: number, duration: number) => {
                const osc = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                osc.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                osc.type = "sine";
                osc.frequency.setValueAtTime(frequency, startTime);
                
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
                
                osc.start(startTime);
                osc.stop(startTime + duration);
              };

              const now = audioCtx.currentTime;
              playTone(523.25, now, 0.4);      // C5
              playTone(659.25, now + 0.15, 0.5); // E5
              playTone(783.99, now + 0.3, 0.6);  // G5
            }
          } catch (e) {
            console.warn("Audio alert playback deferred or restricted by browser settings", e);
          }

          // Trigger toast alert and glowing states
          startTransition(() => {
            setNewAppointmentIds((prev) => [...prev, ...newIds]);
            setHasNewRandomAlert(true);
          });
          
          const newAppts = data.randomAppointments.filter((appt: any) => newIds.includes(appt.id));
          const clientNames = newAppts.map((appt: any) => appt.customers?.full_name || "Khách hàng mới").join(", ");
          startTransition(() => {
            setAlertMessage(`Có lịch đặt Random mới từ: ${clientNames}. Vui lòng kiểm tra nhận ca!`);
          });
          
          // Clear toast automatically after 15 seconds
          const timer = setTimeout(() => {
            startTransition(() => {
              setHasNewRandomAlert(false);
            });
          }, 15000);
          
          randomIdsRef.current = currentIds;
          return () => clearTimeout(timer);
        } else {
          // If a random appointment gets claimed or cancelled, remove it from the highlighted state immediately
          startTransition(() => {
            setNewAppointmentIds((prev) => prev.filter((id) => currentIds.includes(id)));
          });
          randomIdsRef.current = currentIds;
        }
      }
    }
  }, [data?.randomAppointments]);

  const triggerStaffToast = (type: "success" | "danger" | "info" | "warning", message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setStaffToasts((prev) => [...prev, { id, type, message }]);
    
    // Play chemical synthetic staff custom sound chime
    try {
      if (typeof window !== "undefined" && "AudioContext" in window) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(type === 'success' ? 659.25 : 523.25, now);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.08, now + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch (e) {
      console.warn("Visual toast triggers but audio playback deferred by browser context.", e);
    }

    setTimeout(() => {
      setStaffToasts((prev) => prev.filter((t) => t.id !== id));
    }, 10000);
  };

  // Check attendance status to flag checkin reminder past 09:00 AM
  useEffect(() => {
    if (data) {
      const isCheckedIn = !!data.attendance;
      const now = new Date();
      const hours = now.getHours();
      
      // Post 09:00 AM flag check-in warning
      startTransition(() => {
        if (!isCheckedIn && hours >= 9) {
          setShowCheckInReminder(true);
        } else {
          setShowCheckInReminder(false);
        }
      });
    }
  }, [data]);

  // Alert thợ with pre-appointment notice 10 minutes before their scheduled services
  useEffect(() => {
    if (data?.myAppointments) {
      const now = Date.now();
      startTransition(() => {
        data.myAppointments.forEach((appt: any) => {
          if (appt.status === 'CONFIRMED' && !alertedTenMinutesRef.current[appt.id]) {
            const startTime = new Date(appt.start_time).getTime();
            const diffMinutes = (startTime - now) / (1000 * 60);

            // If the appointment starts within 0 to 11 minutes
            if (diffMinutes > 0 && diffMinutes <= 11) {
              triggerStaffToast(
                'warning',
                `⏰ Bạn có ca phục vụ khách hàng [${appt.customers?.full_name || 'Khách lẻ'}] sau 10 phút nữa (${format(new Date(appt.start_time), 'HH:mm')}). Chuẩn bị dụng cụ nhé!`
              );
              alertedTenMinutesRef.current[appt.id] = true;
            }
          }
        });
      });
    }
  }, [data?.myAppointments]);

  const handleCheckIn = async () => {
    setOverlayLoading(true);
    setCheckInLoading(true);

    // Optimistic Update: Immediately set attendance state
    setData((prev: any) => ({
      ...prev,
      attendance: { check_in_time: new Date().toISOString() }
    }));

    try {
      await checkIn();
      toast.success('Điểm danh thành công!');
    } catch (err: unknown) {
      toast.error('Lỗi điểm danh: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'));
      // Rollback: reset attendance to null if it failed
      setData((prev: any) => ({ ...prev, attendance: null }));
    } finally {
      await loadData();
      setCheckInLoading(false);
      setOverlayLoading(false);
    }
  };

  const handleShowHistory = async (customer: any) => {
    const history = await getCustomerHistory(customer.id);
    setHistoryModal({
      isOpen: true,
      history,
      customerName: customer.full_name,
    });
  };

  const handleAction = async (action: () => Promise<any>) => {
    setIsLoading(true);
    await action();
    await loadData();
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-x-hidden">
      {/* Floating sliding toast notification for new random appointments */}
      {hasNewRandomAlert && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-white border-2 border-pink-500 shadow-2xl rounded-2xl p-4 animate-[bounce_1s_1] flex items-start gap-3 border-l-[8px] border-l-pink-600 transition-all duration-300">
          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 shrink-0 select-none animate-pulse relative">
            <Bell className="w-5 h-5 text-pink-600 animate-[bounce_1s_infinite]" />
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              📢 Đơn hàng mới!
            </h4>
            <p className="text-xs text-gray-600 mt-1 font-medium leading-relaxed">
              {alertMessage}
            </p>
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={() => {
                  setHasNewRandomAlert(false);
                  setNewAppointmentIds([]); // clear visual blinking
                }}
                className="text-[11px] font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-2.5 py-2.5 rounded-lg transition-colors cursor-pointer min-h-[44px] flex items-center"
              >
                Bỏ qua
              </button>
              <button
                onClick={() => {
                  // Scroll to random appointments section or focus tab
                  setActiveTab("SCHEDULE");
                  const randomSection = document.getElementById("random-appointments-section");
                  if (randomSection) {
                    randomSection.scrollIntoView({ behavior: "smooth" });
                  }
                  setHasNewRandomAlert(false);
                }}
                className="text-[11px] font-bold text-white bg-pink-600 hover:bg-pink-700 px-3.5 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer min-h-[44px] flex items-center"
              >
                Xem ngay ⚡
              </button>
            </div>
          </div>
          <button 
            onClick={() => setHasNewRandomAlert(false)}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none font-bold cursor-pointer shrink-0"
          >
            ×
          </button>
        </div>
      )}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm shrink-0">
         <div className="max-w-7xl xxl:max-w-[1500px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
              NV
            </div>
            <span className="font-display font-semibold text-gray-900">
              Staff Portal
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              title="Xem trang chủ"
              className="text-gray-500 hover:text-gray-950 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
            >
              <Home className="w-5 h-5" />
            </a>
            <button
              onClick={() => setActiveTab("PASSWORD")}
              title="Đổi mật khẩu"
              className={`hidden md:block text-gray-500 hover:text-gray-950 transition-colors p-1.5 rounded-lg hover:bg-gray-150 ${activeTab === "PASSWORD" ? "text-pink-600 bg-pink-50" : ""}`}
            >
              <Key className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="hidden md:block text-gray-500 hover:text-red-500 transition-colors p-1.5"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
            {/* Mobile only Hamburger Menu */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden text-gray-500 hover:text-gray-950 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
              title="Mở menu"
              aria-label="Mở menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Desktop Navigation - Hidden on mobile */}
         <div className="hidden md:flex px-4 max-w-7xl xxl:max-w-[1500px] mx-auto border-t border-gray-100 gap-6 overflow-x-auto flex-nowrap relative">
          <div className="pointer-events-none sticky right-0 w-8 bg-gradient-to-l from-white to-transparent z-10 ml-auto shrink-0" />
          {[
            { id: "SCHEDULE", label: "Lịch trình cá nhân", icon: Clock },
            { id: "MASTER", label: "Lịch làm việc của Tiệm", icon: Activity },
            {
              id: "ATTENDANCE",
              label: "Điểm danh hàng ngày",
              icon: CalendarCheck,
            },
            { id: "REPORTS", label: "Hiệu suất & Báo cáo", icon: DollarSign },
            { id: "BOOKING", label: "Đặt lịch hộ", icon: CalendarCheck },
            { id: "SELL_PACKAGE", label: "Bán Gói Liệu Trình", icon: Package },
            { id: "TASKS", label: "Công việc", icon: ListTodo },
            { id: "PASSWORD", label: "Đổi mật khẩu", icon: Key },
            ...((data?.profile?.role === "MANAGER" || data?.profile?.role === "ADMIN")
              ? [{ id: "MANAGEMENT", label: "Ban Quản lý 👑", icon: ShieldCheck }]
              : [])
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as "ATTENDANCE" | "SCHEDULE" | "MASTER" | "REPORTS" | "PASSWORD" | "MANAGEMENT" | "SELL_PACKAGE" | "BOOKING" | "TASKS")}
              className={`py-4 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === item.id
                  ? "border-pink-600 text-pink-600"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="fixed top-0 right-0 h-dvh w-4/5 max-w-[300px] bg-gray-950 text-gray-300 z-[110] shadow-2xl p-6 flex flex-col md:hidden overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4 shrink-0">
                <span className="font-display font-black text-white text-base tracking-widest">STAFF MENU</span>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 cursor-pointer"
                  aria-label="Đóng menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
                {[
                  { id: "SCHEDULE", label: "Lịch trình cá nhân", icon: Clock },
                  { id: "MASTER", label: "Lịch làm việc của Tiệm", icon: Activity },
                  { id: "ATTENDANCE", label: "Điểm danh hàng ngày", icon: CalendarCheck },
                  { id: "TASKS", label: "Công việc & Nhiệm vụ", icon: ListTodo },
                  { id: "REPORTS", label: "Hiệu suất & Báo cáo", icon: DollarSign },
                  { id: "BOOKING", label: "Đặt lịch hộ", icon: PlusCircle },
                  { id: "SELL_PACKAGE", label: "Bán Gói Liệu Trình", icon: Package },
                  { id: "PASSWORD", label: "Đổi mật khẩu", icon: Key },
                  ...((data?.profile?.role === "MANAGER" || data?.profile?.role === "ADMIN")
                    ? [{ id: "MANAGEMENT", label: "Ban Quản lý 👑", icon: ShieldCheck }]
                    : [])
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setIsDrawerOpen(false);
                      }}
                      className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-sm w-full transition-colors cursor-pointer ${
                        isActive
                          ? "bg-pink-600/10 text-pink-500 border border-pink-500/20"
                          : "text-gray-400 hover:text-white hover:bg-gray-900 border border-transparent"
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="border-t border-gray-800 pt-4 mt-4 shrink-0 space-y-2">
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/"
                  className="flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white hover:bg-gray-900 transition-colors cursor-pointer"
                >
                  <Home className="w-5 h-5 shrink-0" />
                  <span>Xem trang chủ</span>
                </a>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 w-full transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 p-4 max-w-7xl xxl:max-w-[1500px] mx-auto w-full pb-24 md:pb-8">
        {/* Persistent Flashing Checkin Reminder Past 09:00 AM */}
        {showCheckInReminder && (
          <div className="mb-6 p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-500 text-[#3A2E2B] font-bold flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-amber-100/50 animate-[pulse_2s_infinite]">
            <div className="flex items-center gap-3 text-left">
              <span className="text-2xl shrink-0">⏰</span>
              <div>
                <p className="text-sm font-black uppercase text-amber-800 tracking-wide">Trễ Giờ Điểm Danh Ca Sáng!</p>
                <p className="text-xs text-gray-700 font-medium">Hiện tại đã quá 09:00 sáng nhưng hệ thống chưa thấy bạn Điểm danh hôm nay. Hãy điểm danh ngay để duy trì ca làm việc!</p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTab("ATTENDANCE");
              }}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer text-center whitespace-nowrap min-h-[44px] flex items-center justify-center"
            >
              Xem Điểm danh ngay ⚡
            </button>
          </div>
        )}

        {isLoading && !data ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {activeTab === "SCHEDULE" && data && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* My Appointments */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-pink-500" /> Ca làm của tôi
                    </h3>

                    {data.myAppointments.length === 0 ? (
                      <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center text-gray-500">
                        Chương trình làm hôm nay chưa bắt đầu hoặc chưa chọn
                        lịch.
                      </div>
                    ) : (
                      data.myAppointments.map((appt: any) => (
                        <AppointmentCard
                          key={appt.id}
                          appt={appt}
                          onShowHistory={handleShowHistory}
                          onAction={handleAction}
                          setCompleteModal={setCompleteModal}
                          setSwapModal={setSwapModal}
                          setCompletedDetailModal={setCompletedDetailModal}
                          setEditTipModal={setEditTipModal}
                          isMine={true}
                        />
                      ))
                    )}
                  </div>

                  {/* Random Appointments */}
                  <div 
                    id="random-appointments-section"
                    className={`space-y-4 rounded-3xl transition-all duration-500 ${
                      hasNewRandomAlert || newAppointmentIds.length > 0 
                        ? "bg-pink-50/20 p-4 ring-2 ring-pink-500/40 animate-[pulse_2.2s_infinite] border border-pink-100 shadow-md shadow-pink-100/50" 
                        : "p-0"
                    }`}
                  >
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Navigation className={`w-5 h-5 ${hasNewRandomAlert || newAppointmentIds.length > 0 ? "text-pink-500 animate-bounce" : "text-blue-500"}`} /> 
                      Khách tự do (Random)
                      {(hasNewRandomAlert || newAppointmentIds.length > 0) && (
                        <span className="inline-flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                        </span>
                      )}
                    </h3>

                    {data.randomAppointments.length === 0 ? (
                      <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center text-gray-500">
                        Không có khách rảnh rỗi hoặc chờ KTV ngẫu nhiên.
                      </div>
                    ) : (
                      data.randomAppointments.map((appt: any) => (
                        <AppointmentCard
                          key={appt.id}
                          appt={appt}
                          onShowHistory={handleShowHistory}
                          onAction={handleAction}
                          setCompleteModal={setCompleteModal}
                          setSwapModal={setSwapModal}
                          setCompletedDetailModal={setCompletedDetailModal}
                          setEditTipModal={setEditTipModal}
                          isMine={false}
                          isNew={newAppointmentIds.includes(appt.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ATTENDANCE" && data && (
              <div className="space-y-6 max-w-xl mx-auto">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center text-pink-500 mb-2">
                    <CalendarCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#3A2E2B] line-clamp-1">
                      Trạng thái làm việc hôm nay
                    </h2>
                    <p className="text-sm text-gray-500" suppressHydrationWarning>
                      {todayDateStr || format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi })}
                    </p>
                  </div>
                  <div className="w-full mt-2">
                    {data.attendance ? (
                      <div className="flex items-center justify-center gap-2 px-4 py-4 bg-emerald-50 text-emerald-600 font-bold rounded-2xl text-sm border border-emerald-100 animate-in zoom-in-95">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />{" "}
                        Đã điểm danh làm lúc{" "}
                        {format(
                          new Date(data.attendance.check_in_time),
                          "HH:mm",
                        )}
                      </div>
                    ) : (
                      <LoadingButton
                        onClick={handleCheckIn}
                        isLoading={checkInLoading}
                        loadingText="Đang điểm danh..."
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer text-center min-h-[44px]"
                      >
                        <CalendarCheck className="w-5 h-5" /> Điểm danh làm việc
                        ngay
                      </LoadingButton>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "MASTER" && (
              <div className="space-y-3 font-semibold">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider">
                  <Activity className="w-5 h-5 text-[#8D6E53]" /> Lịch làm việc của Tiệm
                </h3>
                <MasterSchedule mode="STAFF" />
              </div>
            )}

            {activeTab === "REPORTS" && <ReportsTab />}

            {activeTab === "PASSWORD" && <TabPassword />}

            {activeTab === "MANAGEMENT" && <ManagementTab />}

            {activeTab === "BOOKING" && data && (
              <div className="py-6">
                <StaffBookingTab
                  staffId={data.staffId}
                  allServices={data.allServices}
                  staffList={[data.profile, ...(data.otherStaff || [])]}
                  onBookingCreated={() => loadData()}
                />
              </div>
            )}

            {activeTab === "SELL_PACKAGE" && data && (
              <TabSellPackage
                treatmentPackages={data?.treatmentPackages || []}
                onReload={loadData}
              />
            )}

            {activeTab === "TASKS" && <StaffTasksTab />}
          </div>
        )}
      </main>

      {/* Bottom Navigation for Mobile Native App Look */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-150 flex justify-around items-center z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', height: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
        {[
          { id: "SCHEDULE", label: "Lịch trình", icon: Clock },
          { id: "MASTER", label: "Lịch Tiệm", icon: Activity },
          { id: "ATTENDANCE", label: "Điểm danh", icon: CalendarCheck },
          { id: "TASKS", label: "Công việc", icon: ListTodo },
          { id: "MENU", label: "Menu", icon: Menu },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = item.id === "MENU" ? isDrawerOpen : activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "MENU") {
                  setIsDrawerOpen(true);
                } else {
                  setActiveTab(item.id as any);
                }
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all text-center cursor-pointer ${
                isActive
                  ? "text-pink-600 font-bold"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon
                className={`w-6 h-6 mb-1 transition-transform ${isActive ? "scale-110 text-pink-600" : "text-gray-400"}`}
              />
              <span
                className={`text-[11px] uppercase font-bold tracking-tight whitespace-nowrap`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Modals */}
      {historyModal.isOpen && (
        <HistoryModal
          history={historyModal.history}
          customerName={historyModal.customerName}
          onClose={() => setHistoryModal({ ...historyModal, isOpen: false })}
        />
      )}

      {completeModal.isOpen && (
        <CheckoutModal
          appt={completeModal.appt}
          allServices={data.allServices}
          onClose={() => setCompleteModal({ appt: null, isOpen: false })}
          onComplete={async (extraServices: string[], tip: number, discountPercent: number, _paymentMethod: "CASH" | "BANK") => {
            const res = await completeAppointment(completeModal.appt.id, extraServices, tip, discountPercent)
            if (res.success) {
              triggerStaffToast(
                'success',
                `🎉 Đơn hàng của khách ${completeModal.appt.customers?.full_name || 'Khách lẻ'} đã hoàn tất & checkout thành công lúc ${format(new Date(), "HH:mm")}!`
              )
              await loadData()
              sendZalo({
                phone: completeModal.appt.customers?.phone || '',
                message: `Cảm ơn ${completeModal.appt.customers?.full_name || 'quý khách'} đã sử dụng dịch vụ tại Min Nail & Hair! Chúc bạn một ngày tuyệt vời. ✨`
              }).catch(e => logger.error('[Notifications] Failed to send Zalo message', e))
            } else {
              toast.error("Lỗi khi hoàn thành đơn: " + res.error)
            }
            return res
          }}
        />
      )}

      {swapModal.isOpen && (
        <SwapModal
          appt={swapModal.appt}
          otherStaff={data.otherStaff}
          onClose={() => setSwapModal({ appt: null, isOpen: false })}
           onSwap={async (staffId: string) => {
             setSwapModal({ appt: null, isOpen: false }); // Optimistic: Close modal immediately
             try {
               await handleAction(() =>
                 swapAppointment(swapModal.appt.id, staffId),
               );
               toast.success('Đã chuyển lịch hẹn thành công!');
              } catch (err: unknown) {
                 toast.error('Lỗi khi chuyển lịch: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'));
                 setSwapModal({ appt: swapModal.appt, isOpen: true }); // Rollback
              }
           }}
        />
      )}

      {completedDetailModal.isOpen && (
        <CompletedDetailModal
          appt={completedDetailModal.appt}
          allServices={data?.allServices || []}
          onClose={() => setCompletedDetailModal({ isOpen: false, appt: null })}
        />
      )}

      {editTipModal.isOpen && (
        <EditTipModal
          appt={editTipModal.appt}
          onClose={() => setEditTipModal({ isOpen: false, appt: null })}
          onSaved={() => { loadData(); setEditTipModal({ isOpen: false, appt: null }); }}
        />
      )}

      <LoadingOverlay isVisible={overlayLoading} message="Hệ thống đang xử lý, vui lòng không tắt trình duyệt..." />

      {/* Real-time floating staffToasts notifications */}
      <div className="fixed top-20 right-4 z-55 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {staffToasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-2xl flex items-start gap-3 transition-all duration-300 transform translate-x-0 animate-in slide-in-from-right-10 border-l-[6px] ${
              t.type === 'success'
                ? 'bg-white border-emerald-500 border-l-emerald-600 text-[#3A2E2B]'
                : t.type === 'warning'
                ? 'bg-white border-amber-500 border-l-amber-600 text-[#3A2E2B]'
                : 'bg-white border-blue-500 border-l-blue-600 text-[#3A2E2B]'
            }`}
          >
            <span className="text-xl shrink-0 mt-0.5">
              {t.type === 'success' ? '🎉' : t.type === 'warning' ? '⏰' : '📢'}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${
                t.type === 'success' ? 'text-emerald-700' : t.type === 'warning' ? 'text-amber-700' : 'text-blue-700'
              }`}>
                {t.type === 'success' ? 'HOÀN THÀNH ĐƠN' : t.type === 'warning' ? 'SẮP ĐẾN CA LÀM' : 'TIN NHẮN'}
              </p>
              <p className="text-xs font-semibold leading-relaxed text-gray-700">{t.message}</p>
            </div>
            <button
              onClick={() => setStaffToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
              className="text-gray-400 hover:text-gray-900 font-extrabold text-[#3A2E2B] text-base cursor-pointer shrink-0 leading-none p-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppointmentCard({
  appt,
  onShowHistory,
  onAction,
  setCompleteModal,
  setSwapModal,
  setCompletedDetailModal,
  setEditTipModal,
  isMine,
  isNew,
}: any) {
  const services = appt.appointment_services
    .map((as: any) => as.services)
    .filter(Boolean);
  const dateObj = new Date(appt.start_time);
  const time = format(dateObj, "HH:mm");
  const apptDateStr = format(dateObj, "yyyy-MM-dd");
  
  const dateText = (() => {
    const ts = format(new Date(), "yyyy-MM-dd");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = format(tomorrow, "yyyy-MM-dd");
    if (apptDateStr === ts) return "Hôm nay";
    if (apptDateStr === tomorrowStr) return "Ngày mai";
    return format(dateObj, "dd/MM/yy");
  })();

  const isPackage = !!appt.is_package_session;
  const [actionLoading, setActionLoading] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  
  const handleStartAppointment = async () => {
    setActionLoading(true);
    setOptimisticStatus('IN_PROGRESS');
    try {
      await onAction(() => updateAppointmentStatus(appt.id, "IN_PROGRESS"));
      toast.success('Đã bắt đầu phục vụ khách!');
    } catch (err: unknown) {
      setOptimisticStatus(null);
      toast.error('Lỗi: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'));
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleTakeRandom = async () => {
    setActionLoading(true);
    setOptimisticStatus('TAKEN');
    try {
      await onAction(() => takeRandomAppointment(appt.id));
      toast.success('Đã nhận lịch hẹn!');
    } catch (err: unknown) {
      setOptimisticStatus(null);
      toast.error('Lỗi: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md ${
        isPackage
          ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20"
          : "bg-white border-gray-100"
       } ${
         (optimisticStatus === 'IN_PROGRESS' || appt.status === "IN_PROGRESS") 
           ? "ring-2 ring-emerald-500" 
           : (optimisticStatus === 'TAKEN' || !isNew) 
           ? "" 
           : "ring-2 ring-pink-500 border-pink-300 bg-pink-50/10 animate-[pulse_2.1s_infinite] shadow-lg shadow-pink-100/50" 
       }`}
    >
       {(optimisticStatus === 'IN_PROGRESS' || appt.status === "IN_PROGRESS") && (
         <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-bl-xl">
           Đang phục vụ
         </div>
       )}
       {(optimisticStatus === 'COMPLETED' || appt.status === "COMPLETED") && (
         <div className="absolute top-0 right-0 px-3 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded-bl-xl">
           Đã xong
         </div>
       )}
      {!isMine && isNew && (
        <div className="absolute top-0 right-0 px-3.5 py-1.5 bg-gradient-to-l from-pink-600 to-rose-500 text-white text-[10px] font-black tracking-wider uppercase rounded-bl-2xl shadow-sm animate-bounce">
          🎯 MỚI NHẬN!
        </div>
      )}

      <div className="flex justify-between items-start mb-3 mt-1">
        <div className="flex gap-3 w-full">
          <div className="w-16 h-12 bg-pink-50 text-pink-600 rounded-xl flex flex-col items-center justify-center font-bold px-1 shrink-0">
            <span className="text-[9px] text-center leading-tight tracking-tight text-pink-500 font-semibold">{dateText}</span>
            <span className="text-sm font-extrabold leading-none mt-0.5">{time}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className="font-bold text-gray-900 cursor-pointer hover:text-pink-600 flex items-center gap-1.5"
              onClick={() => onShowHistory(appt.customers)}
            >
              <span className="truncate">{appt.customers?.full_name}</span>
              <History className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            </h4>
            <p className="text-sm text-gray-500 font-mono truncate">
              {appt.customers?.phone}
            </p>
            {isPackage && (
              <div className="mt-1.5 bg-amber-100/80 border border-amber-250 text-amber-900 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1">
                ⚠️ LƯU Ý: KHÁCH DÙNG THẺ LIỆU TRÌNH
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100/50 flex flex-col gap-1 font-medium">
        {services.map((s: any) => (
          <div key={s.id} className="flex justify-between">
            <span>{s.name}</span>
          </div>
        ))}
      </div>

      {isMine ? (
        <div className="flex flex-col gap-2 w-full">
          {appt.status === "CONFIRMED" && (
            <div className="flex flex-col gap-2 w-full">
              <LoadingButton
                onClick={handleStartAppointment}
                isLoading={actionLoading}
                loadingText="Đang nhận khách..."
                className="w-full bg-gray-950 active:scale-95 transition-transform hover:bg-black text-white font-bold py-3.5 rounded-xl text-s cursor-pointer text-center min-h-[44px] flex items-center justify-center"
              >
                Nhận Khách (Bắt đầu làm)
              </LoadingButton>
              <button
                onClick={() => setSwapModal({ isOpen: true, appt })}
                className="w-full bg-white border border-gray-200 active:scale-95 transition-transform hover:bg-gray-50 text-gray-700 py-3 rounded-xl text-sm font-semibold cursor-pointer text-center flex items-center justify-center gap-2 min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" /> Đổi đơn (Yêu cầu đổi thợ)
              </button>
            </div>
          )}
          {appt.status === "IN_PROGRESS" && (
            <button
              onClick={() => setCompleteModal({ isOpen: true, appt })}
              className="w-full bg-emerald-500 active:scale-95 transition-transform hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-100 cursor-pointer text-center min-h-[44px] flex items-center justify-center"
            >
              Hoàn thành báo cáo (Hoàn thành)
            </button>
          )}
          {(optimisticStatus === 'COMPLETED' || appt.status === "COMPLETED") && (
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => setCompletedDetailModal({ isOpen: true, appt })}
                className="w-full bg-white border border-gray-200 active:scale-95 transition-transform hover:bg-gray-50 text-gray-700 py-3 rounded-xl text-sm font-semibold cursor-pointer text-center min-h-[44px] flex items-center justify-center"
              >
                <Info className="w-4 h-4 inline mr-1.5" />Xem chi tiết đơn hàng
              </button>
              <button
                onClick={() => setEditTipModal({ isOpen: true, appt })}
                className="w-full bg-amber-50 border border-amber-200 active:scale-95 transition-transform hover:bg-amber-100 text-amber-700 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-center min-h-[44px] flex items-center justify-center"
              >
                <DollarSign className="w-4 h-4 inline mr-1.5" />Sửa tiền Tip
              </button>
            </div>
          )}
        </div>
      ) : (
        <LoadingButton
          onClick={handleTakeRandom}
          isLoading={actionLoading}
          loadingText="Đang nhận..."
          className="w-full bg-blue-500 active:scale-95 transition-transform hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-blue-100 cursor-pointer text-center animate-pulse min-h-[44px] flex items-center justify-center"
        >
          Nhận khách này
        </LoadingButton>
      )}
    </div>
  );
}

function HistoryModal({ history, customerName, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-white md:bg-black/60 md:backdrop-blur-sm z-50 flex flex-col md:items-center md:justify-center p-0 md:p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[85dvh] md:max-w-md flex flex-col overflow-hidden shadow-2xl rounded-none md:rounded-3xl border-0 md:border border-gray-100 animate-in slide-in-from-bottom-5 duration-300">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <h3 className="font-display font-medium text-lg text-gray-900">
            Lịch sử làm đẹp: {customerName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 font-bold text-2xl p-2"
          >
            &times;
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-4 pb-24 md:pb-6">
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              Khách hàng mới, chưa có lịch sử hoàn thành.
            </p>
          ) : (
            history.map((h: any, i: number) => (
              <div
                key={i}
                className="border-l-3 border-pink-500 pl-4 py-1.5 bg-pink-50/10 rounded-r-xl"
              >
                <p className="text-sm font-bold text-gray-900 mb-1">
                  {format(new Date(h.created_at), "dd/MM/yyyy HH:mm")}
                </p>
                <p className="text-sm text-gray-600">
                  KTV:{" "}
                  <span className="font-semibold text-gray-800">
                    {h.users?.full_name || "Không rõ"}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Dịch vụ:{" "}
                  <span className="font-medium text-gray-800">
                    {h.appointment_services
                      ?.map((as: any) => as.services?.name)
                      .join(", ") || "Chi tiết"}
                  </span>
                </p>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-950 hover:bg-black text-white font-bold rounded-2xl active:scale-95 transition-transform cursor-pointer min-h-[44px] flex items-center justify-center"
          >
            Đóng lịch sử
          </button>
        </div>
      </div>
    </div>
  );
}

function CompletedDetailModal({ appt, onClose }: any) {
  const services = appt?.appointment_services?.map((as: any) => as.services).filter(Boolean) || [];
  const total = appt?.total_amount || 0;
  const tip = appt?.tip_amount || 0;

  return (
    <div className="fixed inset-0 bg-white md:bg-black/60 md:backdrop-blur-sm z-50 flex flex-col md:items-center md:justify-center p-0 md:p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[85dvh] md:max-w-md flex flex-col overflow-hidden shadow-2xl rounded-none md:rounded-3xl border-0 md:border border-gray-100 animate-in slide-in-from-bottom-5 duration-300">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <h3 className="font-display font-medium text-lg text-gray-900">Chi tiết đơn hàng</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-lg">
              {appt?.customers?.full_name?.charAt(0) || 'K'}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{appt?.customers?.full_name || 'Khách lẻ'}</h4>
              <p className="text-sm text-gray-500">{appt?.customers?.phone}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dịch vụ đã thực hiện</p>
            {services.length === 0 ? (
              <p className="text-sm text-gray-400">Không có dịch vụ</p>
            ) : services.map((s: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">{s.name}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tổng tiền dịch vụ</span>
              <span className="font-semibold">{Number(total + (appt?.total_amount ? 0 : 0)).toLocaleString("vi")}đ</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Giảm giá</span>
              <span className="font-semibold text-red-500">-{((appt?.total_amount ? (appt._discount || 0) : 0)).toLocaleString("vi")}đ</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tip</span>
              <span className="font-semibold text-pink-600">{tip.toLocaleString("vi")}đ</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2">
              <span>Khách thanh toán</span>
              <span>{(total).toLocaleString("vi")}đ</span>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-black cursor-pointer text-sm min-h-[44px] flex items-center justify-center"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function EditTipModal({ appt, onClose, onSaved }: any) {
  const [tipAmount, setTipAmount] = useState(appt?.tip_amount || 0);
  const [customTip, setCustomTip] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalTip = customTip ? parseInt(customTip.replace(/\D/g, '')) : tipAmount;
      const res = await updateTip(appt.id, finalTip);
      if (res.success) {
        toast.success('Đã cập nhật tip thành công!');
        onSaved();
      } else {
        toast.error(res.error || 'Lỗi khi cập nhật tip');
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : 'Lỗi không xác định') || 'Lỗi không xác định');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white md:bg-black/60 md:backdrop-blur-sm z-50 flex flex-col md:items-center md:justify-center p-0 md:p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[85dvh] md:max-w-md flex flex-col overflow-hidden shadow-2xl rounded-none md:rounded-3xl border-0 md:border border-gray-100 animate-in slide-in-from-bottom-5 duration-300">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <h3 className="font-display font-medium text-lg text-gray-900">Sửa tiền Tip</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-lg">
              {appt?.customers?.full_name?.charAt(0) || 'K'}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{appt?.customers?.full_name || 'Khách lẻ'}</h4>
              <p className="text-sm text-gray-500">Tip hiện tại: <span className="font-bold text-pink-600">{(appt?.tip_amount || 0).toLocaleString("vi")}đ</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {TIP_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => { setTipAmount(amount); setCustomTip(''); }}
className={`py-4 px-4 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer min-h-[44px] flex items-center justify-center ${
                   tipAmount === amount && !customTip
                     ? 'border-pink-500 bg-pink-50 text-pink-700'
                     : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                 }`}
              >
                {amount.toLocaleString("vi")}đ
              </button>
            ))}
            <div className="col-span-2">
              <label htmlFor="staff-editTipCustom" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Số tiền khác</label>
              <input
                id="staff-editTipCustom"
                type="text"
                value={customTip}
                onChange={(e) => { setCustomTip(e.target.value); setTipAmount(0); }}
                placeholder="Nhập số tiền tip..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 cursor-pointer text-sm min-h-[44px] flex items-center justify-center">
            Hủy
          </button>
          <LoadingButton
            onClick={handleSave}
            isLoading={saving}
            loadingText="Đang lưu..."
            className="flex-1 py-3 bg-pink-600 text-white font-semibold rounded-xl hover:bg-pink-700 cursor-pointer text-sm min-h-[44px] flex items-center justify-center"
          >
            Lưu tip
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}

function TabSellPackage({
  treatmentPackages,
  onReload,
}: {
  treatmentPackages: any[];
  onReload: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [customerPackages, setCustomerPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const cleanedPhone = phone.trim().replace(/\s+/g, "");
    if (cleanedPhone.length >= 9) {
      startTransition(() => {
        setIsSearching(true);
      });
      const timer = setTimeout(async () => {
        try {
          const { getCustomerByPhone } = await import("../admin/actions");
          const cust = await getCustomerByPhone(cleanedPhone);
          if (cust) {
            startTransition(() => {
              setCustomerName(cust.full_name);
              setFoundCustomer(cust);
              setIsNewCustomer(false);
            });

            startTransition(() => {
              setLoadingPackages(true);
            });
            try {
              const { getCustomerPackagesDetailed } = await import("./actions");
              const pkgs = await getCustomerPackagesDetailed(cust.id);
              startTransition(() => {
                setCustomerPackages(pkgs || []);
              });
            } catch (err) {
              console.error("Error loading customer packages", err);
            } finally {
              startTransition(() => {
                setLoadingPackages(false);
              });
            }
          } else {
            startTransition(() => {
              if (!foundCustomer) {
                setCustomerName("");
              }
              setFoundCustomer(null);
              setIsNewCustomer(true);
              setCustomerPackages([]);
            });
          }
        } catch (e) {
          console.error(e);
        } finally {
          startTransition(() => {
            setIsSearching(false);
          });
        }
      }, 400);
      return () => clearTimeout(timer);
    } else {
      startTransition(() => {
        setFoundCustomer(null);
        setIsNewCustomer(false);
        setIsSearching(false);
        setCustomerPackages([]);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const cleanedPhone = phone.trim().replace(/\s+/g, "");
    if (!cleanedPhone || !customerName || !selectedPackageId) {
      setMessage({ type: "error", text: "Vui lòng nhập đầy đủ Số điện thoại, Tên khách hàng và chọn Gói liệu trình!" });
      return;
    }

    setSubmitting(true);
    try {
      const { sellPackageToCustomer } = await import("../admin/actions");
      const res = await sellPackageToCustomer(cleanedPhone, customerName, selectedPackageId);
      if (res.success) {
        setMessage({ type: "success", text: res.message || "Bán và kích hoạt gói thành công!" });
        setPhone("");
        setCustomerName("");
        setSelectedPackageId("");
        setFoundCustomer(null);
        setIsNewCustomer(false);
        onReload();
      } else {
        setMessage({ type: "error", text: res.error || "Có lỗi xảy ra" });
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: "Lỗi kết nối máy chủ: " + (err instanceof Error ? err.message : 'Lỗi không xác định') });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPkg = treatmentPackages.find((p) => p.id === selectedPackageId);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-2">
        <h2 className="text-xl font-bold text-gray-950 flex items-center gap-2 font-display">
          <Package className="w-6 h-6 text-pink-500" />
          Bán Gói Liệu Trình Tại Quầy
        </h2>
        <p className="text-sm text-gray-500">
          Nhập số điện thoại khách hàng, chọn gói combo và kích hoạt ngay lập tức.
        </p>
      </div>

      <form onSubmit={handleSell} className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-rose-50 text-rose-700 border border-rose-100"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Bước 1: Thông tin khách hàng</h3>
          
          <div>
            <label htmlFor="staff-sellPhone" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Số điện thoại khách hàng <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="staff-sellPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0912345678"
                required
                className="w-full p-4 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all placeholder:text-gray-400 font-semibold text-lg"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin w-5 h-5 border-2 border-pink-500/20 border-t-pink-500 rounded-full"></div>
                </div>
              )}
            </div>
            {phone.trim() && phone.trim().length < 9 && (
              <p className="text-[11px] text-gray-400 mt-1">Nhập ít nhất 9 số để tra cứu...</p>
            )}
          </div>

          {(phone.trim().length >= 9) && (
            <div className="animate-fadeIn">
              <label htmlFor="staff-sellCustomerName" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Tên khách hàng <span className="text-red-500">*</span>
              </label>
              <input
                id="staff-sellCustomerName"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nhập tên đầy đủ của khách"
                required
                disabled={foundCustomer !== null}
                className={`w-full p-4 border rounded-2xl outline-none transition-all font-semibold ${
                  foundCustomer
                    ? "bg-emerald-50/50 border-emerald-100 text-emerald-950 cursor-not-allowed"
                    : "bg-amber-50/10 border-amber-200 focus:bg-white focus:ring-2 focus:ring-pink-500"
                }`}
              />
              {foundCustomer ? (
                <>
                  <p className="text-xs text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                    ✓ Thành viên cũ: Đã tìm thấy khách hàng trong hệ thống.
                  </p>
                  
                  {/* Package Tracking Section */}
                  <div className="mt-4 p-4 bg-orange-50/40 border border-[#EADDCD] rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-[#8D6E53] uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-pink-500" />
                      Gói liệu trình đang sở hữu ({customerPackages.length})
                    </h4>
                    {loadingPackages ? (
                      <div className="text-xs text-gray-500 py-1.5 flex items-center gap-2">
                        <div className="animate-spin w-3 h-3 border border-pink-500/20 border-t-pink-500 rounded-full"></div>
                        Đang lấy thông tin liệu trình...
                      </div>
                    ) : customerPackages.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {customerPackages.map((cp: any) => (
                          <div key={cp.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center text-xs shadow-sm">
                            <div className="space-y-0.5">
                              <p className="font-extrabold text-[#3A2E2B]">{cp.treatment_packages?.name}</p>
                              <p className="text-[10px] text-gray-400">Mua lúc: {new Date(cp.purchased_at).toLocaleDateString("vi-VN")}</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                cp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                              }`}>
                                Còn {cp.remaining_sessions}/{cp.total_sessions} buổi
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Khách hàng chưa đăng ký mua gói liệu trình nào.</p>
                    )}
                  </div>
                </>
              ) : isNewCustomer ? (
                <p className="text-xs text-amber-600 font-semibold mt-1.5 flex items-center gap-1">
                  ✦ Khách hàng mới: Vui lòng nhập họ tên để hệ thống tự tạo tài khoản.
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-50">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Bước 2: Chọn gói liệu trình</h3>
          
          <div>
            <label htmlFor="staff-sellPackage" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Gói ưu đãi đang hoạt động <span className="text-red-500">*</span>
            </label>
            <select
              id="staff-sellPackage"
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              required
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all font-semibold"
            >
              <option value="">-- Chọn gói combo --</option>
              {treatmentPackages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({Number(p.price).toLocaleString("vi")}đ)
                </option>
              ))}
            </select>
          </div>

          {selectedPkg && (
            <div className="p-4 bg-pink-50/40 rounded-2xl border border-pink-100 space-y-3 animate-fadeIn">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-gray-600">Dịch vụ áp dụng:</span>
                <span className="text-gray-900">{selectedPkg.services?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-gray-600">Tổng số buổi thực nhận:</span>
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-black">
                  {selectedPkg.total_sessions} buổi (Mua {selectedPkg.buy_count} + Tặng {selectedPkg.free_count})
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-pink-100/60">
                <span className="font-bold text-pink-950">Tổng tiền thanh toán:</span>
                <span className="text-lg font-black text-pink-700">{Number(selectedPkg.price).toLocaleString("vi")}đ</span>
              </div>
            </div>
          )}
        </div>

        <LoadingButton
          type="submit"
          isLoading={submitting}
          loadingText="Đang xử lý..."
          disabled={submitting || !phone || !customerName || !selectedPackageId}
          className="w-full p-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none shadow-md flex items-center justify-center gap-2 text-base cursor-pointer min-h-[44px]"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Xác nhận thanh toán và kích hoạt gói
        </LoadingButton>
      </form>
    </div>
  );
}

