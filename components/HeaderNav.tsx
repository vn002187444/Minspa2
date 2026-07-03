'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import NotificationBell from '@/components/NotificationBell';

const NAV_ITEMS = [
  { id: 'Deal-Chan-Dong', label: 'Góc Deal', href: '#category-Deal-Chan-Dong' },
  { id: 'Goi-duong-sinh', label: 'Gội Dưỡng Sinh', href: '#category-Goi-duong-sinh' },
  { id: 'Cha-Got-Chan', label: 'Chà Gót Chân', href: '#category-Cha-Got-Chan' },
  { id: 'Massage', label: 'Massage Body', href: '#category-Massage' },
  { id: 'Cham-Soc-Trang-Tri-Mong', label: 'Chăm Sóc & Trang Trí Móng', href: '#category-Cham-Soc-Trang-Tri-Mong' },
  { id: 'about', label: 'Giới Thiệu', href: '/about' },
  { id: 'faq', label: 'Hỏi Đáp', href: '/faq' },
];

const MOBILE_NAV_ITEMS = [
  { id: 'Deal-Chan-Dong', label: '🔥 Hot Deal', href: '#category-Deal-Chan-Dong' },
  { id: 'Goi-duong-sinh', label: '💆 Gội Dưỡng Sinh', href: '#category-Goi-duong-sinh' },
  { id: 'Massage', label: '💪 Massage', href: '#category-Massage' },
  { id: 'Cham-Soc-Trang-Tri-Mong', label: '💅 Làm Móng', href: '#category-Cham-Soc-Trang-Tri-Mong' },
  { id: 'Cha-Got-Chan', label: '👣 Chà Gót', href: '#category-Cha-Got-Chan' },
  { id: 'goi-vip', label: '🎁 Combo VIP', href: '#services' },
  { id: 'reviews', label: '⭐ Đánh Giá', href: '#reviews' },
  { id: 'about', label: '📖 Giới Thiệu', href: '/about' },
  { id: 'faq', label: '❓ Hỏi Đáp', href: '/faq' },
];

const MOBILE_OBSERVE_IDS = [
  ...NAV_ITEMS.map(i => ({ id: `category-${i.id}`, key: i.id })),
  { id: 'reviews', key: 'reviews' },
  { id: 'faq', key: 'faq' },
];

interface HeaderNavProps {
  logoUrl?: string;
}

export default function HeaderNav({ logoUrl }: HeaderNavProps) {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -45% 0px',
      threshold: [0, 0.1, 0.2, 0.5, 0.8],
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const intersectingEntries = entries.filter((entry) => entry.isIntersecting);
      
      if (intersectingEntries.length > 0) {
        const topmost = intersectingEntries.reduce((prev, current) => {
          const prevTop = Math.abs(prev.boundingClientRect.top);
          const currentTop = Math.abs(current.boundingClientRect.top);
          return currentTop < prevTop ? current : prev;
        });
        
        const elementId = topmost.target.id;
        const match = MOBILE_OBSERVE_IDS.find(o => o.id === elementId);
        if (match) {
          setActiveCategory(match.key);
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    MOBILE_OBSERVE_IDS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <motion.nav
      id="nav-header"
      className="sticky top-0 inset-x-0 z-50 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#EADDCD] transition-all shadow-sm"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {logoUrl ? (
            <Link href="/" className="flex items-center gap-2 md:gap-3">
                <Image
                  src={logoUrl}
                  alt="Min Nail & Hair"
                  width={160}
                  height={48}
                  className="h-8 md:h-10 w-auto object-contain"
                  unoptimized
                  priority
                />
            </Link>
          ) : (
            <>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-[#c08063] rounded-full flex items-center justify-center shadow-md border border-[#EADDCD]">
                <span className="font-display text-lg md:text-xl font-bold text-[#F5EBE0] tracking-wider">M</span>
              </div>
              <div>
                <span className="font-display font-black text-sm md:text-xl tracking-wider text-[#3A2E2B] uppercase block">MIN SALON</span>
                <span className="text-[8px] md:text-[10px] tracking-[0.2em] text-[#5C4033] uppercase font-bold block -mt-1">Nail &amp; Hair Spa</span>
              </div>
            </>
          )}
        </div>
        
        {/* Desktop Links — Original Category Navigation */}
        <div className="hidden md:flex items-center gap-1.5 text-sm font-medium relative">
          {NAV_ITEMS.map((item) => {
            const isHovered = hoveredSection === item.id;
            const isActive = activeCategory === item.id;

            return (
              <a
                key={item.id}
                href={item.href}
                className={`relative px-4 py-2 transition-colors rounded-lg text-xs tracking-wider uppercase font-bold select-none group ${
                  isActive ? 'text-[#8D6E53]' : 'text-[#3A2E2B] hover:text-[#8D6E53]'
                }`}
                onMouseEnter={() => setHoveredSection(item.id)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeUnderlineDesktop"
                    className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#8D6E53] rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {isHovered && (
                  <motion.div
                    layoutId="hoverPillDesktop"
                    className="absolute inset-0 bg-[#EADDCD]/30 rounded-lg -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                <span className="relative z-10 transition-transform duration-300 group-hover:scale-105 inline-block">
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          <NotificationBell />
          <Link 
            href="/booking" 
            className="text-[10px] md:text-xs font-bold tracking-widest text-[#FFF] bg-[#8D6E53] hover:bg-[#3A2E2B] px-3 md:px-5 py-2 md:py-3 rounded-full transition-all flex items-center gap-1 md:gap-2 shadow-md hover:shadow-lg uppercase"
          >
            Booking <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#F5EBE0]" />
          </Link>
          <Link 
            href="/login" 
            className="hidden sm:inline-flex text-xs font-semibold text-[#5C4033] hover:text-[#3A2E2B] bg-[#EADDCD]/50 hover:bg-[#EADDCD] px-3 py-2.5 md:px-3.5 md:py-3 rounded-full transition-all"
          >
            Nhân Viên
          </Link>
        </div>
      </div>

      {/* Mobile Category Navigation Bar — Wrapping Pill Row */}
      <div className="md:hidden flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-3 py-2.5 bg-[#FAF6F0]/95 border-t border-[#EADDCD]/40">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = activeCategory === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all min-h-[34px] flex items-center whitespace-nowrap border ${
                isActive
                  ? "text-[#FFF] bg-[#8D6E53] border-[#8D6E53] shadow-sm"
                  : "text-[#5C4033] bg-white border-[#EADDCD] hover:border-[#8D6E53] hover:text-[#8D6E53]"
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </motion.nav>
  );
}