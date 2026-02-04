import { http } from '../http';
import type { MedicalEntryDto, CreateMedicalEntryRequest } from './types';

export async function getMyEntries(): Promise<MedicalEntryDto[]> {
  const { data } = await http.get<MedicalEntryDto[]>('/api/entries/me');
  return data;
}

export async function getPatientEntries(patientUserId: string): Promise<MedicalEntryDto[]> {
  const { data } = await http.get<MedicalEntryDto[]>(`/api/patients/${patientUserId}/entries`);
  return data;
}

export async function addPatientEntry(
  patientUserId: string,
  body: CreateMedicalEntryRequest
): Promise<MedicalEntryDto> {
  const { data } = await http.post<MedicalEntryDto>(`/api/patients/${patientUserId}/entries`, body);
  return data;
}
