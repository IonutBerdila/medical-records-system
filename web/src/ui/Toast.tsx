import React from 'react';
import { Toaster } from 'react-hot-toast';

export const ToastHost: React.FC = () => (
  <Toaster
    position="top-center"
    toastOptions={{
      style: {
        borderRadius: '999px',
        paddingInline: '16px',
        paddingBlock: '10px',
        fontSize: '0.875rem'
      }
    }}
  />
);

