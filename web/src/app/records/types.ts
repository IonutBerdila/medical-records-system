export interface EmergencyContactDto {
  name?: string;
  relation?: string;
  phone?: string;
}

export interface MedicalRecordDto {
  id: string;
  patientUserId?: string;
  bloodType?: string;
  allergies?: string[];
  adverseDrugReactions?: string[];
  chronicConditions?: string[];
  currentMedications?: string;
  majorSurgeriesHospitalizations?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  emergencyContacts?: EmergencyContactDto[];
  updatedAtUtc: string;
}

export interface UpdateMedicalRecordRequest {
  bloodType?: string;
  allergies?: string[];
  adverseDrugReactions?: string[];
  chronicConditions?: string[];
  currentMedications?: string;
  majorSurgeriesHospitalizations?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  emergencyContacts?: EmergencyContactDto[];
}

export const BLOOD_GROUPS = [
  'Necunoscut',
  '0(I) Rh+',
  '0(I) Rh-',
  'A(II) Rh+',
  'A(II) Rh-',
  'B(III) Rh+',
  'B(III) Rh-',
  'AB(IV) Rh+',
  'AB(IV) Rh-'
] as const;

export const EMERGENCY_RELATIONS = [
  'Părinte',
  'Soț/Soție',
  'Frate/Soră',
  'Rudă',
  'Prieten',
  'Altul'
] as const;
