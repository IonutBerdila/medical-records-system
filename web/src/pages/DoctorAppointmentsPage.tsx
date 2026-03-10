import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { http } from '../app/http';
import toast from 'react-hot-toast';

type Scope = 'today' | 'upcoming' | 'history' | 'cancelled';

interface DoctorAppointment {
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
  patientUserId: string;
  patientFullName: string;
  specialtyId: string;
  specialtyName: string;
  medicalInstitutionId: string;
  medicalInstitutionName: string;
  medicalInstitutionCity?: string;
}

interface AvailabilityRule {
  id: string;
  doctorInstitutionId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

interface DoctorInstitutionOption {
  id: string;
  name: string;
  city?: string;
}

export const DoctorAppointmentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'availability' | 'appointments'>('availability');

  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);

  const [institutions, setInstitutions] = useState<DoctorInstitutionOption[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);

  const [editingRule, setEditingRule] = useState<AvailabilityRule | null>(null);
  const [formInstitutionId, setFormInstitutionId] = useState('');
  const [formDayOfWeek, setFormDayOfWeek] = useState(1);
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('17:00');
  const [formSlotDuration, setFormSlotDuration] = useState(30);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [scope, setScope] = useState<Scope>('today');
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  const weekdays: { value: number; label: string }[] = [
    { value: 1, label: 'Luni' },
    { value: 2, label: 'Marți' },
    { value: 3, label: 'Miercuri' },
    { value: 4, label: 'Joi' },
    { value: 5, label: 'Vineri' },
    { value: 6, label: 'Sâmbătă' },
    { value: 0, label: 'Duminică' }
  ];

  const loadInstitutions = async () => {
    if (institutions.length > 0 || institutionsLoading) return;
    setInstitutionsLoading(true);
    try {
      const { data } = await http.get<DoctorInstitutionOption[]>('/api/me/doctor-institutions');
      setInstitutions(data);
      if (!formInstitutionId && data.length > 0) {
        setFormInstitutionId(data[0].id);
      }
    } catch (err: any) {
      const msg = err?.normalizedMessage || err?.message || 'Nu am putut încărca instituțiile medicale.';
      toast.error(msg);
    } finally {
      setInstitutionsLoading(false);
    }
  };

  const loadRules = async () => {
    setRulesLoading(true);
    try {
      const { data } = await http.get<AvailabilityRule[]>('/api/doctor/availability');
      setRules(data);
    } catch (err: any) {
      const msg = err?.normalizedMessage || err?.message || 'Nu am putut încărca disponibilitatea.';
      toast.error(msg);
    } finally {
      setRulesLoading(false);
    }
  };

  const resetForm = () => {
    setEditingRule(null);
    setFormDayOfWeek(1);
    setFormStartTime('09:00');
    setFormEndTime('17:00');
    setFormSlotDuration(30);
  };

  useEffect(() => {
    void loadInstitutions();
    void loadRules();
  }, []);

  const handleSubmitRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInstitutionId) {
      toast.error('Selectează o instituție medicală.');
      return;
    }
    if (!formStartTime || !formEndTime) {
      toast.error('Completează intervalul orar.');
      return;
    }
    if (formSlotDuration <= 0) {
      toast.error('Durata slotului trebuie să fie mai mare decât 0.');
      return;
    }
    setFormSubmitting(true);
    try {
      const payload = {
        doctorInstitutionId: formInstitutionId,
        dayOfWeek: formDayOfWeek,
        startTime: `${formStartTime}:00`,
        endTime: `${formEndTime}:00`,
        slotDurationMinutes: formSlotDuration,
        isActive: true
      };
      if (editingRule) {
        await http.put(`/api/doctor/availability/${editingRule.id}`, {
          startTime: payload.startTime,
          endTime: payload.endTime,
          slotDurationMinutes: payload.slotDurationMinutes,
          isActive: payload.isActive
        });
        toast.success('Regula de disponibilitate a fost actualizată.');
      } else {
        await http.post('/api/doctor/availability', payload);
        toast.success('Regula de disponibilitate a fost adăugată.');
      }
      resetForm();
      void loadRules();
    } catch (err: any) {
      const msg = err?.normalizedMessage || err?.message || 'Nu am putut salva regula de disponibilitate.';
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditRule = (rule: AvailabilityRule) => {
    setEditingRule(rule);
    setFormInstitutionId(rule.doctorInstitutionId);
    setFormDayOfWeek(rule.dayOfWeek);
    setFormStartTime(rule.startTime.slice(0, 5));
    setFormEndTime(rule.endTime.slice(0, 5));
    setFormSlotDuration(rule.slotDurationMinutes);
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm('Sigur vrei să ștergi această regulă de disponibilitate?')) return;
    try {
      await http.delete(`/api/doctor/availability/${id}`);
      toast.success('Regula a fost ștearsă.');
      void loadRules();
    } catch (err: any) {
      const msg = err?.normalizedMessage || err?.message || 'Nu am putut șterge regula.';
      toast.error(msg);
    }
  };

  const loadAppointments = async (currentScope: Scope) => {
    setAppointmentsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('scope', currentScope);
      const { data } = await http.get<DoctorAppointment[]>(`/api/doctor/appointments?${params.toString()}`);
      setAppointments(data);
    } catch (err: any) {
      const msg = err?.normalizedMessage || err?.message || 'Nu am putut încărca programările.';
      toast.error(msg);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'appointments') {
      void loadAppointments(scope);
    }
  }, [activeTab, scope]);

  const handleComplete = async (id: string) => {
    if (!window.confirm('Marchezi această programare ca finalizată?')) return;
    try {
      await http.post(`/api/doctor/appointments/${id}/complete`);
      toast.success('Programarea a fost marcată ca finalizată.');
      void loadAppointments(scope);
    } catch (err: any) {
      const msg = err?.normalizedMessage || err?.message || 'Nu am putut marca programarea ca finalizată.';
      toast.error(msg);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Sigur vrei să anulezi această programare?')) return;
    try {
      await http.post(`/api/doctor/appointments/${id}/cancel`, { reason: '' });
      toast.success('Programarea a fost anulată.');
      void loadAppointments(scope);
    } catch (err: any) {
      const msg = err?.normalizedMessage || err?.message || 'Nu am putut anula programarea.';
      toast.error(msg);
    }
  };

  const renderRuleRow = (rule: AvailabilityRule) => {
    const i = institutions.find((ins) => ins.id === rule.doctorInstitutionId);
    const weekday = weekdays.find((w) => w.value === rule.dayOfWeek)?.label ?? `Zi ${rule.dayOfWeek}`;
    return (
      <tr key={rule.id} className="border-b last:border-b-0">
        <td className="px-3 py-2 text-sm text-slate-700">
          {i ? (
            <>
              {i.name}
              {i.city ? ` · ${i.city}` : ''}
            </>
          ) : (
            '—'
          )}
        </td>
        <td className="px-3 py-2 text-sm text-slate-700">{weekday}</td>
        <td className="px-3 py-2 text-sm text-slate-700">
          {rule.startTime.slice(0, 5)}–{rule.endTime.slice(0, 5)}
        </td>
        <td className="px-3 py-2 text-sm text-slate-700">{rule.slotDurationMinutes} min</td>
        <td className="px-3 py-2 text-sm text-slate-700">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              rule.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'
            }`}
          >
            {rule.isActive ? 'Activă' : 'Inactivă'}
          </span>
        </td>
        <td className="px-3 py-2 text-right text-sm">
          <Button variant="secondary" className="mr-2" onClick={() => handleEditRule(rule)}>
            Editează
          </Button>
          <Button variant="secondary" onClick={() => handleDeleteRule(rule.id)}>
            Șterge
          </Button>
        </td>
      </tr>
    );
  };

  const renderAppointmentsList = () => {
    if (appointmentsLoading) {
      return (
        <Card className="p-4 mt-4">
          <p className="text-sm text-slate-600">Se încarcă programările...</p>
        </Card>
      );
    }

    if (appointments.length === 0) {
      return (
        <Card className="p-6 mt-4 text-center">
          <p className="text-sm text-slate-700">Nu există programări în această categorie.</p>
        </Card>
      );
    }

    return (
      <div className="mt-4 flex flex-col gap-3">
        {appointments.map((a) => (
          <Card
            key={a.appointmentId}
            className="p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{a.patientFullName || 'Pacient'}</span>
              </div>
              <div className="text-xs text-slate-500">
                {a.specialtyName} · {a.medicalInstitutionName}
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
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {a.status === 'Confirmed'
                  ? 'Confirmată'
                  : a.status === 'Completed'
                  ? 'Finalizată'
                  : a.status === 'CancelledByPatient'
                  ? 'Anulată de pacient'
                  : a.status === 'CancelledByDoctor'
                  ? 'Anulată de doctor'
                  : a.status}
              </span>
              {a.status === 'Confirmed' && scope !== 'history' && scope !== 'cancelled' && (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => handleComplete(a.appointmentId)}>
                    Marchează finalizată
                  </Button>
                  <Button variant="secondary" onClick={() => handleCancel(a.appointmentId)}>
                    Anulează
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">Programările mele</h1>
        <p className="text-sm text-slate-600">
          Configurează-ți disponibilitatea și gestionează programările cu pacienții tăi.
        </p>
      </div>

      <Tabs
        tabs={[
          { id: 'availability', label: 'Disponibilitatea mea' },
          { id: 'appointments', label: 'Programările mele' }
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as 'availability' | 'appointments')}
      />

      {activeTab === 'availability' && (
        <div className="space-y-4">
          <Card className="p-4 md:p-5">
            <h2 className="text-lg font-semibold text-slate-900">Configurează disponibilitatea</h2>
            <p className="mt-1 text-sm text-slate-600">
              Adaugă reguli recurente de program (zi, interval orar, durata consultației) pentru fiecare instituție în
              care activezi.
            </p>
            <form onSubmit={handleSubmitRule} className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">Instituție medicală</label>
                <select
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={formInstitutionId}
                  onChange={(e) => setFormInstitutionId(e.target.value)}
                >
                  <option value="">{institutionsLoading ? 'Se încarcă...' : 'Selectează instituția'}</option>
                  {!institutionsLoading &&
                    institutions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                        {i.city ? ` · ${i.city}` : ''}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">Ziua săptămânii</label>
                <select
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={formDayOfWeek}
                  onChange={(e) => setFormDayOfWeek(Number(e.target.value))}
                >
                  {weekdays.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Input
                  label="Ora început"
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Input
                  label="Ora sfârșit"
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Input
                  label="Durata slotului (minute)"
                  type="number"
                  min={5}
                  max={240}
                  value={formSlotDuration}
                  onChange={(e) => setFormSlotDuration(Number(e.target.value))}
                  required
                />
              </div>
              <div className="flex items-end justify-end gap-2">
                {editingRule && (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Anulează editarea
                  </Button>
                )}
                <Button type="submit" loading={formSubmitting}>
                  {editingRule ? 'Salvează modificările' : 'Adaugă regulă'}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-4 md:p-5">
            <h3 className="text-sm font-semibold text-slate-900">Regulile mele de disponibilitate</h3>
            {rulesLoading ? (
              <p className="mt-3 text-sm text-slate-600">Se încarcă...</p>
            ) : rules.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">
                Nu ai configurat încă nicio regulă de disponibilitate. Adaugă o regulă folosind formularul de mai sus.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-700">Instituție</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700">Zi</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700">Interval</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700">Durată slot</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700">Status</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-700">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">{rules.map(renderRuleRow)}</tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="space-y-4">
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
          {renderAppointmentsList()}
        </div>
      )}
    </div>
  );
};
