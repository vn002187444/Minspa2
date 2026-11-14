'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, Sparkles, Calendar, BookOpen, User, HelpCircle,
  Clock, CalendarCheck, CheckCircle2, Package, BarChart,
  ClipboardCheck, Menu
} from 'lucide-react';

interface BottomNavigationProps {
  activeTab?: string;
  setActiveTab?: (_tab: string) => void;
  onMenuClick?: () => void;
}

export default function BottomNavigation({ activeTab, setActiveTab, onMenuClick }: BottomNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine if we are on Homepage, Staff dashboard, or Admin dashboard
  const isStaff = pathname?.startsWith('/staff');
  const isAdmin = pathname?.startsWith('/admin');
  const isHome = !isStaff && !isAdmin && (pathname === '/' || pathname?.startsWith('/blog') || pathname === '/booking' || pathname === '/about' || pathname === '/faq' || pathname?.startsWith('/dich-vu') || pathname === '/game' || pathname === '/notifications');

  // Handle local tab transitions or external link navigation
  const handleAdminTabChange = (tabId: string) => {
    if (setActiveTab) {
      setActiveTab(tabId);
    } else {
      router.push(`/admin?tab=${tabId}`);
    }
  };

  const handleStaffTabChange = (tabId: string) => {
    if (setActiveTab) {
      setActiveTab(tabId);
    } else {
      router.push(`/staff?tab=${tabId}`);
    }
  };

  // Render navigation item (for button actions with iOS haptic feedback feeling)
  const renderItem = (icon: React.ReactNode, label: string, onClick: () => void, isActive: boolean) => (
    <button
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
      className={`group flex flex-col items-center justify-center flex-1 min-w-0 min-h-[44px] py-1 transition-all duration-200 active:scale-95 select-none relative ${
        isActive 
          ? 'text-[#5C4033] font-bold' 
          : 'text-stone-400 hover:text-stone-600'
      }`}
    >
      <div className={`p-1.5 rounded-2xl transition-all duration-300 flex items-center justify-center ${
        isActive 
          ? 'bg-[#8D6E53]/15 text-[#5C4033] shadow-sm ring-1 ring-[#8D6E53]/20' 
          : 'bg-transparent text-stone-400 group-hover:text-stone-600'
      }`}>
        {icon}
      </div>
      <span className={`text-[10px] leading-tight mt-0.5 tracking-tight font-medium font-sans truncate w-full text-center px-0.5 transition-colors ${
        isActive ? 'text-[#5C4033] font-semibold' : 'text-stone-500'
      }`}>
        {label}
      </span>
      {isActive && (
        <span className="absolute bottom-0.5 w-5 h-[2.5px] bg-[#8D6E53] rounded-full shadow-[0_1px_4px_rgba(141,110,83,0.4)]" />
      )}
    </button>
  );

  // Render link navigation item (for routing with iOS haptic feedback feeling)
  const renderLinkItem = (icon: React.ReactNode, label: string, href: string, isActive: boolean) => (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
      className={`group flex flex-col items-center justify-center flex-1 min-w-0 min-h-[44px] py-1 transition-all duration-200 active:scale-95 select-none relative ${
        isActive 
          ? 'text-[#5C4033] font-bold' 
          : 'text-stone-400 hover:text-stone-600'
      }`}
    >
      <div className={`p-1.5 rounded-2xl transition-all duration-300 flex items-center justify-center ${
        isActive 
          ? 'bg-[#8D6E53]/15 text-[#5C4033] shadow-sm ring-1 ring-[#8D6E53]/20' 
          : 'bg-transparent text-stone-400 group-hover:text-stone-600'
      }`}>
        {icon}
      </div>
      <span className={`text-[10px] leading-tight mt-0.5 tracking-tight font-medium font-sans truncate w-full text-center px-0.5 transition-colors ${
        isActive ? 'text-[#5C4033] font-semibold' : 'text-stone-500'
      }`}>
        {label}
      </span>
      {isActive && (
        <span className="absolute bottom-0.5 w-5 h-[2.5px] bg-[#8D6E53] rounded-full shadow-[0_1px_4px_rgba(141,110,83,0.4)]" />
      )}
    </Link>
  );

  return (
    <>
      {/* Spacer to prevent bottom content being covered by the sticky bar on mobile devices */}
      <div className="md:hidden h-[calc(4.5rem+env(safe-area-inset-bottom))]" />

      <nav 
        role="navigation"
        aria-label="Bottom Navigation"
        className="fixed bottom-0 inset-x-0 w-full z-40 bg-white/75 backdrop-blur-xl backdrop-saturate-180 border-t border-white/40 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-1.5 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-center justify-around md:hidden"
      >
        {/* HOMEPAGE / BLOGS / BOOKINGS ROUTING BAR */}
        {isHome && (
          <>
            {renderLinkItem(
              <Home className="w-5 h-5" aria-hidden="true" />,
              'Trang Chủ',
              '/',
              pathname === '/'
            )}
            {renderLinkItem(
              <Sparkles className="w-5 h-5" aria-hidden="true" />,
              'Dịch Vụ',
              '/#services',
              false
            )}
            {renderLinkItem(
              <Calendar className="w-5 h-5" aria-hidden="true" />,
              'Đặt Lịch',
              '/booking',
              pathname === '/booking'
            )}
            {renderLinkItem(
              <BookOpen className="w-5 h-5" aria-hidden="true" />,
              'Tin Tức',
              '/blog',
              pathname?.startsWith('/blog') || false
            )}
            {renderLinkItem(
              <HelpCircle className="w-5 h-5" aria-hidden="true" />,
              'FAQ',
              '/faq',
              pathname === '/faq'
            )}
            {renderLinkItem(
              <User className="w-5 h-5" aria-hidden="true" />,
              'Đăng Nhập',
              '/login',
              pathname === '/login'
            )}
          </>
        )}

        {/* STAFF AREA BOTTOM BAR */}
        {isStaff && (
          <>
            {renderItem(
              <Clock className="w-5 h-5" aria-hidden="true" />,
              'Lịch Hẹn',
              () => handleStaffTabChange('SCHEDULE'),
              activeTab === 'SCHEDULE'
            )}
            {renderItem(
              <CalendarCheck className="w-5 h-5" aria-hidden="true" />,
              'Lịch Tổng',
              () => handleStaffTabChange('MASTER'),
              activeTab === 'MASTER'
            )}
            {renderItem(
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />,
              'Điểm Danh',
              () => handleStaffTabChange('ATTENDANCE'),
              activeTab === 'ATTENDANCE'
            )}
            {renderItem(
              <Package className="w-5 h-5" aria-hidden="true" />,
              'Bán Gói',
              () => handleStaffTabChange('SELL_PACKAGE'),
              activeTab === 'SELL_PACKAGE'
            )}
            {renderItem(
              <BarChart className="w-5 h-5" aria-hidden="true" />,
              'Báo Cáo',
              () => handleStaffTabChange('REPORTS'),
              activeTab === 'REPORTS'
            )}
          </>
        )}

        {/* ADMIN AREA BOTTOM BAR */}
        {isAdmin && (
          <>
            {renderItem(
              <Home className="w-5 h-5" aria-hidden="true" />,
              'Tổng Quan',
              () => handleAdminTabChange('DASHBOARD'),
              pathname === '/admin' && activeTab === 'DASHBOARD'
            )}
            {renderLinkItem(
              <ClipboardCheck className="w-5 h-5" aria-hidden="true" />,
              'Đơn Hàng',
              '/admin/orders',
              pathname === '/admin/orders'
            )}
            {renderLinkItem(
              <CalendarCheck className="w-5 h-5" aria-hidden="true" />,
              'Lịch Tổng',
              '/admin/schedule',
              pathname === '/admin/schedule'
            )}
            {renderItem(
              <Menu className="w-5 h-5" aria-hidden="true" />,
              'Menu',
              () => onMenuClick?.(),
              false
            )}
          </>
        )}
      </nav>
    </>
  );
}
