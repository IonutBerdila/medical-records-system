import { http } from '../http';
import type { PharmacyPrescriptionDto, VerifyShareTokenRequest } from './types';

export async function verifyShareToken(body: VerifyShareTokenRequest): Promise<PharmacyPrescriptionDto[]> {
  const { data } = await http.post<PharmacyPrescriptionDto[]>('/api/pharmacy/verify', body);
  return data;
}
