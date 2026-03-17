import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useAuth } from '../app/auth/AuthContext';
import type { UserRole } from '../app/auth/types';
import {
  IconDocument,
  IconPrescription,
  IconShare,
  IconUsers,
  IconDoctor,
  IconPatient,
  IconPharmacyPerson,
  IconDashboard,
  IconClock,
  IconCalendar,
  IconShield,
  IconAlert
} from '../ui/Icons';
import { getAdminDashboard } from '../app/admin/adminApi';
import type { AdminDashboardResponse } from '../app/admin/types';

const statCardsDoctor = [
  { label: 'Pacientii mei', value: '147', sub: '+5 saptamana aceasta', icon: IconUsers, color: 'text-sky-600 bg-sky-50', subColor: 'text-emerald-600' },
  { label: 'Intrari recente', value: '23', sub: 'Astazi', icon: IconDocument, color: 'text-emerald-600 bg-emerald-50', subColor: 'text-emerald-600' },
  { label: 'Sarcini in asteptare', value: '8', sub: 'Necesita atentie', icon: IconClock, color: 'text-red-600 bg-red-50', subColor: 'text-red-600' },
  { label: 'Programari azi', value: '12', sub: '3 finalizate', icon: IconCalendar, color: 'text-indigo-600 bg-indigo-50', subColor: 'text-emerald-600' }
] as const;

const doctorPendingTasks = [
  { title: 'Revizuire rezultate laborator', patient: 'Pacient: John Doe', time: 'acum 2 ore', priority: 'error' as const, label: 'ridicata' },
  { title: 'Aproba prescriptie', patient: 'Pacient: Jane Smith', time: 'acum 5 ore', priority: 'warning' as const, label: 'medie' },
  { title: 'Semneaza raport medical', patient: 'Pacient: Robert Johnson', time: 'acum 1 zi', priority: 'error' as const, label: 'ridicata' },
  { title: 'Necesita follow-up', patient: 'Pacient: Emily Davis', time: 'acum 2 zile', priority: 'info' as const, label: 'scazuta' }
] as const;

const doctorRecentEntries = [
  { title: 'Consultatie', patient: 'Pacient: John Doe', status: 'Finalizat', statusVariant: 'success' as const, time: 'acum 30 minute' },
  { title: 'Prescriptie', patient: 'Pacient: Sarah Williams', status: 'Finalizat', statusVariant: 'success' as const, time: 'acum 1 ora' },
  { title: 'Bilet de trimitere', patient: 'Pacient: Michael Brown', status: 'In lucru', statusVariant: 'error' as const, time: 'acum 2 ore' },
  { title: 'Consultatie', patient: 'Pacient: Lisa Anderson', status: 'Finalizat', statusVariant: 'success' as const, time: 'acum 3 ore' },
  { title: 'Referire', patient: 'Pacient: James Wilson', status: 'Finalizat', statusVariant: 'success' as const, time: 'acum 5 ore' }
] as const;

const quickCardsPatient = [
  {
    label: 'Fișa medicală',
    description: 'Accesează istoricul medical',
    path: '/record',
    icon: IconDocument,
    color: 'bg-teal-50 text-teal-600'
  },
  {
    label: 'Prescripții',
    description: 'Vezi medicamentele active',
    path: '/prescriptions',
    icon: IconPrescription,
    color: 'bg-amber-50 text-amber-700'
  },
  {
    label: 'Acces și partajare',
    description: 'Gestionează accesul doctorilor',
    path: '/share',
    icon: IconShare,
    color: 'bg-sky-50 text-sky-600'
  },
  {
    label: 'Programări',
    description: 'Planifică o vizită',
    path: '/appointments',
    icon: IconCalendar,
    color: 'bg-indigo-50 text-indigo-600'
  }
] as const;

const recentActivity = [
  {
    title: 'Dosar actualizat',
    description: 'Dr. Smith a adaugat notite de consultatie',
    time: 'acum 2 ore',
    icon: IconDocument,
    color: 'bg-emerald-50 text-emerald-700'
  },
  {
    title: 'Prescriptie reinnoita',
    description: 'Lisinopril 10mg reinnoit pentru 90 de zile',
    time: 'acum 1 zi',
    icon: IconPrescription,
    color: 'bg-amber-50 text-amber-700'
  },
  {
    title: 'Acces acordat',
    description: 'Ai partajat dosarul cu City Hospital',
    time: 'acum 3 zile',
    icon: IconShare,
    color: 'bg-sky-50 text-sky-700'
  },
  {
    title: 'Programare creata',
    description: 'Control pe 15 feb, 2026',
    time: 'acum 5 zile',
    icon: IconCalendar,
    color: 'bg-indigo-50 text-indigo-700'
  }
] as const;

const activePrescriptions = [
  { name: 'Lisinopril', dosage: '10mg zilnic', refills: '2 reinnoiri ramase' },
  { name: 'Metformin', dosage: '500mg de doua ori pe zi', refills: '1 reinnoire ramasa' },
  { name: 'Atorvastatin', dosage: '20mg seara', refills: '3 reinnoiri ramase' }
] as const;

const accessGrants = [
  {
    name: 'City Hospital',
    level: 'Acces complet la dosar',
    status: 'Activ',
    statusVariant: 'success' as const,
    expires: 'Expira in 30 zile'
  },
  {
    name: 'Dr. Sarah Chen',
    level: 'Doar prescriptii si rezultate',
    status: 'Activ',
    statusVariant: 'success' as const,
    expires: 'Expira in 15 zile'
  },
  {
    name: 'MedLab Inc.',
    level: 'Rezultate de laborator',
    status: 'Expirat',
    statusVariant: 'error' as const,
    expires: 'Expirat'
  }
] as const;

const latestEntries = [
  {
    date: '02 feb 2026',
    type: 'Consultatie',
    provider: 'Dr. Smith',
    status: 'Finalizat',
    statusVariant: 'success' as const
  },
  {
    date: '28 ian 2026',
    type: 'Rezultate laborator',
    provider: 'MedLab Inc.',
    status: 'Disponibil',
    statusVariant: 'info' as const
  },
  {
    date: '20 ian 2026',
    type: 'Prescriptie',
    provider: 'Dr. Smith',
    status: 'Activ',
    statusVariant: 'success' as const
  },
  {
    date: '15 ian 2026',
    type: 'Investigatie imagistica',
    provider: 'Imaging Center',
    status: 'Arhivat',
    statusVariant: 'default' as const
  }
] as const;

const adminStatCards = [
  { label: 'Total utilizatori', value: '1,247', sub: '+12% fata de perioada anterioara', icon: IconUsers, color: 'text-sky-600 bg-sky-50' },
  { label: 'Pacienti', value: '892', sub: '+8% fata de perioada anterioara', icon: IconPatient, color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Medici', value: '245', sub: '+3% fata de perioada anterioara', icon: IconDoctor, color: 'text-indigo-600 bg-indigo-50' },
  { label: 'Farmacii', value: '110', sub: '+5% fata de perioada anterioara', icon: IconPharmacyPerson, color: 'text-amber-600 bg-amber-50' }
] as const;

const adminAuditEvents = [
  { time: 'acum 10 min', actor: 'admin@medrecord.com', action: 'Utilizator activat', target: 'john.doe@email.com', status: 'Succes', statusVariant: 'success' as const },
  { time: 'acum 25 min', actor: 'dr.smith@hospital.com', action: 'Dosar medical creat', target: 'Pacient PT-2401', status: 'Succes', statusVariant: 'success' as const },
  { time: 'acum 1 ora', actor: 'pharmacy@downtown.com', action: 'Incercare autentificare', target: 'Sistem', status: 'Esec', statusVariant: 'error' as const },
  { time: 'acum 2 ore', actor: 'admin@medrecord.com', action: 'Medic aprobat', target: 'dr.chen@clinic.com', status: 'Succes', statusVariant: 'success' as const }
] as const;

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = (user?.roles[0] ?? 'Patient') as UserRole;

  const [adminData, setAdminData] = useState<AdminDashboardResponse | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    if (role !== 'Admin') return;
    setAdminLoading(true);
    setAdminError(null);
    getAdminDashboard()
      .then((res) => {
        setAdminData(res);
      })
      .catch((err: any) => {
        // eslint-disable-next-line no-console
        console.error('Failed to load admin dashboard', err);
        setAdminError(err?.response?.data?.message ?? 'Eroare la încărcarea dashboard-ului admin.');
      })
      .finally(() => {
        setAdminLoading(false);
      });
  }, [role]);

  if (role !== 'Patient') {
    if (role === 'Doctor') {
      return (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCardsDoctor.map((card) => (
              <Card key={card.label} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{card.label}</p>
                    <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
                    <p className={`mt-1 text-sm ${card.subColor}`}>{card.sub}</p>
                  </div>
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)]">
            <Card className="p-5">
              <div className="mb-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-3xl font-semibold text-slate-900">Sarcini in asteptare</h2>
                  <button
                    type="button"
                    className="whitespace-nowrap text-sm font-medium text-teal-600 hover:underline"
                    onClick={() => navigate('/doctor/patients')}
                  >
                    Vezi toate
                  </button>
                </div>
                <Badge variant="default" className="mt-2 whitespace-nowrap bg-white text-slate-700 border-slate-200">
                  8 sarcini
                </Badge>
              </div>
              <ul className="space-y-3">
                {doctorPendingTasks.map((task) => (
                  <li key={task.title} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                      <Badge variant={task.priority}>{task.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{task.patient}</p>
                    <p className="mt-1 text-xs text-slate-400">{task.time}</p>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-3xl font-semibold text-slate-900">Intrari recente create</h2>
                <button
                  type="button"
                  className="text-sm font-medium text-teal-600 hover:underline"
                  onClick={() => navigate('/doctor/patients')}
                >
                  Vezi toate
                </button>
              </div>
              <ul className="divide-y divide-slate-100">
                {doctorRecentEntries.map((entry) => (
                  <li key={`${entry.title}-${entry.patient}-${entry.time}`} className="flex items-start justify-between gap-3 py-3">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                        <IconDocument className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
                        <p className="text-sm text-slate-600">{entry.patient}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={entry.statusVariant}>{entry.status}</Badge>
                      <p className="mt-1 text-xs text-slate-400">{entry.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      );
    }

    if (role === 'Admin') {
      const counts = adminData?.counts;
      const pendingApprovals = counts?.pendingApprovalsTotal ?? 0;
      const pendingSummaryParts: string[] = [];
      if ((counts?.pendingDoctors ?? 0) > 0) {
        pendingSummaryParts.push(
          `${counts?.pendingDoctors} ${counts?.pendingDoctors === 1 ? 'medic' : 'medici'}`
        );
      }
      if ((counts?.pendingPharmacies ?? 0) > 0) {
        pendingSummaryParts.push(
          `${counts?.pendingPharmacies} ${counts?.pendingPharmacies === 1 ? 'farmacie' : 'farmacii'}`
        );
      }
      const pendingSummary =
        pendingApprovals > 0
          ? `${pendingSummaryParts.join(', ')} așteaptă verificarea`
          : 'Nicio aprobare în așteptare';

      const securityAlertsCount = adminData?.recentActivity.length ?? 0;

      return (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-5">
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-slate-900">
                  {adminLoading ? '—' : counts?.totalUsers ?? 0}
                </p>
                <p className="text-base font-medium text-slate-700">Total utilizatori</p>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-slate-900">
                  {adminLoading ? '—' : counts?.patients ?? 0}
                </p>
                <p className="text-base font-medium text-slate-700">Pacienți</p>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-slate-900">
                  {adminLoading ? '—' : counts?.doctors ?? 0}
                </p>
                <p className="text-base font-medium text-slate-700">Medici</p>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-slate-900">
                  {adminLoading ? '—' : counts?.pharmacies ?? 0}
                </p>
                <p className="text-base font-medium text-slate-700">Farmacii</p>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-amber-200 bg-amber-50/60 p-5">
              <div className="flex items-start gap-3 pl-4 sm:pl-8">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <IconShield className="h-6 w-6" />
                </span>
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-amber-600">
                      {adminLoading ? '—' : pendingApprovals}
                    </p>
                    <p className="text-base font-semibold text-amber-700">Aprobări în așteptare</p>
                  </div>
                  <p className="text-sm text-amber-700">{pendingSummary}</p>
                  <button
                    type="button"
                    className="mt-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                    onClick={() => navigate('/admin/approvals')}
                  >
                    Revizuiește
                  </button>
                </div>
              </div>
            </Card>

            <Card className="border-red-200 bg-red-50/60 p-5">
              <div className="flex items-start gap-3 pl-4 sm:pl-8">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <IconAlert className="h-6 w-6" />
                </span>
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-red-600">
                      {adminLoading ? '—' : securityAlertsCount}
                    </p>
                    <p className="text-base font-semibold text-red-700">Alerte de securitate</p>
                  </div>
                  <p className="text-sm text-red-700">
                    Număr de evenimente de audit recente.
                  </p>
                  <button
                    type="button"
                    className="mt-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                    onClick={() => navigate('/admin/audit')}
                  >
                    Vezi detalii
                  </button>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-0">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Evenimente audit recente</h2>
                <p className="text-sm text-slate-600">Ultimele activitati din sistem si actiuni ale utilizatorilor</p>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-teal-600 hover:underline"
                onClick={() => navigate('/admin/audit')}
              >
                Vezi toate jurnalele
              </button>
            </div>
            <div className="overflow-hidden">
              {adminError && (
                <div className="px-5 py-3 text-sm text-red-700 bg-red-50 border-b border-red-200">
                  {adminError}
                </div>
              )}
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Timp</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actor</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actiune</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tinta</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {adminLoading && !adminData && (
                    <tr>
                      <td className="px-5 py-4 text-sm text-slate-500" colSpan={5}>
                        Se încarcă evenimentele de audit...
                      </td>
                    </tr>
                  )}
                  {!adminLoading && adminData && adminData.recentActivity.length === 0 && (
                    <tr>
                      <td className="px-5 py-4 text-sm text-slate-500" colSpan={5}>
                        Nicio activitate recentă.
                      </td>
                    </tr>
                  )}
                  {adminData &&
                    adminData.recentActivity.map((event) => (
                      <tr key={event.id}>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                          {new Date(event.timestampUtc).toLocaleString('ro-RO')}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                          {event.actorEmail ?? event.actorRole ?? '-'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-700">{event.action}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                          {event.patientEmail ?? event.entityType ?? '-'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-xs text-slate-400">
                          {event.ipAddress ?? ''}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {(role === 'Pharmacy' || role === 'Admin') && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <IconDashboard className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">Panou</h3>
                  <p className="text-sm text-slate-600">Acceseaza sectiunile principale din meniul lateral.</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickCardsPatient.map((card) => (
          <Card
            key={card.label}
            className="group cursor-pointer p-4 transition-colors hover:border-slate-300 hover:bg-slate-50"
            onClick={() => navigate(card.path)}
          >
            <div className="flex flex-col gap-3">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-base ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">{card.label}</h3>
                <p className="mt-1 text-[15px] text-slate-600">{card.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-slate-900">Activitate recenta</h2>
            <button
              type="button"
              className="text-sm font-medium text-teal-600 hover:underline"
              onClick={() => navigate('/timeline')}
            >
              Vezi toate
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {recentActivity.map((item) => (
              <li key={item.title} className="flex items-start gap-3 py-3">
                <span className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full text-xs ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-base font-medium text-slate-900">{item.title}</p>
                  <p className="text-[15px] text-slate-600">{item.description}</p>
                  <p className="mt-0.5 text-sm text-slate-400">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
                <h2 className="text-xl font-semibold text-slate-900">Prescripții active</h2>
              <Badge variant="success" className="mt-2">
                3 active
              </Badge>
            </div>
            <button
              type="button"
              className="text-sm font-medium text-teal-600 hover:underline"
              onClick={() => navigate('/prescriptions')}
            >
              Vezi toate
            </button>
          </div>
          <ul className="space-y-3">
            {activePrescriptions.map((rx) => (
              <li
                key={rx.name}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2.5"
              >
                <div>
                  <p className="text-base font-semibold text-slate-900">{rx.name}</p>
                  <p className="text-sm text-slate-500">{rx.dosage}</p>
                  <p className="mt-1 text-sm text-slate-400">{rx.refills}</p>
                </div>
                <button
                  type="button"
                  className="p-1 text-emerald-500 hover:text-emerald-600"
                  aria-label="Editeaza prescriptia (UI doar)"
                >
                  <IconPrescription className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Acces acordat</h2>
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center text-slate-500 hover:text-slate-700"
              aria-label="Adauga un nou grant de acces"
            >
              <span className="text-2xl font-semibold leading-none">+</span>
            </button>
          </div>
          <ul className="space-y-3">
            {accessGrants.map((grant) => (
              <li key={grant.name} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{grant.name}</p>
                    <p className="text-xs text-slate-500">{grant.level}</p>
                  </div>
                  <Badge variant={grant.statusVariant}>{grant.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-400">{grant.expires}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Ultimele inregistrari</h2>
            <button
              type="button"
              className="text-sm font-medium text-teal-600 hover:underline"
              onClick={() => navigate('/timeline')}
            >
              Vezi toate
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Data</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tip</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Furnizor</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {latestEntries.map((entry) => (
                  <tr key={`${entry.date}-${entry.type}-${entry.provider}`}>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-slate-700">{entry.date}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-slate-700">{entry.type}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-slate-700">{entry.provider}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">
                      <Badge variant={entry.statusVariant}>{entry.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
