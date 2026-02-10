import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { getAdminDashboard } from '../app/admin/adminApi';
import type { AdminDashboardResponse } from '../app/admin/types';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminDashboard()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message ?? 'Eroare la încărcarea dashboard-ului.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const c = data?.counts;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin"
        description="Panou de administrare: statistici și acțiuni rapide."
      />
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}
      {!loading && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-sm font-medium text-slate-500">Total utilizatori</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{c?.totalUsers ?? 0}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-medium text-slate-500">Pacienți</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{c?.patients ?? 0}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-medium text-slate-500">Medici</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{c?.doctors ?? 0}</p>
              {c && c.pendingDoctors > 0 && (
                <p className="mt-1 text-sm text-amber-600">
                  {c.pendingDoctors} în așteptare
                </p>
              )}
            </Card>
            <Card className="p-5">
              <p className="text-sm font-medium text-slate-500">Farmacii</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{c?.pharmacies ?? 0}</p>
              {c && c.pendingPharmacies > 0 && (
                <p className="mt-1 text-sm text-amber-600">
                  {c.pendingPharmacies} în așteptare
                </p>
              )}
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <h2 className="text-lg font-semibold text-slate-900">Activitate recentă</h2>
              <ul className="mt-3 space-y-2">
                {data.recentActivity.length === 0 && (
                  <li className="text-sm text-slate-500">Nicio activitate recentă.</li>
                )}
                {data.recentActivity.slice(0, 15).map((evt) => (
                  <li key={evt.id} className="flex flex-wrap items-baseline gap-2 text-sm">
                    <span className="text-slate-500">
                      {new Date(evt.timestampUtc).toLocaleString('ro-RO')}
                    </span>
                    <span className="font-medium">{evt.action}</span>
                    {evt.actorEmail && (
                      <span className="text-slate-600">{evt.actorEmail}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-slate-900">Acțiuni rapide</h2>
              <div className="mt-4 space-y-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate('/admin/users?status=Pending')}
                >
                  Revizuite aprobări în așteptare
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/admin/users')}
                >
                  Deschide utilizatori
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/admin/audit')}
                >
                  Deschide audit
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
