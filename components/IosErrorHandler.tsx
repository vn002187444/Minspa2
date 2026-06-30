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
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999,
        backgroundColor: 'rgba(220,38,38,0.95)', color: 'white',
        padding: expanded ? '16px' : '8px 16px',
        fontSize: '12px', fontFamily: 'monospace',
        cursor: 'pointer', maxHeight: expanded ? '50vh' : 'auto',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '4px',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>⚠ {errors.length} lỗi runtime</strong>
        <span>{expanded ? '▲ Thu gọn' : '▼ Mở rộng'}</span>
      </div>
      {expanded && errors.map((e, i) => (
        <div key={i} style={{
          borderTop: '1px solid rgba(255,255,255,0.2)',
          paddingTop: '4px', paddingBottom: '4px',
        }}>
          <div>{e.message}</div>
          {e.source && <div style={{ opacity: 0.7, fontSize: '10px' }}>{e.source}:{e.lineno}:{e.colno}</div>}
          <div style={{ opacity: 0.5, fontSize: '10px' }}>{e.time}</div>
        </div>
      ))}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setErrors([]);
        }}
        style={{
          marginTop: '8px', padding: '4px 12px',
          backgroundColor: 'rgba(255,255,255,0.2)',
          border: 'none', borderRadius: '4px', color: 'white',
          cursor: 'pointer', fontSize: '11px',
        }}
      >
        Xoá
      </button>
    </div>
  );
}
