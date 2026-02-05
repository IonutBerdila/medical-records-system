import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { RoleBadge } from '../ui/RoleBadge';
import { useAuth } from '../app/auth/AuthContext';

export const Me: React.FC = () => {
  const { user } = useAuth();
  const [showDebug, setShowDebug] = useState(false);

  if (!user) {
    return (
        <div className="flex h-full items-center justify-center text-sm text-slate-600">No user loaded.</div>
    );
  }

  return (
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-semibold text-slate-900">Profil</h1>

        <Card className="p-5 flex flex-col gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Email</div>
            <div className="text-sm font-medium break-all">{user.email}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Roluri</div>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <RoleBadge key={role} role={role} />
              ))}
            </div>
          </div>

          {user.profile && (
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Profil</div>
              <div className="text-sm text-slate-600">
                Profil asociat rolului principal. Vezi secțiunea de debug pentru detalii brute.
              </div>
            </div>
          )}
        </Card>

        <button
          type="button"
          className="text-xs text-slate-600 hover:text-primary underline-offset-2 hover:underline self-start"
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
  );
};

