import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { IconQr } from '../ui/Icons';
import { verifyShareTokenV2, dispensePrescription } from '../app/pharmacy/pharmacyApi';
import type { PharmacyPrescriptionDto } from '../app/pharmacy/types';

const TOKEN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const PharmacyPage: React.FC = () => {
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [prescriptions, setPrescriptions] = useState<PharmacyPrescriptionDto[] | null>(null);
  const [dispensingId, setDispensingId] = useState<string | null>(null);

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    const normalized = token.trim().toUpperCase();
    const isValid =
      normalized.length === 10 &&
      [...normalized].every((c) => TOKEN_ALPHABET.includes(c));

    if (!isValid) {
      toast.error(
        'Token invalid. Folosește exact 10 caractere din A–Z și 2–9, fără I, L, O, 0, 1.'
      );
      return;
    }

    setVerifying(true);
    setPrescriptions(null);
    setVerificationId(null);
    try {
      const response = await verifyShareTokenV2({ token: normalized });
      setVerificationId(response.verificationId);
      setPrescriptions(response.prescriptions);
      if (response.prescriptions.length === 0) toast.success('Token valid, dar nu există rețete de afișat.');
      else toast.success(`${response.prescriptions.length} rețetă/rețete găsite.`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Token invalid, expirat sau deja folosit.';
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleDispense = async (prescriptionId: string) => {
    if (!verificationId) {
      toast.error('Sesiune de verificare lipsă sau expirată. Re-verifică tokenul.');
      return;
    }
    setDispensingId(prescriptionId);
    try {
      const updated = await dispensePrescription(verificationId, prescriptionId);
      setPrescriptions((prev) =>
        prev?.map((p) => (p.id === prescriptionId ? { ...p, status: updated.status, dispensedAtUtc: updated.dispensedAtUtc } : p)) ??
        null
      );
      toast.success('Prescripție marcată ca eliberată.');
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      if (status === 409) {
        toast.error(err?.response?.data?.message || 'Prescripția este deja eliberată.');
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.title ||
          err?.message ||
          'Eroare la marcarea prescripției ca eliberată.';
        toast.error(msg);
      }
    } finally {
      setDispensingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Portal Farmacie MedRecord</h1>
        <p className="mt-1 text-slate-600">Acces securizat la rețete.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-1 max-w-2xl">
        {/* Scan QR */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900">Scanează codul QR al pacientului</h2>
          <p className="mt-1 text-sm text-slate-600">
            Poziționează codul QR al pacientului în fața camerei.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-teal-200 bg-slate-50/80 py-12 px-6">
            <IconQr className="h-16 w-16 text-teal-400" />
            <p className="mt-4 text-sm text-slate-600 text-center">
              Zona de scanare va apărea după pornirea camerei.
            </p>
            <Button className="mt-6" disabled>
              Pornește camera
            </Button>
          </div>
        </Card>

        <div className="flex items-center gap-4 text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-sm font-medium">SAU</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Enter token */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900">Introdu tokenul de acces</h2>
          <form onSubmit={handleTokenSubmit} className="mt-4 space-y-4">
            <Input
              label="Token pacient"
              placeholder="ABCDF-234GH"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              helper="Introdu tokenul de 10 caractere furnizat de pacient (fără I, L, O, 0, 1)."
            />
            <Button type="submit" disabled={!token.trim()} loading={verifying}>
              Verifică token
            </Button>
          </form>
        </Card>
      </div>

      {/* Rezultate verificare */}
      {prescriptions !== null && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900">Rețete (token one-time consumat)</h2>
          {prescriptions.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">Nu există rețete de afișat pentru acest token.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {prescriptions.map((p) => (
                <li key={p.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{p.medicationName}</span>
                    <Badge variant="default">{p.status}</Badge>
                  </div>
                  {p.dosage && <p className="mt-1 text-sm text-slate-600">Dozaj: {p.dosage}</p>}
                  {p.instructions && <p className="mt-0.5 text-sm text-slate-600">{p.instructions}</p>}
                  <p className="mt-1 text-xs text-slate-500">
                    Doctor: {p.doctorName ?? '—'} · {new Date(p.createdAtUtc).toLocaleString('ro-RO')}
                  </p>
                  {p.dispensedAtUtc && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Eliberată la: {new Date(p.dispensedAtUtc).toLocaleString('ro-RO')}
                    </p>
                  )}
                  <div className="mt-3">
                    <Button
                      type="button"
                      disabled={p.status === 'Dispensed' || !!dispensingId}
                      loading={dispensingId === p.id}
                      onClick={() => handleDispense(p.id)}
                    >
                      {p.status === 'Dispensed' ? 'Deja eliberată' : 'Marchează eliberată'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} MedRecord. Conformitate HIPAA • Conexiune criptată.
      </footer>
    </div>
  );
};
