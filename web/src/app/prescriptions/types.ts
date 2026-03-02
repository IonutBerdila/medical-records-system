export interface PrescriptionItemDto {
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
  dispensedByPharmacyUserId?: string;
  dispensedByPharmacyName?: string;
}

export interface PrescriptionDto {
  id: string;
  patientUserId: string;
  doctorUserId: string;
  doctorFullName?: string;
  doctorInstitutionName?: string;
  diagnosis?: string;
  generalNotes?: string;
  validUntilUtc?: string;
  status: string;
  createdAtUtc: string;
  items: PrescriptionItemDto[];
}

export interface CreatePrescriptionItemRequest {
  // Optional Id used only when editing an existing draft item.
  // For new items this should be undefined.
  id?: string;
  medicationName: string;
  form?: string;
  dosage?: string;
  frequency?: string;
  durationDays?: number;
  quantity?: number;
  instructions?: string;
  warnings?: string;
}

export interface CreatePrescriptionRequest {
  diagnosis?: string;
  generalNotes?: string;
  validUntilUtc?: string;
  status: string;
  items: CreatePrescriptionItemRequest[];
}

export interface UpdatePrescriptionItemRequest {
  id?: string;
  medicationName: string;
  form?: string;
  dosage?: string;
  frequency?: string;
  durationDays?: number;
  quantity?: number;
  instructions?: string;
  warnings?: string;
}

export interface UpdatePrescriptionDraftRequest {
  diagnosis?: string;
  generalNotes?: string;
  validUntilUtc?: string;
  items: UpdatePrescriptionItemRequest[];
}
