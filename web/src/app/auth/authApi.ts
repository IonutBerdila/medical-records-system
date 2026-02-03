import { http } from '../http';
import type { LoginRequest, LoginResponse, MeResponse, RegisterRequest, RegisterResponse } from './types';

export async function registerUser(payload: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await http.post<RegisterResponse>('/api/auth/register', payload);
  return data;
}

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>('/api/auth/login', payload);
  return data;
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await http.get<MeResponse>('/api/me');
  return data;
}

