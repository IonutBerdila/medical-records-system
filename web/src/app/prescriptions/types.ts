export interface PrescriptionDto {
  id: string;
  patientUserId: string;
  doctorUserId: string;
  medicationName: string;
  dosage?: string;
  instructions?: string;
  validUntilUtc?: string;
  status: string;
  createdAtUtc: string;
  dispensedAtUtc?: string;
}

export interface CreatePrescriptionRequest {
  medicationName: string;
  dosage?: string;
  instructions?: string;
  validUntilUtc?: string;
}
