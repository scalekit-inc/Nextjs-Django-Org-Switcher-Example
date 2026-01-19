/**
 * API client for communicating with Django backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface User {
  id: string;
  email: string;
  name: string;
  current_organization_id?: string;
}

export interface Organization {
  id: string;
  display_name: string;
  external_id?: string;
  is_current?: boolean;
}

export interface AuthUrlResponse {
  auth_url: string;
  state: string;
}

export interface CallbackRequest {
  code: string;
  state: string;
}

export interface CallbackResponse {
  success: boolean;
  user: User;
  organizations: Organization[];
}

export interface UserInfoResponse {
  user: User;
  organizations: Organization[];
  authenticated: boolean;
}

export interface LogoutResponse {
  success: boolean;
  logout_url?: string;
}

/**
 * Get authorization URL for login
 */
export async function getAuthUrl(options?: {
  organization_id?: string;
  prompt?: string;
}): Promise<AuthUrlResponse> {
  const response = await fetch(`${API_URL}/auth/url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(options || {}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get auth URL');
  }

  return response.json();
}

/**
 * Handle OAuth callback
 */
export async function handleCallback(data: CallbackRequest): Promise<CallbackResponse> {
  const response = await fetch(`${API_URL}/auth/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Authentication failed');
  }

  return response.json();
}

/**
 * Get current user information
 */
export async function getUserInfo(): Promise<UserInfoResponse> {
  const response = await fetch(`${API_URL}/auth/user`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get user info');
  }

  return response.json();
}

/**
 * Switch to a different organization
 */
export async function switchOrganization(organizationId: string): Promise<AuthUrlResponse> {
  const response = await fetch(`${API_URL}/auth/switch-org`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ organization_id: organizationId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to switch organization');
  }

  return response.json();
}

/**
 * Logout user
 */
export async function logout(): Promise<LogoutResponse> {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Logout failed');
  }

  return response.json();
}
