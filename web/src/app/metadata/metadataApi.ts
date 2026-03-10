import { http } from '../http';

export interface SpecialtyOption {
  id: string;
  name: string;
}

export async function fetchSpecialties(): Promise<SpecialtyOption[]> {
  const { data } = await http.get<SpecialtyOption[]>('/api/metadata/specialties');
  return data;
}

