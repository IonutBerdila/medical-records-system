import React from 'react';

interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeId, onChange, className = '' }) => (
  <div className={`border-b border-slate-200 ${className}`}>
    <nav className="-mb-px flex gap-6" aria-label="Tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-0 ${
            activeId === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  </div>
);
