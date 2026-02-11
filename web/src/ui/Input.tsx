import React, { useState } from 'react';
import { IconEye, IconEyeSlash } from './Icons';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  helper,
  error,
  className,
  id,
  type,
  showPasswordToggle,
  ...rest
}) => {
  const inputId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const shouldShowToggle = isPassword && showPasswordToggle;
  const inputType = shouldShowToggle && showPassword ? 'text' : type;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
          {rest.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
          className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition-colors focus:ring-2 focus:ring-primary/20 ${
            shouldShowToggle ? 'pr-11' : ''
          } ${
            error
              ? 'border-red-300 focus:border-red-500'
              : 'border-slate-200 focus:border-primary'
          } ${className ?? ''}`}
          {...rest}
        />
        {shouldShowToggle && (
          <button
            type="button"
            onMouseDown={() => setShowPassword(true)}
            onMouseUp={() => setShowPassword(false)}
            onMouseLeave={() => setShowPassword(false)}
            onTouchStart={() => setShowPassword(true)}
            onTouchEnd={() => setShowPassword(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none focus:text-slate-700 transition-colors"
            aria-label={showPassword ? 'Ascunde parola' : 'Arată parola'}
            tabIndex={-1}
          >
            {showPassword ? (
              <IconEye className="h-5 w-5" />
            ) : (
              <IconEyeSlash className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      {helper && !error && (
        <p id={inputId ? `${inputId}-helper` : undefined} className="text-xs text-slate-500">
          {helper}
        </p>
      )}
      {error && (
        <p id={inputId ? `${inputId}-error` : undefined} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

