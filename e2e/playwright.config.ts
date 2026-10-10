import { defineConfig, devices } from '@playwright/test';

/**
 * 个人知识库 V1.0 E2E 测试配置
 *
 * - 被测对象：server (NestJS, 默认 3000) + web (Vite, 默认 5173)，
 *   前端通过 Vite dev proxy 转发 /api 到后端。
 * - 默认使用 Playwright 自带 Chromium；若执行环境希望复用系统 Chrome，
 *   可通过 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH 指定可执行文件路径。
 */

const SERVER_PORT = Number(process.env.SERVER_PORT || 3000);
const WEB_PORT = Number(process.env.WEB_PORT || 5173);
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: "off",
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath:
            process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
        },
      },
    },
  ],
  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : [
        {
          // 先在 server 目录下执行迁移（创建 data/app.db），再启动 Nest dev。
          command:
            'mkdir -p server/data && pnpm --filter server exec prisma migrate deploy && pnpm --filter server dev',
          port: SERVER_PORT,
          reuseExistingServer: !CI,
          cwd: '../',
          stdout: 'pipe',
          stderr: 'pipe',
          timeout: 180_000,
        },
        {
          command: 'pnpm --filter web dev',
          port: WEB_PORT,
          reuseExistingServer: !CI,
          cwd: '../',
          stdout: 'pipe',
          stderr: 'pipe',
          timeout: 180_000,
        },
      ],
  outputDir: 'test-results/',
});
