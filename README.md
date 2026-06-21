# 星河寻境

更新时间：2026-06-21

星河寻境是 AI 文旅出版与图秀中华公益行动相关的核心项目工作区。当前工作区同时承载官网、UniApp APP、小程序迁移源、Yudao 后台、部署脚本、文档、QA 证据和外发交付物。所有新增文件必须放入对应目录，不能散落在仓库根目录。

## 核心入口

- `docs/00_项目总览/项目总览.md`：项目定位和当前状态。
- `docs/00_项目总览/资料索引.md`：所有资料、素材、交付物和工程目录索引。
- `docs/02_开发规划/开发入口说明.md`：后续进入真实开发的建议入口。
- `docs/02_开发规划/部署上线说明.md`：官网构建、预览和 Nginx 静态部署说明。
- `docs/04_AI交接任务书/下一阶段开发任务书.md`：交给其他 AI 或工程师继续实现时使用。
- `AGENTS.md`：AI 和工程师协作时必须遵守的目录、接口和验证规范。
- `src/`：Vite + React 官网源码。
- `qa/`：桌面和移动端渲染 QA 截图。

## 目录地图

- `src/`、`public/`：官网前端源码与公开静态资源。
- `assets/brand/`：品牌基础素材。
- `assets/references/Web_V3/`、`assets/references/product_effects/`：官网和产品效果参考素材。
- `assets/references/APP/kashgar-mini-program/`：UniApp/小程序前端迁移源；APP 上线优先在这里复用原小程序代码和逻辑。
- `backend/yudao/`：星河寻境 Yudao 后台；只承接原线上小程序接口无法覆盖的能力。
- `docs/00_项目总览/`：项目总览和资料索引。
- `docs/01_产品规划/`：产品规划、PRD、汇报材料源文件。
- `docs/02_开发规划/`：开发规划、Yudao 架构、接口索引、部署说明和环境变量清单。
- `docs/03_汇报与PPT规划/`：汇报与 PPT 内容规划。
- `docs/04_AI交接任务书/`：交给其他 AI 或工程师继续推进的任务书。
- `ops/`：部署、Nginx、Compose、环境变量样例和平台依赖配置。
- `scripts/`：测试、发布、平台 readiness 和运维门禁脚本。
- `services/`：官网配套轻量服务。
- `qa/`：可复查 QA 证据；官网截图在 `qa/`，喀什 APP 视觉验证证据在 `qa/app-kashgar/`。
- `deliverables/`：最终可外发的 PPT、PDF、GIF、视频；默认不随源码提交。
- `workbench/`：PPT、内容生成和其他本地制作流水线；默认不随源码提交。
- `tmp/`：构建包、发布包和临时输出；默认不随源码提交。
- `archive/`：下载、Office 锁文件、系统元数据和其他归档噪声。
- `tools/`：本地工具脚本。

仓库根目录只保留入口文件、配置文件、源码目录和说明文档。截图、console 快照、临时 Markdown、PPT 中间产物、发布包不得写入根目录。

## 本地运行

当前官网使用 Node.js + npm：

```bash
npm install
npm run dev -- --port 5173
npm run test:run
npm run build
```

构建产物输出到 `dist/`，默认不提交仓库。

## 当前开发状态

当前已完成第一阶段官网工程：

- 首页、产品能力、应用场景、解决方案、试点样板、跟着游记、关于我们页面。
- 桌面端与移动端响应式导航。
- 预约演示表单前端成功态。
- Vitest 内容/交互测试。
- Playwright 桌面与移动端截图 QA。

正式推送代码时，按项目要求同步推送到 GitHub 和 Gitee。
