import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { TagInput } from '../ui/TagInput';
import { getMyRecord, updateMyRecord } from '../app/records/recordsApi';
import type {
  MedicalRecordDto,
  UpdateMedicalRecordRequest,
  EmergencyContactDto
} from '../app/records/types';
import { BLOOD_GROUPS, EMERGENCY_RELATIONS } from '../app/records/types';

function toTagArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatLastUpdated(utc: string): string {
  try {
    const d = new Date(utc);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

const PHONE_REGEX = /^[\d\s+\-()]{8,}$/;
function isValidPhone(val: string): boolean {
  const digits = val.replace(/\D/g, '');
  return digits.length >= 8 && PHONE_REGEX.test(val.trim());
}

function toEmergencyContacts(dto: MedicalRecordDto): EmergencyContactDto[] {
  if (dto.emergencyContacts && dto.emergencyContacts.length > 0) {
    return dto.emergencyContacts.map((c) => ({
      name: c.name ?? '',
      relation: c.relation ?? '',
      phone: c.phone ?? ''
    }));
  }
  if (dto.emergencyContactName || dto.emergencyContactPhone) {
    return [
      {
        name: dto.emergencyContactName ?? '',
        relation: dto.emergencyContactRelation ?? '',
        phone: dto.emergencyContactPhone ?? ''
      }
    ];
  }
  return [{ name: '', relation: '', phone: '' }];
}

export const RecordPage: React.FC = () => {
  const [record, setRecord] = useState<MedicalRecordDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateMedicalRecordRequest>({});
  const [phoneErrors, setPhoneErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    getMyRecord()
      .then((r) => {
        if (!cancelled) {
          setRecord(r);
          setForm({
            bloodType: r.bloodType ?? '',
            allergies: toTagArray(r.allergies),
            adverseDrugReactions: toTagArray(r.adverseDrugReactions),
            chronicConditions: toTagArray(r.chronicConditions),
            currentMedications: r.currentMedications ?? '',
            majorSurgeriesHospitalizations: r.majorSurgeriesHospitalizations ?? '',
            emergencyContacts: toEmergencyContacts(r)
          });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg =
            (err as { response?: { data?: { message?: string; title?: string } }; message?: string })?.response?.data
              ?.message ||
            (err as { response?: { data?: { message?: string; title?: string } } })?.response?.data?.title ||
            (err as { message?: string })?.message ||
            'Eroare la încărcare';
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

  const validateContactPhone = (idx: number, val: string) => {
    if (!val.trim()) {
      setPhoneErrors((prev) => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
      return true;
    }
    const ok = isValidPhone(val);
    setPhoneErrors((prev) =>
      ok ? (() => { const n = { ...prev }; delete n[idx]; return n; })() : { ...prev, [idx]: 'Minim 8 cifre' }
    );
    return ok;
  };

  const contacts = form.emergencyContacts ?? [{ name: '', relation: '', phone: '' }];

  const updateContact = (idx: number, field: keyof EmergencyContactDto, value: string) => {
    const next = [...contacts];
    next[idx] = { ...next[idx], [field]: value };
    setForm({ ...form, emergencyContacts: next });
  };

  const addContact = () => {
    setForm({ ...form, emergencyContacts: [...contacts, { name: '', relation: '', phone: '' }] });
  };

  const removeContact = (idx: number) => {
    if (contacts.length <= 1) return;
    const next = contacts.filter((_, i) => i !== idx);
    setForm({ ...form, emergencyContacts: next });
    setPhoneErrors({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let phoneValid = true;
    contacts.forEach((c, i) => {
      if (c.phone?.trim() && !validateContactPhone(i, c.phone)) phoneValid = false;
    });
    if (!phoneValid) return;

    setSaving(true);
    try {
      const payload: UpdateMedicalRecordRequest = {
        bloodType: form.bloodType?.trim() || undefined,
        allergies: (form.allergies ?? []).filter((s) => s.trim()).slice(0, 30),
        adverseDrugReactions: (form.adverseDrugReactions ?? []).filter((s) => s.trim()).slice(0, 30),
        chronicConditions: (form.chronicConditions ?? []).filter((s) => s.trim()).slice(0, 30),
        currentMedications: form.currentMedications?.trim().slice(0, 1000) || undefined,
        majorSurgeriesHospitalizations: form.majorSurgeriesHospitalizations?.trim().slice(0, 1000) || undefined,
        emergencyContacts: contacts
          .filter((c) => c.name?.trim() || c.phone?.trim())
          .map((c) => ({
            name: c.name?.trim() || undefined,
            relation: c.relation?.trim() || undefined,
            phone: c.phone?.trim() || undefined
          }))
      };
      const updated = await updateMyRecord(payload);
      setRecord(updated);
      toast.success('Fișa medicală a fost salvată.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; title?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.title ||
        (err as { message?: string })?.message ||
        'Eroare la salvare';
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
      {record?.updatedAtUtc && (
        <p className="text-xs text-slate-400">
          Ultima actualizare: {formatLastUpdated(record.updatedAtUtc)}
        </p>
      )}

      <Card className="p-5 md:p-6">
        <form className="flex flex-col gap-6" onSubmit={handleSave}>
          {/* Section 1: Informații critice */}
          <section>
            <h2 className="mb-4 text-base font-semibold text-slate-800">Informații critice</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="blood-type" className="mb-1 block text-sm font-medium text-slate-700">
                  Grupa sanguină
                </label>
                <select
                  id="blood-type"
                  value={form.bloodType ?? ''}
                  onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-colors focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
              <TagInput
                label="Alergii"
                value={form.allergies ?? []}
                onChange={(allergies) => setForm({ ...form, allergies })}
                placeholder="Adaugă alergie…"
                maxTags={30}
                maxLengthPerTag={60}
              />
              <TagInput
                label="Reacții adverse la medicamente"
                value={form.adverseDrugReactions ?? []}
                onChange={(adverseDrugReactions) => setForm({ ...form, adverseDrugReactions })}
                placeholder="Adaugă reacție…"
                maxTags={30}
                maxLengthPerTag={60}
              />
              <TagInput
                label="Afecțiuni cronice"
                value={form.chronicConditions ?? []}
                onChange={(chronicConditions) => setForm({ ...form, chronicConditions })}
                placeholder="Adaugă afecțiune…"
                maxTags={30}
                maxLengthPerTag={60}
              />
            </div>
          </section>

          {/* Section 2: Medicație curentă */}
          <section>
            <h2 className="mb-4 text-base font-semibold text-slate-800">Medicație curentă</h2>
            <Textarea
              label="Medicație curentă"
              helper="Include: denumire, doză, frecvență (ex: Metformin 500mg, 2x/zi)"
              value={form.currentMedications ?? ''}
              onChange={(e) => setForm({ ...form, currentMedications: e.target.value })}
              rows={4}
              maxLength={1000}
              placeholder="Ex: Metformin 500mg, 2x/zi"
            />
          </section>

          {/* Section 3: Istoric medical relevant */}
          <section>
            <h2 className="mb-4 text-base font-semibold text-slate-800">Istoric medical relevant</h2>
            <Textarea
              label="Intervenții / spitalizări importante"
              helper="Ex: apendicectomie 2022, internare 2024"
              value={form.majorSurgeriesHospitalizations ?? ''}
              onChange={(e) => setForm({ ...form, majorSurgeriesHospitalizations: e.target.value })}
              rows={4}
              maxLength={1000}
              placeholder="Ex: apendicectomie 2022, internare 2024"
            />
          </section>

          {/* Section 4: Contact de urgență */}
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-slate-800">Contact de urgență</h2>
              <Button
                type="button"
                variant="secondary"
                onClick={addContact}
                className="shrink-0 text-sm"
              >
                <span className="mr-1.5">+</span>
                Adaugă
              </Button>
            </div>
            <div className="flex flex-col gap-4">
              {contacts.map((contact, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Input
                        label="Contact urgență (nume)"
                        value={contact.name ?? ''}
                        onChange={(e) => updateContact(idx, 'name', e.target.value)}
                      />
                      <div>
                        <label
                          htmlFor={`emergency-relation-${idx}`}
                          className="mb-1 block text-sm font-medium text-slate-700"
                        >
                          Relație
                        </label>
                        <select
                          id={`emergency-relation-${idx}`}
                          value={contact.relation ?? ''}
                          onChange={(e) => updateContact(idx, 'relation', e.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-colors focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          <option value="">— Selectează —</option>
                          {EMERGENCY_RELATIONS.map((rel) => (
                            <option key={rel} value={rel}>
                              {rel}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Input
                          label="Contact urgență (telefon)"
                          value={contact.phone ?? ''}
                          onChange={(e) => {
                            updateContact(idx, 'phone', e.target.value);
                            if (phoneErrors[idx]) validateContactPhone(idx, e.target.value);
                          }}
                          onBlur={(e) => validateContactPhone(idx, e.target.value)}
                          placeholder="+373 69 123 456"
                          error={phoneErrors[idx]}
                        />
                      </div>
                    </div>
                    {contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContact(idx)}
                        className="mt-8 rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                        aria-label="Șterge contact"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-slate-200 pt-4">
            <Button type="submit" loading={saving} disabled={saving}>
              Salvează
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
