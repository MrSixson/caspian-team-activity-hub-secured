import { User } from '../types';

/**
 * Thin client for the Caspian backend.
 *
 * The session token lives in sessionStorage (cleared when the tab closes) and is
 * sent as an `Authorization: Bearer` header. It is never placed in a cookie, so
 * the API is not exposed to CSRF, and it is never written into localStorage
 * alongside application data.
 */

const TOKEN_KEY = 'caspian_session_token';

let inMemoryToken: string | null = null;

export function getToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  try {
    inMemoryToken = sessionStorage.getItem(TOKEN_KEY);
  } catch {
    inMemoryToken = null;
  }
  return inMemoryToken;
}

export function setToken(token: string | null): void {
  inMemoryToken = token;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable — the in-memory copy still works for this page view */
  }
}

export interface ApiResult<T = any> {
  success: boolean;
  status: number;
  message?: string;
  data?: T;
}

async function request<T = any>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<ApiResult<T>> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { success: false, status: 0, message: 'ارتباط با سرور برقرار نشد.' };
  }

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  // An expired or revoked session must not linger on the client.
  if (response.status === 401) {
    setToken(null);
  }

  return {
    success: response.ok && payload?.success !== false,
    status: response.status,
    message: payload?.message,
    data: payload as T,
  };
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T = any>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  del: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ==========================================
// Auth
// ==========================================

export interface LoginOutcome {
  success: boolean;
  error?: string;
  user?: User;
  mustChangePassword?: boolean;
}

export async function login(username: string, password: string): Promise<LoginOutcome> {
  const res = await request<{ token: string; user: User; mustChangePassword: boolean }>('/api/auth/login', {
    method: 'POST',
    body: { username, password },
    auth: false,
  });

  if (!res.success || !res.data?.token) {
    return { success: false, error: res.message || 'ورود ناموفق بود.' };
  }

  setToken(res.data.token);
  return { success: true, user: res.data.user, mustChangePassword: res.data.mustChangePassword };
}

export interface RegisterPayload {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  teamspeakName: string;
}

export async function register(payload: RegisterPayload): Promise<{ success: boolean; error?: string; user?: User }> {
  // NOTE: no `role` is sent. The server assigns the lowest rank and a Pending
  // status regardless of what the client asks for.
  const res = await request<{ user: User }>('/api/auth/register', {
    method: 'POST',
    body: payload,
    auth: false,
  });

  if (!res.success) return { success: false, error: res.message || 'ثبت‌نام ناموفق بود.' };
  return { success: true, user: res.data?.user };
}

export async function logout(): Promise<void> {
  await request('/api/auth/logout', { method: 'POST' });
  setToken(null);
}

export async function fetchMe(): Promise<{ user: User; mustChangePassword: boolean } | null> {
  const res = await request<{ user: User; mustChangePassword: boolean }>('/api/auth/me');
  if (!res.success || !res.data?.user) return null;
  return { user: res.data.user, mustChangePassword: res.data.mustChangePassword };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const res = await request<{ token: string }>('/api/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
  if (!res.success) return { success: false, error: res.message || 'تغییر کلمه عبور ناموفق بود.' };
  if (res.data?.token) setToken(res.data.token);
  return { success: true };
}

// ==========================================
// Users (all sanitized server-side — no hashes are ever returned)
// ==========================================

export async function fetchUsers(): Promise<User[] | null> {
  const res = await request<{ users: User[] }>('/api/users');
  return res.success ? res.data?.users ?? [] : null;
}

export async function adminResetPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const res = await request(`/api/users/${encodeURIComponent(userId)}/reset-password`, {
    method: 'POST',
    body: { newPassword },
  });
  return res.success ? { success: true } : { success: false, error: res.message };
}

export async function adminCreateUser(payload: RegisterPayload & { role?: string }) {
  const res = await request<{ user: User }>('/api/users', { method: 'POST', body: payload });
  return res.success
    ? { success: true as const, user: res.data?.user }
    : { success: false as const, error: res.message };
}

export async function adminChangeRole(userId: string, role: string) {
  const res = await request<{ user: User }>(`/api/users/${encodeURIComponent(userId)}/role`, {
    method: 'POST',
    body: { role },
  });
  return res.success
    ? { success: true as const, user: res.data?.user }
    : { success: false as const, error: res.message };
}

export async function adminSuspendUser(userId: string, suspended: boolean) {
  const res = await request(`/api/users/${encodeURIComponent(userId)}/suspend`, {
    method: 'POST',
    body: { suspended },
  });
  return res.success ? { success: true as const } : { success: false as const, error: res.message };
}

export async function adminDeleteUser(userId: string) {
  const res = await request(`/api/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
  return res.success ? { success: true as const } : { success: false as const, error: res.message };
}
