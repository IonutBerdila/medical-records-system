import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Splash } from '../pages/Splash';
import { AuthLanding } from '../pages/AuthLanding';
import { Login } from '../pages/Login';
import { SignupStep1 } from '../pages/SignupStep1';
import { SignupStep2 } from '../pages/SignupStep2';
import { Me } from '../pages/Me';
import { Dashboard } from '../pages/Dashboard';
import { RequireAuth } from './auth/RequireAuth';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/auth" element={<AuthLanding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupStep1 />} />
        <Route path="/signup/extra" element={<SignupStep2 />} />
        <Route
          path="/me"
          element={
            <RequireAuth>
              <Me />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

