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

// ============================================
// Connector API (Agent Auth)
// ============================================

export interface Connector {
  connector: string;
  display_name: string;
  description: string;
  connected: boolean;
  status: string;
  account_id?: string;
  error?: string;
}

export interface ConnectorsListResponse {
  connectors: Connector[];
}

export interface ConnectorConnectResponse {
  auth_url: string;
  connector: string;
}

export interface ConnectorDisconnectResponse {
  success: boolean;
  connector: string;
  message: string;
}

/**
 * Get status of all connectors for the current user
 */
export async function getConnectors(): Promise<ConnectorsListResponse> {
  const response = await fetch(`${API_URL}/connectors`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get connectors');
  }

  return response.json();
}

/**
 * Generate authorization link to connect a service
 */
export async function connectConnector(
  connector: string,
  redirectUrl?: string
): Promise<ConnectorConnectResponse> {
  const response = await fetch(`${API_URL}/connectors/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      connector,
      redirect_url: redirectUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to connect');
  }

  return response.json();
}

/**
 * Get status of a specific connector
 */
export async function getConnectorStatus(connector: string): Promise<Connector> {
  const response = await fetch(`${API_URL}/connectors/${connector}/status`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get connector status');
  }

  return response.json();
}

/**
 * Disconnect a connected service
 */
export async function disconnectConnector(
  connector: string
): Promise<ConnectorDisconnectResponse> {
  const response = await fetch(`${API_URL}/connectors/${connector}/disconnect`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to disconnect');
  }

  return response.json();
}
