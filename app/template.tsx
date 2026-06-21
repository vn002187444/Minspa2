'use client'

import AnimatedWrapper from '@/components/animated-wrapper';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <AnimatedWrapper key={pathname}>{children}</AnimatedWrapper>;
}
