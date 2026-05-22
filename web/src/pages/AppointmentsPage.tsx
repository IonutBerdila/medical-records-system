import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

/** Mapează limba interfeței la un locale pentru formatarea datelor. */
const localeForLang = (lang: string): string => {
  if (lang.startsWith('en')) return 'en-GB';
  if (lang.startsWith('fr')) return 'fr-FR';
  if (lang.startsWith('ru')) return 'ru-RU';
  return 'ro-RO';
};

const getMonthGridMondayFirst = (monthStart: Date): Date[] => {
  const first = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  const mondayIndex = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - mondayIndex);
  return Array.from({ length: 42 }, (_, idx) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + idx);
    return d;
  });
};

const areSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const startOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isBeforeToday = (date: Date): boolean => startOfDay(date).getTime() < startOfDay(new Date()).getTime();

export const AppointmentsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
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

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateMonthCursor, setDateMonthCursor] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dateSelectedDay, setDateSelectedDay] = useState<Date | null>(null);
  const datePickerRef = useRef<HTMLDivElement | null>(null);

  const monthDays = useMemo(() => getMonthGridMondayFirst(dateMonthCursor), [dateMonthCursor]);

  /** Etichetele zilelor săptămânii și formatatorul de lună, dependente de limbă. */
  const weekDays = t('appointments.weekDays', { returnObjects: true }) as unknown as string[];
  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(localeForLang(i18n.language), { month: 'long', year: 'numeric' }),
    [i18n.language]
  );

  const loadAppointments = async (currentScope: Scope) => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams();
      params.set('scope', currentScope);
      const { data } = await http.get<PatientAppointment[]>(`/api/appointments/my?${params.toString()}`);
      setAppointments(data);
    } catch (err: any) {
      const msg = err?.normalizedMessage || err?.message || t('appointments.errLoad');
      toast.error(msg);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void loadAppointments(scope);
  }, [scope]);

  useEffect(() => {
    if (!datePickerOpen) return;
    const onDocumentClick = (ev: MouseEvent) => {
      if (!datePickerRef.current) return;
      if (!datePickerRef.current.contains(ev.target as Node)) {
        setDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, [datePickerOpen]);

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
      const msg = err?.normalizedMessage || err?.message || t('appointments.errSpecialties');
      toast.error(msg);
    } finally {
      setSpecialtiesLoading(false);
    }
  };

  const handleNextFromStep1 = async () => {
    if (!specialtyId) {
      toast.error(t('appointments.valSpecialty'));
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
      const msg = err?.normalizedMessage || err?.message || t('appointments.errDoctors');
      toast.error(msg);
    } finally {
      setDoctorsLoading(false);
    }
  };

  const handleNextFromStep2 = () => {
    if (!selectedDoctorInstitutionId) {
      toast.error(t('appointments.valDoctor'));
      return;
    }
    setWizardStep(3);
  };

  const handleNextFromStep3 = async () => {
    if (!date) {
      toast.error(t('appointments.valDate'));
      return;
    }
    if (!selectedDoctorInstitutionId) {
      toast.error(t('appointments.valDoctor'));
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
      const msg = err?.normalizedMessage || err?.message || t('appointments.errSlots');
      toast.error(msg);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleNextFromStep4 = () => {
    if (!selectedSlot) {
      toast.error(t('appointments.valSlot'));
      return;
    }
    setWizardStep(5);
  };

  const handleNextFromStep5 = () => {
    if (!reason.trim()) {
      toast.error(t('appointments.valReason'));
      return;
    }
    setWizardStep(6);
  };

  const handleSubmitAppointment = async () => {
    if (!selectedSlot || !selectedDoctorInstitutionId || !specialtyId || !date || !reason.trim()) {
      toast.error(t('appointments.valAllFields'));
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
      toast.success(t('appointments.successCreate'));
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
      const msg = err?.normalizedMessage || err?.message || t('appointments.errCreate');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm(t('appointments.confirmCancel'))) return;
    try {
      await http.post(`/api/appointments/${appointmentId}/cancel-by-patient`, { reason: '' });
      toast.success(t('appointments.successCancel'));
      void loadAppointments(scope);
    } catch (err: any) {
      const msg = err?.normalizedMessage || err?.message || t('appointments.errCancel');
      toast.error(msg);
    }
  };

  const renderStatusBadge = (status: string) => {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
    if (status === 'Confirmed')
      return <span className={`${base} bg-emerald-50 text-emerald-700`}>{t('appointments.statusConfirmed')}</span>;
    if (status === 'Completed')
      return <span className={`${base} bg-sky-50 text-sky-700`}>{t('appointments.statusCompleted')}</span>;
    if (status === 'CancelledByPatient')
      return <span className={`${base} bg-slate-50 text-slate-600`}>{t('appointments.statusCancelledByPatient')}</span>;
    if (status === 'CancelledByDoctor')
      return <span className={`${base} bg-red-50 text-red-700`}>{t('appointments.statusCancelledByDoctor')}</span>;
    return <span className={`${base} bg-slate-50 text-slate-600`}>{status}</span>;
  };

  const renderList = () => {
    if (loadingList) {
      return (
        <Card className="p-6">
          <p className="text-sm text-slate-600">{t('appointments.loadingList')}</p>
        </Card>
      );
    }

    if (appointments.length === 0) {
      const emptyKey = `appointments.empty${scope.charAt(0).toUpperCase()}${scope.slice(1)}`;
      return (
        <Card className="flex flex-col items-center justify-center p-10 text-center">
          <p className="text-base font-medium text-slate-800">{t(emptyKey)}</p>
          <p className="mt-2 max-w-md text-sm text-slate-600">{t('appointments.emptyHint')}</p>
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
                  <span className="font-medium">{t('appointments.reasonLabel')}</span> {a.reason}
                </div>
              )}
              {a.cancellationReason && (
                <div className="text-xs text-slate-600">
                  <span className="font-medium">{t('appointments.cancellationReasonLabel')}</span> {a.cancellationReason}
                </div>
              )}
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              {renderStatusBadge(a.status)}
              {a.status === 'Confirmed' && scope !== 'history' && scope !== 'cancelled' && (
                <Button variant="secondary" onClick={() => handleCancelAppointment(a.appointmentId)}>
                  {t('appointments.cancel')}
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
          <h2 className="text-lg font-semibold text-slate-900">{t('appointments.step1Title')}</h2>
          <p className="text-sm text-slate-600">{t('appointments.step1Desc')}</p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('appointments.specialtyLabel')}</label>
            <select
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              value={specialtyId}
              onChange={(e) => setSpecialtyId(e.target.value)}
              onFocus={() => void loadSpecialtiesOnce()}
            >
              <option value="">{specialtiesLoading ? t('appointments.loading') : t('appointments.select')}</option>
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
              {t('appointments.cancelBtn')}
            </Button>
            <Button type="button" onClick={handleNextFromStep1}>
              {t('appointments.nextStep')}
            </Button>
          </div>
        </div>
      );
    }

    if (wizardStep === 2) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-salte-900">{t('appointments.step2Title')}</h2>
          <p className="text-sm text-slate-600">{t('appointments.step2Desc')}</p>
          {doctorsLoading ? (
            <p className="text-sm text-slate-600">{t('appointments.loadingDoctors')}</p>
          ) : doctors.length === 0 ? (
            <p className="text-sm text-slate-600">{t('appointments.noDoctors')}</p>
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
                        {t('appointments.hasFreeSlots')}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => setWizardStep(1)}>
              {t('appointments.back')}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={closeWizard}>
                {t('appointments.cancelBtn')}
              </Button>
              <Button type="button" onClick={handleNextFromStep2}>
                {t('appointments.nextStep')}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (wizardStep === 3) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{t('appointments.step3Title')}</h2>
          <p className="text-sm text-slate-600">{t('appointments.step3Desc')}</p>
          <div className="space-y-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('appointments.dateLabel')}</label>
            <div className="relative" ref={datePickerRef}>
              <button
                type="button"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-left text-sm text-slate-900 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
                onClick={() => {
                  setDatePickerOpen((prev) => !prev);
                  if (!date) {
                    const now = new Date();
                    setDateMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
                  } else {
                    const current = new Date(date);
                    if (!Number.isNaN(current.getTime())) {
                      setDateMonthCursor(new Date(current.getFullYear(), current.getMonth(), 1));
                      setDateSelectedDay(current);
                    }
                  }
                }}
              >
                {date ? new Date(date).toLocaleDateString(localeForLang(i18n.language)) : t('appointments.selectDate')}
              </button>

              {datePickerOpen && (
                <div className="absolute left-0 z-30 mt-2 w-full min-w-[320px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg sm:w-[360px]">
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
                      onClick={() =>
                        setDateMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                      }
                    >
                      {'<'}
                    </button>
                    <p className="text-sm font-semibold capitalize text-slate-800">
                      {monthFormatter.format(dateMonthCursor)}
                    </p>
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
                      onClick={() =>
                        setDateMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                      }
                    >
                      {'>'}
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
                    {weekDays.map((label) => (
                      <span key={label} className="py-1">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-1 text-center text-sm">
                    {monthDays.map((day) => {
                      const inMonth = day.getMonth() === dateMonthCursor.getMonth();
                      const isToday = areSameDay(day, new Date());
                      const isSelected = !!dateSelectedDay && areSameDay(day, dateSelectedDay);
                      const disabled = isBeforeToday(day);
                      return (
                        <button
                          key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                          type="button"
                          disabled={disabled}
                          className={[
                            'h-8 rounded-lg transition-colors',
                            disabled ? 'cursor-not-allowed text-slate-300' : 'hover:bg-slate-100',
                            isSelected ? 'bg-teal-500 text-white hover:bg-teal-500' : '',
                            !inMonth ? 'text-slate-400' : 'text-slate-700',
                            isToday && !isSelected ? 'ring-1 ring-teal-300' : ''
                          ].join(' ')}
                          onClick={() => {
                            const selected = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                            setDateSelectedDay(selected);
                            const yyyy = selected.getFullYear();
                            const mm = String(selected.getMonth() + 1).padStart(2, '0');
                            const dd = String(selected.getDate()).padStart(2, '0');
                            setDate(`${yyyy}-${mm}-${dd}`);
                            setDatePickerOpen(false);
                          }}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => setWizardStep(2)}>
              {t('appointments.back')}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={closeWizard}>
                {t('appointments.cancelBtn')}
              </Button>
              <Button type="button" onClick={handleNextFromStep3}>
                {t('appointments.viewSlots')}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (wizardStep === 4) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{t('appointments.step4Title')}</h2>
          <p className="text-sm text-slate-600">{t('appointments.step4Desc')}</p>
          {slotsLoading ? (
            <p className="text-sm text-slate-600">{t('appointments.loadingSlots')}</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-600">{t('appointments.noSlots')}</p>
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
              {t('appointments.back')}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={closeWizard}>
                {t('appointments.cancelBtn')}
              </Button>
              <Button type="button" onClick={handleNextFromStep4}>
                {t('appointments.nextStep')}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (wizardStep === 5) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{t('appointments.step5Title')}</h2>
          <p className="text-sm text-slate-600">{t('appointments.step5Desc')}</p>
          <Input
            label={t('appointments.reasonFieldLabel')}
            placeholder={t('appointments.reasonPlaceholder')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <Input
            label={t('appointments.notesFieldLabel')}
            placeholder={t('appointments.notesPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => setWizardStep(4)}>
              {t('appointments.back')}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={closeWizard}>
                {t('appointments.cancelBtn')}
              </Button>
              <Button type="button" onClick={handleNextFromStep5}>
                {t('appointments.viewSummary')}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (wizardStep === 6 && selectedSlot && currentDoctor) {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{t('appointments.step6Title')}</h2>
          <p className="text-sm text-slate-600">{t('appointments.step6Desc')}</p>
          <Card className="p-4 space-y-2 bg-slate-50 border-slate-200">
            <div className="text-sm">
              <span className="font-medium text-slate-700">{t('appointments.summaryDoctor')}</span>{' '}
              <span className="text-slate-900">{currentDoctor.doctorFullName}</span>
            </div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">{t('appointments.summarySpecialty')}</span> {currentDoctor.specialtyName}
            </div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">{t('appointments.summaryInstitution')}</span> {currentDoctor.institutionName}
              {currentDoctor.institutionCity ? ` · ${currentDoctor.institutionCity}` : ''}
            </div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">{t('appointments.summaryDate')}</span> {selectedSlot.date}
            </div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">{t('appointments.summarySlot')}</span> {selectedSlot.label}
            </div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">{t('appointments.summaryReason')}</span> {reason}
            </div>
            {notes.trim() && (
              <div className="text-sm text-slate-700">
                <span className="font-medium">{t('appointments.summaryNotes')}</span> {notes}
              </div>
            )}
          </Card>
          <div className="flex justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => setWizardStep(5)}>
              {t('appointments.back')}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={closeWizard}>
                {t('appointments.cancelBtn')}
              </Button>
              <Button type="button" onClick={handleSubmitAppointment} loading={submitting}>
                {t('appointments.confirmBook')}
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
          <h1 className="text-2xl font-semibold text-slate-900">{t('appointments.pageTitle')}</h1>
          <p className="mt-1 text-sm text-slate-600">{t('appointments.pageSubtitle')}</p>
        </div>
        <Button type="button" onClick={openWizard}>
          {t('appointments.bookButton')}
        </Button>
      </div>

      <Tabs
        tabs={[
          { id: 'today', label: t('appointments.tabToday') },
          { id: 'upcoming', label: t('appointments.tabUpcoming') },
          { id: 'history', label: t('appointments.tabHistory') },
          { id: 'cancelled', label: t('appointments.tabCancelled') }
        ]}
        activeId={scope}
        onChange={(id) => setScope(id as Scope)}
      />

      {renderList()}

      <Modal open={wizardOpen} onOpenChange={setWizardOpen} title={t('appointments.wizardTitle')}>
        {renderWizardContent()}
      </Modal>
    </div>
  );
}
