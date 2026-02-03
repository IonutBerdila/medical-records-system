import React from 'react';
import { AppRouter } from './router';
import { AuthProvider } from './auth/AuthContext';
import { ToastHost } from '../ui/Toast';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastHost />
      <AppRouter />
    </AuthProvider>
  );
};

