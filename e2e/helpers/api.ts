/**
 * API 助手：统一封装对后端 REST 接口的请求。
 * 本轮（架构初始化骨架阶段）仅用于 health 冒烟。
 */

export interface ApiResp<T> {
  code: number;
  message: string;
  data: T;
  requestId: string;
}

export interface HealthData {
  status: 'ok' | 'degraded';
  db: 'ok' | 'fail';
  llmConfigured: boolean;
  version: string;
}

export async function fetchJson<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: ApiResp<T> }> {
  const resp = await fetch(`${baseUrl}${path}`, init);
  const text = await resp.text();
  let body: ApiResp<T>;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(
      `接口 ${path} 返回非 JSON（状态 ${resp.status}）：${text.slice(0, 200)}`,
    );
  }
  return { status: resp.status, body };
}
