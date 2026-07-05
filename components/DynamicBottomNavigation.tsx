'use client';
import dynamic from 'next/dynamic';

const BottomNavigation = dynamic(() => import('./BottomNavigation'), { ssr: false });

export default BottomNavigation;
