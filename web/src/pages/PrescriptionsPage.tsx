import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../ui/Card';
import { getMyPrescriptions } from '../app/prescriptions/prescriptionsApi';
import type { PrescriptionDto } from '../app/prescriptions/types';

export const PrescriptionsPage: React.FC = () => {
  const [list, setList] = useState<PrescriptionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPrescriptions()
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
  }, []);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {list.length === 0 ? (
        <Card className="p-6 text-center text-sm text-slate-600">
          Nu ai prescripții înregistrate.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-900">
                  Prescripție · {new Date(p.createdAtUtc).toLocaleDateString('ro-RO')}
                </span>
                <span className="text-xs text-slate-500">Status: {p.status}</span>
              </div>
              {(p.doctorFullName || p.doctorInstitutionName) && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {[p.doctorFullName && `Dr. ${p.doctorFullName}`, p.doctorInstitutionName].filter(Boolean).join(' · ')}
                </p>
              )}
              {p.diagnosis && <p className="mt-1 text-sm text-slate-600">Diagnostic: {p.diagnosis}</p>}
              {p.validUntilUtc && (
                <p className="mt-0.5 text-xs text-slate-600">
                  Valabilă până: {new Date(p.validUntilUtc).toLocaleDateString('ro-RO')}
                </p>
              )}
              <ul className="mt-2 space-y-1">
                {(p.items ?? []).map((item) => (
                  <li key={item.id} className="text-sm text-slate-700">
                    {item.medicationName}
                    {item.dosage && ` · ${item.dosage}`}
                    {item.instructions && ` · ${item.instructions}`}
                    <span className="ml-2 text-xs text-slate-500">({item.status})</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
