import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getMyDoctors, grantAccess, revokeAccess, createShareToken } from '../app/consent/consentApi';
import type { AccessDto, GrantAccessRequest, ShareTokenResponse } from '../app/consent/types';

function formatExpiry(expiresAtUtc?: string): string {
  if (!expiresAtUtc) return 'Fără expirare';
  const d = new Date(expiresAtUtc);
  const now = new Date();
  if (d < now) return `Expirat ${formatRelative(d)}`;
  const days = Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  return days === 1 ? '24 ore' : `${days} zile`;
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days === 0) return 'astăzi';
  if (days === 1) return 'ieri';
  if (days < 7) return `acum ${days} zile`;
  return date.toLocaleDateString('ro-RO');
}

export const ShareAccessPage: React.FC = () => {
  const [list, setList] = useState<AccessDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [shareTokenLoading, setShareTokenLoading] = useState(false);
  const [shareTokenResult, setShareTokenResult] = useState<ShareTokenResponse | null>(null);
  const [shareTokenExpiresIn, setShareTokenExpiresIn] = useState<number>(10);

  const load = () => {
    getMyDoctors()
      .then(setList)
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string; title?: string } }; message?: string })?.response?.data
            ?.message ||
          (err as { response?: { data?: { title?: string } } })?.response?.data?.title ||
          (err as { message?: string })?.message ||
          'Eroare la încărcare';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorEmail.trim()) {
      toast.error('Introdu adresa de email a doctorului.');
      return;
    }
    setGranting(true);
    try {
      const body: GrantAccessRequest = {
        doctorEmail: doctorEmail.trim(),
        expiresAtUtc: expiresAt ? new Date(expiresAt).toISOString() : undefined
      };
      await grantAccess(body);
      toast.success('Acces acordat.');
      setDoctorEmail('');
      setExpiresAt('');
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; title?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as { response?: { data?: { title?: string } } })?.response?.data?.title ||
        (err as { message?: string })?.message ||
        'Eroare la acordare acces';
      toast.error(msg);
    } finally {
      setGranting(false);
    }
  };

  const handleCreateShareToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setShareTokenLoading(true);
    setShareTokenResult(null);
    try {
      const expiresInMinutes = Math.min(60, Math.max(1, shareTokenExpiresIn || 10));
      const result = await createShareToken({ expiresInMinutes });
      setShareTokenResult(result);
      toast.success('Token generat. Copiază-l acum — se afișează o singură dată.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Eroare la generare token';
      toast.error(msg);
    } finally {
      setShareTokenLoading(false);
    }
  };

  const handleRevoke = async (accessId: string) => {
    try {
      await revokeAccess(accessId);
      toast.success('Acces revocat.');
      load();
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      if (status === 404) {
        toast.error('Acordul nu a fost găsit.');
        return;
      }
      if (status === 403) {
        toast.error('Nu ai drepturi pentru această acțiune.');
        return;
      }
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        'Eroare la revocare';
      toast.error(msg);
    }
  };

  const activeList = list.filter((a) => a.isActive);
  const expiredList = list.filter((a) => !a.isActive);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Create Access Grant */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">Creează acord de acces</h2>
        <p className="mt-1 text-sm text-slate-600">
          Generează acces securizat pentru un doctor (prin email) la fișa ta medicală.
        </p>
        <form className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4" onSubmit={handleGrant}>
          <div className="flex-1">
            <Input
              label="Email doctor"
              type="email"
              placeholder="doctor@example.com"
              value={doctorEmail}
              onChange={(e) => setDoctorEmail(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Input
              label="Expiră la (opțional)"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <Button type="submit" loading={granting} className="shrink-0">
            + Acord nou
          </Button>
        </form>
      </Card>

      {/* Token pentru farmacie */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">Token pentru farmacie</h2>
        <p className="mt-1 text-sm text-slate-600">
          Generează un token temporar (one-time) de <span className="font-mono font-semibold">10 caractere</span> pe care îl poți da
          farmaciei pentru a vedea rețetele tale. Tokenul se afișează o singură dată.
        </p>
        {!shareTokenResult ? (
          <form className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={handleCreateShareToken}>
            <div className="w-32">
              <Input
                label="Valabil (min)"
                type="number"
                min={1}
                max={60}
                value={shareTokenExpiresIn}
                onChange={(e) => setShareTokenExpiresIn(parseInt(e.target.value, 10) || 10)}
              />
            </div>
            <Button type="submit" loading={shareTokenLoading} className="shrink-0">
              Generează token
            </Button>
          </form>
        ) : (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="text-sm font-medium text-amber-800">Copiază tokenul acum — nu se mai afișează.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="break-all rounded-lg bg-slate-800 px-3 py-2 text-sm text-teal-300 font-mono">
                {shareTokenResult.token.replace(/(.{5})(.{5})/, '$1-$2')}
              </code>
              <Button
                type="button"
                variant="secondary"
                className="text-sm"
                onClick={() => {
                  navigator.clipboard.writeText(shareTokenResult.token);
                  toast.success('Token copiat.');
                }}
              >
                Copiază
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Expiră: {new Date(shareTokenResult.expiresAtUtc).toLocaleString('ro-RO')} · Scope: {shareTokenResult.scope}
            </p>
            <Button type="button" variant="ghost" className="mt-3 text-sm" onClick={() => setShareTokenResult(null)}>
              Generează alt token
            </Button>
          </div>
        )}
      </Card>

      {/* Active Grants */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xl font-semibold text-slate-900">Acorduri active</h2>
          {activeList.length > 0 && (
            <Badge variant="success">{activeList.length} active</Badge>
          )}
        </div>
        {activeList.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-slate-600">Niciun acord activ. Creează unul folosind formularul de mai sus.</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeList.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {a.doctorFullName ?? a.doctorUserId}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fișă completă · {formatExpiry(a.expiresAtUtc)}
                    </p>
                    <p className="text-xs font-mono text-slate-400 mt-1 truncate">{a.doctorUserId}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="success">Activ</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 px-3 text-xs"
                      onClick={() => handleRevoke(a.id)}
                    >
                      Revocă
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Expired Grants */}
      {expiredList.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xl font-semibold text-slate-900">Acorduri expirate</h2>
            <Badge variant="default">{expiredList.length} expirate</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {expiredList.map((a) => (
              <Card key={a.id} className="p-4 opacity-80">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {a.doctorFullName ?? a.doctorUserId}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Expirat {a.expiresAtUtc ? formatRelative(new Date(a.expiresAtUtc)) : '—'}
                    </p>
                  </div>
                  <Badge variant="default">Expirat</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
