export interface AdminUserDto {
  userId: string;
  email: string;
  roles: string[];
  createdAtUtc?: string;
  fullName?: string;
  pharmacyName?: string;
  licenseNumber?: string;
  approvalStatus?: string;
  approvedAtUtc?: string;
  approvedByAdminUserId?: string;
  rejectedAtUtc?: string;
  rejectionReason?: string;
}

export interface AdminUsersParams {
  role?: string;
  status?: string;
  search?: string;
  skip?: number;
  take?: number;
}

export interface AdminUsersResponse {
  users: AdminUserDto[];
  total: number;
}

export interface AdminApprovalsParams {
  status?: string;
  role?: string;
  skip?: number;
  take?: number;
}

export interface AdminApprovalsResponse {
  items: AdminUserDto[];
  total: number;
}

export interface ApproveUserRequest {
  note?: string;
}

export interface RejectUserRequest {
  reason: string;
}

export interface AdminDashboardCounts {
  totalUsers: number;
  patients: number;
  doctors: number;
  pharmacies: number;
  admins: number;
  pendingDoctors: number;
  pendingPharmacies: number;
  pendingApprovalsTotal: number;
  // Backwards-compat: aggregated pending (equals pendingApprovalsTotal)
  pendingApprovals: number;
}

export interface AdminAuditEventDto {
  id: string;
  timestampUtc: string;
  action: string;
  actorUserId: string;
  actorRole?: string;
  actorEmail?: string;
  patientUserId?: string;
  patientEmail?: string;
  entityType?: string;
  entityId?: string;
  metadataJson?: string;
  ipAddress?: string;
}

export interface AdminDashboardResponse {
  counts: AdminDashboardCounts;
  recentActivity: AdminAuditEventDto[];
}

export interface AdminAuditParams {
  fromUtc?: string;
  toUtc?: string;
  action?: string;
  skip?: number;
  take?: number;
}

export interface AdminAuditResponse {
  events: AdminAuditEventDto[];
  total: number;
}
