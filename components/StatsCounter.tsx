'use client'

import { useEffect, useRef, useState } from 'react';

interface StatsCounterProps {
  end: number;
  suffix?: string;
  label: string;
  icon: string;
}

function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          started.current = true;
          observer.unobserve(el);
          const duration = 1500;
          const steps = 30;
          const increment = end / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{count.toLocaleString('vi-VN')}{suffix}</span>;
}

export default function StatsCounter({ end, suffix = '', label, icon }: StatsCounterProps) {
  return (
    <div className="text-center space-y-2">
      <div className="text-3xl">{icon}</div>
      <div className="text-3xl md:text-4xl font-black text-[#5C4033] font-mono">
        <Counter end={end} suffix={suffix} />
      </div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  );
}
