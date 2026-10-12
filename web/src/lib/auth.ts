// 登录态管理：access_token 存 localStorage，refresh_token 也存 localStorage（与骨架 request.ts 约定一致）。
// Spec 推荐 httpOnly Cookie，但考虑到当前 vite proxy 同源代理已配置、后端目前没设 Set-Cookie，
// 这里采用 body + localStorage 方案并在注释中标注，后续可平滑切换到 Cookie 方案。
import { request, ApiResp } from './request';

export interface AuthUser {
  id: string;
  email: string | null;
  nickname: string;
  status: string;
  avatarUrl: string | null;
  bio: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}
export function setTokens(access: string, refresh?: string | null) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}
export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}
export function setUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function getCachedUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

let refreshPromise: Promise<string | null> | null = null;
/**
 * 单飞刷新：并发 401 时只触发一次 refresh，成功后所有调用拿到新 access_token，失败则返回 null（表示需要跳登录）。
 */
export function refreshTokenOnce(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  const rt = getRefreshToken();
  if (!rt) return Promise.resolve(null);
  refreshPromise = (async () => {
    try {
      const resp = await request<{ accessToken: string; refreshToken: string; user: AuthUser }>(
        '/auth/refresh',
        { method: 'POST', body: JSON.stringify({ refreshToken: rt }) },
      );
      if (resp.code === 0 && resp.data?.accessToken) {
        setTokens(resp.data.accessToken, resp.data.refreshToken);
        setUser(resp.data.user);
        return resp.data.accessToken;
      }
      clearTokens();
      return null;
    } catch {
      clearTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function login(
  email: string,
  password: string,
): Promise<ApiResp<{ accessToken: string; refreshToken: string; user: AuthUser }>> {
  const resp = await request<{ accessToken: string; refreshToken: string; user: AuthUser }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  );
  if (resp.code === 0 && resp.data) {
    setTokens(resp.data.accessToken, resp.data.refreshToken);
    setUser(resp.data.user);
  }
  return resp;
}

export async function register(
  email: string,
  password: string,
): Promise<ApiResp<{ accessToken: string; refreshToken: string; user: AuthUser }>> {
  const resp = await request<{ accessToken: string; refreshToken: string; user: AuthUser }>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  );
  if (resp.code === 0 && resp.data) {
    setTokens(resp.data.accessToken, resp.data.refreshToken);
    setUser(resp.data.user);
  }
  return resp;
}

export async function fetchMe(): Promise<AuthUser | null> {
  const resp = await request<AuthUser>('/user/me');
  if (resp.code === 0 && resp.data) {
    setUser(resp.data);
    return resp.data;
  }
  return null;
}

export async function logout(): Promise<void> {
  const rt = getRefreshToken();
  try {
    await request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: rt || undefined }),
    });
  } catch {
    // 网络失败也忽略
  } finally {
    clearTokens();
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/** returnTo 开放重定向校验：仅允许同站相对路径 */
export function safeReturnTo(input: string | null | undefined): string {
  if (!input) return '/app';
  if (input.startsWith('/') && !input.startsWith('//') && !/^\/[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(input)) {
    return input;
  }
  return '/app';
}
