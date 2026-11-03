import { apiClient } from './client';
import type { ApiSuccessEnvelope } from '../types/api';
import type {
  LoginRequest,
  LoginResponseData,
  ProfileResponseData,
  RegisterRequest,
  RegisterResponseData,
} from '../types/auth';

export async function loginRequest(
  payload: LoginRequest,
): Promise<LoginResponseData> {
  const response = await apiClient.post<ApiSuccessEnvelope<LoginResponseData>>(
    '/api/v1/auth/login',
    payload,
  );

  return response.data.data;
}

export async function registerRequest(
  payload: RegisterRequest,
): Promise<RegisterResponseData> {
  const response = await apiClient.post<
    ApiSuccessEnvelope<RegisterResponseData>
  >('/api/v1/auth/register', payload);

  return response.data.data;
}

export async function fetchProfile(): Promise<ProfileResponseData> {
  const response = await apiClient.get<ApiSuccessEnvelope<ProfileResponseData>>(
    '/api/v1/auth/me',
  );

  return response.data.data;
}
