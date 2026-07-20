import { cn } from '@/lib/cn';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-[#5C4033] hover:bg-[#3A2E2B] text-white shadow-md hover:shadow-lg',
  secondary: 'bg-[#FAF0E6] hover:bg-[#EADDCD] text-[#5C4033] border border-[#EADDCD]',
  outline: 'bg-transparent hover:bg-[#FAF0E6] text-[#5C4033] border-2 border-[#EADDCD] hover:border-[#8D6E53]',
  ghost: 'bg-transparent hover:bg-[#FAF0E6] text-[#5C4033]',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs min-h-[32px]',
  md: 'px-5 py-2.5 text-sm min-h-[40px]',
  lg: 'px-7 py-3.5 text-sm min-h-[48px]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-bold rounded-full transition-all active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D6E53] focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, type ButtonProps, type Variant, type Size };
