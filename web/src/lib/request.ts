// 统一 API 请求封装骨架：自动注入 token、统一响应解包、错误码处理。
// 具体拦截器逻辑在后续编码节点补齐。
const BASE_URL = '/api';

export interface ApiResp<T> {
  code: number;
  message: string;
  data: T;
  requestId: string;
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResp<T>> {
  const token = localStorage.getItem('access_token');
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const resp = await fetch(BASE_URL + path, { ...init, headers });
  return resp.json();
}
