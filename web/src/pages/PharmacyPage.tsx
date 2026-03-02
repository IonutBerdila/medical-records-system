import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { IconQr } from '../ui/Icons';
import { verifyShareTokenV2, dispensePrescriptionItems } from '../app/pharmacy/pharmacyApi';
import type { PharmacyPrescriptionDto, PharmacyPrescriptionItemDto } from '../app/pharmacy/types';

const TOKEN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const PharmacyPage: React.FC = () => {
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [prescriptions, setPrescriptions] = useState<PharmacyPrescriptionDto[] | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [dispensing, setDispensing] = useState(false);

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
    setSelectedItemIds(new Set());
    try {
      const response = await verifyShareTokenV2({ token: normalized });
      setVerificationId(response.verificationId);
      setPrescriptions(response.prescriptions);
      if (response.prescriptions.length === 0) {
        toast.success('Token valid, dar nu există prescripții cu medicamente în așteptare.');
      } else {
        toast.success(`${response.prescriptions.length} prescripție/prescripții găsite.`);
      }
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

  const toggleItem = (item: PharmacyPrescriptionItemDto) => {
    if (item.status !== 'Pending') return;
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };

  const handleDispense = async () => {
    if (!verificationId || selectedItemIds.size === 0) {
      toast.error('Selectați cel puțin un medicament de eliberat.');
      return;
    }
    setDispensing(true);
    try {
      const updated = await dispensePrescriptionItems(verificationId, Array.from(selectedItemIds));
      setPrescriptions(updated);
      setSelectedItemIds(new Set());
      toast.success('Medicamentele selectate au fost eliberate cu succes.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Eroare la eliberare.';
      toast.error(msg);
    } finally {
      setDispensing(false);
    }
  };

  const pendingCount = prescriptions?.flatMap((p) => p.items).filter((i) => i.status === 'Pending').length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Portal Farmacie MedRecord</h1>
        <p className="mt-1 text-slate-600">Acces securizat la rețete.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-1 max-w-2xl">
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

      {prescriptions !== null && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900">Prescripții active pentru eliberare</h2>
          {prescriptions.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">
              Nu există prescripții cu medicamente în așteptare pentru acest token.
            </p>
          ) : (
            <>
              <ul className="mt-4 space-y-4">
                {prescriptions.map((p) => (
                  <li key={p.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <p className="text-sm font-medium text-slate-700">
                      {p.doctorName && `Dr. ${p.doctorName}`}
                      {p.doctorInstitutionName && ` · ${p.doctorInstitutionName}`}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(p.createdAtUtc).toLocaleString('ro-RO')}
                      {p.diagnosis && ` · ${p.diagnosis}`}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {p.items.map((item) => (
                        <li
                          key={item.id}
                          className={`flex items-start gap-3 rounded-lg border p-3 ${
                            item.status === 'Dispensed'
                              ? 'border-slate-200 bg-slate-100/80'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          {item.status === 'Pending' ? (
                            <>
                              <input
                                type="checkbox"
                                checked={selectedItemIds.has(item.id)}
                                onChange={() => toggleItem(item)}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-slate-900">{item.medicationName}</span>
                                {(item.dosage || item.form) && (
                                  <p className="text-sm text-slate-600">
                                    {[item.form, item.dosage].filter(Boolean).join(' · ')}
                                  </p>
                                )}
                                {item.instructions && (
                                  <p className="text-xs text-slate-500">{item.instructions}</p>
                                )}
                                <span className="text-xs text-amber-700 font-medium">În așteptare</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <input type="checkbox" disabled className="mt-1 h-4 w-4 rounded border-slate-300" />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-slate-900">{item.medicationName}</span>
                                {(item.dosage || item.form) && (
                                  <p className="text-sm text-slate-600">
                                    {[item.form, item.dosage].filter(Boolean).join(' · ')}
                                  </p>
                                )}
                                <p className="text-xs text-slate-600 mt-1">
                                  Eliberat la data de {item.dispensedAtUtc && new Date(item.dispensedAtUtc).toLocaleString('ro-RO')}
                                  {item.dispensedByPharmacyName && ` de farmacia ${item.dispensedByPharmacyName}`}
                                </p>
                                <span className="text-xs text-emerald-700 font-medium">Eliberat</span>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              {pendingCount > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    disabled={selectedItemIds.size === 0 || dispensing}
                    loading={dispensing}
                    onClick={handleDispense}
                  >
                    Confirmă eliberarea
                  </Button>
                  {selectedItemIds.size > 0 && (
                    <span className="text-sm text-slate-600">
                      {selectedItemIds.size} medicament(e) selectat(e)
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </Card>
      )}

      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} MedRecord. Conformitate HIPAA • Conexiune criptată.
      </footer>
    </div>
  );
};
