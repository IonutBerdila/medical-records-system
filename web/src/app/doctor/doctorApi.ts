import { http } from '../http';
import type { DoctorPatientDto } from './types';

export async function getMyPatients(): Promise<DoctorPatientDto[]> {
  const { data } = await http.get<DoctorPatientDto[]>('/api/doctor/patients');
  return data;
}
