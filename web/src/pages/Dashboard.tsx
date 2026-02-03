import React from 'react';
import { Layout } from '../ui/Layout';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../app/auth/AuthContext';
import type { UserRole } from '../app/auth/types';

const actionsByRole: Record<UserRole, { label: string }[]> = {
  Patient: [
    { label: 'My Medical Record' },
    { label: 'Prescriptions' }
  ],
  Doctor: [
    { label: 'Patients' },
    { label: 'Create Prescription' }
  ],
  Pharmacy: [
    { label: 'Scan QR' },
    { label: 'Validate Prescription' }
  ],
  Admin: [
    { label: 'Users' },
    { label: 'Audit Logs' }
  ]
};

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const primaryRole = user?.roles[0] ?? 'Patient';
  const actions = actionsByRole[primaryRole];

  return (
    <Layout>
      <div className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
            <p className="text-xs text-mutedText">
              Bine ai venit, {user?.email ?? 'invitat'}.
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-primary font-medium underline-offset-2 hover:underline"
          >
            Logout
          </button>
        </div>

        <Card className="p-5 flex flex-col gap-3">
          <div className="text-xs uppercase tracking-[0.18em] text-mutedText mb-1">Role</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {user?.roles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-primary/10 text-primary text-xs font-medium px-3 py-1"
              >
                {role}
              </span>
            ))}
          </div>
          <p className="text-sm text-mutedText">
            Acțiunile de mai jos sunt doar pentru demo vizual. Funcționalitatea completă va fi implementată în fazele următoare.
          </p>
        </Card>

        <Card className="p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text mb-1">Quick actions</h2>
          <div className="grid grid-cols-1 gap-3">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant="secondary"
                className="cursor-not-allowed opacity-70"
                disabled
              >
                {action.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-4 text-[11px] text-mutedText">
          <p>
            Aceasta este doar o interfață demo pentru testarea rapidă a autentificării și a rolurilor.
            Funcționalitățile medicale vor fi implementate în fazele 3+.
          </p>
        </Card>
      </div>
    </Layout>
  );
};

