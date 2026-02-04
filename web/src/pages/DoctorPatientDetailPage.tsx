import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Layout } from '../ui/Layout';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { getPatientRecord } from '../app/records/recordsApi';
import { getPatientEntries, addPatientEntry } from '../app/entries/entriesApi';
import { createPatientPrescription } from '../app/prescriptions/prescriptionsApi';
import type { MedicalRecordDto } from '../app/records/types';
import type { MedicalEntryDto } from '../app/entries/types';
import type { CreateMedicalEntryRequest } from '../app/entries/types';
import type { CreatePrescriptionRequest } from '../app/prescriptions/types';

const ENTRY_TYPES = ['Diagnosis', 'Visit', 'Note', 'LabResult'];

export const DoctorPatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const patientUserId = id ?? '';

  const [record, setRecord] = useState<MedicalRecordDto | null>(null);
  const [entries, setEntries] = useState<MedicalEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
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
    Promise.all([
      getPatientRecord(patientUserId),
      getPatientEntries(patientUserId)
    ])
      .then(([r, e]) => {
        setRecord(r);
        setEntries(e);
      })
      .catch((err: any) => {
        const msg =
          err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Eroare la încărcare';
        toast.error(msg);
        if (err?.response?.status === 403) navigate('/doctor/patients');
      })
      .finally(() => setLoading(false));
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
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Eroare la adăugare';
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
      toast.success('Rețetă creată.');
      setPrescriptionForm({ medicationName: '', dosage: '', instructions: '' });
      load();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Eroare la creare';
      toast.error(msg);
    } finally {
      setSubmittingPrescription(false);
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => navigate('/doctor/patients')}
          >
            ← Pacienți
          </button>
        </div>
        <h1 className="text-2xl font-semibold text-text">Detalii pacient</h1>

        {record && (
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-text mb-2">Fișă medicală</h2>
            <p className="text-sm text-mutedText">
              Grupă: {record.bloodType || '—'} · Alergii: {record.allergies || '—'}
            </p>
            {record.emergencyContactName && (
              <p className="text-sm text-mutedText">
                Contact urgență: {record.emergencyContactName} {record.emergencyContactPhone}
              </p>
            )}
          </Card>
        )}

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-text mb-3">Adaugă intrare</h2>
          <form className="flex flex-col gap-3" onSubmit={handleAddEntry}>
            <label className="text-sm text-mutedText">
              Tip
              <select
                className="ml-2 rounded-full border border-borderSoft/80 bg-white px-3 py-1.5 text-sm"
                value={entryForm.type}
                onChange={(e) => setEntryForm({ ...entryForm, type: e.target.value })}
              >
                {ENTRY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <Input
              label="Titlu"
              value={entryForm.title}
              onChange={(e) => setEntryForm({ ...entryForm, title: e.target.value })}
              required
            />
            <Input
              label="Descriere (opțional)"
              value={entryForm.description ?? ''}
              onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
            />
            <Button type="submit" loading={submittingEntry}>
              Adaugă intrare
            </Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-text mb-3">Creează rețetă</h2>
          <form className="flex flex-col gap-3" onSubmit={handleCreatePrescription}>
            <Input
              label="Medicament"
              value={prescriptionForm.medicationName}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicationName: e.target.value })}
              required
            />
            <Input
              label="Doza (opțional)"
              value={prescriptionForm.dosage ?? ''}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
            />
            <Input
              label="Instrucțiuni (opțional)"
              value={prescriptionForm.instructions ?? ''}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
            />
            <Button type="submit" loading={submittingPrescription}>
              Creează rețetă
            </Button>
          </form>
        </Card>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-text">Intrări timeline</h2>
          {entries.length === 0 ? (
            <p className="text-sm text-mutedText">Nicio intrare încă.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((e) => (
                <Card key={e.id} className="p-3">
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                    {e.type}
                  </span>
                  <span className="ml-2 font-medium">{e.title}</span>
                  <span className="ml-2 text-xs text-mutedText">
                    {new Date(e.createdAtUtc).toLocaleDateString('ro-RO')}
                  </span>
                  {e.description && (
                    <p className="mt-1 text-sm text-mutedText">{e.description}</p>
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
