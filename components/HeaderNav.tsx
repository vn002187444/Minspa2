'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';
import { motion } from 'motion/react';
import NotificationBell from '@/components/NotificationBell';

const NAV_ITEMS = [
  { id: 'Deal-Chan-Dong', label: 'Góc Deal', href: '#category-Deal-Chan-Dong' },
  { id: 'Goi-duong-sinh', label: 'Gội Dưỡng Sinh', href: '#category-Goi-duong-sinh' },
  { id: 'Cha-Got-Chan', label: 'Chà Gót Chân', href: '#category-Cha-Got-Chan' },
  { id: 'Massage', label: 'Massage Body', href: '#category-Massage' },
];

export default function HeaderNav() {
  const [activeSection, setActiveSection] = useState<string>('');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-25% 0px -45% 0px',
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
        const sectionKey = elementId.replace('category-', '');
        setActiveSection(sectionKey);
      }
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    NAV_ITEMS.forEach((item) => {
      const el = document.getElementById(`category-${item.id}`);
      if (el) observer.observe(el);
    });

    return () => {
      NAV_ITEMS.forEach((item) => {
        const el = document.getElementById(`category-${item.id}`);
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  return (
    <motion.nav
      id="nav-header"
      className="sticky top-0 inset-x-0 z-50 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#EADDCD] transition-all relative"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
        
        {/* Brand / Logo — compact on mobile, full on desktop */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-[#c08063] rounded-full flex items-center justify-center shadow-md border border-[#EADDCD]">
            <span className="font-display text-lg md:text-xl font-bold text-[#F5EBE0] tracking-wider">M</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-display font-black text-lg md:text-xl tracking-wider text-[#3A2E2B] uppercase block">MIN</span>
            <span className="text-[9px] md:text-[10px] tracking-[0.25em] text-[#8D6E53] uppercase font-bold block -mt-1">Nail & Hair Salon</span>
          </div>
        </div>
        
        {/* Desktop Links with Framer Motion Layout Transitions */}
        <div className="hidden md:flex items-center gap-2 text-sm font-medium relative">
          {NAV_ITEMS.map((item) => {
            const isHovered = hoveredSection === item.id;
            const isActive = activeSection === item.id;

            return (
              <a
                key={item.id}
                href={item.href}
                className="relative px-4 py-2 text-[#3A2E2B] hover:text-[#8D6E53] transition-colors rounded-lg text-xs tracking-wider uppercase font-bold select-none group"
                onMouseEnter={() => setHoveredSection(item.id)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                {/* Active Underline Effect */}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#8D6E53] rounded-full"
                  />
                )}

                {/* Hover Pill Effect */}
                {isHovered && (
                  <div
                    className="absolute inset-0 bg-[#EADDCD]/30 rounded-lg -z-10"
                  />
                )}
                
                <span className="relative z-10 transition-transform duration-300 group-hover:scale-105 inline-block">
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-[#EADDCD] shadow-lg z-50">
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-4 text-sm font-bold text-[#3A2E2B] hover:text-[#8D6E53] hover:bg-[#FAF6F0] rounded-lg transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#3A2E2B] hover:text-[#8D6E53] transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* CTAs */}
        <div className="flex items-center gap-2 md:gap-3">
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
    </motion.nav>
  );
}
