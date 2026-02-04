export interface AccessDto {
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

export interface RevokeAccessRequest {
  doctorUserId: string;
}
