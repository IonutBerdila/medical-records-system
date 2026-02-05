import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/auth/AuthContext';
import { RoleBadge } from './RoleBadge';
import {
  IconPulse,
  IconDashboard,
  IconDocument,
  IconPill,
  IconShare,
  IconUsers,
  IconQr
} from './Icons';

const ROUTE_TITLES: Record<string, string> = {
  '/me': 'Profil',
  '/dashboard': 'Dashboard',
  '/record': 'Fișa medicală',
  '/timeline': 'Timeline',
  '/prescriptions': 'Rețete',
  '/share': 'Acces și partajare',
  '/doctor/patients': 'Pacienții mei',
  '/pharmacy': 'Farmacie',
  '/pharmacy/prescription': 'Rețetă',
  '/admin': 'Admin',
  '/admin/users': 'Utilizatori',
  '/admin/audit': 'Audit'
};

const ROUTE_SUBTITLES: Record<string, string> = {
  '/share': 'Gestionează accesul la fișa ta medicală',
  '/doctor/patients': 'Gestionează și vizualizează fișele pacienților'
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
  const pageTitle = getPageTitle(location.pathname);
  const pageSubtitle = getPageSubtitle(location.pathname);

  const navItems: NavItem[] = [
    { label: 'Dashboard', to: '/dashboard', roles: ['Patient', 'Doctor', 'Pharmacy', 'Admin'], icon: <IconDashboard /> },
    { label: 'Fișa medicală', to: '/record', roles: ['Patient'], icon: <IconDocument /> },
    { label: 'Timeline', to: '/timeline', roles: ['Patient'], icon: <IconDocument /> },
    { label: 'Rețete', to: '/prescriptions', roles: ['Patient'], icon: <IconPill /> },
    { label: 'Acces și partajare', to: '/share', roles: ['Patient'], icon: <IconShare /> },
    { label: 'Pacienții mei', to: '/doctor/patients', roles: ['Doctor'], icon: <IconUsers /> },
    { label: 'Farmacie', to: '/pharmacy', roles: ['Pharmacy'], icon: <IconQr /> },
    { label: 'Admin', to: '/admin', roles: ['Admin'], icon: <IconDashboard /> }
  ];

  const visibleNav = navItems.filter((item) => !role || item.roles.includes(role));

  const closeSidebar = () => setSidebarOpen(false);

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="min-h-screen flex bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
          aria-hidden
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar — dark (slate-900), 260px, iconițe, user jos */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col bg-slate-900 text-white
          md:static md:flex
          transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <IconPulse className="text-teal-400" />
            <span className="text-lg font-bold tracking-tight text-white">MedRecord</span>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="Închide meniul"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {visibleNav.map((item) => (
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
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User la bottom sidebar */}
        {user && (
          <div className="border-t border-slate-700/80 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/30 text-sm font-semibold text-teal-300">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {user.email?.split('@')[0] ?? 'Utilizator'}
                </p>
                {role && (
                  <p className="text-xs text-slate-400">{role}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main + topbar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 shrink-0 border-b border-slate-200 bg-white flex items-center justify-between gap-4 px-4 md:px-6">
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
              <h1 className="text-lg font-semibold text-slate-900 truncate">{pageTitle}</h1>
              {pageSubtitle && (
                <p className="text-xs text-slate-500 truncate hidden sm:block">{pageSubtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {user && (
              <>
                <span className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-700">
                  {user.email?.slice(0, 2).toUpperCase() ?? '?'}
                </span>
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-slate-700 truncate max-w-[160px]" title={user.email}>
                    {user.email}
                  </p>
                  {role && <RoleBadge role={role} />}
                </div>
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

        <main className="flex-1 px-4 py-6 md:px-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
