export type UserRole = 'Patient' | 'Doctor' | 'Pharmacy' | 'Admin';

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // ISO date (YYYY-MM-DD)
  doctorLicenseNumber?: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAtUtc: string;
}

export interface MeResponse {
  userId: string;
  email: string;
  roles: UserRole[];
  profile: unknown;
}

