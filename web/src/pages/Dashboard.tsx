import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { useAuth } from '../app/auth/AuthContext';
import type { UserRole } from '../app/auth/types';
import {
  IconDocument,
  IconPill,
  IconShare,
  IconUsers,
  IconDashboard,
  IconClock
} from '../ui/Icons';

const statCardsDoctor = [
  { label: 'Pacienții mei', value: '—', sub: 'cu consimțământ', icon: IconUsers, color: 'text-teal-600 bg-teal-50' },
  { label: 'Intrări recente', value: '—', sub: 'astăzi', icon: IconDocument, color: 'text-sky-600 bg-sky-50' },
  { label: 'Sarcini în așteptare', value: '—', sub: 'necesită atenție', icon: IconClock, color: 'text-amber-600 bg-amber-50' },
  { label: 'Programări azi', value: '—', sub: '—', icon: IconClock, color: 'text-slate-600 bg-slate-100' }
];

const quickCardsPatient = [
  { label: 'Fișa medicală', path: '/record', description: 'Accesează istoricul medical', icon: IconDocument },
  { label: 'Rețete', path: '/prescriptions', description: 'Vezi medicamentele active', icon: IconPill },
  { label: 'Acces și partajare', path: '/share', description: 'Gestionează accesul doctorilor', icon: IconShare },
  { label: 'Timeline', path: '/timeline', description: 'Istoric vizite și note', icon: IconDocument }
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = (user?.roles[0] ?? 'Patient') as UserRole;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">
          Bun venit, {user?.email ?? 'invitat'}
        </p>
      </div>

      {role === 'Doctor' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCardsDoctor.map((card) => (
            <Card key={card.label} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
                  {card.sub && <p className="text-xs text-slate-500">{card.sub}</p>}
                </div>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {role === 'Patient' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickCardsPatient.map((card) => (
            <Card
              key={card.label}
              className="cursor-pointer p-5 transition-colors hover:border-teal-200 hover:shadow-md"
              onClick={() => card.path && navigate(card.path)}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <card.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-semibold text-slate-900">{card.label}</h3>
              <p className="mt-0.5 text-sm text-slate-600">{card.description}</p>
            </Card>
          ))}
        </div>
      )}

      {(role === 'Pharmacy' || role === 'Admin') && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <IconDashboard className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Panou</h3>
                <p className="text-sm text-slate-600">Accesează secțiunile din meniul lateral.</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Activitate recentă / Acțiuni rapide */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Activitate recentă</h2>
            {(role === 'Patient' || role === 'Doctor') && (
              <button
                type="button"
                className="text-sm font-medium text-teal-600 hover:underline"
                onClick={() => navigate(role === 'Patient' ? '/timeline' : '/doctor/patients')}
              >
                Vezi toate →
              </button>
            )}
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex items-center gap-3 rounded-lg py-2">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              Intrările și rețetele noi vor apărea aici.
            </li>
            <li className="flex items-center gap-3 rounded-lg py-2">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Consimțămintele acordate sau revocate.
            </li>
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-semibold text-slate-900">Acțiuni rapide</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {role === 'Patient' && (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/record')}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Fișa medicală
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/prescriptions')}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Rețete
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/share')}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Acces doctori
                </button>
              </>
            )}
            {role === 'Doctor' && (
              <button
                type="button"
                onClick={() => navigate('/doctor/patients')}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Pacienții mei
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
