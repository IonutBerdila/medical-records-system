import { http } from '../http';
import type { MedicalRecordDto, UpdateMedicalRecordRequest } from './types';

export async function getMyRecord(): Promise<MedicalRecordDto> {
  const { data } = await http.get<MedicalRecordDto>('/api/records/me');
  return data;
}

export async function updateMyRecord(body: UpdateMedicalRecordRequest): Promise<MedicalRecordDto> {
  const { data } = await http.put<MedicalRecordDto>('/api/records/me', body);
  return data;
}

export async function getPatientRecord(patientUserId: string): Promise<MedicalRecordDto> {
  const { data } = await http.get<MedicalRecordDto>(`/api/patients/${patientUserId}/record`);
  return data;
}
