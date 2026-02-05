import React from 'react';

interface LogoProps {
  compact?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ compact }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
        <div className="relative h-6 w-6">
          <span className="absolute inset-0 rounded-full border-2 border-primary" />
          <span className="absolute left-1 top-1 h-3 w-3 rounded-full bg-primary" />
          <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-primaryDark" />
        </div>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-500">Med Card</div>
          <div className="text-sm font-medium text-white">Calitate în servicii medicale</div>
        </div>
      )}
    </div>
  );
};

