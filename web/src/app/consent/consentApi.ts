import { http } from '../http';
import type { AccessDto, GrantAccessRequest, RevokeAccessRequest } from './types';

export async function getMyDoctors(): Promise<AccessDto[]> {
  const { data } = await http.get<AccessDto[]>('/api/consent/my-doctors');
  return data;
}

export async function grantAccess(body: GrantAccessRequest): Promise<void> {
  await http.post('/api/consent/grant', body);
}

export async function revokeAccess(body: RevokeAccessRequest): Promise<void> {
  await http.post('/api/consent/revoke', body);
}
