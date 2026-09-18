'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LanguageSwitcher from '@/lib/i18n/LanguageSwitcher';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import NotificationBell from '@/components/NotificationBell';
import { COOKIE_NAME, DEFAULT_LOCALE, type Dictionary } from '@/lib/i18n/config';
import viDict from '@/lib/i18n/dictionaries/vi.json';
import enDict from '@/lib/i18n/dictionaries/en.json';

const DICTS: Record<string, Dictionary> = { vi: viDict as Dictionary, en: enDict as Dictionary };

function getNavItems(t: (k: string) => string) {
  return [
    { id: 'Deal-Chan-Dong', label: t('nav.deal'), href: '#category-Deal-Chan-Dong' },
    { id: 'Goi-duong-sinh', label: t('nav.hairWash'), href: '#category-Goi-duong-sinh' },
    { id: 'Cha-Got-Chan', label: t('nav.footScrub'), href: '#category-Cha-Got-Chan' },
    { id: 'Massage', label: t('nav.massage'), href: '#category-Massage' },
    { id: 'Cham-Soc-Trang-Tri-Mong', label: t('nav.nail'), href: '#category-Cham-Soc-Trang-Tri-Mong' },
    { id: 'about', label: t('nav.about'), href: '/about' },
    { id: 'faq', label: t('nav.faq'), href: '/faq' },
  ];
}
function getMobileNavItems(t: (k: string) => string) {
  return [
    { id: 'Deal-Chan-Dong', label: t('nav.mobile.deal'), href: '#category-Deal-Chan-Dong' },
    { id: 'Goi-duong-sinh', label: t('nav.mobile.hairWash'), href: '#category-Goi-duong-sinh' },
    { id: 'Massage', label: t('nav.mobile.massage'), href: '#category-Massage' },
    { id: 'Cham-Soc-Trang-Tri-Mong', label: t('nav.mobile.nail'), href: '#category-Cham-Soc-Trang-Tri-Mong' },
    { id: 'Cha-Got-Chan', label: t('nav.mobile.footScrub'), href: '#category-Cha-Got-Chan' },
    { id: 'goi-vip', label: t('nav.mobile.vipCombo'), href: '#services' },
    { id: 'reviews', label: t('nav.mobile.reviews'), href: '#reviews' },
    { id: 'about', label: t('nav.mobile.about'), href: '/about' },
    { id: 'faq', label: t('nav.mobile.faq'), href: '/faq' },
  ];
}

const NAV_IDS = ['Deal-Chan-Dong', 'Goi-duong-sinh', 'Cha-Got-Chan', 'Massage', 'Cham-Soc-Trang-Tri-Mong', 'about', 'faq'];
const MOBILE_OBSERVE_IDS = [
  ...NAV_IDS.slice(0, 5).map(id => ({ id: `category-${id}`, key: id })),
  { id: 'reviews', key: 'reviews' },
  { id: 'faq', key: 'faq' },
];

interface HeaderNavProps {
  logoUrl?: string;
}

export default function HeaderNav({ logoUrl }: HeaderNavProps) {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [showMobileCategories, setShowMobileCategories] = useState(true);
  const lastScrollY = useRef(0);
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  useEffect(() => {
    const m = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
    if (m && DICTS[m[2]]) setLocale(m[2]);
  }, []);
  const dict = DICTS[locale] || DICTS[DEFAULT_LOCALE];
  const t = (k: string) => dict[k] || DICTS[DEFAULT_LOCALE][k] || k;
  const NAV_ITEMS = getNavItems(t);
  const MOBILE_NAV_ITEMS = getMobileNavItems(t);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const prevScrollY = lastScrollY.current;

      if (currentScrollY < 50) {
        setShowMobileCategories(true);
      } else if (currentScrollY > prevScrollY && currentScrollY - prevScrollY > 10) {
        setShowMobileCategories(false);
      } else if (currentScrollY < prevScrollY && prevScrollY - currentScrollY > 10) {
        setShowMobileCategories(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
                  priority
                  fetchPriority="high"
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
          <LanguageSwitcher />
          <Link 
            href="/booking" 
            className="text-[10px] md:text-xs font-bold tracking-widest text-[#FFF] bg-[#8D6E53] hover:bg-[#3A2E2B] px-3 md:px-5 py-2 md:py-3 rounded-full transition-all flex items-center gap-1 md:gap-2 shadow-md hover:shadow-lg uppercase"
          >
            {t('nav.booking')}             <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#F5EBE0]" aria-hidden="true" />
          </Link>
          <Link 
            href="/login" 
            className="hidden sm:inline-flex text-xs font-semibold text-[#5C4033] hover:text-[#3A2E2B] bg-[#EADDCD]/50 hover:bg-[#EADDCD] px-3 py-2.5 md:px-3.5 md:py-3 rounded-full transition-all"
          >
            {t('nav.staff')}
          </Link>
        </div>
      </div>

      {/* Mobile Category Navigation Bar — Wrapping Pill Row */}
      <div 
        className={`md:hidden flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-3 bg-[#FAF6F0]/95 transition-all duration-300 ease-in-out overflow-hidden ${
          showMobileCategories 
            ? 'max-h-40 py-2.5 opacity-100 border-t border-[#EADDCD]/40' 
            : 'max-h-0 py-0 opacity-0 border-t-transparent pointer-events-none'
        }`}
      >
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = activeCategory === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all min-h-[44px] flex items-center whitespace-nowrap border ${
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