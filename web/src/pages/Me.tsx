import React, { useState } from 'react';
import { Layout } from '../ui/Layout';
import { Card } from '../ui/Card';
import { useAuth } from '../app/auth/AuthContext';

export const Me: React.FC = () => {
  const { user } = useAuth();
  const [showDebug, setShowDebug] = useState(false);

  if (!user) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center text-sm text-mutedText">No user loaded.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-semibold text-text">Profile</h1>

        <Card className="p-5 flex flex-col gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-mutedText mb-1">Email</div>
            <div className="text-sm font-medium break-all">{user.email}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-mutedText mb-1">Roles</div>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-primary/10 text-primary text-xs font-medium px-3 py-1"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          {user.profile && (
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-mutedText mb-1">Profile</div>
              <div className="text-sm text-mutedText">
                Profil asociat rolului principal. Vezi secțiunea de debug pentru detalii brute.
              </div>
            </div>
          )}
        </Card>

        <button
          type="button"
          className="text-xs text-mutedText hover:text-primary underline-offset-2 hover:underline self-start"
          onClick={() => setShowDebug((v) => !v)}
        >
          {showDebug ? 'Ascunde debug JSON' : 'Afișează debug JSON'}
        </button>

        {showDebug && (
          <Card className="p-4">
            <pre className="text-[11px] leading-snug text-slate-700 overflow-auto max-h-64">
              {JSON.stringify(user, null, 2)}
            </pre>
          </Card>
        )}
      </div>
    </Layout>
  );
};

