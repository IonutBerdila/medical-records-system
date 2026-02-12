import axios, { AxiosError } from 'axios';
import { env } from './env';
import { storage } from './storage';

export const http = axios.create({
  baseURL: env.apiBaseUrl
});

http.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Normalizes backend errors (ProblemDetails or legacy format) into a user-friendly message.
 */
function normalizeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string; title?: string; message?: string }>;
    
    // RFC 7807 ProblemDetails format (from global exception handler)
    if (axiosError.response?.data?.detail) {
      return axiosError.response.data.detail;
    }
    
    // Legacy format or other structured errors
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    
    if (axiosError.response?.data?.title) {
      return axiosError.response.data.title;
    }
    
    // Fallback to status text or generic message
    if (axiosError.response?.statusText) {
      return axiosError.response.statusText;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'A apărut o eroare. Încearcă din nou.';
}

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storage.clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Attach normalized message to error for easier access in components
    const normalizedMessage = normalizeError(error);
    (error as AxiosError & { normalizedMessage?: string }).normalizedMessage = normalizedMessage;
    
    return Promise.reject(error);
  }
);

export { normalizeError };

