import { http } from '../http';
import type {
  AdminUsersResponse,
  AdminUsersParams,
  AdminApprovalsResponse,
  AdminApprovalsParams,
  AdminUserDto,
  AdminDashboardResponse,
  AdminAuditResponse,
  AdminAuditParams,
  ApproveUserRequest,
  RejectUserRequest
} from './types';

export async function getAdminUsers(params: AdminUsersParams): Promise<AdminUsersResponse> {
  const { data } = await http.get<AdminUsersResponse>('/api/admin/users', { params });
  return data;
}

export async function getAdminApprovals(params: AdminApprovalsParams): Promise<AdminApprovalsResponse> {
  const { data } = await http.get<AdminApprovalsResponse>('/api/admin/approvals', { params });
  return data;
}

export async function approveUser(userId: string, body?: ApproveUserRequest): Promise<AdminUserDto> {
  const { data } = await http.post<AdminUserDto>(`/api/admin/approvals/${userId}/approve`, body ?? {});
  return data;
}

export async function rejectUser(userId: string, body: RejectUserRequest): Promise<AdminUserDto> {
  const { data } = await http.post<AdminUserDto>(`/api/admin/approvals/${userId}/reject`, body);
  return data;
}

export async function getAdminDashboard(): Promise<AdminDashboardResponse> {
  const { data } = await http.get<AdminDashboardResponse>('/api/admin/dashboard');
  return data;
}

export async function getAdminAudit(params: AdminAuditParams): Promise<AdminAuditResponse> {
  const { data } = await http.get<AdminAuditResponse>('/api/admin/audit', { params });
  return data;
}
