# 星河寻境 AI 协作规范

本仓库是星河寻境综合工作区，包含官网、UniApp APP、小程序迁移源、Yudao 后台、部署脚本、文档和交付物。所有 AI 和工程师必须优先保持目录结构清晰，不得为了临时验证把文件散落到仓库根目录。

## 代码同步

- 默认从 Gitee `origin` 同步最新代码后再开发；本项目只推送到 Gitee，不再要求 GitHub。
- 如果当前仓库只配置了单一 Gitee remote，视为符合本项目规则；除非用户明确要求，不要新增 GitHub remote。
- 不得移动或重置用户未提交改动；遇到脏工作树先审计再动手。

## 目录边界

- `src/`、`public/`：官网前端源码和公开静态资源。
- `assets/references/APP/kashgar-mini-program/`：UniApp/小程序前端迁移与 APP 上线代码，尽最大可能复用原小程序代码和逻辑。
- `backend/yudao/`：星河寻境独立 Yudao 后台，承接 P0 图书/地图/地球仪扫码、知识库、素材库、AI 问答、数据看板和公益报告等平台能力。
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
- 禁止在未补齐 API 契约、`tenant-id`、权限、种子数据和验收门禁前，粗暴替换原小程序线上 `api2/*` 链路。
- 禁止把 APP 名称、全局标题、包名或描述恢复成 `xinxiake`、`uni-app` 等脚手架/旧项目默认值。
- 禁止给 APP 增加读取日志、读取账号、读取设备号、写系统设置、修改网络或 Wi-Fi、挂载文件系统等高风险 Android 权限，确需新增权限必须先写明业务理由并补测试。
- 禁止为了目录变干净而删除、重置或覆盖用户未提交文件。

## 接口原则

- 原小程序线上 `https://kashi.weiapp.net/api2/*` 可以作为迁移参考和短期联调兜底，不作为星河寻境 P0 后台长期主体。
- 图书扫码、地图扫码、地球仪讲解、RAG 问答、资源包、公益报告、素材调用和 AI 评测等 P0 新能力必须通过 `/app-api/xunjing/**` 走独立 Yudao APP API。
- `/app-api/xunjing/**` 调用必须带 `tenant-id`，并保留公网网关可验证门禁。

## 验证要求

- 改前端 APP：在 `assets/references/APP/kashgar-mini-program/` 运行相关 `tests/*.test.mjs` 和 `npm run build`。
- 改根项目：运行 `npm run test:run`。
- 改 Yudao/部署门禁：运行相关 `scripts/*.test.mjs` 和 `npm run xunjing:platform:verify:static`。
- 改目录结构：运行 `npm run test:run -- scripts/project-structure-contract.test.mjs`。
