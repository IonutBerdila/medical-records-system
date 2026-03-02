import { http } from '../http';
import type { PrescriptionDto, CreatePrescriptionRequest, UpdatePrescriptionDraftRequest } from './types';

export async function getMyPrescriptions(): Promise<PrescriptionDto[]> {
  const { data } = await http.get<PrescriptionDto[]>('/api/prescriptions/me');
  return data;
}

export async function getPatientPrescriptions(patientUserId: string): Promise<PrescriptionDto[]> {
  const { data } = await http.get<PrescriptionDto[]>(`/api/patients/${patientUserId}/prescriptions`);
  return data;
}

export async function getPrescriptionById(patientUserId: string, prescriptionId: string): Promise<PrescriptionDto> {
  const { data } = await http.get<PrescriptionDto>(`/api/patients/${patientUserId}/prescriptions/${prescriptionId}`);
  return data;
}

export async function createPatientPrescription(
  patientUserId: string,
  body: CreatePrescriptionRequest
): Promise<PrescriptionDto> {
  const { data } = await http.post<PrescriptionDto>(
    `/api/patients/${patientUserId}/prescriptions`,
    body
  );
  return data;
}

export async function updatePrescriptionDraft(
  patientUserId: string,
  prescriptionId: string,
  body: UpdatePrescriptionDraftRequest
): Promise<PrescriptionDto> {
  const { data } = await http.put<PrescriptionDto>(
    `/api/patients/${patientUserId}/prescriptions/${prescriptionId}`,
    body
  );
  return data;
}

export async function issuePrescriptionDraft(
  patientUserId: string,
  prescriptionId: string,
  body: UpdatePrescriptionDraftRequest
): Promise<PrescriptionDto> {
  const { data } = await http.post<PrescriptionDto>(
    `/api/patients/${patientUserId}/prescriptions/${prescriptionId}/issue`,
    body
  );
  return data;
}

export async function deletePrescriptionDraft(patientUserId: string, prescriptionId: string): Promise<void> {
  await http.delete(`/api/patients/${patientUserId}/prescriptions/${prescriptionId}`);
}
