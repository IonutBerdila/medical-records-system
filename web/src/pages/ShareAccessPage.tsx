import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Layout } from '../ui/Layout';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { getMyDoctors, grantAccess, revokeAccess } from '../app/consent/consentApi';
import type { AccessDto, GrantAccessRequest } from '../app/consent/types';

export const ShareAccessPage: React.FC = () => {
  const [list, setList] = useState<AccessDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const load = () => {
    getMyDoctors()
      .then(setList)
      .catch((err: any) => {
        const msg =
          err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Eroare la încărcare';
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
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Eroare la acordare acces';
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
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Eroare la revocare';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-semibold text-text">Acordare acces doctorilor</h1>
        <Card className="p-5">
          <form className="flex flex-col gap-4" onSubmit={handleGrant}>
            <Input
              label="Email doctor"
              type="email"
              placeholder="doctor@example.com"
              value={doctorEmail}
              onChange={(e) => setDoctorEmail(e.target.value)}
            />
            <Input
              label="Expiră la (opțional)"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <Button type="submit" loading={granting}>
              Acordă acces
            </Button>
          </form>
        </Card>
        <div>
          <h2 className="mb-2 text-sm font-semibold text-text">Acces acordat</h2>
          {list.length === 0 ? (
            <p className="text-sm text-mutedText">Niciun doctor nu are acces în prezent.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {list.map((a) => (
                <Card key={a.doctorUserId} className="flex items-center justify-between p-3">
                  <div>
                    <span className="font-medium text-text">
                      {a.doctorFullName ?? a.doctorUserId}
                    </span>
                    {a.expiresAtUtc && (
                      <span className="ml-2 text-xs text-mutedText">
                        expiră {new Date(a.expiresAtUtc).toLocaleDateString('ro-RO')}
                      </span>
                    )}
                    {a.isActive && (
                      <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                        Activ
                      </span>
                    )}
                  </div>
                  {a.isActive && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-8 w-auto px-3 text-xs"
                      onClick={() => handleRevoke(a.doctorUserId)}
                    >
                      Revocă
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
