/**
 * API client for TwitterOS backend.
 * Uses localStorage for JWT token storage.
 */

import type {
  Token,
  UserCreate,
  UserResponse,
  CampaignCreate,
  CampaignResponse,
  ParticipantJoin,
  ParticipantResponse,
  JoinStatusResponse,
  CampaignPublicInfo,
  CredentialsResponse,
  ApifySave,
  VTUSave,
  APIError,
} from '@/types';
import type { VerificationLog, DeliveryLog } from '@/types/logs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ============= Token Management =============

const TOKEN_KEY = 'twitteros_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ============= Base Fetch =============

class APIException extends Error {
  constructor(public detail: string, public status: number) {
    super(detail);
    this.name = 'APIException';
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit & { skipAuth?: boolean }
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) || {}),
  };

  // Add auth header unless skipped
  if (!options?.skipAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let detail = 'Request failed';
    try {
      const error: APIError = await res.json();
      detail = error.detail || detail;
    } catch {
      // Ignore JSON parse errors
    }
    throw new APIException(detail, res.status);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// ============= Auth API =============

export async function register(data: UserCreate): Promise<UserResponse> {
  return fetchAPI<UserResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
    skipAuth: true,
  });
}

export async function login(email: string, password: string): Promise<Token> {
  // OAuth2 requires form-urlencoded
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });

  if (!res.ok) {
    const error: APIError = await res.json();
    throw new APIException(error.detail || 'Login failed', res.status);
  }

  const token: Token = await res.json();
  setToken(token.access_token);
  return token;
}

export function logout(): void {
  clearToken();
}

export async function getCurrentUser(): Promise<UserResponse> {
  return fetchAPI<UserResponse>('/auth/me');
}

// ============= Campaign API =============

export async function createCampaign(data: CampaignCreate): Promise<CampaignResponse> {
  return fetchAPI<CampaignResponse>('/campaigns/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function listCampaigns(): Promise<CampaignResponse[]> {
  return fetchAPI<CampaignResponse[]>('/campaigns/');
}

export async function getCampaign(slug: string): Promise<CampaignResponse> {
  return fetchAPI<CampaignResponse>(`/campaigns/${slug}`);
}

export async function deleteCampaign(slug: string): Promise<void> {
  return fetchAPI<void>(`/campaigns/${slug}`, {
    method: 'DELETE',
  });
}

// ============= Join API (Public) =============

export async function getCampaignInfo(slug: string): Promise<CampaignPublicInfo> {
  return fetchAPI<CampaignPublicInfo>(`/join/${slug}`, { skipAuth: true });
}

export async function joinCampaign(slug: string, data: ParticipantJoin): Promise<ParticipantResponse> {
  return fetchAPI<ParticipantResponse>(`/join/${slug}`, {
    method: 'POST',
    body: JSON.stringify(data),
    skipAuth: true,
  });
}

export async function checkJoinStatus(slug: string, twitterUsername: string): Promise<JoinStatusResponse> {
  return fetchAPI<JoinStatusResponse>(`/join/${slug}/status/${twitterUsername}`, { skipAuth: true });
}

// ============= Settings API =============

export async function getCredentials(): Promise<CredentialsResponse> {
  return fetchAPI<CredentialsResponse>('/settings/credentials');
}

export async function saveApifyKey(data: ApifySave): Promise<{ message: string }> {
  return fetchAPI<{ message: string }>('/settings/apify', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function addApifyKey(data: ApifySave): Promise<{ message: string }> {
  return fetchAPI<{ message: string }>('/settings/apify', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteApifyKey(keyId: number): Promise<{ message: string }> {
  return fetchAPI<{ message: string }>(`/settings/apify/${keyId}`, {
    method: 'DELETE',
  });
}

export async function saveVtuCredentials(data: VTUSave): Promise<{ message: string }> {
  return fetchAPI<{ message: string }>('/settings/vtu', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============= Logs API =============

export async function getVerificationLogs(skip = 0, limit = 100, campaignSlug?: string): Promise<VerificationLog[]> {
  let url = `/logs/verification?skip=${skip}&limit=${limit}`;
  if (campaignSlug) {
    url += `&campaign_slug=${campaignSlug}`;
  }
  return fetchAPI<VerificationLog[]>(url);
}

export async function getDeliveryLogs(skip = 0, limit = 100, campaignSlug?: string): Promise<DeliveryLog[]> {
  let url = `/logs/delivery?skip=${skip}&limit=${limit}`;
  if (campaignSlug) {
    url += `&campaign_slug=${campaignSlug}`;
  }
  return fetchAPI<DeliveryLog[]>(url);
}

export { APIException };

