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
