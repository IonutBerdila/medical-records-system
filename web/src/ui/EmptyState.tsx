import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = ''
}) => (
  <div
    className={`flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-12 px-6 text-center shadow-sm ${className}`}
  >
    {icon && <div className="mb-4 text-slate-400">{icon}</div>}
    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    {description && <p className="mt-2 max-w-sm text-sm text-slate-600">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
