import { cn } from '@/lib/cn';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold tracking-wider uppercase text-gray-500">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8D6E53]" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-describedby={errorId}
            aria-invalid={!!error}
            className={cn(
              'w-full py-3 bg-[#FAF6F0] border border-[#EADDCD] rounded-xl text-sm font-medium',
              'focus:bg-white focus:ring-2 focus:ring-[#8D6E53] focus:border-transparent outline-none transition-all',
              leftIcon ? 'pl-11 pr-4' : 'px-4',
              error && 'border-red-400 focus:ring-red-400',
              className,
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="text-xs text-red-600 font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface FieldErrorProps {
  message?: string;
  id?: string;
}

function FieldError({ message, id }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-red-600 font-medium" role="alert">
      {message}
    </p>
  );
}

export { Input, FieldError, type InputProps };
