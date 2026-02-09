import { http } from '../http';
import type { PharmacyPrescriptionDto, PharmacyVerifyResponse, VerifyShareTokenRequest } from './types';

export async function verifyShareTokenV2(body: VerifyShareTokenRequest): Promise<PharmacyVerifyResponse> {
  const { data } = await http.post<PharmacyVerifyResponse>('/api/pharmacy/verify-v2', body);
  return data;
}

export async function dispensePrescription(
  verificationId: string,
  prescriptionId: string
): Promise<PharmacyPrescriptionDto> {
  const { data } = await http.post<PharmacyPrescriptionDto>('/api/pharmacy/dispense', {
    verificationId,
    prescriptionId
  });
  return data;
}
