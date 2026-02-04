import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Layout } from '../../ui/Layout';

export const RequireRole: React.FC<{ allowedRoles: string[]; children: React.ReactNode }> = ({
  allowedRoles,
  children
}) => {
  const { user, token, loading } = useAuth();

  if (loading || !token) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  const hasRole = user?.roles.some((r) => allowedRoles.includes(r));
  if (!hasRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
