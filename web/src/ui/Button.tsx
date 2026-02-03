import React from 'react';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', loading, className, ...rest }) => {
  const base =
    'w-full h-12 rounded-full font-semibold text-sm transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed';

  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary hover:bg-primaryDark text-white',
    secondary: 'bg-white text-primary border border-primary hover:bg-primary/5'
  };

  return (
    <button className={`${base} ${variants[variant]} ${className ?? ''}`} disabled={loading || rest.disabled} {...rest}>
      {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
      {children}
    </button>
  );
};

