import React from 'react';

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '' }) => {
  const label =
    role === 'Patient'
      ? 'PACIENT'
      : role === 'Doctor'
      ? 'DOCTOR'
      : role === 'Pharmacy'
      ? 'FARMACIE'
      : role.toUpperCase();

  return (
    <span className={`text-xs font-semibold tracking-wide text-slate-700 ${className}`}>
      {label}
    </span>
  );
};
