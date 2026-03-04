import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Tabs } from "../ui/Tabs";
import { EmptyState } from "../ui/EmptyState";
import { getPatientRecord } from "../app/records/recordsApi";
import { getPatientEntries, addPatientEntry } from "../app/entries/entriesApi";
import {
  getPatientPrescriptions,
  createPatientPrescription,
  getPrescriptionById,
  updatePrescriptionDraft,
  issuePrescriptionDraft,
  deletePrescriptionDraft,
} from "../app/prescriptions/prescriptionsApi";
import type { MedicalRecordDto } from "../app/records/types";
import type { MedicalEntryDto } from "../app/entries/types";
import type { CreateMedicalEntryRequest } from "../app/entries/types";
import type {
  CreatePrescriptionRequest,
  CreatePrescriptionItemRequest,
  PrescriptionDto,
} from "../app/prescriptions/types";
import { getInitials } from "../app/utils/initials";

const ENTRY_TYPES = ["Diagnosis", "Visit", "Note", "LabResult"];

function formatTags(arr: string | string[] | undefined): string {
  if (!arr) return "—";
  const list = Array.isArray(arr) ? arr : [arr];
  return list.filter(Boolean).join(", ") || "—";
}

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
function hasRecordData(r: MedicalRecordDto | null): boolean {
  if (!r) return false;
  if (r.id === EMPTY_GUID || !r.id) return false;
  return true;
}

export const DoctorPatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const patientUserId = id ?? "";
  const { fullName, email } =
    (location.state as { fullName?: string; email?: string } | null) ?? {};

  const [record, setRecord] = useState<MedicalRecordDto | null>(null);
  const [entries, setEntries] = useState<MedicalEntryDto[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [entryForm, setEntryForm] = useState<CreateMedicalEntryRequest>({
    type: "Note",
    title: "",
    description: "",
  });
  const emptyItem = (): CreatePrescriptionItemRequest => ({
    id: undefined,
    medicationName: "",
    form: "",
    dosage: "",
    frequency: "",
    durationDays: undefined,
    quantity: undefined,
    instructions: "",
    warnings: "",
  });
  const [prescriptionForm, setPrescriptionForm] =
    useState<CreatePrescriptionRequest>({
      diagnosis: "",
      generalNotes: "",
      validUntilUtc: undefined,
      status: "Active",
      items: [emptyItem()],
    });
  const [submittingEntry, setSubmittingEntry] = useState(false);
  const [submittingPrescription, setSubmittingPrescription] = useState(false);
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<
    string | null
  >(null);

  const load = () => {
    if (!patientUserId) return;
    const status = (e: unknown) =>
      (e as { response?: { status?: number } })?.response?.status;
    const msg = (e: unknown) =>
      (e as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ||
      (e as { response?: { data?: { title?: string } } })?.response?.data
        ?.title ||
      (e as { message?: string })?.message ||
      "Eroare la încărcare";

    Promise.allSettled([
      getPatientRecord(patientUserId),
      getPatientEntries(patientUserId),
      getPatientPrescriptions(patientUserId),
    ]).then(([rRes, eRes, pRes]) => {
      if (rRes.status === "fulfilled") setRecord(rRes.value);
      else {
        if (status(rRes.reason) === 403) navigate("/doctor/patients");
        else if (status(rRes.reason) === 405)
          toast.error(
            "Endpoint fișă medicală indisponibil (405). Reporniți API-ul.",
          );
        else toast.error(`Fișă medicală: ${msg(rRes.reason)}`);
      }
      if (eRes.status === "fulfilled") setEntries(eRes.value);
      else {
        if (status(eRes.reason) === 403) navigate("/doctor/patients");
        else if (status(eRes.reason) === 405)
          toast.error("Endpoint intrări indisponibil (405). Reporniți API-ul.");
        else toast.error(`Intrări: ${msg(eRes.reason)}`);
      }
      if (pRes.status === "fulfilled") setPrescriptions(pRes.value);
      else {
        if (status(pRes.reason) === 403) navigate("/doctor/patients");
        else if (status(pRes.reason) === 405)
          toast.error(
            "Endpoint prescripții indisponibil (405). Reporniți API-ul.",
          );
        else toast.error(`Prescripții: ${msg(pRes.reason)}`);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, [patientUserId]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientUserId || !entryForm.title.trim()) return;
    setSubmittingEntry(true);
    try {
      await addPatientEntry(patientUserId, entryForm);
      toast.success("Intrare adăugată.");
      setEntryForm({ type: "Note", title: "", description: "" });
      load();
    } catch (err: unknown) {
      type ApiErr = {
        response?: {
          data?: { message?: string; title?: string; detail?: string };
        };
        message?: string;
      };
      const e = err as ApiErr;
      const msg =
        e.response?.data?.detail ||
        e.response?.data?.message ||
        e.response?.data?.title ||
        e.message ||
        "Eroare la adăugare";
      toast.error(msg);
    } finally {
      setSubmittingEntry(false);
    }
  };

  const handleCreatePrescription = async (
    e: React.FormEvent,
    asDraft: boolean,
  ) => {
    e.preventDefault();
    if (!patientUserId) return;
    const items = prescriptionForm.items.filter((i) =>
      i.medicationName?.trim(),
    );
    if (items.length === 0) {
      toast.error("Adaugă cel puțin un medicament.");
      return;
    }
    setSubmittingPrescription(true);
    try {
      if (editingPrescriptionId) {
        await updatePrescriptionDraft(patientUserId, editingPrescriptionId, {
          diagnosis: prescriptionForm.diagnosis?.trim() || undefined,
          generalNotes: prescriptionForm.generalNotes?.trim() || undefined,
          validUntilUtc: prescriptionForm.validUntilUtc,
          items: items.map((i) => ({
            id: i.id,
            medicationName: i.medicationName.trim(),
            form: i.form?.trim() || undefined,
            dosage: i.dosage?.trim() || undefined,
            frequency: i.frequency?.trim() || undefined,
            durationDays: i.durationDays,
            quantity: i.quantity,
            instructions: i.instructions?.trim() || undefined,
            warnings: i.warnings?.trim() || undefined,
          })),
        });
        toast.success("Draft actualizat cu succes.");
        setEditingPrescriptionId(null);
      } else {
        await createPatientPrescription(patientUserId, {
          diagnosis: prescriptionForm.diagnosis?.trim() || undefined,
          generalNotes: prescriptionForm.generalNotes?.trim() || undefined,
          validUntilUtc: prescriptionForm.validUntilUtc,
          status: asDraft ? "Draft" : "Active",
          items: items.map((i) => ({
            medicationName: i.medicationName.trim(),
            form: i.form?.trim() || undefined,
            dosage: i.dosage?.trim() || undefined,
            frequency: i.frequency?.trim() || undefined,
            durationDays: i.durationDays,
            quantity: i.quantity,
            instructions: i.instructions?.trim() || undefined,
            warnings: i.warnings?.trim() || undefined,
          })),
        });
        toast.success("Prescripție creată.");
      }
      setPrescriptionForm({
        diagnosis: "",
        generalNotes: "",
        validUntilUtc: undefined,
        status: "Active",
        items: [emptyItem()],
      });
      load();
    } catch (err: unknown) {
      type ApiErr = {
        response?: {
          data?: { message?: string; title?: string; detail?: string };
        };
        message?: string;
      };
      const e = err as ApiErr;
      const msg =
        e.response?.data?.detail ||
        e.response?.data?.message ||
        e.response?.data?.title ||
        e.message ||
        "Eroare la creare";
      toast.error(msg);
    } finally {
      setSubmittingPrescription(false);
    }
  };

  const handleIssueDraft = async (prescriptionId: string) => {
    if (!patientUserId) return;
    const items = prescriptionForm.items.filter((i) =>
      i.medicationName?.trim(),
    );
    if (items.length === 0) {
      toast.error("Adaugă cel puțin un medicament.");
      return;
    }
    setSubmittingPrescription(true);
    try {
      await issuePrescriptionDraft(patientUserId, prescriptionId, {
        diagnosis: prescriptionForm.diagnosis?.trim() || undefined,
        generalNotes: prescriptionForm.generalNotes?.trim() || undefined,
        validUntilUtc: prescriptionForm.validUntilUtc,
        items: items.map((i) => ({
          id: i.id,
          medicationName: i.medicationName.trim(),
          form: i.form?.trim() || undefined,
          dosage: i.dosage?.trim() || undefined,
          frequency: i.frequency?.trim() || undefined,
          durationDays: i.durationDays,
          quantity: i.quantity,
          instructions: i.instructions?.trim() || undefined,
          warnings: i.warnings?.trim() || undefined,
        })),
      });
      toast.success("Prescripție emisă.");
      setEditingPrescriptionId(null);
      setPrescriptionForm({
        diagnosis: "",
        generalNotes: "",
        validUntilUtc: undefined,
        status: "Active",
        items: [emptyItem()],
      });
      load();
    } catch (err: unknown) {
      type ApiErr = {
        response?: {
          data?: { message?: string; title?: string; detail?: string };
        };
        message?: string;
      };
      const e = err as ApiErr;
      const msg =
        e.response?.data?.detail ||
        e.response?.data?.message ||
        e.response?.data?.title ||
        e.message ||
        "Eroare la emitere";
      toast.error(msg);
    } finally {
      setSubmittingPrescription(false);
    }
  };

  const handleEditDraft = async (prescriptionId: string) => {
    if (!patientUserId) return;
    try {
      const draft = await getPrescriptionById(patientUserId, prescriptionId);
      setPrescriptionForm({
        diagnosis: draft.diagnosis || "",
        generalNotes: draft.generalNotes || "",
        validUntilUtc: draft.validUntilUtc,
        status: draft.status,
        items:
          draft.items.length > 0
            ? draft.items.map((it) => ({
                id: it.id,
                medicationName: it.medicationName,
                form: it.form || "",
                dosage: it.dosage || "",
                frequency: it.frequency || "",
                durationDays: it.durationDays,
                quantity: it.quantity,
                instructions: it.instructions || "",
                warnings: it.warnings || "",
              }))
            : [emptyItem()],
      });
      setEditingPrescriptionId(prescriptionId);
    } catch (err: unknown) {
      type ApiErr = {
        response?: { data?: { message?: string; detail?: string } };
        message?: string;
      };
      const e = err as ApiErr;
      const msg =
        e.response?.data?.detail ||
        e.response?.data?.message ||
        e.message ||
        "Eroare la încărcare draft";
      toast.error(msg);
    }
  };

  const handleDeleteDraft = async (prescriptionId: string) => {
    if (!patientUserId) return;
    if (!confirm("Ești sigur că vrei să ștergi acest draft?")) return;
    try {
      await deletePrescriptionDraft(patientUserId, prescriptionId);
      toast.success("Draft șters.");
      if (editingPrescriptionId === prescriptionId) {
        setEditingPrescriptionId(null);
        setPrescriptionForm({
          diagnosis: "",
          generalNotes: "",
          validUntilUtc: undefined,
          status: "Active",
          items: [emptyItem()],
        });
      }
      load();
    } catch (err: unknown) {
      type ApiErr = {
        response?: { data?: { message?: string; detail?: string } };
        message?: string;
      };
      const e = err as ApiErr;
      const msg =
        e.response?.data?.detail ||
        e.response?.data?.message ||
        e.message ||
        "Eroare la ștergere";
      toast.error(msg);
    }
  };

  const cancelEdit = () => {
    setEditingPrescriptionId(null);
    setPrescriptionForm({
      diagnosis: "",
      generalNotes: "",
      validUntilUtc: undefined,
      status: "Active",
      items: [emptyItem()],
    });
  };

  const addPrescriptionItem = () => {
    setPrescriptionForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  };
  const removePrescriptionItem = (index: number) => {
    setPrescriptionForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== index),
    }));
  };
  const updatePrescriptionItem = (
    index: number,
    upd: Partial<CreatePrescriptionItemRequest>,
  ) => {
    setPrescriptionForm((f) => ({
      ...f,
      items: f.items.map((item, i) =>
        i === index ? { ...item, ...upd } : item,
      ),
    }));
  };

  const tabItems = [
    { id: "overview", label: "Prezentare generală" },
    { id: "timeline", label: "Timeline" },
    { id: "prescriptions", label: "Prescripții" },
  ];

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          onClick={() => navigate("/doctor/patients")}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Pacienți
        </button>
        <div className="flex gap-2">
          <Button onClick={() => setActiveTab("prescriptions")}>
            + Adaugă prescripție
          </Button>
          <Button onClick={() => setActiveTab("timeline")}>
            + Adaugă intrare medicală
          </Button>
        </div>
      </div>

      {/* Patient summary card (ca referință) */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xl font-semibold text-teal-700">
              {getInitials(fullName, email, patientUserId)}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Pacient</h1>
              <p className="text-sm text-slate-600">ID: {patientUserId}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {record?.bloodType && (
                  <Badge variant="error">Grupă: {record.bloodType}</Badge>
                )}
                {record?.allergies && record.allergies.length > 0 && (
                  <Badge variant="warning">
                    Alergie: {formatTags(record.allergies)}
                  </Badge>
                )}
                <Badge variant="success">Pacient activ</Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs tabs={tabItems} activeId={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-900">
              Fișă medicală
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasRecordData(record) ? (
              <>
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-700">
                    Grupă sanguină:
                  </span>{" "}
                  {record.bloodType || "—"}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Alergii:</span>{" "}
                  {formatTags(record.allergies)}
                </p>
                {record.adverseDrugReactions &&
                  record.adverseDrugReactions.length > 0 && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-700">
                        Reacții adverse la medicamente:
                      </span>{" "}
                      {formatTags(record.adverseDrugReactions)}
                    </p>
                  )}
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-700">
                    Afecțiuni cronice:
                  </span>{" "}
                  {formatTags(record.chronicConditions)}
                </p>
                {record.currentMedications && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">
                      Medicație curentă:
                    </span>{" "}
                    {record.currentMedications}
                  </p>
                )}
                {record.majorSurgeriesHospitalizations && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">
                      Intervenții/spitalizări:
                    </span>{" "}
                    {record.majorSurgeriesHospitalizations}
                  </p>
                )}
                {((record.emergencyContacts &&
                  record.emergencyContacts.length > 0) ||
                  record.emergencyContactName ||
                  record.emergencyContactPhone) && (
                  <div className="space-y-1">
                    <span className="font-medium text-slate-700">
                      Contact urgență:
                    </span>
                    {record.emergencyContacts &&
                    record.emergencyContacts.length > 0 ? (
                      record.emergencyContacts.map((c, i) => (
                        <p key={i} className="text-sm text-slate-600 pl-4">
                          {[c.name, c.relation, c.phone]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm text-slate-600 pl-4">
                        {[
                          record.emergencyContactName,
                          record.emergencyContactRelation,
                          record.emergencyContactPhone,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Nu există date de fișă medicală.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "timeline" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">
                Adaugă intrare medicală
              </h2>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={handleAddEntry}
              >
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Tip <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={entryForm.type}
                    onChange={(e) =>
                      setEntryForm({ ...entryForm, type: e.target.value })
                    }
                  >
                    {ENTRY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Titlu"
                    value={entryForm.title}
                    onChange={(e) =>
                      setEntryForm({ ...entryForm, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Descriere (opțional)"
                    value={entryForm.description ?? ""}
                    onChange={(e) =>
                      setEntryForm({
                        ...entryForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <Button type="submit" loading={submittingEntry}>
                    Salvează intrare
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setEntryForm({ type: "Note", title: "", description: "" })
                    }
                  >
                    Anulează
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">
              Intrări timeline
            </h2>
            {entries.length === 0 ? (
              <EmptyState
                title="Nicio intrare"
                description="Intrările adăugate aici vor apărea în lista de mai jos."
              />
            ) : (
              <ul className="space-y-2">
                {entries.map((e) => (
                  <Card key={e.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info">{e.type}</Badge>
                      <span className="font-medium text-slate-900">
                        {e.title}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(e.createdAtUtc).toLocaleString("ro-RO")}
                      </span>
                    </div>
                    {(e.createdByDoctorFullName ||
                      e.createdByInstitutionName) && (
                      <p className="mt-1 text-xs text-slate-500">
                        {[
                          e.createdByDoctorFullName &&
                            `Dr. ${e.createdByDoctorFullName}`,
                          e.createdByInstitutionName,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {e.description && (
                      <p className="mt-2 text-sm text-slate-600">
                        {e.description}
                      </p>
                    )}
                  </Card>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === "prescriptions" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingPrescriptionId
                    ? "Editează prescripție"
                    : "Creează prescripție"}
                </h2>
                {editingPrescriptionId && (
                  <Badge variant="info">Editare draft</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="Diagnostic (opțional)"
                    value={prescriptionForm.diagnosis ?? ""}
                    onChange={(e) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        diagnosis: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Input
                    label="Valabil până la"
                    type="datetime-local"
                    value={
                      prescriptionForm.validUntilUtc
                        ? new Date(prescriptionForm.validUntilUtc)
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        validUntilUtc: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : undefined,
                      })
                    }
                  />
                </div>
                {!editingPrescriptionId && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Status
                    </label>
                    <select
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-primary"
                      value={prescriptionForm.status}
                      onChange={(e) =>
                        setPrescriptionForm({
                          ...prescriptionForm,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="Draft">Draft</option>
                      <option value="Active">Activ</option>
                    </select>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <Input
                    label="Note generale (opțional)"
                    value={prescriptionForm.generalNotes ?? ""}
                    onChange={(e) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        generalNotes: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-slate-700">
                    Medicamente
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-sm"
                    onClick={addPrescriptionItem}
                  >
                    + Adaugă medicament
                  </Button>
                </div>
                <div className="space-y-3">
                  {prescriptionForm.items.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Input
                            label="Medicament"
                            value={item.medicationName}
                            onChange={(e) =>
                              updatePrescriptionItem(index, {
                                medicationName: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <Input
                          label="Formă"
                          value={item.form ?? ""}
                          onChange={(e) =>
                            updatePrescriptionItem(index, {
                              form: e.target.value,
                            })
                          }
                        />
                        <Input
                          label="Dozaj"
                          value={item.dosage ?? ""}
                          onChange={(e) =>
                            updatePrescriptionItem(index, {
                              dosage: e.target.value,
                            })
                          }
                        />
                        <Input
                          label="Frecvență"
                          value={item.frequency ?? ""}
                          onChange={(e) =>
                            updatePrescriptionItem(index, {
                              frequency: e.target.value,
                            })
                          }
                        />
                        <Input
                          label="Durată (zile)"
                          type="number"
                          min={1}
                          value={item.durationDays ?? ""}
                          onChange={(e) =>
                            updatePrescriptionItem(index, {
                              durationDays: e.target.value
                                ? parseInt(e.target.value, 10)
                                : undefined,
                            })
                          }
                        />
                        <Input
                          label="Cantitate totală"
                          type="number"
                          min={1}
                          value={item.quantity ?? ""}
                          onChange={(e) =>
                            updatePrescriptionItem(index, {
                              quantity: e.target.value
                                ? parseInt(e.target.value, 10)
                                : undefined,
                            })
                          }
                        />
                        <div className="sm:col-span-2">
                          <Input
                            label="Instrucțiuni"
                            value={item.instructions ?? ""}
                            onChange={(e) =>
                              updatePrescriptionItem(index, {
                                instructions: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Input
                            label="Atenționări"
                            value={item.warnings ?? ""}
                            onChange={(e) =>
                              updatePrescriptionItem(index, {
                                warnings: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="sm:col-span-2 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => removePrescriptionItem(index)}
                            disabled={prescriptionForm.items.length <= 1}
                          >
                            Șterge
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">
                  Rezumat prescripție
                </h3>
                <p className="text-sm text-slate-600">
                  {
                    prescriptionForm.items.filter((i) =>
                      i.medicationName?.trim(),
                    ).length
                  }{" "}
                  medicament(e)
                  {prescriptionForm.diagnosis?.trim() &&
                    ` · Diagnostic: ${prescriptionForm.diagnosis.trim()}`}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {editingPrescriptionId ? (
                  <>
                    <Button
                      type="button"
                      loading={submittingPrescription}
                      onClick={(e) => handleCreatePrescription(e, false)}
                    >
                      Actualizează draft
                    </Button>
                    <Button
                      type="button"
                      loading={submittingPrescription}
                      onClick={() =>
                        editingPrescriptionId &&
                        handleIssueDraft(editingPrescriptionId)
                      }
                    >
                      Emite prescripția
                    </Button>
                    <Button type="button" variant="ghost" onClick={cancelEdit}>
                      Anulează editarea
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      loading={submittingPrescription}
                      onClick={(e) => handleCreatePrescription(e, true)}
                    >
                      Salvează ca draft
                    </Button>
                    <Button
                      type="button"
                      loading={submittingPrescription}
                      onClick={(e) => handleCreatePrescription(e, false)}
                    >
                      Emite prescripția
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setPrescriptionForm({
                          diagnosis: "",
                          generalNotes: "",
                          validUntilUtc: undefined,
                          status: "Active",
                          items: [emptyItem()],
                        })
                      }
                    >
                      Anulează
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">
              Lista de prescripții
            </h2>
            {prescriptions.length === 0 ? (
              <EmptyState
                title="Nu există prescripții încă"
                description="Prescripțiile create aici apar în lista de mai jos și în contul pacientului."
              />
            ) : (
              <ul className="space-y-2">
                {prescriptions.map((p) => (
                  <Card key={p.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {new Date(p.createdAtUtc).toLocaleString("ro-RO")} ·{" "}
                          {p.status}
                        </span>
                        {p.status === "Draft" && (
                          <Badge variant="info">Draft</Badge>
                        )}
                      </div>
                      {p.status === "Draft" && (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="text-sm"
                            onClick={() => handleEditDraft(p.id)}
                            disabled={editingPrescriptionId === p.id}
                          >
                            Editează draft
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-sm text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteDraft(p.id)}
                          >
                            Șterge draft
                          </Button>
                        </div>
                      )}
                    </div>
                    {(p.doctorFullName || p.doctorInstitutionName) && (
                      <p className="mt-1 text-xs text-slate-500">
                        {[
                          p.doctorFullName && `Dr. ${p.doctorFullName}`,
                          p.doctorInstitutionName,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {p.diagnosis && (
                      <p className="text-sm text-slate-600">
                        Diagnostic: {p.diagnosis}
                      </p>
                    )}
                    <ul className="mt-2 space-y-1">
                      {(p.items ?? []).map((it) => (
                        <li key={it.id} className="text-sm text-slate-700">
                          {it.medicationName}
                          {it.dosage && ` · ${it.dosage}`}
                          <span className="text-xs text-slate-500">
                            {" "}
                            ({it.status})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
