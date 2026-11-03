import axios, { AxiosError, type AxiosInstance } from 'axios';
import { env } from '../config/env';
import { useAuthStore } from '../stores/authStore';
import type { ApiEnvelope } from '../types/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-API-Version': 'v1',
  },
  timeout: 30_000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearSession();
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const payload = error.response?.data as ApiEnvelope<unknown> | undefined;

  if (payload && typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }

  if (payload?.errors) {
    const firstFieldErrors = Object.values(payload.errors)[0];
    if (Array.isArray(firstFieldErrors) && firstFieldErrors[0]) {
      return firstFieldErrors[0];
    }
  }

  return fallback;
}
