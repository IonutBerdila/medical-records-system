import { http } from '../http';
import type { AccessDto, GrantAccessRequest, CreateShareTokenRequest, ShareTokenResponse } from './types';

export async function getMyDoctors(): Promise<AccessDto[]> {
  const { data } = await http.get<AccessDto[]>('/api/consent/my-doctors');
  return data;
}

export async function grantAccess(body: GrantAccessRequest): Promise<void> {
  await http.post('/api/consent/grant', body);
}

export async function revokeAccess(accessId: string): Promise<void> {
  await http.delete(`/api/access-grants/${accessId}`);
}

export async function createShareToken(body?: CreateShareTokenRequest): Promise<ShareTokenResponse> {
  const { data } = await http.post<ShareTokenResponse>('/api/consent/share-token', body ?? {});
  return data;
}
