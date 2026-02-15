import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/auth/AuthContext';
import { RoleBadge } from './RoleBadge';
import {
  IconPulse,
  IconDashboard,
  IconDocument,
  IconPrescription,
  IconShare,
  IconUsers,
  IconShield,
  IconQr,
  IconClock,
  IconCalendar,
  IconAnalytics
} from './Icons';

const ROUTE_TITLES: Record<string, string> = {
  '/me': 'Profil',
  '/dashboard': 'Dashboard',
  '/record': 'Fisa medicala',
  '/timeline': 'Istoric',
  '/appointments': 'Programari',
  '/prescriptions': 'Prescriptii',
  '/share': 'Acces si partajare',
  '/doctor/patients': 'Pacientii mei',
  '/doctor/appointments': 'Programari',
  '/doctor/analytics': 'Analitica',
  '/admin': 'Dashboard Admin',
  '/admin/users': 'Gestionare utilizatori',
  '/admin/approvals': 'Aprobari',
  '/admin/audit': 'Jurnale audit',
  '/admin/reports': 'Rapoarte',
  '/admin/config': 'Configurare sistem',
  '/pharmacy': 'Farmacie',
  '/pharmacy/prescription': 'Prescriptie'
};

const ROUTE_SUBTITLES: Record<string, string> = {
  '/share': 'Gestioneaza accesul la fisa ta medicala',
  '/doctor/patients': 'Gestioneaza si vizualizeaza fisele pacientilor'
};

function getPageTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (pathname.startsWith('/doctor/patients/')) return 'Detalii pacient';
  return 'Dashboard';
}

function getPageSubtitle(pathname: string): string | undefined {
  return ROUTE_SUBTITLES[pathname];
}

interface NavItem {
  label: string;
  to: string;
  roles: string[];
  icon: React.ReactNode;
  badge?: string;
  settings?: boolean;
}

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.roles[0];
  const pageTitle = location.pathname === '/dashboard' ? 'Bun venit' : getPageTitle(location.pathname);
  const pageSubtitle =
    location.pathname === '/dashboard'
      ? `${user?.email ?? 'utilizator'}`
      : getPageSubtitle(location.pathname);
  const isDashboard = location.pathname === '/dashboard';

  const navItems: NavItem[] = [
    { label: 'Dashboard', to: '/dashboard', roles: ['Patient', 'Doctor', 'Pharmacy', 'Admin'], icon: <IconDashboard /> },
    { label: 'Fisa medicala', to: '/record', roles: ['Patient'], icon: <IconDocument /> },
    { label: 'Istoric', to: '/timeline', roles: ['Patient'], icon: <IconClock /> },
    { label: 'Prescriptii', to: '/prescriptions', roles: ['Patient'], icon: <IconPrescription /> },
    { label: 'Acces si partajare', to: '/share', roles: ['Patient'], icon: <IconShare /> },
    { label: 'Programari', to: '/appointments', roles: ['Patient'], icon: <IconCalendar /> },
    { label: 'Pacientii mei', to: '/doctor/patients', roles: ['Doctor'], icon: <IconUsers /> },
    { label: 'Programari', to: '/doctor/appointments', roles: ['Doctor'], icon: <IconCalendar /> },
    { label: 'Analitica', to: '/doctor/analytics', roles: ['Doctor'], icon: <IconAnalytics /> },
    { label: 'Administrare', to: '/admin', roles: ['Admin'], icon: <IconDashboard /> },
    { label: 'Gestionare utilizatori', to: '/admin/users', roles: ['Admin'], icon: <IconUsers /> },
    { label: 'Aprobari', to: '/admin/approvals', roles: ['Admin'], icon: <IconShield />, badge: '3' },
    { label: 'Jurnale audit', to: '/admin/audit', roles: ['Admin'], icon: <IconDocument /> },
    { label: 'Rapoarte', to: '/admin/reports', roles: ['Admin'], icon: <IconDocument /> },
    { label: 'Configurare sistem', to: '/admin/config', roles: ['Admin'], icon: <IconShield />, settings: true },
    { label: 'Farmacie', to: '/pharmacy', roles: ['Pharmacy'], icon: <IconQr /> }
  ];

  const visibleNav = navItems
    .filter((item) => !role || item.roles.includes(role))
    .filter((item, index, list) => list.findIndex((i) => i.to === item.to) === index);
  const adminMainNav = role === 'Admin' ? visibleNav.filter((item) => !item.settings) : visibleNav;
  const adminSettingsNav = role === 'Admin' ? visibleNav.filter((item) => item.settings) : [];

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 md:hidden" aria-hidden onClick={closeSidebar} />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col bg-slate-900 text-white
          md:flex
          transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-700/80 px-5">
          <div className="flex items-center gap-3">
            <IconPulse className="text-teal-400" />
            <span className="text-lg font-bold tracking-tight text-white">MedRecord</span>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="Inchide meniul"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {adminMainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-teal-500/20 text-teal-300'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                ].join(' ')
              }
            >
              <span className="shrink-0 opacity-90" aria-hidden>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
          {role === 'Admin' && adminSettingsNav.length > 0 && (
            <div className="pt-4">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Setari</p>
              <div className="space-y-0.5">
                {adminSettingsNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-teal-500/20 text-teal-300'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      ].join(' ')
                    }
                  >
                    <span className="shrink-0 opacity-90" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>

        
      </aside>

      <div className="flex min-h-screen flex-1 flex-col min-w-0 md:ml-[260px]">
        <header className="sticky top-0 z-30 h-20 shrink-0 border-b border-slate-200 bg-white flex items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Deschide meniul"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-slate-900 truncate">{pageTitle}</h1>
              {pageSubtitle && <p className="text-sm text-slate-500 truncate hidden sm:block">{pageSubtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {user && (
              <>
                <button
                  type="button"
                  className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Notificari"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.5 17a2.5 2.5 0 0 0 5 0"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
                </button>
                <span className="hidden sm:block h-8 w-px bg-slate-200" aria-hidden />
                <span className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-700">
                  {user.email?.slice(0, 2).toUpperCase() ?? '?'}
                </span>
                {role && <RoleBadge role={role} />}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login', { replace: true });
                  }}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Logout"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </header>

        <main className={`flex-1 px-4 md:px-6 ${isDashboard ? 'pt-2 pb-6' : 'py-6'}`}>
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
