import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  helper,
  error,
  className,
  id,
  ...rest
}) => {
  const textareaId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : helper ? `${textareaId}-helper` : undefined}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:ring-2 focus:ring-primary/20 ${
          error
            ? 'border-red-300 focus:border-red-500'
            : 'border-slate-200 focus:border-primary'
        } ${className ?? ''}`}
        {...rest}
      />
      {helper && !error && (
        <p id={textareaId ? `${textareaId}-helper` : undefined} className="text-xs text-slate-500">
          {helper}
        </p>
      )}
      {error && (
        <p id={textareaId ? `${textareaId}-error` : undefined} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
