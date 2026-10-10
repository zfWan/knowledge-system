# API 文档

- 开发环境 Swagger UI：启动 server 后访问 <http://localhost:3000/api/docs>（非 production 默认开启）。
- 完整接口契约、错误码分段、SSE 协议、关键接口示例见 [`architecture.md §6 接口设计`](./architecture.md#6-接口设计)。
- 统一响应格式：`{ code, message, data, requestId }`；错误码分段（1xxxx 账号 / 2xxxx 笔记 / 3xxxx 分类标签 / 4xxxx 检索 / 5xxxx 问答 / 6xxxx 配额附件 / 9xxxx 系统）。
