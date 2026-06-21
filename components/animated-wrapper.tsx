'use client'

import { ReactNode } from 'react';

export default function AnimatedWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="animate-fadeIn">
      {children}
    </div>
  );
}
