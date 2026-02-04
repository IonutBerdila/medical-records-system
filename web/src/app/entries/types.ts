export interface MedicalEntryDto {
  id: string;
  recordId: string;
  type: string;
  title: string;
  description?: string;
  createdByUserId: string;
  createdAtUtc: string;
}

export interface CreateMedicalEntryRequest {
  type: string;
  title: string;
  description?: string;
}
