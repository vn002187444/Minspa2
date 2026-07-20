'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'

const MascotProvider = dynamic(() => import('@/components/MascotProvider'), { ssr: false })

export default function MascotLoader({ children }: { children: ReactNode }) {
  return <MascotProvider>{children}</MascotProvider>
}
