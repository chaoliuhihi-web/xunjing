# 星河寻境 AI 协作规范

本仓库是星河寻境综合工作区，包含官网、UniApp APP、小程序迁移源、Yudao 后台、部署脚本、文档和交付物。所有 AI 和工程师必须优先保持目录结构清晰，不得为了临时验证把文件散落到仓库根目录。

## 代码同步

- 默认从远端同步最新代码后再开发；推送代码时必须同步推送到 GitHub 和 Gitee。
- 如果当前仓库只配置了单一 remote，先说明事实，不要假设另一个 remote 已存在。
- 不得移动或重置用户未提交改动；遇到脏工作树先审计再动手。

## 目录边界

- `src/`、`public/`：官网前端源码和公开静态资源。
- `assets/references/APP/kashgar-mini-program/`：UniApp/小程序前端迁移与 APP 上线代码，尽最大可能复用原小程序代码和逻辑。
- `backend/yudao/`：星河寻境 Yudao 后台，只承接原线上小程序接口无法覆盖的能力。
- `docs/`：项目总览、产品规划、开发规划、交接任务书和部署说明。
- `ops/`：部署、Nginx、Compose、环境变量样例。
- `scripts/`：测试、发布、平台 readiness 和运维门禁。
- `qa/`：可复查的 QA 证据；喀什 APP 视觉验证证据只能放在 `qa/app-kashgar/`。
- `deliverables/`：最终可外发的 PPT、PDF、视频、GIF。
- `workbench/`、`tmp/`、`.playwright-mcp/`、`archive/`：本地生成、中间产物、调试日志和归档噪声，默认不提交。
- 临时构建、发布包、浏览器调试日志只能放在 `tmp/`、`workbench/` 或 `.playwright-mcp/`。

## 禁止事项

- 禁止在仓库根目录写入截图、控制台快照、临时 Markdown、PPT 中间产物或发布包。
- 禁止把 `dist/`、`tmp/`、`workbench/`、`.playwright-mcp/`、`node_modules/` 作为源码提交。
- 禁止在前端客户端保存 Coze、Qwen、Yudao 或其他第三方真实密钥。
- 禁止用 Yudao 接口替换已有可用的原小程序线上接口，例如注册、登录、用户资料、首页、地图、剧场、收藏、点赞和分享等 `api2/*` 链路。
- 禁止为了目录变干净而删除、重置或覆盖用户未提交文件。

## 接口原则

- 小程序注册、登录、用户资料和已有内容接口优先使用线上 `https://kashi.weiapp.net/api2/*`。
- 原线上接口不能覆盖的新增能力，再使用 `/app-api/xunjing/**` 走 Yudao APP API。
- `/app-api/xunjing/**` 调用必须带 `tenant-id`，并保留公网网关可验证门禁。

## 验证要求

- 改前端 APP：在 `assets/references/APP/kashgar-mini-program/` 运行相关 `tests/*.test.mjs` 和 `npm run build`。
- 改根项目：运行 `npm run test:run`。
- 改 Yudao/部署门禁：运行相关 `scripts/*.test.mjs` 和 `npm run xunjing:platform:verify:static`。
- 改目录结构：运行 `npm run test:run -- scripts/project-structure-contract.test.mjs`。
