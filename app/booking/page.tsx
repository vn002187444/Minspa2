'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { checkCustomerHistory, submitBooking, getAvailableStaff, getPublicServices, getCustomerCareSuggestion, getPublicSeoSettings, getSlotAvailability, getCustomerNotifications, markCustomerNotificationRead, markAllCustomerNotificationsRead } from './actions';
import type { SlotInfo } from './actions';
import { Sparkles, Calendar, Clock, User, Phone, CheckCircle2, ArrowRight, ArrowLeft, Bell } from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';
import LoadingButton from '@/components/LoadingButton';
import LoadingOverlay from '@/components/LoadingOverlay';
import BookingCalendar from '@/components/BookingCalendar';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // Step 1: Customer Info
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [customerNotifs, setCustomerNotifs] = useState<any[]>([]);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  
  // Treatment package options
  const [activePackages, setActivePackages] = useState<any[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [buyPackageId, setBuyPackageId] = useState<string | null>(null);
  const [allPackages, setAllPackages] = useState<any[]>([]);

  // Data fetching
  const [services, setServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);

  // Step 2: Time & Staff
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [slotAvailability, setSlotAvailability] = useState<SlotInfo[]>([]);
  
  const [discountSettings, setDiscountSettings] = useState({ enabled: true, percent: 5 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');

  const CACHE_HISTORY_PREFIX = 'min_salon_cust_';
  const CACHE_PACKAGES_PREFIX = 'min_salon_pkg_';
  const CACHE_TTL = 24 * 60 * 60 * 1000;
  const CACHE_PACKAGES_TTL = 5 * 60 * 1000;

  function getCachedHistory(phone: string): any | null {
    try {
      const raw = localStorage.getItem(CACHE_HISTORY_PREFIX + phone);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > CACHE_TTL) {
        localStorage.removeItem(CACHE_HISTORY_PREFIX + phone);
        return null;
      }
      return data;
    } catch { return null; }
  }

  function setCachedHistory(phone: string, data: any) {
    try {
      localStorage.setItem(CACHE_HISTORY_PREFIX + phone, JSON.stringify({ data, timestamp: Date.now() }));
    } catch { /* quota exceeded */ }
  }

  function getCachedPackages(phone: string): any | null {
    try {
      const raw = localStorage.getItem(CACHE_PACKAGES_PREFIX + phone);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > CACHE_PACKAGES_TTL) {
        localStorage.removeItem(CACHE_PACKAGES_PREFIX + phone);
        return null;
      }
      return data;
    } catch { return null; }
  }

  function setCachedPackages(phone: string, data: any) {
    try {
      localStorage.setItem(CACHE_PACKAGES_PREFIX + phone, JSON.stringify({ data, timestamp: Date.now() }));
    } catch { /* quota exceeded */ }
  }

  function invalidateCustomerCache(phone: string) {
    try {
      localStorage.removeItem(CACHE_HISTORY_PREFIX + phone);
      localStorage.removeItem(CACHE_PACKAGES_PREFIX + phone);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    async function loadServices() {
      const data = await getPublicServices();
      if (data) {
        // Normalize categories for alignment with flyer groups in Booking too
        const normalized = data.map((s: any) => {
          let cat = s.category;
          if (cat === 'Móng' || cat?.toLowerCase().includes('móng') || cat?.toLowerCase().includes('nail')) {
            if (s.name.toLowerCase().includes('chà gót') || s.name.toLowerCase().includes('gót chân')) {
              return { ...s, category: 'Chà Gót Chân' };
            }
            if (s.price < 150000 && (s.name.toLowerCase().includes('combo') || s.name.toLowerCase().includes('sơn gel'))) {
              return { ...s, category: 'Deal Chấn Động' };
            }
            return { ...s, category: 'Chăm Sóc & Trang Trí Móng' };
          }
          if (cat === 'Deal' || cat?.toLowerCase().includes('deal')) {
            return { ...s, category: 'Deal Chấn Động' };
          }
          if (cat === 'Gội Dưỡng Sinh' || cat === 'Gội ') {
            return { ...s, category: 'Gội dưỡng sinh' };
          }
          return s;
        });
        setServices(normalized);
      }
    }

    async function loadPackages() {
      const { getPublicPackages } = await import('./actions');
      const pkgs = await getPublicPackages();
      setAllPackages(pkgs || []);
    }

    loadServices();
    loadPackages();
    getPublicSeoSettings().then((s) => setDiscountSettings({ enabled: s.discountEnabled, percent: s.discountPercent }));
  }, []);

  const restoredRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !restoredRef.current) {
      const params = new URLSearchParams(window.location.search);
      const buyPkgParam = params.get('buy_pkg');
      if (buyPkgParam) {
        const pkg = allPackages.find(p => p.id === buyPkgParam);
        if (pkg) {
          setBuyPackageId(pkg.id);
          if (pkg.service_id) {
            setSelectedServices([String(pkg.service_id)]);
          }
        }
      }
    }
  }, [allPackages]);

  // Restore phone number from previous booking
  useEffect(() => {
    if (typeof window !== 'undefined' && !restoredRef.current && allPackages.length > 0) {
      const savedPhone = localStorage.getItem('min_salon_customer_phone');
      if (savedPhone) {
        restoredRef.current = true;
        setPhone(savedPhone);
        setTimeout(async () => {
          try {
            let result = getCachedHistory(savedPhone);
            if (!result) {
              result = await checkCustomerHistory(savedPhone);
              if (result.found) setCachedHistory(savedPhone, result);
            }
            if (result.found) {
              setName(result.name);
              setCustomerId(result.id);
              localStorage.setItem('min_salon_customer_id', result.id);
              setActivePackages(result.activePackages || []);
            }
            const suggestion = await getCustomerCareSuggestion(savedPhone);
            setAiSuggestion(suggestion);
          } catch (e) {
            console.error(e);
          }
        }, 100);
      }
    }
  }, [allPackages]);

  const handlePhoneBlur = async () => {
    if (phone.length < 10) return;
    setIsCheckingPhone(true);
    
    try {
      let cached = getCachedHistory(phone);
      if (!cached) {
        cached = await checkCustomerHistory(phone);
        if (cached.found) setCachedHistory(phone, cached);
      }
      const { found, name: foundName, id, history, activePackages: foundPackages } = cached;
      if (found) {
        setName(foundName);
        setCustomerId(id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('min_salon_customer_id', id);
          localStorage.setItem('min_salon_customer_phone', phone);
        }
        setActivePackages(foundPackages || []);

        // Fetch customer notifications
        const notifs = await getCustomerNotifications(id);
        setCustomerNotifs(notifs);
        const unreadNotifs = notifs.filter((n: any) => !n.is_read);
        if (unreadNotifs.length > 0) {
          setShowNotifBanner(true);
        }
      } else {
        setCustomerId(null);
        setActivePackages([]);
        setSelectedPackageId(null);
        setCustomerNotifs([]);
        setShowNotifBanner(false);
      }

      setIsAiLoading(true);
      const suggestion = await getCustomerCareSuggestion(phone);
      setAiSuggestion(suggestion);
      setIsAiLoading(false);
    } catch (e) {
      console.error(e);
    }
    
    setIsCheckingPhone(false);
  };

  useEffect(() => {
    if (phone.length < 10) {
      setActivePackages([]);
      setSelectedPackageId(null);
    }
  }, [phone]);

  // Derived data (hoisted before effects that depend on them)
  const selectedItemsData = services.filter(s => selectedServices.includes(s.id));
  const rawDuration = selectedItemsData.reduce((sum, item) => sum + (item.duration || 30), 0);

  useEffect(() => {
    async function fetchSlotAvail() {
      if (selectedDate) {
        const slots = await getSlotAvailability(selectedDate, selectedServices, services);
        setSlotAvailability(slots || []);
      }
    }
    fetchSlotAvail();
  }, [selectedDate]);

  useEffect(() => {
    async function fetchStaff() {
      if (selectedDate && selectedTime) {
        const duration = rawDuration > 0 ? rawDuration : 60;
        const freeStaff = await getAvailableStaff(selectedDate, selectedTime, duration);
        setAvailableStaff(freeStaff || []);
      }
    }
    fetchStaff();
  }, [selectedDate, selectedTime, rawDuration]);

  const handleNext = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!name || !phone || selectedServices.length === 0) {
        return setErrorMsg('Vui lòng điền đủ thông tin và chọn ít nhất 1 dịch vụ');
      }
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!selectedTime) return setErrorMsg('Vui lòng chọn giờ hẹn');

    const selSlot = slotAvailability.find(s => s.time === selectedTime);
    if (selSlot && (selSlot.status === 'past' || selSlot.status === 'fully_booked' || selSlot.status === 'no_staff_present')) {
      return setErrorMsg('Khung giờ này không khả dụng, vui lòng chọn khung giờ khác.');
    }
    
    setIsSubmitting(true);
    const res = await submitBooking({
      customerId,
      name,
      phone,
      date: selectedDate,
      time: selectedTime,
      staffId: selectedStaff || null,
      serviceIds: selectedServices,
      usePackageId: selectedPackageId || null,
      buyPackageId: buyPackageId || null
    });
    
    setIsSubmitting(false);
    
    if (res.success) {
      if (typeof window !== 'undefined') {
        invalidateCustomerCache(phone);
        localStorage.setItem('min_salon_customer_phone', phone);
        if (res.customerId) {
          localStorage.setItem('min_salon_customer_id', res.customerId);
        }
      }
      setStep(3);
    } else {
      setErrorMsg('Có lỗi xảy ra: ' + res.error);
    }
  };

  // Get active staff full name
  const selectedStaffName = availableStaff.find(s => s.id === selectedStaff)?.full_name || '';

  // Get selected services details
  const selectedPkg = activePackages.find(p => p.id === selectedPackageId);
  const coveredServiceId = selectedPkg?.treatment_packages?.service_id;

  let rawTotal = 0;
  selectedItemsData.forEach(item => {
    if (selectedPkg && String(item.id) === String(coveredServiceId)) {
      // Free for package session
    } else {
      rawTotal += item.price;
    }
  });
  const discountPercent = discountSettings.enabled ? discountSettings.percent / 100 : 0;
  const discountAmount = Math.round(rawTotal * discountPercent);
  const finalTotal = rawTotal - discountAmount;

  const filteredServices = services.filter(s => {
    if (activeCategory === 'Tất cả') return true;
    return s.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-2 sm:p-4 lg:py-12 font-sans text-[#3A2E2B]">
      <div className="max-w-xl lg:max-w-5xl w-full bg-white rounded-3xl shadow-xl overflow-hidden min-h-[520px] flex flex-col border border-[#EADDCD] transition-all duration-300">
        
        {/* Header Steps */}
        <div className="bg-[#5C4033] p-5 sm:p-6 text-[#FAF6F0] shrink-0 relative overflow-hidden border-b border-[#EADDCD]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full mix-blend-overlay filter blur-xl transform translate-x-10 -translate-y-10"></div>
            <button 
              onClick={() => router.push('/')}
              className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF6F0] transition-all hidden sm:flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="text-center sm:text-left sm:pl-8">
              <h1 className="text-2xl font-display font-bold mb-1 tracking-wide">Đặt lịch giữ chỗ</h1>
              <p className="text-gray-300 text-xs mb-6">Chỉ mất 1 phút để trải nghiệm dịch vụ đẳng cấp</p>
            </div>
            
            <div className="flex items-center gap-2 relative z-10 max-w-sm mx-auto">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-1 h-1 rounded-full bg-[#3A2E2B] overflow-hidden">
                  <div className={`h-full bg-amber-400 transition-all duration-500 ${step >= i ? 'w-full' : 'w-0'}`}></div>
                </div>
              ))}
            </div>
        </div>

        {/* Dynamic Split Body Columns */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          
          {/* Left Column: Core Booking Wizard Steps */}
          <div className="p-5 sm:p-6 md:p-8 flex-1 flex flex-col h-full overflow-y-auto lg:w-3/5">
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium animate-in fade-in">
                {errorMsg}
              </div>
            )}

            {/* Mobile-Only Summary Accordion Banner (shown on mobile when services are selected and not on final step) */}
            {step < 3 && selectedItemsData.length > 0 && (
              <div className="block lg:hidden mb-5 bg-[#FAF0E6]/80 p-4 rounded-xl border border-[#EADDCD]/75 text-xs shadow-xs">
                <div className="flex justify-between items-center font-bold text-[#5C4033] uppercase">
                  <span>Dịch vụ đã chọn ({selectedServices.length})</span>
                  <span className="text-[#3A2E2B] font-extrabold">{finalTotal.toLocaleString('vi')}đ</span>
                </div>
                <div className="mt-2 text-gray-500 font-medium whitespace-normal leading-relaxed line-clamp-1">
                  {selectedItemsData.map(s => s.name).join(', ')}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6 flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                 <div>
                   {showNotifBanner && customerNotifs.some((n: any) => !n.is_read) && (
                     <div className="mb-4 p-4 bg-[#FAF0E6] border border-[#EADDCD] rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                       <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                           <Bell className="w-4 h-4 text-amber-700" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-xs font-bold text-[#5C4033] uppercase tracking-wider mb-1.5">
                             Thông báo mới ({customerNotifs.filter((n: any) => !n.is_read).length})
                           </p>
                           <div className="space-y-1.5 max-h-32 overflow-y-auto">
                             {customerNotifs.filter((n: any) => !n.is_read).map((n: any) => (
                               <button
                                 key={n.id}
                                 onClick={async () => {
                                   await markCustomerNotificationRead(n.id, customerId!);
                                   setCustomerNotifs((prev) =>
                                     prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
                                   );
                                   if (customerNotifs.filter((x: any) => !x.is_read).length <= 1) {
                                     setShowNotifBanner(false);
                                   }
                                 }}
                                 className="w-full text-left bg-white/80 hover:bg-white rounded-lg p-2.5 transition-colors border border-[#EADDCD]/50"
                               >
                                 <p className="text-xs font-semibold text-[#3A2E2B]">{n.title}</p>
                                 <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.content}</p>
                               </button>
                             ))}
                           </div>
                           <button
                             onClick={async () => {
                               await markAllCustomerNotificationsRead(customerId!);
                               setCustomerNotifs((prev) => prev.map((x) => ({ ...x, is_read: true })));
                               setShowNotifBanner(false);
                             }}
                             className="mt-2 text-[11px] font-semibold text-[#8D6E53] hover:text-[#5C4033] transition-colors"
                           >
                             Đánh dấu tất cả đã đọc
                           </button>
                         </div>
                         <button
                           onClick={() => setShowNotifBanner(false)}
                           className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0"
                         >
                           ×
                         </button>
                       </div>
                     </div>
                   )}
                   {activePackages && activePackages.length > 0 && (
                     <div className="p-5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-4 mb-6 animate-in fade-in zoom-in-95 duration-300">
                       <div className="flex gap-2">
                         <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                         <div>
                           <p className="text-xs font-bold text-amber-800 uppercase tracking-wider font-sans">Ưu đãi thẻ liệu trình khả dụng</p>
                           <p className="text-xs text-amber-950 mt-1 leading-relaxed font-sans">
                             Hệ thống ghi nhận chị đang có gói liệu trình <span className="font-extrabold text-[#78350F]">“{activePackages[0].treatment_packages?.name || 'Gói liệu trình của bạn'}”</span> còn <span className="font-extrabold text-[#D97706] bg-amber-100/60 px-1.5 py-0.5 rounded">{activePackages[0].remaining_sessions} buổi</span> chưa sử dụng. Chị có muốn dùng 1 buổi của gói này cho lịch hẹn hôm nay không?
                           </p>
                         </div>
                       </div>
                       <div className="flex flex-wrap gap-2 pt-1 font-sans">
                         <button
                           type="button"
                           onClick={() => {
                             setSelectedPackageId(activePackages[0].id);
                             const svcId = activePackages[0].treatment_packages?.service_id;
                             if (svcId && !selectedServices.includes(svcId)) {
                               setSelectedServices(prev => [...prev, svcId]);
                             }
                           }}
                           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                             selectedPackageId === activePackages[0].id
                               ? 'bg-[#8D6E53] text-white shadow-sm ring-2 ring-[#8D6E53]/25'
                               : 'bg-white text-[#8D6E53] border border-[#EADDCD] hover:bg-[#FAF6F0]'
                           }`}
                         >
                           {selectedPackageId === activePackages[0].id ? '✓ Có, sử dụng buổi liệu trình' : 'Có, sử dụng buổi liệu trình'}
                         </button>
                         <button
                           type="button"
                           onClick={() => {
                             setSelectedPackageId(null);
                           }}
                           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                             selectedPackageId === null
                               ? 'bg-[#3A2E2B] text-white shadow-sm'
                               : 'bg-white text-gray-700 border border-gray-250 hover:bg-gray-50'
                           }`}
                         >
                           {selectedPackageId === null ? '✓ Không, tôi đặt dịch vụ lẻ khác' : 'Không, tôi đặt dịch vụ lẻ khác'}
                         </button>
                       </div>
                     </div>
                   )}

                   {buyPackageId && (
                     <div className="p-4 bg-pink-50/70 border border-pink-200 rounded-2xl flex gap-3 animate-fadeIn mb-5 text-left">
                       <div className="mt-1">
                         <Sparkles className="w-4 h-4 text-pink-600 animate-pulse" />
                       </div>
                       <div className="space-y-1">
                         <p className="text-[10px] uppercase tracking-wider font-extrabold text-pink-700">Chị Đang Đăng Ký Mua Gói VIP</p>
                         <p className="text-xs font-extrabold text-[#3A2E2B]">
                           {allPackages.find(p => p.id === buyPackageId)?.name || 'Gói liệu trình ưu đãi'}
                         </p>
                         <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                           Hệ thống đã tự chuẩn bị dịch vụ của gói. Buổi hôm nay sẽ được trừ vào tài khoản gói ngay sau khi đơn mua gói được nhân viên kích hoạt thành công tại quầy!
                         </p>
                         <button
                           type="button"
                           onClick={() => {
                             setBuyPackageId(null);
                             setSelectedServices([]);
                           }}
                           className="text-[10px] font-bold text-[#8D6E53] underline hover:text-pink-700 block mt-1 cursor-pointer"
                         >
                           Hủy đăng ký mua gói, đổi sang dịch vụ lẻ
                         </button>
                       </div>
                     </div>
                   )}

                   <label className="block text-xs font-bold tracking-wider uppercase text-gray-500 mb-1.5">Số điện thoại khách hàng</label>
                   <div className="relative">
                     <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D6E53]" />
                     <input 
                       type="tel"
                       value={phone}
                       onChange={(e) => setPhone(e.target.value)}
                       onBlur={handlePhoneBlur}
                       placeholder="Ví dụ: 0934 323 878"
                       className="w-full pl-11 pr-4 py-3 bg-[#FAF6F0] border border-[#EADDCD] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent outline-none transition-all text-sm font-medium"
                     />
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-xs font-bold tracking-wider uppercase text-gray-500 mb-1.5">
                     Họ & Tên quý khách {isCheckingPhone && <span className="text-amber-600 text-xs animate-pulse font-normal"> (Đang tra cứu lịch sử...)</span>}
                   </label>
                   <div className="relative">
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D6E53]" />
                     <input 
                       type="text"
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       placeholder="Ví dụ: Nguyễn Phương Vy"
                       className="w-full pl-11 pr-4 py-3 bg-[#FAF6F0] border border-[#EADDCD] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent outline-none transition-all text-sm font-medium"
                     />
                   </div>
                 </div>

                 {isAiLoading && (
                   <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center justify-center gap-2">
                     <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                     <span className="text-xs text-[#8D6E53] font-semibold tracking-wider">Trợ lý AI đang cá nhân hóa trải nghiệm...</span>
                   </div>
                 )}

                 {aiSuggestion && !isAiLoading && (
                   <div className="p-4 bg-[#FAF0E6] flex gap-3 origin-left animate-in fade-in zoom-in-95 duration-500 border border-[#EADDCD] rounded-2xl">
                      <div className="mt-0.5"><Sparkles className="w-4 h-4 text-[#8D6E53]" /></div>
                      <div>
                        <p className="text-[10px] font-bold text-[#8D6E53] mb-1 uppercase tracking-widest flex items-center gap-1">✨ Gợi ý dành riêng cho bạn</p>
                        <p className="text-xs text-[#3A2E2B] leading-relaxed font-semibold italic">{aiSuggestion}</p>
                      </div>
                   </div>
                 )}

                 {/* Categorized Filter Tabs (UX Upgrade for selecting from grouped lists easily) */}
                 <div>
                   <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 mb-2">Xem theo chuyên mục</label>
                   <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none snap-x mb-3">
                     {['Tất cả', 'Deal Chấn Động', 'Gội dưỡng sinh', 'Chà Gót Chân', 'Massage', 'Chăm Sóc & Trang Trí Móng'].map(cat => (
                       <button
                         key={cat}
                         type="button"
                         onClick={() => setActiveCategory(cat)}
                         className={`snap-start shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wider border transition-all uppercase ${
                           activeCategory === cat
                             ? 'bg-[#8D6E53] border-[#8D6E53] text-[#FAF6F0] shadow-sm'
                             : 'bg-white border-[#EADDCD] text-gray-600 hover:border-[#8D6E53]'
                         }`}
                       >
                         {cat}
                       </button>
                     ))}
                   </div>

                   <label className="block text-xs font-bold tracking-wider uppercase text-gray-500 mb-3">Lựa chọn dịch vụ làm đẹp</label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                      {filteredServices.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            if (selectedServices.includes(s.id)) {
                              setSelectedServices(selectedServices.filter(id => id !== s.id));
                            } else {
                              setSelectedServices([...selectedServices, s.id]);
                            }
                          }}
                          className={`p-3 text-left border rounded-xl transition-all flex flex-col gap-1 relative ${
                            selectedServices.includes(s.id) 
                              ? 'border-[#8D6E53] bg-[#FAF0E6]/60 ring-1 ring-[#8D6E53]' 
                              : 'border-[#EADDCD] bg-white hover:border-[#8D6E53] hover:bg-[#FAF6F0]/40'
                          }`}
                        >
                          <span className="font-semibold text-xs text-[#3A2E2B] leading-tight pr-6">{s.name}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{s.duration || 30} phút</span>
                          <span className="text-xs text-[#8D6E53] font-bold mt-1">{(s.price).toLocaleString('vi')}đ</span>
                          {selectedServices.includes(s.id) && (
                            <div className="absolute top-2 right-2 text-[#8D6E53]"><CheckCircle2 className="w-4 h-4" /></div>
                          )}
                        </button>
                      ))}
                      {filteredServices.length === 0 && (
                        <div className="col-span-full py-8 text-center text-xs text-gray-400 font-medium italic">
                          Không có dịch vụ nào trong chuyên mục này.
                        </div>
                      )}
                   </div>
                 </div>

                  <div className="pt-4">
                    <LoadingButton
                      onClick={handleNext}
                      className="w-full bg-[#5C4033] hover:bg-[#3A2E2B] text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group tracking-widest uppercase text-xs shadow-md"
                    >
                      Tiếp tục lựa chọn <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </LoadingButton>
                  </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                  <button onClick={() => setStep(1)} className="text-xs text-[#8D6E53] hover:text-[#5C4033] flex items-center gap-1 -mt-2 font-semibold">
                    <ArrowLeft className="w-4 h-4" /> Quay lại bước trước
                  </button>

                 <div>
                   <label className="block text-xs font-bold tracking-wider uppercase text-gray-500 mb-2">Chọn ngày hẹn đẹp nhất</label>
                   <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                       {Array.from({ length: 14 }, (_, i) => i).map(offset => {
                        const d = addDays(new Date(), offset);
                        const dateStr = format(d, 'yyyy-MM-dd');
                        const isSelected = selectedDate === dateStr;
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => setSelectedDate(dateStr)}
                            className={`snap-start shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-xl border transition-all relative ${
                              isSelected 
                                ? 'bg-[#5C4033] border-[#5C4033] text-white shadow-md' 
                                : 'bg-white border-[#EADDCD] text-gray-600 hover:border-[#8D6E53]'
                            }`}
                          >
                             <span className={`text-[9px] font-bold uppercase mb-1 ${isWeekend && !isSelected ? 'text-rose-500' : ''}`}>
                               {format(d, 'EEE', { locale: vi })}
                             </span>
                             <span className={`text-base font-bold ${isSelected ? 'text-white' : 'text-[#3A2E2B]'} ${isWeekend && !isSelected ? 'text-rose-500' : ''}`}>
                               {format(d, 'dd')}
                             </span>
                             {isWeekend && (
                               <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-rose-400"></span>
                             )}
                          </button>
                        );
                      })}
                   </div>
                 </div>

                  <div>
                    <BookingCalendar
                      slotAvailability={slotAvailability}
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      onSelectDate={setSelectedDate}
                      onSelectTime={setSelectedTime}
                      totalDuration={rawDuration}
                    />
                  </div>

                 <div>
                    <label className="block text-xs font-bold tracking-wider uppercase text-gray-500 mb-2">Chọn kỹ thuật viên yêu thích (Nếu có)</label>
                    <select 
                      value={selectedStaff} 
                      onChange={(e) => setSelectedStaff(e.target.value)}
                      disabled={availableStaff.length === 0}
                      className={`w-full text-xs p-3 bg-white border border-[#EADDCD] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent outline-none transition-all font-semibold text-[#3A2E2B] ${availableStaff.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {availableStaff.length === 0 ? (
                        <option value="">⛔ Đã hết nhân viên trống trong khung giờ này</option>
                      ) : (
                        <option value="">✨ Sắp xếp ngẫu nhiên (Ưu tiên KTV rảnh trực tuyến)</option>
                      )}
                      {availableStaff.map(staff => (
                        <option key={staff.id} value={staff.id}>🌟 Nhân viên: {staff.full_name}</option>
                      ))}
                    </select>
                    {availableStaff.length === 0 && selectedTime && (
                      <p className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
                        ⏳ Khung giờ này đã hết nhân viên trực. Vui lòng chọn khung giờ khác hoặc quay lại sau.
                      </p>
                    )}
                 </div>

                 <div className="pt-4">
                    <LoadingButton
                      onClick={handleSubmit}
                      isLoading={isSubmitting}
                      loadingText="Đang lưu lịch hẹn..."
                      className="w-full bg-[#5C4033] hover:bg-[#3A2E2B] text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md uppercase tracking-wider text-xs"
                    >
                      Hoàn tất gửi lịch hẹn
                    </LoadingButton>
                 </div>
              </div>
            )}

            {step === 3 && (
               <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 py-6">
                 <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
                   <CheckCircle2 className="w-8 h-8" />
                 </div>
                 <h2 className="text-xl font-display font-bold text-[#3A2E2B] mb-2">Gửi Lịch Hẹn Thành Công!</h2>
                 <p className="text-sm text-gray-500 mb-8 max-w-xs leading-relaxed font-medium">
                   Cảm ơn quý khách <strong id="customer-name-lbl" className="text-[#3A2E2B] font-semibold">{name}</strong>. Lịch hẹn lúc <strong className="text-[#3A2E2B]">{selectedTime}</strong> ngày <strong className="text-[#3A2E2B]">{format(new Date(selectedDate), 'dd/MM/yyyy')}</strong> đã được hệ thống Min ghi nhận.
                 </p>
                 <button 
                   onClick={() => router.push('/')}
                   className="bg-[#FAF0E6] hover:bg-[#FAF6F0] text-[#8D6E53] border border-[#EADDCD] font-bold text-xs tracking-wider uppercase py-3.5 px-6 rounded-xl transition-colors"
                 >
                   Xem Bảng Giá Khác
                 </button>
               </div>
            )}
          </div>

          {/* Right Column: Premium Dynamic Booking Summary & Estimator (PC Design Extra Value) */}
          <div className="hidden lg:flex lg:w-2/5 flex-col bg-[#FAF8F5] border-t lg:border-t-0 lg:border-l border-[#EADDCD] p-6 lg:p-8 shrink-0">
             <div className="flex items-center gap-2 pb-4 border-b border-[#EADDCD] mb-6">
               <span className="p-1.5 bg-[#5C4033] text-white rounded-lg"><CheckCircle2 className="w-4 h-4" /></span>
               <h3 className="font-display font-extrabold text-sm tracking-wider text-[#5C4033] uppercase">Hóa Đơn / Lịch Trình Tạm Tính</h3>
             </div>

             {/* Booking Info Preview */}
             {selectedItemsData.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-12">
                 <div className="w-12 h-12 bg-[#FAF0E6] rounded-full flex items-center justify-center border border-[#EADDCD]/50">
                    <Sparkles className="w-5 h-5 text-[#8D6E53]" />
                 </div>
                 <p className="text-xs font-bold text-[#8D6E53] uppercase tracking-wider">Chưa chọn dịch vụ</p>
                 <p className="text-[11px] text-gray-400 max-w-[200px] leading-relaxed">
                   Vui lòng tick chọn ít nhất một dịch vụ làm móng, gội đầu dưỡng sinh hoặc massage để xem hóa đơn chi tiết.
                 </p>
               </div>
             ) : (
               <div className="flex-1 flex flex-col justify-between space-y-6">
                 
                 {/* Live Service Lines */}
                 <div className="space-y-4">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dịch vụ đã chọn ({selectedServices.length})</p>
                   <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                     {selectedItemsData.map(item => (
                       <div key={item.id} className="flex justify-between items-start text-xs group">
                         <div className="space-y-0.5 max-w-[70%]">
                            <p className="font-semibold text-gray-800 leading-tight">{item.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{item.duration || 30} phút</p>
                         </div>
                         <span className="font-extrabold text-gray-700">{(item.price).toLocaleString('vi')}đ</span>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Active Booking Data Resume (Dynamic Badge Info) */}
                 {(selectedTime || selectedStaffName || name) && (
                   <div className="p-4 bg-white rounded-2xl border border-[#EADDCD]/60 space-y-3">
                     <p className="text-[10px] font-bold text-[#8D6E53] uppercase tracking-widest border-b border-[#FAF6F0] pb-1.5 flex items-center gap-1.5">
                       <Calendar className="w-3.5 h-3.5" /> Thông tin giữ chỗ
                     </p>
                     
                     {name && (
                       <div className="flex items-center gap-2 text-xs font-semibold">
                         <User className="w-3.5 h-3.5 text-gray-400" />
                         <span className="text-gray-500">Khách hàng:</span>
                         <span className="text-[#3A2E2B] line-clamp-1 font-bold">{name}</span>
                       </div>
                     )}

                     {selectedDate && (
                       <div className="flex items-center gap-2 text-xs font-semibold">
                         <Calendar className="w-3.5 h-3.5 text-gray-400" />
                         <span className="text-gray-500">Ngày hẹn:</span>
                         <span className="text-[#3A2E2B] font-bold">{format(new Date(selectedDate), 'dd/MM/yyyy')}</span>
                       </div>
                     )}

                     {selectedTime && (
                       <div className="flex items-center gap-2 text-xs font-semibold">
                         <Clock className="w-3.5 h-3.5 text-gray-400" />
                         <span className="text-gray-500">Giờ làm:</span>
                         <span className="bg-amber-100/80 text-amber-800 px-1.5 py-0.5 rounded-md font-extrabold text-[10px] tracking-wide">{selectedTime}</span>
                       </div>
                     )}

                     {selectedStaffName && (
                       <div className="flex items-center gap-2 text-xs font-semibold">
                         <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                         <span className="text-gray-500">Thợ yêu thích:</span>
                         <span className="text-[#3A2E2B] font-bold">{selectedStaffName}</span>
                       </div>
                     )}
                   </div>
                 )}

                 {/* Calculations Area */}
                 <div className="border-t border-[#EADDCD] pt-4 space-y-3 shrink-0">
                   <div className="flex justify-between text-xs text-gray-500 font-medium">
                     <span>Giá niêm yết:</span>
                     <span>{(rawTotal).toLocaleString('vi')}đ</span>
                   </div>
                   
                    {discountSettings.enabled && discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                      <span className="flex items-center gap-1">🎁 Đặt lịch Online (-{discountSettings.percent}%):</span>
                      <span>- {(discountAmount).toLocaleString('vi')}đ</span>
                    </div>
                    )}

                   <div className="h-px bg-[#EADDCD]/45 my-2"></div>

                   <div className="flex justify-between items-end">
                     <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Tổng tiền ước lượng</p>
                       <p className="text-[10px] text-gray-400 italic">Thanh toán tại quầy khi xong dịch vụ</p>
                     </div>
                     <span className="text-xl font-black text-[#5C4033] tracking-tight font-display">{(finalTotal).toLocaleString('vi')}đ</span>
                   </div>

                   <div className="pt-2">
                     <div className="p-3 bg-white rounded-xl border border-[#EADDCD]/50 text-[10px] font-semibold text-gray-500 flex gap-1.5 leading-relaxed">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                       Nhà Min miễn phí giữ chỗ 100%. Quý khách có thể hủy hoặc dời lịch bất cứ lúc nào qua điện thoại.
                     </div>
                   </div>
                 </div>

               </div>
             )}
          </div>

        </div>

      </div>
      <BottomNavigation />
      <LoadingOverlay isVisible={isSubmitting} message="Đang gửi lịch hẹn..." />
    </div>
  );
}
