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
  dispensedAtUtc?: string;
}

export interface PharmacyVerifyResponse {
  verificationId: string;
  prescriptions: PharmacyPrescriptionDto[];
}
