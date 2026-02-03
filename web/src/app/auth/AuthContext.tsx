import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '../storage';
import type { LoginRequest, MeResponse } from './types';
import { fetchMe, loginUser } from './authApi';

interface AuthContextValue {
  user: MeResponse | null;
  token: string | null;
  loading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [token, setToken] = useState<string | null>(() => storage.getToken());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await fetchMe();
        setUser(me);
      } catch {
        storage.clearAuth();
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [token]);

  const login = async (payload: LoginRequest) => {
    const res = await loginUser(payload);
    storage.setToken(res.accessToken);
    setToken(res.accessToken);
    const me = await fetchMe();
    setUser(me);
  };

  const logout = () => {
    storage.clearAuth();
    setToken(null);
    setUser(null);
  };

  const refreshMe = async () => {
    if (!token) return;
    const me = await fetchMe();
    setUser(me);
  };

  const value: AuthContextValue = {
    user,
    token,
    loading,
    login,
    logout,
    refreshMe
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

