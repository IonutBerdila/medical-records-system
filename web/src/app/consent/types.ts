export interface AccessDto {
  id: string;
  doctorUserId: string;
  doctorFullName?: string;
  grantedAtUtc: string;
  expiresAtUtc?: string;
  isActive: boolean;
}

export interface GrantAccessRequest {
  doctorUserId?: string;
  doctorEmail?: string;
  expiresAtUtc?: string;
}

export interface CreateShareTokenRequest {
  scope?: string;
  expiresInMinutes?: number;
  prescriptionId?: string;
}

export interface ShareTokenResponse {
  token: string;
  expiresAtUtc: string;
  scope: string;
}
