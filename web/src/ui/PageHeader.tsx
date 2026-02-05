import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions, className = '' }) => (
  <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${className}`}>
    <div>
      <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
    </div>
    {actions && <div className="mt-2 flex shrink-0 items-center gap-2 sm:mt-0">{actions}</div>}
  </div>
);
