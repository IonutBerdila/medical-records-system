import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Splash } from '../pages/Splash';
import { AuthLanding } from '../pages/AuthLanding';
import { Login } from '../pages/Login';
import { SignupStep1 } from '../pages/SignupStep1';
import { SignupStep2 } from '../pages/SignupStep2';
import { Me } from '../pages/Me';
import { Dashboard } from '../pages/Dashboard';
import { RecordPage } from '../pages/RecordPage';
import { TimelinePage } from '../pages/TimelinePage';
import { PrescriptionsPage } from '../pages/PrescriptionsPage';
import { ShareAccessPage } from '../pages/ShareAccessPage';
import { DoctorPatientsPage } from '../pages/DoctorPatientsPage';
import { DoctorPatientDetailPage } from '../pages/DoctorPatientDetailPage';
import { RequireAuth } from './auth/RequireAuth';
import { RequireRole } from './auth/RequireRole';

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
        <Route
          path="/record"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Patient']}>
                <RecordPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/timeline"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Patient']}>
                <TimelinePage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/prescriptions"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Patient']}>
                <PrescriptionsPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/share"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Patient']}>
                <ShareAccessPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/doctor/patients"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Doctor']}>
                <DoctorPatientsPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/doctor/patients/:id"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Doctor']}>
                <DoctorPatientDetailPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

