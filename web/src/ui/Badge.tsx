import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  // Info = albastru (aprox. #3B82F6 din Tailwind blue-500)
  info: 'bg-blue-50 text-blue-700 border-blue-200'
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
  >
    {children}
  </span>
);
