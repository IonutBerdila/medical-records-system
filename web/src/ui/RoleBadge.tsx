import React from 'react';
import { Badge } from './Badge';

const roleVariant: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
  Patient: 'info',
  Doctor: 'success',
  Pharmacy: 'warning',
  Admin: 'default'
};

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '' }) => (
  <Badge variant={roleVariant[role] ?? 'default'} className={className}>
    {role}
  </Badge>
);
