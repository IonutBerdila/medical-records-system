import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
  return (
    <div
      className={`rounded-xl bg-card shadow-card border border-borderSoft/60 ${className ?? ''}`.trim()}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

