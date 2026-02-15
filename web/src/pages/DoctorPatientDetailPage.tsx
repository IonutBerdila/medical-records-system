import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs } from '../ui/Tabs';
import { EmptyState } from '../ui/EmptyState';
import { getPatientRecord } from '../app/records/recordsApi';
import { getPatientEntries, addPatientEntry } from '../app/entries/entriesApi';
import { getPatientPrescriptions, createPatientPrescription } from '../app/prescriptions/prescriptionsApi';
import type { MedicalRecordDto } from '../app/records/types';
import type { MedicalEntryDto } from '../app/entries/types';
import type { CreateMedicalEntryRequest } from '../app/entries/types';
import type { CreatePrescriptionRequest, PrescriptionDto } from '../app/prescriptions/types';
import { getInitials } from '../app/utils/initials';

const ENTRY_TYPES = ['Diagnosis', 'Visit', 'Note', 'LabResult'];

function formatTags(arr: string | string[] | undefined): string {
  if (!arr) return '—';
  const list = Array.isArray(arr) ? arr : [arr];
  return list.filter(Boolean).join(', ') || '—';
}

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
function hasRecordData(r: MedicalRecordDto | null): boolean {
  if (!r) return false;
  if (r.id === EMPTY_GUID || !r.id) return false;
  return true;
}

export const DoctorPatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const patientUserId = id ?? '';
  const { fullName, email } = (location.state as { fullName?: string; email?: string } | null) ?? {};

  const [record, setRecord] = useState<MedicalRecordDto | null>(null);
  const [entries, setEntries] = useState<MedicalEntryDto[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [entryForm, setEntryForm] = useState<CreateMedicalEntryRequest>({
    type: 'Note',
    title: '',
    description: ''
  });
  const [prescriptionForm, setPrescriptionForm] = useState<CreatePrescriptionRequest>({
    medicationName: '',
    dosage: '',
    instructions: ''
  });
  const [submittingEntry, setSubmittingEntry] = useState(false);
  const [submittingPrescription, setSubmittingPrescription] = useState(false);

  const load = () => {
    if (!patientUserId) return;
    const status = (e: unknown) => (e as { response?: { status?: number } })?.response?.status;
    const msg = (e: unknown) =>
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      (e as { response?: { data?: { title?: string } } })?.response?.data?.title ||
      (e as { message?: string })?.message ||
      'Eroare la încărcare';

    Promise.allSettled([
      getPatientRecord(patientUserId),
      getPatientEntries(patientUserId),
      getPatientPrescriptions(patientUserId)
    ]).then(([rRes, eRes, pRes]) => {
      if (rRes.status === 'fulfilled') setRecord(rRes.value);
      else {
        if (status(rRes.reason) === 403) navigate('/doctor/patients');
        else if (status(rRes.reason) === 405) toast.error('Endpoint fișă medicală indisponibil (405). Reporniți API-ul.');
        else toast.error(`Fișă medicală: ${msg(rRes.reason)}`);
      }
      if (eRes.status === 'fulfilled') setEntries(eRes.value);
      else {
        if (status(eRes.reason) === 403) navigate('/doctor/patients');
        else if (status(eRes.reason) === 405) toast.error('Endpoint intrări indisponibil (405). Reporniți API-ul.');
        else toast.error(`Intrări: ${msg(eRes.reason)}`);
      }
      if (pRes.status === 'fulfilled') setPrescriptions(pRes.value);
      else {
        if (status(pRes.reason) === 403) navigate('/doctor/patients');
        else if (status(pRes.reason) === 405) toast.error('Endpoint prescripții indisponibil (405). Reporniți API-ul.');
        else toast.error(`Prescripții: ${msg(pRes.reason)}`);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, [patientUserId]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientUserId || !entryForm.title.trim()) return;
    setSubmittingEntry(true);
    try {
      await addPatientEntry(patientUserId, entryForm);
      toast.success('Intrare adăugată.');
      setEntryForm({ type: 'Note', title: '', description: '' });
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; title?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as { response?: { data?: { title?: string } } })?.response?.data?.title ||
        (err as { message?: string })?.message ||
        'Eroare la adăugare';
      toast.error(msg);
    } finally {
      setSubmittingEntry(false);
    }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientUserId || !prescriptionForm.medicationName.trim()) return;
    setSubmittingPrescription(true);
    try {
      await createPatientPrescription(patientUserId, prescriptionForm);
      toast.success('Prescripție creată.');
      setPrescriptionForm({ medicationName: '', dosage: '', instructions: '' });
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; title?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as { response?: { data?: { title?: string } } })?.response?.data?.title ||
        (err as { message?: string })?.message ||
        'Eroare la creare';
      toast.error(msg);
    } finally {
      setSubmittingPrescription(false);
    }
  };

  const tabItems = [
    { id: 'overview', label: 'Prezentare generală' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'prescriptions', label: 'Prescripții' }
  ];

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          onClick={() => navigate('/doctor/patients')}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Pacienți
        </button>
        <div className="flex gap-2">
          <Button onClick={() => setActiveTab('prescriptions')}>
            + Adaugă prescripție
          </Button>
          <Button onClick={() => setActiveTab('timeline')}>
            + Adaugă intrare medicală
          </Button>
        </div>
      </div>

      {/* Patient summary card (ca referință) */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xl font-semibold text-teal-700">
              {getInitials(fullName, email, patientUserId)}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Pacient</h1>
              <p className="text-sm text-slate-600">ID: {patientUserId}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {record?.bloodType && (
                  <Badge variant="error">Grupă: {record.bloodType}</Badge>
                )}
                {record?.allergies && record.allergies.length > 0 && (
                  <Badge variant="warning">Alergie: {formatTags(record.allergies)}</Badge>
                )}
                <Badge variant="success">Pacient activ</Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs tabs={tabItems} activeId={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-900">Fișă medicală</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasRecordData(record) ? (
              <>
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Grupă sanguină:</span> {record.bloodType || '—'}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Alergii:</span> {formatTags(record.allergies)}
                </p>
                {record.adverseDrugReactions && record.adverseDrugReactions.length > 0 && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Reacții adverse la medicamente:</span>{' '}
                    {formatTags(record.adverseDrugReactions)}
                  </p>
                )}
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Afecțiuni cronice:</span>{' '}
                  {formatTags(record.chronicConditions)}
                </p>
                {record.currentMedications && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Medicație curentă:</span>{' '}
                    {record.currentMedications}
                  </p>
                )}
                {record.majorSurgeriesHospitalizations && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Intervenții/spitalizări:</span>{' '}
                    {record.majorSurgeriesHospitalizations}
                  </p>
                )}
                {((record.emergencyContacts && record.emergencyContacts.length > 0) ||
                  record.emergencyContactName ||
                  record.emergencyContactPhone) && (
                  <div className="space-y-1">
                    <span className="font-medium text-slate-700">Contact urgență:</span>
                    {record.emergencyContacts && record.emergencyContacts.length > 0
                      ? record.emergencyContacts.map((c, i) => (
                          <p key={i} className="text-sm text-slate-600 pl-4">
                            {[c.name, c.relation, c.phone].filter(Boolean).join(' · ') || '—'}
                          </p>
                        ))
                      : (
                          <p className="text-sm text-slate-600 pl-4">
                            {[record.emergencyContactName, record.emergencyContactRelation, record.emergencyContactPhone]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">Nu există date de fișă medicală.</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">Adaugă intrare medicală</h2>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleAddEntry}>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Tip <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={entryForm.type}
                    onChange={(e) => setEntryForm({ ...entryForm, type: e.target.value })}
                  >
                    {ENTRY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Titlu"
                    value={entryForm.title}
                    onChange={(e) => setEntryForm({ ...entryForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Descriere (opțional)"
                    value={entryForm.description ?? ''}
                    onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <Button type="submit" loading={submittingEntry}>
                    Salvează intrare
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEntryForm({ type: 'Note', title: '', description: '' })}>
                    Anulează
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">Intrări timeline</h2>
            {entries.length === 0 ? (
              <EmptyState
                title="Nicio intrare"
                description="Intrările adăugate aici vor apărea în lista de mai jos."
              />
            ) : (
              <ul className="space-y-2">
                {entries.map((e) => (
                  <Card key={e.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info">{e.type}</Badge>
                      <span className="font-medium text-slate-900">{e.title}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(e.createdAtUtc).toLocaleString('ro-RO')}
                      </span>
                    </div>
                    {e.description && (
                      <p className="mt-2 text-sm text-slate-600">{e.description}</p>
                    )}
                  </Card>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">Creează prescripție</h2>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreatePrescription}>
                <div className="sm:col-span-2">
                  <Input
                    label="Medicament"
                    value={prescriptionForm.medicationName}
                    onChange={(e) =>
                      setPrescriptionForm({ ...prescriptionForm, medicationName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Input
                    label="Doza (opțional)"
                    value={prescriptionForm.dosage ?? ''}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    label="Instrucțiuni (opțional)"
                    value={prescriptionForm.instructions ?? ''}
                    onChange={(e) =>
                      setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <Button type="submit" loading={submittingPrescription}>
                    Salvează prescripție
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setPrescriptionForm({ medicationName: '', dosage: '', instructions: '' })
                    }
                  >
                    Anulează
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">Lista de prescripții</h2>
            {prescriptions.length === 0 ? (
              <EmptyState
                title="Nu există prescripții încă"
                description="Prescripțiile create aici apar în lista de mai jos și în contul pacientului."
              />
            ) : (
              <ul className="space-y-2">
                {prescriptions.map((p) => (
                  <Card key={p.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{p.medicationName}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(p.createdAtUtc).toLocaleString('ro-RO')}
                      </span>
                    </div>
                    {(p.dosage || p.instructions) && (
                      <p className="mt-2 text-sm text-slate-600">
                        {[p.dosage, p.instructions].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </Card>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
