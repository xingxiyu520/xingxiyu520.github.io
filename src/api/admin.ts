import { apiRequest, clearAdminToken, writeAdminToken } from './client';

export type AdminProfile = {
  id: string;
  username: string;
  must_change_password: boolean;
  last_login_at: string | null;
};

export type AdminTokenResponse = {
  access_token: string;
  token_type: 'bearer';
  expires_in_seconds: number;
  must_change_password: boolean;
  admin: AdminProfile;
};

export async function adminLogin(username: string, password: string): Promise<AdminTokenResponse> {
  const response = await apiRequest<AdminTokenResponse>('/admin/login', {
    method: 'POST',
    body: { username, password },
  });

  writeAdminToken(response.access_token);
  return response;
}

export function getCurrentAdmin(): Promise<AdminProfile> {
  return apiRequest<AdminProfile>('/admin/me', { auth: true });
}

export async function adminLogout(): Promise<void> {
  try {
    await apiRequest('/admin/logout', { method: 'POST', auth: true });
  } finally {
    clearAdminToken();
  }
}

export function changeAdminPassword(currentPassword: string, newPassword: string) {
  return apiRequest('/admin/change-password', {
    method: 'POST',
    auth: true,
    body: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });
}
