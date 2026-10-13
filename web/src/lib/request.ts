import type { ApiResp, TokenPair } from '@/types';
import { useAuthStore } from '@/stores/auth';

const BASE_URL = '/api';

// 内存中缓存正在刷新的 Promise，实现 single-flight
let refreshPromise: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  const { refreshToken, setTokens, clearTokens } = useAuthStore.getState();
  if (!refreshToken) {
    clearTokens();
    throw new Error('NO_REFRESH');
  }
  const resp = await fetch(BASE_URL + '/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const json = (await resp.json()) as ApiResp<TokenPair>;
  if (!resp.ok || json.code !== 0 || !json.data) {
    clearTokens();
    throw new Error('REFRESH_FAIL');
  }
  setTokens(json.data.accessToken, json.data.refreshToken, json.data.user);
  return json.data.accessToken;
}

function redirectToLogin(reason: string) {
  const { clearTokens } = useAuthStore.getState();
  clearTokens();
  const redirect = encodeURIComponent(window.location.pathname + window.location.search);
  if (window.location.pathname !== '/login') {
    window.location.href = `/login?redirect=${redirect}`;
  }
}

export interface RequestOptions extends RequestInit {
  /** 是否跳过自动刷新 */
  _skipRefresh?: boolean;
}

export async function request<T = any>(
  path: string,
  init: RequestOptions = {},
): Promise<ApiResp<T>> {
  const { accessToken } = useAuthStore.getState();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  let resp = await fetch(BASE_URL + path, { ...init, headers });

  if (resp.status === 401 && !init._skipRefresh && path !== '/auth/refresh') {
    try {
      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccess = await refreshPromise;
      // 重放请求
      const headers2 = new Headers(init.headers);
      headers2.set('Content-Type', 'application/json');
      headers2.set('Authorization', `Bearer ${newAccess}`);
      resp = await fetch(BASE_URL + path, { ...init, headers: headers2 });
    } catch (e) {
      redirectToLogin((e as Error).message);
      return resp.json().catch(() => ({ code: 10201, message: '登录已过期', data: null as T, requestId: '' }));
    }
  }
  return resp.json();
}
