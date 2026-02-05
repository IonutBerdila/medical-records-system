import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Table, TableHead, Th, TableBody, Tr, Td } from '../ui/Table';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { Badge } from '../ui/Badge';
import { IconDocumentEmpty } from '../ui/Icons';
import { getMyPatients } from '../app/doctor/doctorApi';
import type { DoctorPatientDto } from '../app/doctor/types';

function initials(name?: string, email?: string, id?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  if (id) return id.slice(0, 2).toUpperCase();
  return '?';
}

export const DoctorPatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<DoctorPatientDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getMyPatients()
      .then(setPatients)
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

  const filtered =
    search.trim() === ''
      ? patients
      : patients.filter(
          (p) =>
            (p.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
            (p.fullName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
            p.patientUserId.toLowerCase().includes(search.toLowerCase())
        );

  const total = patients.length;
  const activeCount = total; // placeholder: toți cu acces = activi

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Pacienții mei</h1>
          <p className="mt-1 text-slate-600">Gestionează și vizualizează fișele pacienților.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Card className="p-6">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Pacienții mei</h1>
        <p className="mt-1 text-slate-600">Gestionează și vizualizează fișele pacienților.</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm font-medium text-slate-600">Total pacienți</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{total}</p>
        </Card>
        <Card className="p-4 border-emerald-200 bg-emerald-50/50">
          <p className="text-sm font-medium text-emerald-700">Activi</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{activeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-slate-600">Urmărire</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">—</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-slate-600">Inactivi</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">—</p>
        </Card>
      </div>

      <Card className="p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <input
              type="search"
              placeholder="Caută după nume, ID, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 flex-1 max-w-md rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              aria-label="Caută pacienți"
            />
            <Button variant="secondary" className="shrink-0">
              Filtre
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<IconDocumentEmpty className="text-slate-300" />}
            title={patients.length === 0 ? 'Niciun pacient găsit' : 'Niciun rezultat'}
            description={
              patients.length === 0
                ? 'Pacienții care ți-au acordat consimțământ vor apărea aici. Ei pot face acest lucru din secțiunea „Acces și partajare”.'
                : 'Încearcă alt termen de căutare.'
            }
            action={
              patients.length > 0 ? (
                <Button variant="secondary" onClick={() => setSearch('')}>
                  Resetează căutarea
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <Th>Nume</Th>
                <Th>ID Pacient</Th>
                <Th>Ultima actualizare</Th>
                <Th>Ultima vizită</Th>
                <Th>Status</Th>
                <Th className="text-right">Acțiune</Th>
              </TableHead>
              <TableBody>
                {filtered.map((p) => (
                  <Tr key={p.patientUserId}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                          {initials(p.fullName, p.email, p.patientUserId)}
                        </span>
                        <span className="font-medium text-slate-900">
                          {p.fullName || p.email || p.patientUserId}
                        </span>
                      </div>
                    </Td>
                    <Td className="font-mono text-xs text-slate-600">
                      {p.patientUserId.slice(0, 8)}…
                    </Td>
                    <Td className="text-slate-600">—</Td>
                    <Td className="text-slate-600">—</Td>
                    <Td>
                      <Badge variant="success">Activ</Badge>
                    </Td>
                    <Td className="text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/doctor/patients/${p.patientUserId}`)}
                        className="text-sm font-medium text-teal-600 hover:underline"
                      >
                        Deschide
                      </button>
                    </Td>
                  </Tr>
                ))}
              </TableBody>
            </Table>
            <p className="mt-4 text-sm text-slate-500">
              Se afișează {filtered.length} din {patients.length} pacienți.
            </p>
          </>
        )}
      </Card>
    </div>
  );
};
