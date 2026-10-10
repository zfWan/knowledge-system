import { test, expect } from '@playwright/test';
import { fetchJson, type HealthData } from '../helpers/api';

const SERVER_BASE = process.env.SERVER_BASE_URL || 'http://localhost:3000';

/**
 * 冒烟用例集：覆盖本轮（monorepo 初始化 + 架构骨架）真实可工作的路径。
 * - /api/healthz：唯一完整实现的后端接口（健康检查）。
 * - 前端骨架页面：/、/login、/app 的静态渲染与路由跳转。
 * - 统一响应格式与 requestId 响应头。
 */

test.describe('后端健康检查 @smoke', () => {
  test('GET /api/healthz 返回统一响应格式与 ok 状态', async () => {
    const { status, body } = await fetchJson<HealthData>(SERVER_BASE, '/api/healthz');
    expect(status).toBe(200);
    expect(body.code).toBe(0);
    expect(body.message).toBe('ok');
    expect(body.requestId).toMatch(/^req_/);
    expect(body.data).toMatchObject({
      version: '0.1.0',
      db: 'ok',
    });
    expect(typeof body.data.llmConfigured).toBe('boolean');
    expect(['ok', 'degraded']).toContain(body.data.status);
  });
});

test.describe('统一响应与拦截器 @smoke', () => {
  test('响应头 X-Request-ID 存在且与 body.requestId 一致', async () => {
    const resp = await fetch(`${SERVER_BASE}/api/healthz`);
    expect(resp.ok).toBe(true);
    const reqIdHeader = resp.headers.get('x-request-id');
    expect(reqIdHeader).toBeTruthy();
    const body = await resp.json();
    expect(body.requestId).toBe(reqIdHeader);
  });
});

test.describe('前端骨架页面 @smoke', () => {
  test('根路径自动跳转到工作台 /app', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole('heading', { level: 1, name: '个人知识库' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: '欢迎使用个人知识库' })).toBeVisible();
  });

  test('工作台展示三栏骨架与功能入口卡片', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByRole('heading', { level: 2, name: '欢迎使用个人知识库' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '分类' })).toBeVisible();
    const featureArea = page.locator('section').locator('div.grid');
    const features = ['笔记', '分类', '标签', '搜索', 'AI 问答', '回收站', '设置'];
    for (const name of features) {
      await expect(featureArea.getByText(name, { exact: true })).toBeVisible();
    }
  });

  test('登录页渲染骨架与待实现提示', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 2, name: '登录' })).toBeVisible();
    await expect(page.getByText(/POST \/api\/auth\/login/)).toBeVisible();
    const submitBtn = page.getByRole('button', { name: /登录（待实现）/ });
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();
  });

  test('导航栏可在登录页与工作台之间切换', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: '工作台' }).click();
    await expect(page).toHaveURL(/\/app$/);
    await page.getByRole('link', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('不存在路径显示 404 文案', async ({ page }) => {
    await page.goto('/not-exist-page');
    await expect(page.getByText('页面不存在')).toBeVisible();
  });
});

test.describe('前端通过 Vite proxy 访问后端 @smoke', () => {
  test('浏览器侧 fetch /api/healthz 经过 Vite proxy 可正常返回', async ({ page }) => {
    await page.goto('/app');
    const result = await page.evaluate(async () => {
      const resp = await fetch('/api/healthz');
      return { status: resp.status, json: await resp.json() };
    });
    expect(result.status).toBe(200);
    expect(result.json.code).toBe(0);
    expect(result.json.data.version).toBe('0.1.0');
    expect(result.json.data.db).toBe('ok');
  });
});
