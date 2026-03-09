import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { IconCalendar, IconDocument, IconDocumentEmpty, IconUsers } from '../ui/Icons';
import { getMyPrescriptions } from '../app/prescriptions/prescriptionsApi';
import type { PrescriptionDto, PrescriptionItemDto } from '../app/prescriptions/types';

function formatDate(dateIso: string): string {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatValidity(validUntilUtc?: string): string {
  if (!validUntilUtc) return 'Fără expirare';
  return formatDate(validUntilUtc);
}

function formatDateForFilename(dateIso: string): string {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return 'data-necunoscuta';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function normalizeStatus(status: string): string {
  if (!status) return 'Necunoscut';
  const s = status.toLowerCase();
  if (s === 'active') return 'Activ';
  if (s === 'activ') return 'Activ';
  if (s === 'completed' || s === 'complete') return 'Complet';
  if (s === 'draft' || s === 'pending') return 'În așteptare';
  if (s === 'dispensed') return 'Eliberat';
  if (s === 'expired') return 'Expirat';
  if (s === 'finalized') return 'Finalizată';
  if (s === 'cancelled' || s === 'canceled') return 'Anulată';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/** Culoare text pentru statusul medicamentului: verde = În așteptare, roșu = Eliberat. */
function medicationStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === 'draft' || s === 'pending') return 'text-emerald-600';
  if (s === 'dispensed' || s === 'eliberat') return 'text-red-600';
  return 'text-slate-900';
}

async function downloadPrescriptionPdf(prescription: PrescriptionDto, element: HTMLElement): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 20;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const y = margin;
    pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight, undefined, 'FAST');

    const safeId = prescription.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'rx';
    const datePart = formatDateForFilename(prescription.createdAtUtc);
    const filename = `prescriptie-${datePart}-${safeId}.pdf`;
    pdf.save(filename);
  } catch (err) {
    console.error(err);
    toast.error('Nu am putut genera PDF-ul prescripției.');
  }
}

const MedicationItemRow: React.FC<{ item: PrescriptionItemDto; expanded: boolean }> = ({
  item,
  expanded
}) => {
  const metaParts: string[] = [];
  if (item.form) metaParts.push(item.form);
  if (item.frequency) metaParts.push(item.frequency);
  if (item.durationDays) metaParts.push(`Durată: ${item.durationDays} zile`);
  if (item.quantity) metaParts.push(`Cantitate: ${item.quantity}`);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {item.medicationName}
            {item.dosage && (
              <span className="ml-1 text-xs font-normal text-slate-600">· {item.dosage}</span>
            )}
          </p>
          {expanded && metaParts.length > 0 && (
            <p className="mt-1 text-xs text-slate-600">{metaParts.join(' · ')}</p>
          )}
        </div>
        {item.status && (
          <span className={`text-xs font-medium ${medicationStatusColor(item.status)}`}>
            {normalizeStatus(item.status)}
          </span>
        )}
      </div>
      {expanded && item.instructions && (
        <p className="mt-1 text-xs text-slate-700">
          <span className="font-medium text-slate-800">Instrucțiuni:</span> {item.instructions}
        </p>
      )}
      {expanded && item.warnings && (
        <p className="mt-1 text-xs text-red-700">
          <span className="font-medium">Atenționări:</span> {item.warnings}
        </p>
      )}
    </div>
  );
};

const PrescriptionCard: React.FC<{
  prescription: PrescriptionDto;
  expanded: boolean;
  onToggleDetails: () => void;
  onDownloadPdf: () => void;
  hideActions?: boolean;
}> = ({ prescription, expanded, onToggleDetails, onDownloadPdf, hideActions }) => {
  const doctorLabel = [prescription.doctorFullName && `Dr. ${prescription.doctorFullName}`, prescription.doctorInstitutionName]
    .filter(Boolean)
    .join(' · ');

  const hasGeneralNotes = !!prescription.generalNotes && prescription.generalNotes.trim().length > 0;

  return (
    <Card className="p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-900 md:text-lg">
            {normalizeStatus(prescription.status)}{' '}
            <span className="text-sm font-normal text-slate-500 md:text-base">
              · {formatDate(prescription.createdAtUtc)}
            </span>
          </p>
        </div>
      </div>

      {/* General info */}
      <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
        {doctorLabel && (
          <div className="flex items-start gap-2">
            <IconUsers className="mt-0.5 h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Doctor</p>
              <p>{doctorLabel}</p>
            </div>
          </div>
        )}
        {prescription.diagnosis && (
          <div className="flex items-start gap-2">
            <IconDocument className="mt-0.5 h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Diagnostic</p>
              <p>{prescription.diagnosis}</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-2">
          <IconCalendar className="mt-0.5 h-4 w-4 text-slate-400" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Valabil până la</p>
            <p>{formatValidity(prescription.validUntilUtc)}</p>
          </div>
        </div>
      </div>

      {/* Medication list */}
      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">
            {(prescription.items?.length ?? 0) === 1 ? 'Preparat' : 'Preparate'}
          </p>
        </div>
        {prescription.items?.length ? (
          <div className="mt-2 space-y-2">
            {prescription.items.map((item) => (
              <MedicationItemRow key={item.id} item={item} expanded={expanded} />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Nu există medicamente înregistrate pentru această prescripție.</p>
        )}
      </div>

      {/* General notes */}
      {expanded && hasGeneralNotes && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Note generale</p>
          <p className="mt-1 text-sm text-slate-700">{prescription.generalNotes}</p>
        </div>
      )}

      {/* Actions */}
      {!hideActions && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
          {expanded && (
            <p className="text-xs text-slate-500">
              Ultima actualizare: {formatDate(prescription.createdAtUtc)}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onToggleDetails}
            >
              {expanded ? 'Ascunde detalii' : 'Vezi detalii'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onDownloadPdf}
            >
              Descarcă PDF
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export const PrescriptionsPage: React.FC = () => {
  const [list, setList] = useState<PrescriptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDownloadPdf = async (prescriptionId: string) => {
    const prescription = list.find((p) => p.id === prescriptionId);
    if (!prescription) return;

    const container = document.querySelector<HTMLElement>(
      `[data-prescription-print-id="${prescriptionId}"]`
    );
    if (!container) {
      toast.error('Nu am găsit conținutul prescripției pentru export.');
      return;
    }

    await downloadPrescriptionPdf(prescription, container);
  };

  useEffect(() => {
    getMyPrescriptions()
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
  }, []);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <EmptyState
        title="Nu există prescripții disponibile."
        description="Prescripțiile emise de medicii tăi vor apărea aici."
        icon={<IconDocumentEmpty />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {list.map((p) => (
        <div key={p.id} className="relative">
          <div data-prescription-id={p.id}>
            <PrescriptionCard
              prescription={p}
              expanded={expandedId === p.id}
              onToggleDetails={() =>
                setExpandedId((prev) => (prev === p.id ? null : p.id))
              }
              onDownloadPdf={() => handleDownloadPdf(p.id)}
            />
          </div>
          {/* Versiune invizibilă, mereu detaliată, folosită doar pentru PDF */}
          <div
            className="absolute -left-[9999px] top-0 w-[900px]"
            data-prescription-print-id={p.id}
            aria-hidden="true"
          >
            <PrescriptionCard
              prescription={p}
              expanded
              onToggleDetails={() => {}}
              onDownloadPdf={() => {}}
              hideActions
            />
          </div>
        </div>
      ))}
    </div>
  );
};
