import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Layout } from '../ui/Layout';
import { Card } from '../ui/Card';
import { getMyEntries } from '../app/entries/entriesApi';
import type { MedicalEntryDto } from '../app/entries/types';

const ENTRY_TYPES = ['Diagnosis', 'Visit', 'Note', 'LabResult'];

export const TimelinePage: React.FC = () => {
  const [entries, setEntries] = useState<MedicalEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    getMyEntries()
      .then(setEntries)
      .catch((err: any) => {
        const msg =
          err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Eroare la încărcare';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterType
    ? entries.filter((e) => e.type === filterType)
    : entries;

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
        <h1 className="text-2xl font-semibold text-text">Timeline medical</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-mutedText">Filtru tip:</label>
          <select
            className="rounded-full border border-borderSoft/80 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Toate</option>
            {ENTRY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {filtered.length === 0 ? (
          <Card className="p-6 text-center text-sm text-mutedText">
            Nu există încă intrări în timeline.
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((e) => (
              <Card key={e.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {e.type}
                    </span>
                    <h3 className="mt-1 font-medium text-text">{e.title}</h3>
                    {e.description && (
                      <p className="mt-1 text-sm text-mutedText">{e.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-mutedText">
                    {new Date(e.createdAtUtc).toLocaleDateString('ro-RO')}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
