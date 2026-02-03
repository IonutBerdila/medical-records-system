import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className, ...rest }) => {
  return (
    <label className="flex flex-col gap-1 text-sm text-mutedText">
      {label && <span>{label}</span>}
      <input
        className={`h-11 rounded-full border border-borderSoft/80 bg-white px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${className ?? ''}`}
        {...rest}
      />
    </label>
  );
};

