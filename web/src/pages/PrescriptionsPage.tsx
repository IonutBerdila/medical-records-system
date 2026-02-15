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
      .catch((err: any) => {
        const msg =
          err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Eroare la Ã®ncÄƒrcare';
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
        <h1 className="text-2xl font-semibold text-slate-900">Prescripții</h1>
        {list.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-600">
            Nu ai prescripții înregistrate.
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((p) => (
              <Card key={p.id} className="p-4">
                <h3 className="font-medium text-slate-900">{p.medicationName}</h3>
                {p.dosage && (
                  <p className="text-sm text-slate-600">Doza: {p.dosage}</p>
                )}
                {p.instructions && (
                  <p className="text-sm text-slate-600">{p.instructions}</p>
                )}
                {p.validUntilUtc && (
                  <p className="mt-1 text-xs text-slate-600">
                    ValabilÄƒ pÃ¢nÄƒ: {new Date(p.validUntilUtc).toLocaleDateString('ro-RO')}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-600">
                  {new Date(p.createdAtUtc).toLocaleDateString('ro-RO')} Â· Status: {p.status}
                </p>
                {p.dispensedAtUtc && (
                  <p className="mt-1 text-xs text-emerald-700">
                    EliberatÄƒ la: {new Date(p.dispensedAtUtc).toLocaleString('ro-RO')}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
  );
};


