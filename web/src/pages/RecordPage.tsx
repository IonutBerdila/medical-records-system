import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { getMyRecord, updateMyRecord } from '../app/records/recordsApi';
import type { MedicalRecordDto, UpdateMedicalRecordRequest } from '../app/records/types';

export const RecordPage: React.FC = () => {
  const [record, setRecord] = useState<MedicalRecordDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateMedicalRecordRequest>({});

  useEffect(() => {
    let cancelled = false;
    getMyRecord()
      .then((r) => {
        if (!cancelled) {
          setRecord(r);
          setForm({
            bloodType: r.bloodType ?? '',
            allergies: r.allergies ?? '',
            chronicConditions: r.chronicConditions ?? '',
            emergencyContactName: r.emergencyContactName ?? '',
            emergencyContactPhone: r.emergencyContactPhone ?? ''
          });
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          const msg =
            err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Eroare la încărcare';
          toast.error(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateMyRecord(form);
      setRecord(updated);
      toast.success('Fișa medicală a fost actualizată.');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Eroare la salvare';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-semibold text-slate-900">Fișa medicală</h1>
        <Card className="p-5">
          <form className="flex flex-col gap-4" onSubmit={handleSave}>
            <Input
              label="Grupa sanguină"
              value={form.bloodType ?? ''}
              onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
            />
            <Input
              label="Alergii"
              value={form.allergies ?? ''}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
            />
            <Input
              label="Afecțiuni cronice"
              value={form.chronicConditions ?? ''}
              onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })}
            />
            <Input
              label="Contact urgență (nume)"
              value={form.emergencyContactName ?? ''}
              onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
            />
            <Input
              label="Contact urgență (telefon)"
              value={form.emergencyContactPhone ?? ''}
              onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
            />
            <Button type="submit" loading={saving}>
              Salvează
            </Button>
          </form>
        </Card>
      </div>
  );
};
