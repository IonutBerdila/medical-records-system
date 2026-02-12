import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Splash } from '../pages/Splash';
import { AuthLanding } from '../pages/AuthLanding';
import { Login } from '../pages/Login';
import { Signup } from '../pages/Signup';
import { Me } from '../pages/Me';
import { Dashboard } from '../pages/Dashboard';
import { RecordPage } from '../pages/RecordPage';
import { TimelinePage } from '../pages/TimelinePage';
import { PrescriptionsPage } from '../pages/PrescriptionsPage';
import { ShareAccessPage } from '../pages/ShareAccessPage';
import { DoctorPatientsPage } from '../pages/DoctorPatientsPage';
import { DoctorPatientDetailPage } from '../pages/DoctorPatientDetailPage';
import { PharmacyPage } from '../pages/PharmacyPage';
import { PharmacyPrescriptionPage } from '../pages/PharmacyPrescriptionPage';
import { AdminPage } from '../pages/AdminPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { AdminAuditPage } from '../pages/AdminAuditPage';
import { RequireAuth } from './auth/RequireAuth';
import { RequireRole } from './auth/RequireRole';
import { AppShell } from '../ui/AppShell';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/auth" element={<AuthLanding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/me"
          element={
            <RequireAuth>
              <AppShell>
                <Me />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <AppShell>
                <Dashboard />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/record"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Patient']}>
                <AppShell>
                  <RecordPage />
                </AppShell>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/timeline"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Patient']}>
                <AppShell>
                  <TimelinePage />
                </AppShell>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/prescriptions"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Patient']}>
                <AppShell>
                  <PrescriptionsPage />
                </AppShell>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/share"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Patient']}>
                <AppShell>
                  <ShareAccessPage />
                </AppShell>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/doctor/patients"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Doctor']}>
                <AppShell>
                  <DoctorPatientsPage />
                </AppShell>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/doctor/patients/:id"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Doctor']}>
                <AppShell>
                  <DoctorPatientDetailPage />
                </AppShell>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/pharmacy"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Pharmacy']}>
                <AppShell>
                  <PharmacyPage />
                </AppShell>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/pharmacy/prescription"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Pharmacy']}>
                <AppShell>
                  <PharmacyPrescriptionPage />
                </AppShell>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Admin']}>
                <AppShell>
                  <AdminPage />
                </AppShell>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Admin']}>
                <AppShell>
                  <AdminUsersPage />
                </AppShell>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['Admin']}>
                <AppShell>
                  <AdminAuditPage />
                </AppShell>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

