import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`rounded-xl bg-card shadow-card border border-borderSoft/60 ${className ?? ''}`.trim()}>
      {children}
    </div>
  );
}

