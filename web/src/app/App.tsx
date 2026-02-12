import React from 'react';
import { AppRouter } from './router';
import { AuthProvider } from './auth/AuthContext';
import { ToastHost } from '../ui/Toast';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastHost />
        <AppRouter />
      </AuthProvider>
    </ErrorBoundary>
  );
};

