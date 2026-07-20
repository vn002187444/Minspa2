'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-[#5C4033] hover:bg-[#3A2E2B] text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-[#FAF0E6] hover:bg-[#FAF6F0] text-[#8D6E53] border border-[#EADDCD] disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed',
};

const sizeStyles: Record<string, string> = {
  sm: 'py-2 px-3 text-[11px]',
  md: 'py-3 px-5 text-xs',
  lg: 'py-4 px-7 text-sm',
};

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      isLoading = false,
      loadingText,
      variant = 'primary',
      size = 'md',
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
        whileTap={!disabled && !isLoading ? { scale: 0.95 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={`
          inline-flex items-center justify-center gap-2
          font-bold rounded-xl transition-colors duration-200
          active:scale-95
          ${variantStyles[variant] || variantStyles.primary}
          ${sizeStyles[size] || sizeStyles.md}
          select-none
          ${className}
        `}
        {...(props as any)}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            <span>{loadingText || 'Đang xử lý...'}</span>
          </>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export default LoadingButton;
