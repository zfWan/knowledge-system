# E2E Tests (Playwright)

个人知识库 V1.0 的端到端 / UI 自动化测试，使用 [Playwright](https://playwright.dev/)。

## 目录结构

```
e2e/
├── tests/              # 用例（*.spec.ts）
│   └── smoke.spec.ts   # 架构骨架冒烟用例
├── helpers/            # API / 公共 fixture / Page Object
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## 运行方式

```bash
# 在仓库根目录执行
pnpm e2e              # 跑所有用例（自动启动 server + web）
pnpm e2e:smoke        # 仅跑冒烟用例
pnpm e2e:report       # 打开 HTML 报告
```

### 已存在服务时复用

```bash
E2E_NO_WEBSERVER=1 pnpm e2e:smoke
```

需要手动提前启动：
- `pnpm --filter server dev`（默认 3000）
- `pnpm --filter web dev`（默认 5173）

### 浏览器

- 默认使用 Playwright 自带 Chromium。
- 若环境已装系统 Chrome/Chromium，可通过环境变量复用：
  ```bash
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser pnpm e2e
  ```
- CI 环境建议 `pnpm --filter e2e exec playwright install --with-deps chromium`。

## 报告与取证

- HTML 报告：`e2e/playwright-report/index.html`
- 失败 trace / screenshot：`e2e/test-results/`
- 配置默认 `screenshot: only-on-failure`、`trace: retain-on-failure`、`video: off`。
