'use client';

import { useEffect, useState } from 'react';

// Only show in development — never expose runtime errors to users in production

interface ErrorInfo {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  time: string;
}

export default function IosErrorHandler() {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (typeof window === 'undefined') return;

    const oldHandler = window.onerror;
    window.onerror = (msg, source, lineno, colno) => {
      const info: ErrorInfo = {
        message: String(msg),
        source,
        lineno,
        colno,
        time: new Date().toISOString(),
      };
      setErrors(prev => [...prev.slice(-9), info]);
      oldHandler?.call(window, msg, source, lineno, colno, undefined);
      return false;
    };

    const oldRejection = window.onunhandledrejection;
    window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
      const info: ErrorInfo = {
        message: String(e.reason?.message || e.reason || 'Unknown'),
        time: new Date().toISOString(),
      };
      setErrors(prev => [...prev.slice(-9), info]);
    });
    if (oldRejection) {
      window.onunhandledrejection = oldRejection;
    }

    return () => {
      window.onerror = oldHandler;
    };
  }, []);

  if (errors.length === 0) return null;

  return (
    <div
      id="ios-error-handler"
      className={`fixed bottom-0 left-0 right-0 z-[99999] bg-red-600/95 text-white font-mono cursor-pointer overflow-y-auto flex flex-col gap-1 ${expanded ? 'p-4 max-h-[50vh]' : 'p-2 max-h-auto'}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex justify-between items-center text-xs">
        <strong>⚠ {errors.length} lỗi runtime</strong>
        <span>{expanded ? '▲ Thu gọn' : '▼ Mở rộng'}</span>
      </div>
      {expanded && errors.map((e, i) => (
        <div key={i} className="border-t border-white/20 py-1">
          <div className="text-xs">{e.message}</div>
          {e.source && <div className="opacity-70 text-[10px]">{e.source}:{e.lineno}:{e.colno}</div>}
          <div className="opacity-50 text-[10px]">{e.time}</div>
        </div>
      ))}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setErrors([]);
        }}
        className="mt-2 px-3 py-1 bg-white/20 rounded text-white cursor-pointer text-[11px] border-none self-start"
      >
        Xoá
      </button>
    </div>
  );
}
