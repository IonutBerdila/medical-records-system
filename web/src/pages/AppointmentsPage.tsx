import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { http } from '../app/http';
import { fetchSpecialties, type SpecialtyOption } from '../app/metadata/metadataApi';
import toast from 'react-hot-toast';

type Scope = 'upcoming' | 'history' | 'cancelled' | 'today';

interface PatientAppointment {
  appointmentId: string;
  status: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
  notes?: string;
  cancellationReason?: string;
  createdAtUtc: string;
  cancelledAtUtc?: string;
  doctorProfileId: string;
  doctorFullName: string;
  specialtyId: string;
  specialtyName: string;
  medicalInstitutionId: string;
  medicalInstitutionName: string;
  medicalInstitutionCity?: string;
}

interface DoctorSearchResult {
  doctorProfileId: string;
  doctorInstitutionId: string;
  doctorFullName: string;
  specialtyId: string;
  specialtyName: string;
  institutionName: string;
  institutionCity?: string;
  hasAvailabilityOnDate: boolean;
}

interface AvailableSlot {
  date: string;
  startTime: string;
  endTime: string;
  label: string;
}

interface AppointmentCreateRequest {
  doctorInstitutionId: string;
  specialtyId: string;
  appointmentDate: string;
  startTime: string;
  reason?: string;
  notes?: string;
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export const AppointmentsPage: React.FC = () => {
  const [scope, setScope] = useState<Scope>('upcoming');
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);

  const [specialties, setSpecialties] = useState<SpecialtyOption[]>([]);
  const [specialtiesLoading, setSpecialtiesLoading] = useState(false);
  const [specialtyId, setSpecialtyId] = useState('');

  const [doctors, setDoctors] = useState<DoctorSearchResult[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [selectedDoctorInstitutionId, setSelectedDoctorInstitutionId] = useState('');

  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const currentScopeLabel = useMemo(() => {
    if (scope === 'upcoming') return 'Viitoare';
    if (scope === 'history') return 'Istoric';
    if (scope === 'cancelled') return 'Anulate';
    if (scope === 'today') return 'Azi';
    return '';
  }, [scope]);

  const loadAppointments = async (currentScope: Scope) => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams();
      params.set('scope', currentScope);
      const { data } = await http.get<PatientAppointment[]>(`/api/appointments/my?${params.toString()}`);
      setAppointments(data);
    } catch (err: any) {
      const msg = err?.normalizedMessage || err?.message || 'Nu am putut încărca programările.';
      toast.error(msg);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void loadAppointments(scope);
  }, [scope]);

  const openWizard = () => {
    setWizardOpen(true);
    setWizardStep(1);
  };

  const closeWizard = () => {
    setWizardOpen(false);
  };

  const loadSpecialtiesOnce = async () => {
    if (specialties.length > 0 || specialtiesLoading) return;
    setSpecialtiesLoading(true);
    try {
      const data = await fetchSpecialties();
      setSpecialties(data);
    } catch (err: any) {
      const msg = err?.normalizedMessage || err?.message || 'Nu am putut încărca specialitățile.';
      toast.error(msg);
    } finally {
      setSpecialtiesLoading(false);
    }
  };

  const handleNextFromStep1 = async () => {
    if (!specialtyId) {
      toast.error('Selectează o specialitate.');
      return;
    }
    setWizardStep(2);
    setDoctorsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('specialtyId', specialtyId);
      if (date) params.set('date', date);
      const { data } = await http.get<DoctorSearchResult[]>(`/api/appointments/doctors/search?${params.toString()}`);
      setDoctors(data);
    } catch (err: any) {
      const msg = err?.normalizedMessage || err?.message || 'Nu am putut încărca doctorii.';
      toast.error(msg);
    } finally {
      setDoctorsLoading(false);
    }
  };

  const handleNextFromStep2 = () => {
    if (!selectedDoctorInstitutionId) {
      toast.error('Selectează un doctor.');
      return;
    }
    setWizardStep(3);
  };

  const handleNextFromStep3 = async () => {
    if (!date) {
      toast.error('Selectează o dată.');
      return;
    }
    if (!selectedDoctorInstitutionId) {
      toast.error('Selectează un doctor.');
      return;
    }
    setWizardStep(4);
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const params = new URLSearchParams();
      params.set('doctorInstitutionId', selectedDoctorInstitutionId);
      params.set('date', date);
      const { data } = await http.get<AvailableSlot[]>(`/api/appointments/available-slots?${params.toString()}`);
      setSlots(data);
    } catch (err: any) {
      const msg = err?.normalizedMessage || err?.message || 'Nu am putut încărca sloturile disponibile.';
      toast.error(msg);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleNextFromStep4 = () => {
    if (!selectedSlot) {
      toast.error('Selectează un interval orar.');
      return;
    }
    setWizardStep(5);
  };

  const handleNextFromStep5 = () => {
    if (!reason.trim()) {
      toast.error('Motivul programării este obligatoriu.');
      return;
    }
    setWizardStep(6);
  };

  const handleSubmitAppointment = async () => {
    if (!selectedSlot || !selectedDoctorInstitutionId || !specialtyId || !date || !reason.trim()) {
      toast.error('Completează toate câmpurile obligatorii.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: AppointmentCreateRequest = {
        doctorInstitutionId: selectedDoctorInstitutionId,
        specialtyId,
        appointmentDate: selectedSlot.date,
        startTime: selectedSlot.startTime,
        reason: reason.trim(),
        notes: notes.trim() || undefined
      };
      await http.post('/api/appointments', payload);
      toast.success('Programarea a fost creată cu succes.');
      setWizardOpen(false);
      setSpecialtyId('');
      setSelectedDoctorInstitutionId('');
      setDate('');
      setSelectedSlot(null);
      setReason('');
      setNotes('');
      void loadAppointments('upcoming');
      setScope('upcoming');
    } catch (err: any) {
      const msg = err?.normalizedMessage || err?.message || 'Nu am putut crea programarea.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm('Sigur vrei să anulezi această programare?')) return;
    try {
      await http.post(`/api/appointments/${appointmentId}/cancel-by-patient`, { reason: '' });
      toast.success('Programarea a fost anulată.');
      void loadAppointments(scope);
    } catch (err: any) {
      const msg = err?.normalizedMessage || err?.message || 'Nu am putut anula programarea.';
      toast.error(msg);
    }
  };

  const renderStatusBadge = (status: string) => {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
    if (status === 'Confirmed') return <span className={`${base} bg-emerald-50 text-emerald-700`}>Confirmată</span>;
    if (status === 'Completed') return <span className={`${base} bg-sky-50 text-sky-700`}>Finalizată</span>;
    if (status === 'CancelledByPatient')
      return <span className={`${base} bg-slate-50 text-slate-600`}>Anulată de pacient</span>;
    if (status === 'CancelledByDoctor')
      return <span className={`${base} bg-red-50 text-red-700`}>Anulată de doctor</span>;
    return <span className={`${base} bg-slate-50 text-slate-600`}>{status}</span>;
  };

  const renderList = () => {
    if (loadingList) {
      return (
        <Card className="p-6">
          <p className="text-sm text-slate-600">Se încarcă programările...</p>
        </Card>
      );
    }

    if (appointments.length === 0) {
      return (
        <Card className="flex flex-col items-center justify-center p-10 text-center">
          <p className="text-base font-medium text-slate-800">Nu există programări {currentScopeLabel.toLowerCase()}.</p>
          <p className="mt-2 max-w-md text-sm text-slate-600">
            Poți crea o programare nouă apăsând pe butonul „Programează-te”.
          </p>
        </Card>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        {appointments.map((a) => (
          <Card key={a.appointmentId} className="p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{a.doctorFullName}</span>
                <span className="text-xs text-slate-500">· {a.specialtyName}</span>
              </div>
              <div className="text-xs text-slate-500">
                {a.medicalInstitutionName}
                {a.medicalInstitutionCity ? ` · ${a.medicalInstitutionCity}` : ''}
              </div>
              <div className="text-xs text-slate-600">
                {a.appointmentDate} · {a.startTime.slice(0, 5)}–{a.endTime.slice(0, 5)}
              </div>
              {a.reason && (
                <div className="text-xs text-slate-700">
                  <span className="font-medium">Motiv:</span> {a.reason}
                </div>
              )}
              {a.cancellationReason && (
                <div className="text-xs text-slate-600">
                  <span className="font-medium">Motiv anulare:</span> {a.cancellationReason}
                </div>
              )}
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              {renderStatusBadge(a.status)}
              {a.status === 'Confirmed' && scope !== 'history' && scope !== 'cancelled' && (
                <Button variant="secondary" onClick={() => handleCancelAppointment(a.appointmentId)}>
                  Anulează
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const currentDoctor = doctors.find((d) => d.doctorInstitutionId === selectedDoctorInstitutionId) || null;

  const renderWizardContent = () => {
    if (wizardStep === 1) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Alege specialitatea</h2>
          <p className="text-sm text-slate-600">Selectează specialitatea pentru care vrei să te programezi.</p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Specialitate</label>
            <select
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              value={specialtyId}
              onChange={(e) => setSpecialtyId(e.target.value)}
              onFocus={() => void loadSpecialtiesOnce()}
            >
              <option value="">{specialtiesLoading ? 'Se încarcă...' : 'Selectează'}</option>
              {!specialtiesLoading &&
                specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeWizard}>
              Renunță
            </Button>
            <Button type="button" onClick={handleNextFromStep1}>
              Următorul pas
            </Button>
          </div>
        </div>
      );
    }

    if (wizardStep === 2) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-salte-900">Alege doctorul</h2>
          <p className="text-sm text-slate-600">
            Alege unul dintre doctorii disponibili pentru specialitatea selectată.
          </p>
          {doctorsLoading ? (
            <p className="text-sm text-slate-600">Se încarcă doctorii...</p>
          ) : doctors.length === 0 ? (
            <p className="text-sm text-slate-600">
              Nu am găsit doctori pentru această specialitate. Încearcă altă specialitate sau altă dată.
            </p>
          ) : (
            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
              {doctors.map((d) => (
                <button
                  key={d.doctorInstitutionId}
                  type="button"
                  onClick={() => setSelectedDoctorInstitutionId(d.doctorInstitutionId)}
                  className={`text-left rounded-xl border px-4 py-3 text-sm transition-colors ${
                    selectedDoctorInstitutionId === d.doctorInstitutionId
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 bg-white hover:border-primary/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{d.doctorFullName}</div>
                      <div className="text-xs text-slate-500">
                        {d.specialtyName} · {d.institutionName}
                        {d.institutionCity ? ` · ${d.institutionCity}` : ''}
                      </div>
                    </div>
                    {d.hasAvailabilityOnDate && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        Are sloturi libere
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => setWizardStep(1)}>
              Înapoi
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={closeWizard}>
                Renunță
              </Button>
              <Button type="button" onClick={handleNextFromStep2}>
                Următorul pas
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (wizardStep === 3) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Alege data</h2>
          <p className="text-sm text-slate-600">
            Selectează data în care dorești să ai consultația. Nu poți alege date din trecut.
          </p>
          <Input
            label="Dată"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
          />
          <div className="flex justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => setWizardStep(2)}>
              Înapoi
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={closeWizard}>
                Renunță
              </Button>
              <Button type="button" onClick={handleNextFromStep3}>
                Vezi intervalele disponibile
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (wizardStep === 4) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Alege intervalul orar</h2>
          <p className="text-sm text-slate-600">
            Alege unul dintre intervalele disponibile pentru data selectată.
          </p>
          {slotsLoading ? (
            <p className="text-sm text-slate-600">Se încarcă intervalele...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-600">
              Nu există sloturi disponibile pentru data selectată. Încearcă o altă dată.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={`${s.date}-${s.startTime}`}
                  type="button"
                  onClick={() => setSelectedSlot(s)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                    selectedSlot && selectedSlot.date === s.date && selectedSlot.startTime === s.startTime
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-primary/60'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => setWizardStep(3)}>
              Înapoi
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={closeWizard}>
                Renunță
              </Button>
              <Button type="button" onClick={handleNextFromStep4}>
                Următorul pas
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (wizardStep === 5) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Motivul programării</h2>
          <p className="text-sm text-slate-600">
            Descrie pe scurt motivul consultației, pentru ca doctorul să se poată pregăti.
          </p>
          <Input
            label="Motivul programării"
            placeholder="Ex: consultație de control, dureri toracice, rezultate analize..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <Input
            label="Note suplimentare (opțional)"
            placeholder="Ex: prefer orele de dimineață, alergii cunoscute..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => setWizardStep(4)}>
              Înapoi
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={closeWizard}>
                Renunță
              </Button>
              <Button type="button" onClick={handleNextFromStep5}>
                Vezi rezumatul
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (wizardStep === 6 && selectedSlot && currentDoctor) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Confirmă programarea</h2>
          <p className="text-sm text-slate-600">
            Verifică detaliile programării înainte de a o trimite spre confirmare.
          </p>
          <Card className="p-4 space-y-2 bg-slate-50 border-slate-200">
            <div className="text-sm">
              <span className="font-medium text-slate-700">Doctor:</span>{' '}
              <span className="text-slate-900">{currentDoctor.doctorFullName}</span>
            </div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">Specialitate:</span> {currentDoctor.specialtyName}
            </div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">Instituție medicală:</span> {currentDoctor.institutionName}
              {currentDoctor.institutionCity ? ` · ${currentDoctor.institutionCity}` : ''}
            </div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">Dată:</span> {selectedSlot.date}
            </div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">Interval orar:</span> {selectedSlot.label}
            </div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">Motiv:</span> {reason}
            </div>
            {notes.trim() && (
              <div className="text-sm text-slate-700">
                <span className="font-medium">Note:</span> {notes}
              </div>
            )}
          </Card>
          <div className="flex justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => setWizardStep(5)}>
              Înapoi
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={closeWizard}>
                Renunță
              </Button>
              <Button type="button" onClick={handleSubmitAppointment} loading={submitting}>
                Confirmă programarea
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Programările mele</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gestionează-ți programările la doctor și creează consultații noi.
          </p>
        </div>
        <Button type="button" onClick={openWizard}>
          Programează-te
        </Button>
      </div>

      <Tabs
        tabs={[
          { id: 'today', label: 'Azi' },
          { id: 'upcoming', label: 'Viitoare' },
          { id: 'history', label: 'Istoric' },
          { id: 'cancelled', label: 'Anulate' }
        ]}
        activeId={scope}
        onChange={(id) => setScope(id as Scope)}
      />

      {renderList()}

      <Modal open={wizardOpen} onOpenChange={setWizardOpen} title="Programare nouă">
        {renderWizardContent()}
      </Modal>
    </div>
  );
}
