import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../ui/Layout';
import { Logo } from '../ui/Logo';

export const Splash: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const id = setTimeout(() => {
      navigate('/auth', { replace: true });
    }, 1200);
    return () => clearTimeout(id);
  }, [navigate]);

  return (
    <div className="min-h-screen app-gradient-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[420px] flex flex-col items-center justify-center text-center text-white gap-6">
        <Logo compact={false} />
        <p className="text-sm text-white/80 max-w-xs">
          Acces rapid și sigur la cardul tău medical electronic.
        </p>
      </div>
    </div>
  );
};

