export interface VerifyShareTokenRequest {
  token: string;
}

export interface PharmacyPrescriptionItemDto {
  id: string;
  medicationName: string;
  form?: string;
  dosage?: string;
  frequency?: string;
  durationDays?: number;
  quantity?: number;
  instructions?: string;
  warnings?: string;
  status: string;
  dispensedAtUtc?: string;
  dispensedByPharmacyName?: string;
}

export interface PharmacyPrescriptionDto {
  id: string;
  createdAtUtc: string;
  doctorName?: string;
  doctorInstitutionName?: string;
  diagnosis?: string;
  generalNotes?: string;
  validUntilUtc?: string;
  status: string;
  items: PharmacyPrescriptionItemDto[];
}

export interface PharmacyVerifyResponse {
  verificationId: string;
  prescriptions: PharmacyPrescriptionDto[];
}
