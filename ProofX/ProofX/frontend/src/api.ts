/// <reference types="vite/client" />

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const AUTH_EVENT = 'proofx-auth-change';

export type AuthRole = 'user' | 'company';

export interface AuthPayload {
  token: string;
  role: AuthRole;
  email: string;
}

export function getToken() {
  return localStorage.getItem('proofx_token');
}

export function getRole() {
  return localStorage.getItem('proofx_role') as AuthRole | null;
}

export function getEmail() {
  return localStorage.getItem('proofx_email');
}

export function saveAuth(payload: AuthPayload) {
  localStorage.setItem('proofx_token', payload.token);
  localStorage.setItem('proofx_role', payload.role);
  localStorage.setItem('proofx_email', payload.email);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function logout() {
  localStorage.removeItem('proofx_token');
  localStorage.removeItem('proofx_role');
  localStorage.removeItem('proofx_email');
  localStorage.removeItem('proofx_verification_result');
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function onAuthChange(callback: () => void) {
  window.addEventListener(AUTH_EVENT, callback);
  return () => window.removeEventListener(AUTH_EVENT, callback);
}

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || undefined);

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || 'Request failed');
  }

  return (await response.json()) as T;
}
