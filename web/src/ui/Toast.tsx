import React from 'react';
import { Toaster } from 'react-hot-toast';

export const ToastHost: React.FC = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      className: '',
      style: {
        borderRadius: '0.75rem',
        padding: '12px 16px',
        fontSize: '0.875rem',
        border: '1px solid rgb(226 232 240)',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        background: '#fff'
      },
      success: {
        iconTheme: { primary: '#0d9488' }
      },
      error: {
        iconTheme: { primary: '#dc2626' }
      }
    }}
  />
);

