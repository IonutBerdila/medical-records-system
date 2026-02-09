export interface VerifyShareTokenRequest {
  token: string;
}

export interface PharmacyPrescriptionDto {
  id: string;
  medicationName: string;
  dosage?: string;
  instructions?: string;
  createdAtUtc: string;
  doctorName?: string;
  status: string;
}
