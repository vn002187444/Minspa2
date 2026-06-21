'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import BottomNavigation from '@/components/BottomNavigation';

const MasterSchedule = dynamic(() => import('@/components/MasterSchedule'), {
  loading: () => <div className="animate-pulse space-y-4 p-4"><div className="h-64 bg-gray-200 rounded-xl" /></div>,
});

export default function MasterSchedulePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen bg-[#FAF6F0] p-4 sm:p-6 text-[#3A2E2B]">
      <div className="max-w-7xl xxl:max-w-[1500px] mx-auto space-y-6">
        <button 
          onClick={() => router.push('/admin')} 
          className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#8D6E53] hover:text-[#5C4033] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Dashboard
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 bg-white p-4 sm:p-5 rounded-3xl border border-[#EADDCD] shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-[#3A2E2B]">Biểu Đồ Lịch Tổng</h1>
            <p className="text-xs text-gray-500 mt-1">Điều phối nhân viên kỹ thuật và theo dõi rảnh/bận trong thời gian thực</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-600 hidden sm:inline-block">Chọn ngày:</span>
            <div className="w-full sm:w-max px-4 py-2 bg-[#FAF6F0] border border-[#EADDCD] hover:border-[#8D6E53] transition-colors cursor-pointer rounded-2xl text-sm font-bold text-gray-700 flex items-center justify-between gap-2 shadow-inner">
              <CalendarIcon className="w-4 h-4 text-[#8D6E53]" />
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                  }
                }}
                className="bg-transparent border-none focus:ring-0 outline-none text-[#5C4033] cursor-pointer w-full text-right sm:text-left"
              />
            </div>
          </div>
        </div>

        {/* Master Schedule UI in Admin Mode */}
        <MasterSchedule mode="ADMIN" dateOverride={selectedDate} />
      </div>
      <BottomNavigation />
    </div>
  );
}
