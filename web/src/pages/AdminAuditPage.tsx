import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { getAdminAudit } from '../app/admin/adminApi';
import type { AdminAuditEventDto } from '../app/admin/types';

const PAGE_SIZE = 20;
const ACTION_OPTIONS = [
  '',
  'DOCTOR_REGISTRATION_CREATED',
  'PHARMACY_REGISTRATION_CREATED',
  'DOCTOR_APPROVED',
  'DOCTOR_REJECTED',
  'PHARMACY_APPROVED',
  'PHARMACY_REJECTED',
  'SHARE_TOKEN_CREATED',
  'SHARE_TOKEN_VERIFIED',
  'PRESCRIPTION_DISPENSED'
];

export const AdminAuditPage: React.FC = () => {
  const [events, setEvents] = useState<AdminAuditEventDto[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fromUtc, setFromUtc] = useState('');
  const [toUtc, setToUtc] = useState('');
  const [action, setAction] = useState('');

  const fetchAudit = useCallback(() => {
    setLoading(true);
    getAdminAudit({
      fromUtc: fromUtc ? new Date(fromUtc).toISOString() : undefined,
      toUtc: toUtc ? new Date(toUtc).toISOString() : undefined,
      action: action || undefined,
      skip,
      take: PAGE_SIZE
    })
      .then((res) => {
        setEvents(res.events);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [fromUtc, toUtc, action, skip]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit"
        description="Jurnal de evenimente: înregistrări, aprobări, tokenuri, eliberări."
      />
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">De la</span>
            <input
              type="datetime-local"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={fromUtc}
              onChange={(e) => { setFromUtc(e.target.value); setSkip(0); }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Până la</span>
            <input
              type="datetime-local"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={toUtc}
              onChange={(e) => { setToUtc(e.target.value); setSkip(0); }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Acțiune</span>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={action}
              onChange={(e) => { setAction(e.target.value); setSkip(0); }}
            >
              {ACTION_OPTIONS.map((a) => (
                <option key={a || 'all'} value={a}>
                  {a || 'Toate'}
                </option>
              ))}
            </select>
          </label>
          <Button variant="outline" onClick={() => { setFromUtc(''); setToUtc(''); setAction(''); setSkip(0); }}>
            Resetează
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Se încarcă...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Niciun eveniment în intervalul selectat.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 font-medium text-slate-700">Data/Ora</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Acțiune</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Actor (rol / email)</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Entitate</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Pacient</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => (
                  <tr key={evt.id} className="border-b border-slate-100">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {new Date(evt.timestampUtc).toLocaleString('ro-RO')}
                    </td>
                    <td className="px-4 py-3 font-medium">{evt.action}</td>
                    <td className="px-4 py-3">
                      {evt.actorRole && <span className="text-slate-600">{evt.actorRole}</span>}
                      {evt.actorEmail && (
                        <span className="ml-1 text-slate-800">{evt.actorEmail}</span>
                      )}
                      {!evt.actorRole && !evt.actorEmail && '-'}
                    </td>
                    <td className="px-4 py-3">
                      {evt.entityType && (
                        <>
                          {evt.entityType}
                          {evt.entityId && (
                            <span className="ml-1 text-slate-500">{evt.entityId.slice(0, 8)}…</span>
                          )}
                        </>
                      )}
                      {!evt.entityType && '-'}
                    </td>
                    <td className="px-4 py-3">{evt.patientEmail ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <span className="text-sm text-slate-500">
              {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} din {total}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={skip === 0}
                onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
              >
                Înapoi
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={skip + PAGE_SIZE >= total}
                onClick={() => setSkip((s) => s + PAGE_SIZE)}
              >
                Înainte
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
