'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, Sparkles, Calendar, BookOpen, User, 
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
  const isHome = !isStaff && !isAdmin && (pathname === '/' || pathname?.startsWith('/blog') || pathname === '/booking');

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

  // Render navigation item
  const renderItem = (icon: React.ReactNode, label: string, onClick: () => void, isActive: boolean) => (
    <button
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`flex flex-col items-center justify-center flex-1 min-w-0 min-h-[44px] py-1.5 transition-all duration-300 relative ${
        isActive 
          ? 'text-[#5C4033] font-bold scale-105' 
          : 'text-stone-400 hover:text-stone-600'
      }`}
    >
      <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-[#FAF0E6] text-[#8D6E53]' : 'bg-transparent'}`}>
        {icon}
      </div>
      <span className="text-[11px] mt-0.5 font-medium font-sans truncate w-full text-center px-0.5">{label}</span>
      {isActive && (
        <span className="absolute bottom-0 w-6 h-[3px] bg-[#8D6E53] rounded-full" />
      )}
    </button>
  );

  const renderLinkItem = (icon: React.ReactNode, label: string, href: string, isActive: boolean) => (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`flex flex-col items-center justify-center flex-1 min-w-0 min-h-[44px] py-1.5 transition-all duration-300 relative ${
        isActive 
          ? 'text-[#5C4033] font-bold scale-105' 
          : 'text-stone-400 hover:text-stone-600'
      }`}
    >
      <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-[#FAF0E6] text-[#8D6E53]' : 'bg-transparent'}`}>
        {icon}
      </div>
      <span className="text-[11px] mt-0.5 font-medium font-sans truncate w-full text-center px-0.5">{label}</span>
      {isActive && (
        <span className="absolute bottom-0 w-6 h-[3px] bg-[#8D6E53] rounded-full" />
      )}
    </Link>
  );

  return (
    <>
      {/* Spacer to prevent bottom content being covered by the sticky bar on mobile devices */}
      <div className="md:hidden h-[calc(4rem+env(safe-area-inset-bottom))]" />

      <nav className="fixed bottom-0 inset-x-0 w-full z-50 bg-[#FAF6F0]/95 backdrop-blur-md border-t border-[#EADDCD] px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden">
        {/* HOMEPAGE / BLOGS / BOOKINGS ROUTING BAR */}
        {isHome && (
          <>
            {renderLinkItem(
              <Home className="w-5 h-5" />,
              'Trang Chủ',
              '/',
              pathname === '/'
            )}
            {renderLinkItem(
              <Sparkles className="w-5 h-5" />,
              'Dịch Vụ',
              '/#services',
              false
            )}
            {renderLinkItem(
              <Calendar className="w-5 h-5" />,
              'Đặt Lịch',
              '/booking',
              pathname === '/booking'
            )}
            {renderLinkItem(
              <BookOpen className="w-5 h-5" />,
              'Tin Tức',
              '/blog',
              pathname?.startsWith('/blog') || false
            )}
            {renderLinkItem(
              <User className="w-5 h-5" />,
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
              <Clock className="w-5 h-5" />,
              'Lịch Hẹn',
              () => handleStaffTabChange('SCHEDULE'),
              activeTab === 'SCHEDULE'
            )}
            {renderItem(
              <CalendarCheck className="w-5 h-5" />,
              'Lịch Tổng',
              () => handleStaffTabChange('MASTER'),
              activeTab === 'MASTER'
            )}
            {renderItem(
              <CheckCircle2 className="w-5 h-5" />,
              'Điểm Danh',
              () => handleStaffTabChange('ATTENDANCE'),
              activeTab === 'ATTENDANCE'
            )}
            {renderItem(
              <Package className="w-5 h-5" />,
              'Bán Gói',
              () => handleStaffTabChange('SELL_PACKAGE'),
              activeTab === 'SELL_PACKAGE'
            )}
            {renderItem(
              <BarChart className="w-5 h-5" />,
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
              <Home className="w-5 h-5" />,
              'Tổng Quan',
              () => handleAdminTabChange('DASHBOARD'),
              pathname === '/admin' && activeTab === 'DASHBOARD'
            )}
            {renderLinkItem(
              <ClipboardCheck className="w-5 h-5" />,
              'Đơn Hàng',
              '/admin/orders',
              pathname === '/admin/orders'
            )}
            {renderLinkItem(
              <CalendarCheck className="w-5 h-5" />,
              'Lịch Tổng',
              '/admin/schedule',
              pathname === '/admin/schedule'
            )}
            {renderItem(
              <Menu className="w-5 h-5" />,
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
