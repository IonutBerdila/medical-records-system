import { http } from '../http';
import type { PrescriptionDto, CreatePrescriptionRequest } from './types';

export async function getMyPrescriptions(): Promise<PrescriptionDto[]> {
  const { data } = await http.get<PrescriptionDto[]>('/api/prescriptions/me');
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
