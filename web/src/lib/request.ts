// 统一 API 请求封装：自动注入 access token、401 时单飞 refresh 并重放原请求。
import { getAccessToken, refreshTokenOnce, clearTokens, safeReturnTo } from './auth';

const BASE_URL = '/api';

export interface ApiResp<T> {
  code: number;
  message: string;
  data: T;
  requestId: string;
}

export async function request<T = any>(path: string, init: RequestInit = {}): Promise<ApiResp<T>> {
  return doRequest<T>(path, init, false);
}

async function doRequest<T>(path: string, init: RequestInit, retried: boolean): Promise<ApiResp<T>> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let resp = await fetch(BASE_URL + path, { ...init, headers });

  // 401：若存在 refresh token 且尚未重试过，尝试刷新一次后重放
  if (resp.status === 401 && !retried) {
    const newAccess = await refreshTokenOnce();
    if (newAccess) {
      const retryHeaders = new Headers(init.headers);
      if (!retryHeaders.has('Content-Type') && init.body) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      retryHeaders.set('Authorization', `Bearer ${newAccess}`);
      return doRequest<T>(path, { ...init, headers: retryHeaders }, true);
    } else {
      // refresh 失败：清登录态并跳登录页
      clearTokens();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        const returnTo = safeReturnTo(window.location.pathname + window.location.search);
        window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
      }
    }
  }

  if (resp.status === 204) {
    return { code: 0, message: 'ok', data: null as unknown as T, requestId: resp.headers.get('x-request-id') || '' };
  }

  const text = await resp.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    return {
      code: resp.ok ? 0 : resp.status,
      message: text || resp.statusText,
      data: null as unknown as T,
      requestId: resp.headers.get('x-request-id') || '',
    };
  }
  if (data && typeof data === 'object' && 'code' in data) return data as ApiResp<T>;
  return {
    code: resp.status,
    message: (data && data.message) || resp.statusText || '请求失败',
    data: null as unknown as T,
    requestId: resp.headers.get('x-request-id') || '',
  };
}
