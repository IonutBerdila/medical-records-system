import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getMyDoctors, grantAccess, revokeAccess } from '../app/consent/consentApi';
import type { AccessDto, GrantAccessRequest } from '../app/consent/types';

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

  const handleRevoke = async (doctorUserId: string) => {
    try {
      await revokeAccess({ doctorUserId });
      toast.success('Acces revocat.');
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
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
              <Card key={a.doctorUserId} className="p-4">
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
                      className="h-8 w-8 p-0"
                      onClick={() => handleRevoke(a.doctorUserId)}
                      aria-label="Revocă acces"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
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
              <Card key={a.doctorUserId} className="p-4 opacity-80">
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
