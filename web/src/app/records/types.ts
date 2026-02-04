export interface MedicalRecordDto {
  id: string;
  patientUserId?: string;
  bloodType?: string;
  allergies?: string;
  chronicConditions?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  updatedAtUtc: string;
}

export interface UpdateMedicalRecordRequest {
  bloodType?: string;
  allergies?: string;
  chronicConditions?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}
