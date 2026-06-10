'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'Deal-Chan-Dong', label: 'Góc Deal', href: '#category-Deal-Chan-Dong' },
  { id: 'Goi-duong-sinh', label: 'Gội Dưỡng Sinh', href: '#category-Goi-duong-sinh' },
  { id: 'Cha-Got-Chan', label: 'Chà Gót Chân', href: '#category-Cha-Got-Chan' },
  { id: 'Massage', label: 'Massage Body', href: '#category-Massage' },
];

export default function HeaderNav() {
  const [activeSection, setActiveSection] = useState<string>('');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

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
    <nav id="nav-header" className="sticky top-0 inset-x-0 z-50 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#EADDCD] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#c08063] rounded-full flex items-center justify-center shadow-md border border-[#EADDCD]">
            <span className="font-display text-xl font-bold text-[#F5EBE0] tracking-wider">M</span>
          </div>
          <div>
            <span className="font-display font-black text-xl tracking-wider text-[#3A2E2B] uppercase block">MIN</span>
            <span className="text-[10px] tracking-[0.25em] text-[#8D6E53] uppercase font-bold block -mt-1">Nail & Hair Salon</span>
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
                  <motion.div
                    layoutId="nav-active"
                    className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#8D6E53] rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}

                {/* Hover Pill Effect */}
                {isHovered && (
                  <motion.div
                    layoutId="nav-hover"
                    className="absolute inset-0 bg-[#EADDCD]/30 rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
        <div className="flex items-center gap-3">
          <Link 
            href="/booking" 
            className="text-xs font-bold tracking-widest text-[#FFF] bg-[#8D6E53] hover:bg-[#3A2E2B] px-5 py-3 rounded-full transition-all flex items-center gap-2 shadow-md hover:shadow-lg uppercase"
          >
            Booking <ArrowRight className="w-4 h-4 text-[#F5EBE0]" />
          </Link>
          <Link 
            href="/login" 
            className="text-xs font-semibold text-[#5C4033] hover:text-[#3A2E2B] bg-[#EADDCD]/50 hover:bg-[#EADDCD] px-3.5 py-3 rounded-full transition-all"
          >
            Nhân Viên
          </Link>
        </div>
      </div>
    </nav>
  );
}
