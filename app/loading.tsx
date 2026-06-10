'use client';

import React from 'react';

export default function Loading() {
  return (
    <div id="global-page-loader" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF6F0] text-[#3A2E2B] transition-opacity duration-300">
      {/* Decorative blurred backgrounds for luxury ambiance */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-[#EADDCD]/30 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-pink-100/40 blur-3xl" />

      <div className="relative flex flex-col items-center max-w-xs text-center space-y-6 px-6 animate-fadeIn">
        {/* Animated Elegant Logo Sphere & Spinner */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Subtle slow rotating background gold border */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#8D6E53]/30 animate-[spin_12s_linear_infinite]" />
          
          {/* Active fast glowing pink/rose spinner segment */}
          <div className="absolute inset-[-4px] rounded-full border-t-2 border-r-2 border-pink-500 animate-spin" />
          
          {/* Glowing central circle */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#8D6E53] to-[#B09780] shadow-md flex items-center justify-center text-white scale-100 animate-pulse">
            <span className="text-xl font-serif italic text-amber-50">M</span>
          </div>

          {/* Sparkling dots popping in and out */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-pink-500"></span>
          </span>
        </div>

        <div className="space-y-2">
          {/* Main heading */}
          <h2 className="font-display font-semibold text-base tracking-widest text-[#3A2E2B] uppercase">
            Min Nail & Gội Đầu
          </h2>
          {/* Subtitle / Status with microdots */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 font-medium">
            <span>Đang tải không gian an yên</span>
            <span className="flex space-x-1">
              <span className="w-1 h-1 bg-[#8D6E53] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-1 bg-[#8D6E53] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-1 bg-[#8D6E53] rounded-full animate-bounce"></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
