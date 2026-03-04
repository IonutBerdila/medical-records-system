import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getMyDoctors, grantAccess, revokeAccess, createShareToken, searchDoctors } from '../app/consent/consentApi';
import type { AccessDto, DoctorLookupDto, GrantAccessRequest, ShareTokenResponse } from '../app/consent/types';

function formatExpiry(expiresAtUtc?: string): string {
  if (!expiresAtUtc) return 'Fără expirare';
  const d = new Date(expiresAtUtc);
  const now = new Date();
  if (d < now) return `Expirat ${formatRelative(d)}`;
  const days = Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  return days === 1 ? '24 ore' : `${days} zile`;
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days === 0) return 'astăzi';
  if (days === 1) return 'ieri';
  if (days < 7) return `acum ${days} zile`;
  return date.toLocaleDateString('ro-RO');
}

// Helpers pentru câmpul "Expiră la" (mască ZZ.LL.AAAA)
const WEEK_DAYS_RO = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sa', 'Du'];

const monthFormatterRo = new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' });

const formatDateTimeRo = (date: Date): string => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy}, ${hh}:${min}`;
};

const startOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isBeforeToday = (date: Date): boolean => startOfDay(date).getTime() < startOfDay(new Date()).getTime();

const roundUpToNext5Minutes = (date: Date): Date => {
  const next = new Date(date);
  next.setSeconds(0, 0);
  const minutes = next.getMinutes();
  const rounded = minutes % 5 === 0 ? minutes : minutes + (5 - (minutes % 5));
  next.setMinutes(rounded);
  return next;
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

const buildDateWithTime = (day: Date, hour: number, minute: number): Date =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0);

const formatMmSs = (totalSec: number): string => {
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

export const ShareAccessPage: React.FC = () => {
  const [list, setList] = useState<AccessDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [doctorInput, setDoctorInput] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [shareTokenLoading, setShareTokenLoading] = useState(false);
  const [shareTokenResult, setShareTokenResult] = useState<ShareTokenResponse | null>(null);
  const [shareTokenExpiresIn, setShareTokenExpiresIn] = useState<number>(10);
  const [shareTokenExpiresInput, setShareTokenExpiresInput] = useState<string>('10');
  const [tokenCopied, setTokenCopied] = useState(false);
  const [tokenCopyError, setTokenCopyError] = useState<string | null>(null);
  const [tokenNowMs, setTokenNowMs] = useState<number>(Date.now());
  const [tokenCreatedAtMs, setTokenCreatedAtMs] = useState<number | null>(null);

  // Doctor search / selection state
  const [doctorSearchLoading, setDoctorSearchLoading] = useState(false);
  const [doctorSuggestions, setDoctorSuggestions] = useState<AccessDto[]>([]);
  const [doctorDropdownOpen, setDoctorDropdownOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<AccessDto | null>(null);
  const [doctorValidationError, setDoctorValidationError] = useState<string | null>(null);
  const [doctorValidationInfo, setDoctorValidationInfo] = useState<string | null>(null);
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryPickerOpen, setExpiryPickerOpen] = useState(false);
  const [expirySelectedDay, setExpirySelectedDay] = useState<Date | null>(null);
  const [expiryHour, setExpiryHour] = useState<number>(() => roundUpToNext5Minutes(new Date()).getHours());
  const [expiryMinute, setExpiryMinute] = useState<number>(() => roundUpToNext5Minutes(new Date()).getMinutes());
  const [expiryValidationError, setExpiryValidationError] = useState<string | null>(null);
  const [expiryMonthCursor, setExpiryMonthCursor] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const expiryPickerRef = useRef<HTMLDivElement | null>(null);
  const tokenCodeRef = useRef<HTMLElement | null>(null);

  const monthDays = useMemo(() => getMonthGridMondayFirst(expiryMonthCursor), [expiryMonthCursor]);
  const expiryHours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const expiryMinutes = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 5), []);

  const setExpiryFromParts = (day: Date, hour: number, minute: number) => {
    const next = buildDateWithTime(day, hour, minute);
    setExpiresAt(next.toISOString());
  };

  const load = () => {
    getMyDoctors()
      .then(setList)
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string; title?: string } }; message?: string })?.response?.data
            ?.message ||
          (err as { response?: { data?: { title?: string } } })?.response?.data?.title ||
          (err as { message?: string })?.message ||
          'Eroare la încărcare';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!expiryPickerOpen) return;
    const source = expiresAt ? new Date(expiresAt) : roundUpToNext5Minutes(new Date());
    if (Number.isNaN(source.getTime())) return;
    const selected = new Date(source.getFullYear(), source.getMonth(), source.getDate());
    setExpirySelectedDay(selected);
    setExpiryMonthCursor(new Date(source.getFullYear(), source.getMonth(), 1));
    setExpiryHour(source.getHours());
    setExpiryMinute(Math.floor(source.getMinutes() / 5) * 5);
  }, [expiryPickerOpen, expiresAt]);

  useEffect(() => {
    if (!expiryPickerOpen) return;
    const onDocumentClick = (ev: MouseEvent) => {
      if (!expiryPickerRef.current) return;
      if (!expiryPickerRef.current.contains(ev.target as Node)) {
        setExpiryPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, [expiryPickerOpen]);

  useEffect(() => {
    if (!expiryEnabled) {
      setExpiresAt('');
      setExpiryValidationError(null);
      setExpirySelectedDay(null);
      setExpiryPickerOpen(false);
      return;
    }

    if (!expiresAt) return;
    const selected = new Date(expiresAt);
    if (Number.isNaN(selected.getTime())) return;
    if (selected.getTime() < Date.now()) {
      setExpiryValidationError('Data si ora trebuie sa fie in viitor.');
    } else {
      setExpiryValidationError(null);
    }
  }, [expiryEnabled, expiresAt]);

  useEffect(() => {
    if (!shareTokenResult) return;
    setTokenNowMs(Date.now());
    const id = window.setInterval(() => setTokenNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [shareTokenResult]);

  // Debounce pentru căutarea după nume/email doctor
  useEffect(() => {
    const trimmed = doctorInput.trim();
    if (!trimmed) {
      setDoctorDropdownOpen(false);
      setDoctorSearchLoading(false);
      setDoctorSuggestions([]);
      return;
    }

    setDoctorSearchLoading(true);
    const t = setTimeout(async () => {
      try {
        const results = await searchDoctors(trimmed);
        // mapăm DoctorLookupDto în AccessDto-like doar pentru UI
        const suggestions: AccessDto[] = results.map((d: DoctorLookupDto) => ({
          id: d.userId,
          doctorUserId: d.userId,
          doctorFullName: d.fullName ?? d.email ?? d.userId,
          grantedAtUtc: new Date().toISOString(),
          isActive: true
        }));
        setDoctorSuggestions(suggestions);
        setDoctorDropdownOpen(true);
      } catch {
        // în caz de eroare, doar închidem dropdownul
        setDoctorDropdownOpen(false);
      } finally {
        setDoctorSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [doctorInput]);

  const handleDoctorBlur = () => {
    // Dacă a fost selectat un doctor din listă, nu tratăm inputul ca email
    if (selectedDoctor) return;
    const value = doctorInput.trim();
    if (!value) {
      setDoctorValidationError(null);
      setDoctorValidationInfo(null);
      return;
    }

    // Fallback: dacă pare email, validăm formatul local.
    if (value.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setDoctorValidationError('Email invalid. Verifică adresa introdusă.');
        setDoctorValidationInfo(null);
      } else {
        setDoctorValidationError(null);
        setDoctorValidationInfo('Email valid. Doctorul va fi verificat la trimiterea acordului.');
      }
    } else {
      // Nume liber fără selectare explicită
      setDoctorValidationError(null);
      setDoctorValidationInfo('Introdu un nume complet sau un email valid, sau selectează din listă.');
    }
  };

  const expiryPreview = useMemo(() => {
    if (!expirySelectedDay) return null;
    return buildDateWithTime(expirySelectedDay, expiryHour, expiryMinute);
  }, [expirySelectedDay, expiryHour, expiryMinute]);

  const isExpiryPreviewValid = !!expiryPreview && expiryPreview.getTime() >= Date.now();

  const handleSelectExpiryDay = (day: Date) => {
    const nextDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    setExpirySelectedDay(nextDay);
    if (!expiresAt) {
      const rounded = roundUpToNext5Minutes(new Date());
      setExpiryHour(rounded.getHours());
      setExpiryMinute(rounded.getMinutes());
    }
    setExpiryValidationError(null);
  };

  const applyPreset = (preset: '1h' | '24h' | '7d' | '30d' | 'none') => {
    if (preset === 'none') {
      setExpiryEnabled(false);
      return;
    }
    const now = new Date();
    const next = new Date(now);
    if (preset === '1h') next.setHours(next.getHours() + 1);
    if (preset === '24h') next.setHours(next.getHours() + 24);
    if (preset === '7d') next.setDate(next.getDate() + 7);
    if (preset === '30d') next.setDate(next.getDate() + 30);
    next.setSeconds(0, 0);
    const minute = Math.floor(next.getMinutes() / 5) * 5;
    next.setMinutes(minute);

    setExpiryEnabled(true);
    setExpiresAt(next.toISOString());
    setExpirySelectedDay(new Date(next.getFullYear(), next.getMonth(), next.getDate()));
    setExpiryHour(next.getHours());
    setExpiryMinute(next.getMinutes());
    setExpiryValidationError(null);
    setExpiryPickerOpen(false);
  };

  const handleConfirmExpiry = () => {
    if (!expiryPreview || expiryPreview.getTime() < Date.now()) {
      setExpiryValidationError('Data si ora trebuie sa fie in viitor.');
      return;
    }
    setExpiryFromParts(expirySelectedDay!, expiryHour, expiryMinute);
    setExpiryValidationError(null);
    setExpiryPickerOpen(false);
  };

  const tokenExpiresAtMs = shareTokenResult ? new Date(shareTokenResult.expiresAtUtc).getTime() : 0;
  const tokenRemainingSec = shareTokenResult
    ? Math.max(0, Math.floor((tokenExpiresAtMs - tokenNowMs) / 1000))
    : 0;
  const tokenExpired = shareTokenResult ? tokenRemainingSec <= 0 : false;
  const tokenTotalSec = useMemo(() => {
    if (!shareTokenResult || tokenCreatedAtMs == null) return shareTokenExpiresIn * 60;
    return Math.max(1, Math.floor((tokenExpiresAtMs - tokenCreatedAtMs) / 1000));
  }, [shareTokenResult, tokenCreatedAtMs, shareTokenExpiresIn, tokenExpiresAtMs]);
  const tokenProgress = Math.min(1, Math.max(0, tokenTotalSec > 0 ? tokenRemainingSec / tokenTotalSec : 0));

  const handleTokenSelect = () => {
    if (!tokenCodeRef.current) return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(tokenCodeRef.current);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const handleCopyToken = async () => {
    if (!shareTokenResult || tokenExpired) return;
    try {
      await navigator.clipboard.writeText(shareTokenResult.token);
      setTokenCopyError(null);
      setTokenCopied(true);
      window.setTimeout(() => setTokenCopied(false), 2000);
    } catch {
      setTokenCopyError('Nu am putut copia. Selectează manual.');
    }
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = doctorInput.trim();
    if (!raw && !selectedDoctor) {
      toast.error('Introdu numele sau emailul doctorului.');
      return;
    }

    const emailValue = !selectedDoctor && raw.includes('@') ? raw : undefined;
    if (!selectedDoctor && !emailValue) {
      toast.error('Selectează un doctor din listă sau introdu un email valid.');
      return;
    }

    setGranting(true);
    try {
      const body: GrantAccessRequest = {
        doctorUserId: selectedDoctor?.doctorUserId,
        doctorEmail: emailValue,
        expiresAtUtc: expiresAt || undefined
      };
      await grantAccess(body);
      toast.success('Acces acordat.');
      setDoctorInput('');
      setSelectedDoctor(null);
      setDoctorValidationError(null);
      setDoctorValidationInfo(null);
      setExpiresAt('');
      setExpiryEnabled(false);
      setExpiryValidationError(null);
      setExpirySelectedDay(null);
      setExpiryPickerOpen(false);
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; title?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as { response?: { data?: { title?: string } } })?.response?.data?.title ||
        (err as { message?: string })?.message ||
        'Eroare la acordare acces';
      toast.error(msg);
    } finally {
      setGranting(false);
    }
  };

  const handleCreateShareToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setShareTokenLoading(true);
    setShareTokenResult(null);
    setTokenCopyError(null);
    setTokenCopied(false);
    try {
      const parsed = Number(shareTokenExpiresInput);
      const expiresInMinutes = Math.min(60, Math.max(1, Number.isFinite(parsed) ? parsed : 10));
      setShareTokenExpiresIn(expiresInMinutes);
      setShareTokenExpiresInput(String(expiresInMinutes));
      const result = await createShareToken({ expiresInMinutes });
      setShareTokenResult(result);
      setTokenCreatedAtMs(Date.now());
      toast.success('Token generat. Copiază-l acum — se afișează o singură dată.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Eroare la generare token';
      toast.error(msg);
    } finally {
      setShareTokenLoading(false);
    }
  };

  const handleRevoke = async (accessId: string) => {
    try {
      await revokeAccess(accessId);
      toast.success('Acces revocat.');
      load();
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      if (status === 404) {
        toast.error('Acordul nu a fost găsit.');
        return;
      }
      if (status === 403) {
        toast.error('Nu ai drepturi pentru această acțiune.');
        return;
      }
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        'Eroare la revocare';
      toast.error(msg);
    }
  };

  const activeList = list.filter((a) => a.isActive);
  const expiredList = list.filter((a) => !a.isActive);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Create Access Grant */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">Creează acord de acces</h2>
        <p className="mt-1 text-sm text-slate-600">
          Generează acces securizat pentru un doctor la fișa ta medicală.
        </p>
        <form className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4" onSubmit={handleGrant}>
          <div className="flex-1">
            <div className="relative">
              <Input
                label="Doctor"
                type="text"
                placeholder="Caută după nume sau email"
                autoComplete="off"
                value={doctorInput}
                onChange={(e) => {
                  setDoctorInput(e.target.value);
                  setDoctorDropdownOpen(true);
                  setSelectedDoctor(null);
                  setDoctorValidationError(null);
                  setDoctorValidationInfo(null);
                }}
                onFocus={() => {
                  if (doctorInput.trim()) setDoctorDropdownOpen(true);
                }}
                onBlur={handleDoctorBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setDoctorDropdownOpen(false);
                  }
                }}
              />
              {doctorDropdownOpen && doctorInput.trim() && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
                  {doctorSearchLoading ? (
                    <div className="px-3 py-2 text-xs text-slate-500">Se caută...</div>
                  ) : doctorSuggestions.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-500">Niciun doctor găsit</div>
                  ) : (
                    <ul className="max-h-64 overflow-y-auto py-1 text-sm">
                      {doctorSuggestions.map((d) => (
                        <li
                          key={d.id}
                          className="cursor-pointer px-3 py-1.5 hover:bg-slate-50"
                          // onMouseDown pentru a preveni blur-ul înainte de selectare
                          onMouseDown={(ev) => {
                            ev.preventDefault();
                            setSelectedDoctor(d);
                            setDoctorInput(d.doctorFullName ?? d.doctorUserId);
                            setDoctorDropdownOpen(false);
                            setDoctorValidationError(null);
                            setDoctorValidationInfo(null);
                          }}
                        >
                          <div className="font-medium text-slate-900">
                            {d.doctorFullName ?? d.doctorUserId}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            ID: {d.doctorUserId}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Expira la (optional)</label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                  <span>Seteaza expirare</span>
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={expiryEnabled}
                    onChange={(e) => setExpiryEnabled(e.target.checked)}
                  />
                  <span className="relative h-5 w-9 rounded-full bg-slate-300 transition-colors duration-200 peer-checked:bg-teal-500 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform after:duration-200 peer-checked:after:translate-x-4" />
                </label>
              </div>

              {!expiryEnabled ? (
                <p className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Nu expira
                </p>
              ) : (
                <div className="relative" ref={expiryPickerRef}>
                  <button
                    type="button"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-left text-sm text-slate-900 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onClick={() => setExpiryPickerOpen((prev) => !prev)}
                  >
                    {expiresAt ? formatDateTimeRo(new Date(expiresAt)) : 'Selecteaza data si ora'}
                  </button>

                  {expiryPickerOpen && (
                    <div className="absolute left-0 z-30 mt-2 w-full min-w-[320px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg sm:w-[360px]">
                      <div className="mb-3 flex items-center justify-between">
                        <button
                          type="button"
                          className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
                          onClick={() =>
                            setExpiryMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                          }
                        >
                          {'<'}
                        </button>
                        <p className="text-sm font-semibold capitalize text-slate-800">
                          {monthFormatterRo.format(expiryMonthCursor)}
                        </p>
                        <button
                          type="button"
                          className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
                          onClick={() =>
                            setExpiryMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                          }
                        >
                          {'>'}
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
                        {WEEK_DAYS_RO.map((label) => (
                          <span key={label} className="py-1">
                            {label}
                          </span>
                        ))}
                      </div>
                      <div className="mt-1 grid grid-cols-7 gap-1 text-center text-sm">
                        {monthDays.map((day) => {
                          const inMonth = day.getMonth() === expiryMonthCursor.getMonth();
                          const isToday = areSameDay(day, new Date());
                          const isSelected = !!expirySelectedDay && areSameDay(day, expirySelectedDay);
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
                              onClick={() => handleSelectExpiryDay(day)}
                            >
                              {day.getDate()}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-xs text-slate-600">Ora</label>
                          <select
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            value={expiryHour}
                            onChange={(e) => setExpiryHour(Number(e.target.value))}
                          >
                            {expiryHours.map((h) => (
                              <option key={h} value={h}>
                                {String(h).padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-600">Minute</label>
                          <select
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            value={expiryMinute}
                            onChange={(e) => setExpiryMinute(Number(e.target.value))}
                          >
                            {expiryMinutes.map((m) => (
                              <option key={m} value={m}>
                                {String(m).padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50" onClick={() => applyPreset('1h')}>+1 ora</button>
                        <button type="button" className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50" onClick={() => applyPreset('24h')}>+24h</button>
                        <button type="button" className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50" onClick={() => applyPreset('7d')}>+7 zile</button>
                        <button type="button" className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50" onClick={() => applyPreset('30d')}>+30 zile</button>
                        <button type="button" className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm text-teal-700 hover:bg-teal-100" onClick={() => applyPreset('none')}>Fara expirare</button>
                      </div>

                      {expiryValidationError && (
                        <p className="mt-2 text-xs text-red-600">{expiryValidationError}</p>
                      )}
                      {!expiryValidationError && expiryPreview && !isExpiryPreviewValid && (
                        <p className="mt-2 text-xs text-red-600">Data si ora trebuie sa fie in viitor.</p>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <button
                          type="button"
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                          onClick={() => setExpiryEnabled(false)}
                        >
                          Sterge
                        </button>
                        <button
                          type="button"
                          className="rounded-md bg-teal-600 px-3 py-1.5 text-xs text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                          disabled={!isExpiryPreviewValid}
                          onClick={handleConfirmExpiry}
                        >
                          Confirma
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button type="submit" loading={granting} className="shrink-0">
            + Acord nou
          </Button>
        </form>
        {selectedDoctor && (
          <p className="mt-2 text-xs text-slate-600">
            Doctor selectat:{' '}
            <span className="font-medium">
              {selectedDoctor.doctorFullName ?? selectedDoctor.doctorUserId}
            </span>
          </p>
        )}
        {!selectedDoctor && doctorValidationError && (
          <p className="mt-2 text-xs text-red-600">{doctorValidationError}</p>
        )}
        {!selectedDoctor && !doctorValidationError && doctorValidationInfo && (
          <p className="mt-2 text-xs text-slate-600">{doctorValidationInfo}</p>
        )}
      </Card>

      {/* Token pentru farmacie */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">Token pentru farmacie</h2>
        <p className="mt-1 text-sm text-slate-600">
          Genereaza alt token temporar farmaciei pentru a vedea prescriptiile. Tokenul se afiseaza o singura data.
        </p>
        {!shareTokenResult ? (
          <form className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={handleCreateShareToken}>
            <div className="w-24">
              <Input
                label="Valabil (min)"
                type="text"
                min={1}
                max={60}
                inputMode="numeric"
                className="h-10 px-3 text-base"
                value={shareTokenExpiresInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
                  setShareTokenExpiresInput(raw);
                }}
              />
            </div>
            <Button type="submit" loading={shareTokenLoading} className="shrink-0">
              Genereaza token
            </Button>
          </form>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Token generat</p>
                <p className="mt-0.5 text-xs text-slate-600">Se afiseaza o singura data. Copiaza-l acum.</p>
              </div>
              {tokenExpired && <Badge variant="default">Expirat</Badge>}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code
                ref={tokenCodeRef}
                onClick={handleTokenSelect}
                className="cursor-text select-text break-all rounded-lg bg-slate-900 px-3 py-2 text-sm text-white font-mono"
                title="Click pentru selectare"
              >
                {shareTokenResult.token}
              </code>
              <Button
                type="button"
                variant="secondary"
                className="text-sm"
                onClick={handleCopyToken}
                disabled={tokenExpired}
              >
                {tokenCopied ? 'Copiat' : 'Copiaza'}
              </Button>
            </div>
            {tokenCopyError && <p className="mt-1 text-xs text-red-600">{tokenCopyError}</p>}
            {tokenCopied && !tokenCopyError && <p className="mt-1 text-xs text-teal-700">Token copiat.</p>}

            <div className="mt-3">
              <p className="text-sm font-medium text-slate-800">
                {tokenExpired ? 'Expirat' : `Expira in ${formatMmSs(tokenRemainingSec)}`}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded bg-slate-100">
                <div
                  className="h-2 rounded bg-teal-600 transition-[width] duration-1000"
                  style={{ width: `${Math.round(tokenProgress * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Active Grants */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xl font-semibold text-slate-900">Acorduri active</h2>
          {activeList.length > 0 && (
            <Badge variant="success">{activeList.length} active</Badge>
          )}
        </div>
        {activeList.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-slate-600">Niciun acord activ. Creează unul folosind formularul de mai sus.</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeList.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {a.doctorFullName ?? a.doctorUserId}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fișă completă · {formatExpiry(a.expiresAtUtc)}
                    </p>
                    <p className="text-xs font-mono text-slate-400 mt-1 truncate">{a.doctorUserId}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="success">Activ</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 px-3 text-xs"
                      onClick={() => handleRevoke(a.id)}
                    >
                      Revocă
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Expired Grants */}
      {expiredList.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xl font-semibold text-slate-900">Acorduri expirate</h2>
            <Badge variant="default">{expiredList.length} expirate</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {expiredList.map((a) => (
              <Card key={a.id} className="p-4 opacity-80">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {a.doctorFullName ?? a.doctorUserId}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Expirat {a.expiresAtUtc ? formatRelative(new Date(a.expiresAtUtc)) : '—'}
                    </p>
                  </div>
                  <Badge variant="default">Expirat</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

