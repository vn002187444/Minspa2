'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
      fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }),
    }).catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
          <div className="bg-white rounded-3xl shadow-xl border border-red-100 p-8 max-w-lg w-full text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h1>
            <p className="text-sm text-gray-500 mb-4">Vui lòng tải lại trang hoặc liên hệ Admin.</p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-left">
              <p className="text-xs font-mono text-red-700 break-words">{this.state.error?.message}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-gray-950 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors cursor-pointer"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
