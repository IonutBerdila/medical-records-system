import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, helper, error, className, id, ...rest }) => {
  const inputId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
          {rest.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
        className={`h-11 rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition-colors focus:ring-2 focus:ring-primary/20 ${
          error
            ? 'border-red-300 focus:border-red-500'
            : 'border-slate-200 focus:border-primary'
        } ${className ?? ''}`}
        {...rest}
      />
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

