import React from 'react';
import { Logo } from './Logo';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen app-gradient-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[420px] rounded-3xl bg-background shadow-card overflow-hidden flex flex-col">
        <header className="px-6 pt-6 pb-4 flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            <Logo compact />
          </div>
        </header>
        <main className="flex-1 px-6 pb-6 pt-2">{children}</main>
      </div>
    </div>
  );
};

