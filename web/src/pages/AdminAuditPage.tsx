import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { getAdminAudit } from '../app/admin/adminApi';
import type { AdminAuditEventDto } from '../app/admin/types';

const PAGE_SIZE = 20;
const ACTION_OPTIONS = [
  '',
  'DOCTOR_REGISTRATION_CREATED',
  'PHARMACY_REGISTRATION_CREATED',
  'DOCTOR_APPROVED',
  'DOCTOR_REJECTED',
  'PHARMACY_APPROVED',
  'PHARMACY_REJECTED',
  'SHARE_TOKEN_CREATED',
  'SHARE_TOKEN_VERIFIED',
  'PRESCRIPTION_DISPENSED'
];

const WEEK_DAYS_RO = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sa', 'Du'];

const monthFormatterRo = new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' });

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

const formatDateTimeRo = (date: Date): string => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy}, ${hh}:${min}`;
};

interface DateTimeFilterPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const DateTimeFilterPicker: React.FC<DateTimeFilterPickerProps> = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [hour, setHour] = useState<number>(0);
  const [minute, setMinute] = useState<number>(0);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const monthDays = useMemo(() => getMonthGridMondayFirst(monthCursor), [monthCursor]);
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 5), []);

  useEffect(() => {
    if (!open) return;
    const source = value ? new Date(value) : new Date();
    if (Number.isNaN(source.getTime())) return;
    const selected = new Date(source.getFullYear(), source.getMonth(), source.getDate());
    setSelectedDay(selected);
    setMonthCursor(new Date(source.getFullYear(), source.getMonth(), 1));
    setHour(source.getHours());
    setMinute(Math.floor(source.getMinutes() / 5) * 5);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onDocumentClick = (ev: MouseEvent) => {
      if (!pickerRef.current) return;
      if (!pickerRef.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, [open]);

  const handleConfirm = () => {
    if (!selectedDay) {
      onChange('');
      setOpen(false);
      return;
    }
    const next = buildDateWithTime(selectedDay, hour, minute);
    onChange(next.toISOString());
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSelectedDay(null);
    setOpen(false);
  };

  const preview = selectedDay ? buildDateWithTime(selectedDay, hour, minute) : null;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="relative" ref={pickerRef}>
        <button
          type="button"
          className={`h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-left text-sm shadow-sm outline-none transition-colors hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            value ? 'text-slate-900' : 'text-slate-500'
          }`}
          onClick={() => setOpen((prev) => !prev)}
        >
          {value ? formatDateTimeRo(new Date(value)) : 'Selectează data și ora'}
        </button>
        {open && (
          <div className="absolute z-30 mt-2 w-[320px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg sm:w-[360px]">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
                onClick={() =>
                  setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                }
              >
                {'<'}
              </button>
              <p className="text-sm font-semibold capitalize text-slate-800">
                {monthFormatterRo.format(monthCursor)}
              </p>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
                onClick={() =>
                  setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
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
                const inMonth = day.getMonth() === monthCursor.getMonth();
                const isSelected = !!selectedDay && areSameDay(day, selectedDay);
                return (
                  <button
                    key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                    type="button"
                    className={[
                      'h-8 rounded-lg transition-colors',
                      'hover:bg-slate-100',
                      isSelected ? 'bg-teal-500 text-white hover:bg-teal-500' : '',
                      !inMonth ? 'text-slate-400' : 'text-slate-700'
                    ].join(' ')}
                    onClick={() =>
                      setSelectedDay(new Date(day.getFullYear(), day.getMonth(), day.getDate()))
                    }
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
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-600">Minute</label>
                <select
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={minute}
                  onChange={(e) => setMinute(Number(e.target.value))}
                >
                  {minutes.map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {preview && (
              <p className="mt-2 text-xs text-slate-600">
                Se va filtra de la: <span className="font-medium">{formatDateTimeRo(preview)}</span>
              </p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                onClick={handleClear}
              >
                Șterge
              </button>
              <button
                type="button"
                className="rounded-md bg-teal-600 px-3 py-1.5 text-xs text-white hover:bg-teal-500"
                onClick={handleConfirm}
              >
                Confirmă
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminAuditPage: React.FC = () => {
  const [events, setEvents] = useState<AdminAuditEventDto[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fromUtc, setFromUtc] = useState('');
  const [toUtc, setToUtc] = useState('');
  const [action, setAction] = useState('');

  const fetchAudit = useCallback(() => {
    setLoading(true);
    getAdminAudit({
      fromUtc: fromUtc ? new Date(fromUtc).toISOString() : undefined,
      toUtc: toUtc ? new Date(toUtc).toISOString() : undefined,
      action: action || undefined,
      skip,
      take: PAGE_SIZE
    })
      .then((res) => {
        setEvents(res.events);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [fromUtc, toUtc, action, skip]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <DateTimeFilterPicker
            label="De la"
            value={fromUtc}
            onChange={(val) => {
              setFromUtc(val);
              setSkip(0);
            }}
          />
          <DateTimeFilterPicker
            label="Până la"
            value={toUtc}
            onChange={(val) => {
              setToUtc(val);
              setSkip(0);
            }}
          />
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Acțiune</span>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={action}
              onChange={(e) => { setAction(e.target.value); setSkip(0); }}
            >
              {ACTION_OPTIONS.map((a) => (
                <option key={a || 'all'} value={a}>
                  {a || 'Toate'}
                </option>
              ))}
            </select>
          </label>
          <Button variant="outline" onClick={() => { setFromUtc(''); setToUtc(''); setAction(''); setSkip(0); }}>
            Resetează
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Se încarcă...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Niciun eveniment în intervalul selectat.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 font-medium text-slate-700">Data/Ora</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Acțiune</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Actor (rol / email)</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Entitate</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Pacient</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => (
                  <tr key={evt.id} className="border-b border-slate-100">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {new Date(evt.timestampUtc).toLocaleString('ro-RO')}
                    </td>
                    <td className="px-4 py-3 font-medium">{evt.action}</td>
                    <td className="px-4 py-3">
                      {evt.actorRole && <span className="text-slate-600">{evt.actorRole}</span>}
                      {evt.actorEmail && (
                        <span className="ml-1 text-slate-800">{evt.actorEmail}</span>
                      )}
                      {!evt.actorRole && !evt.actorEmail && '-'}
                    </td>
                    <td className="px-4 py-3">
                      {evt.entityType && (
                        <>
                          {evt.entityType}
                          {evt.entityId && (
                            <span className="ml-1 text-slate-500">{evt.entityId.slice(0, 8)}…</span>
                          )}
                        </>
                      )}
                      {!evt.entityType && '-'}
                    </td>
                    <td className="px-4 py-3">{evt.patientEmail ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <span className="text-sm text-slate-500">
              {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} din {total}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={skip === 0}
                onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
              >
                Înapoi
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={skip + PAGE_SIZE >= total}
                onClick={() => setSkip((s) => s + PAGE_SIZE)}
              >
                Înainte
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
