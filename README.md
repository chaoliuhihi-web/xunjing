# 星河寻境

- 更新时间：2026-09-01
- 当前主分支：`main`
- 当前产品主线：完整 C 端“寻境”
- 代码远端：GitHub `github`、Gitee `origin`

星河寻境是一款贯穿行前、行中和行后的 C 端旅行产品：把攻略变成可预演的旅程，在不打扰旅行的情况下留下真实线索，再把照片、可选足迹和共同素材变成故事、电影和一本可印刷的旅行书。

当前实施只做 C 端及支撑其真实交付的运营后台。合作方、加盟、渠道分润和结算暂不进入当前范围。

## 人和 AI 的统一入口

1. [`docs/README.md`](docs/README.md)：文档总导航和权威关系。
2. [`AGENTS.md`](AGENTS.md)：目录、安全、接口、验证和双远端硬规则。
3. [`寻境 C 端产品功能文档 v1.5`](docs/01_产品规划/寻境C端产品功能文档_v1.5.md)：产品功能与用户体验。
4. [`寻境 C 端重点体验设计细化 v1.0`](docs/01_产品规划/寻境C端重点体验设计细化_v1.0.md)：完整旅程回放、路线证据、自动成书地图与整本节奏。
5. [`寻境 C 端完整产品技术实施蓝图 v1.0`](docs/02_开发规划/寻境C端完整产品技术实施蓝图_v1.0.md)：目标架构与代码落点。
6. [`寻境 Codex Harness 成书生产架构与 Skill 运维规范 v1.0`](docs/02_开发规划/寻境CodexHarness成书生产架构与Skill运维规范_v1.0.md)：服务器 Harness、`travel-memory-book` 安装、版本、安全、灰度和回滚。
7. [`寻境 C 端完整产品 AI 实施任务书 v1.0`](docs/04_AI交接任务书/寻境C端完整产品AI实施任务书_v1.0.md)：任务 ID、依赖和完成定义。
8. [`寻境 C 端 P0 验收门禁 v1.0`](docs/05_验收与证据/寻境C端P0验收门禁_v1.0.md)：测试、运行、履约和业务证据。

遇到旧 PRD、旧分支说明或历史任务书与上述文档冲突时，以 `docs/README.md` 中的权威顺序为准。

## 当前产品结构

```text
入口 A：规划一次新旅行
  -> 攻略导入 -> 路线核对 -> 动态预演 -> 同行查看

入口 B：旅行结束了，做成作品
  -> 一次选择照片 -> 实际旅程重建

共同进入
  -> 完整旅程回放 / 旅行故事 / 足迹卡 / 回忆电影
  -> 完整旅行书首版 -> 整本节奏 -> 真实翻页 -> 少量修改
  -> 一次付款 -> 印刷 / 物流 / 售后
  -> 作品库与个人旅行档案
```

行中仅提供今日行程、第三方导航调起、“记下这里”和可选共同素材；完整轨迹不作为 P0 成书前提。

## 目录地图

```text
src/                                        # 星河寻境官网
public/                                     # 官网公开静态资源
assets/references/APP/kashgar-mini-program/ # UniApp/H5/小程序正式迁移与复用基座
backend/yudao/                              # 独立 Yudao 后台与 yudao-module-xunjing
services/memory-book-worker/                # Codex Harness + travel-memory-book Skill + 渲染/QA
ops/                                        # Compose、Nginx、环境变量样例和部署配置
scripts/                                    # 测试、发布和 readiness 门禁
docs/                                       # 产品、技术、任务和验收文档
qa/                                         # 可复查测试与运行证据
qa/app-kashgar/                             # 喀什 APP 视觉验证证据专用目录
deliverables/                               # 最终可外发 PPT、PDF、视频、GIF
workbench/、tmp/、archive/                  # 本地中间产物和归档，默认不提交
```

仓库根目录只保留入口、配置和正式源码目录。截图、日志、临时 Markdown、构建包和生成中间产物不得散落在根目录。

## 快速验证

文档与目录：

```bash
node scripts/verify-xunjing-c-docs.mjs
npm run test:run -- scripts/project-structure-contract.test.mjs
```

根官网：

```bash
npm install
npm run test:run
npm run build
```

旅行书链路：

```bash
npm run xunjing:memory-book:contract
python3 -m pytest services/memory-book-worker/tests -q
cd assets/references/APP/kashgar-mini-program
node tests/memory-book-standalone-app.test.mjs
npm run build:memory-book:h5
```

完整门禁和证据要求见 [`docs/05_验收与证据/寻境C端P0验收门禁_v1.0.md`](docs/05_验收与证据/寻境C端P0验收门禁_v1.0.md)。

## Git 协作

- 默认先从 GitHub 获取最新 `main`，不得重置用户未提交改动。
- 功能分支使用 `codex/<task-id>-<slug>`，一次只领取一个不重叠任务。
- 正式提交只暂存本任务文件；当前工作树很脏时优先使用 clean worktree。
- 正式推送必须让同一提交同时到达 GitHub `github` 和 Gitee `origin`。
- 没有真实上传、持久化、生成、付款、印刷或签收证据时必须标记 `NOT_READY` 或 `BLOCKED_ENV`。
