# Yudao 二开变更记录

更新时间：2026-06-21

## 1. 记录原则

业务功能优先放入 `yudao-module-xunjing`。只有确实需要改 Yudao 原生模块时，才在本文件登记。

需要登记的原生模块包括：

```text
yudao-server
yudao-module-system
yudao-module-infra
yudao-module-member
yudao-module-ai
yudao-ui-admin-vue3
```

## 2. 变更模板

```text
日期：
提交：
模块：
文件：
变更原因：
变更内容：
是否影响原生功能：
是否可独立迁移：
回滚方案：
验证命令：
验证结果：
负责人：
```

## 3. 当前记录

### 2026-06-21 独立星河寻境业务模块接入

日期：2026-06-21
提交：未提交
模块：`yudao-module-xunjing`、`yudao-server`
文件：

```text
backend/yudao/pom.xml
backend/yudao/yudao-server/pom.xml
backend/yudao/yudao-module-xunjing/**
backend/yudao/sql/mysql/xunjing-module.sql
```

变更原因：星河寻境是独立项目，需要在独立 Yudao 副本内承载项目、学校、资源包、知识库、图片库、地图、地球仪、资料导入审核、访问数据、AI 评测/配额/成本和公益报告，不共用 XingheAI2026V2 运行后台。

变更内容：

- 新增 `yudao-module-xunjing` Maven 模块。
- 新增项目、学校、资源包、知识文档、媒体素材、素材调用日志、地图点位、地球仪模型、访问事件、二维码、公益报告、采集来源、资料导入待审核项、AI 评测集、AI 评测问题、AI 配额规则、AI 调用成本日志 17 类 P0 数据对象。
- 新增 Admin API：`/admin-api/xunjing/console/**`。
- Admin API 已补资源包、知识文档、素材、二维码、资料导入项的分页查询，以及资源包更新、知识审核、素材审核、二维码启停、资料导入批量审核、采集来源运行、AI 评测集运行。
- 新增 App API：`/app-api/xunjing/resource/package`、`/app-api/xunjing/resource/events`、`/app-api/xunjing/scan/resolve`、`/app-api/xunjing/ai/chat`、`/app-api/xunjing/reading/ask`、`/app-api/xunjing/map/explain`、`/app-api/xunjing/globe/explain`。
- 媒体素材新增 `can_public`、`can_ai_use`、`can_promotion_use` 三个使用开关，用于区分 App 公开展示、AI 生成和对外宣传物料授权。
- App 公开资源包接口只返回已发布资源包、已审核且已向量化知识、已审核且已授权且 `can_public=true` 的媒体、已发布地图点和地球仪模型。
- App 问答/讲解 facade 只使用已审核且已索引知识作为 sources，并记录 ASK 事件与 AI 调用成本日志。
- App 问答已接入 `yudao-module-ai` 的 `AiModelService` 默认 Chat 模型生成最终回答，模型不可用或异常时降级为确定性讲解文本。
- App 问答已接入 `ai_quota_rule.cache_enabled` 控制的同日缓存：同资源包、同二维码、同用户 trace、同场景、同问题命中后不再调用模型，但仍写入 `cacheHit=true` 的 AI 调用日志。
- App 公开事件回传从管理端内部 `packageId` 请求改为 App 专用请求，支持前端传 `packageCode` 或二维码 `sceneCode`，后台自动校验公开资源包、解析二维码、写入归因后的 `packageId`、`schoolId`，并把 `sceneCode`、`qrCodeId` 和原始客户端 payload 放入 `payloadJson`；`eventType=SCAN` 时同步增加二维码扫码数。
- 采集来源运行可承接外部爬虫或图影中华图片库采集结果，先生成 `xunjing_import_item` 待审核项；`targetType=MEDIA` 的导入项审核通过后发布为 `xunjing_media_asset`。
- AI 评测集运行复用 App 问答链路，逐题返回 `safetyStatus`、`sourceCount`、`logId` 和失败原因；要求来源但无 sources 时返回 `SOURCE_REQUIRED_BUT_EMPTY`，未知/实时答案用例未明确拒答时返回 `UNKNOWN_ANSWER_POLICY_NOT_MET`。
- Admin 运营 API 补齐地图点、地球仪模型、采集来源、素材调用、AI 评测集、AI 评测题、AI 配额和 AI 调用日志的分页查询，并在 Vue3 Admin API client 暴露对应调用。
- AI 调用日志新增 `projectId`、`schoolId`、`qrCodeId` 维度；App 问答配额从项目级扩展为 `PROJECT`、`SCHOOL`、`PACKAGE`、`QRCODE`、`USER` 五类作用域，并支持日次数和月预算拦截。
- 喀什 P0 种子脚本写入五类默认配额、5 条固定评测题、二维码、知识、素材和报告样例，并由 SQL 契约测试锁住关键字段。
- P0 就绪度新增 AI 评测用例数、配额规则数、AI 调用数、素材调用数和待审核导入项统计。
- `yudao-server` 引入 `yudao-module-xunjing`。
- 新增 MySQL 生产迁移脚本 `backend/yudao/sql/mysql/xunjing-module.sql`。

是否影响原生功能：不修改 Yudao 原生 system/infra/ai 业务逻辑，只在 `yudao-server` 增加模块依赖。

是否可独立迁移：是。

回滚方案：

- 从 `backend/yudao/pom.xml` 移除 `yudao-module-xunjing`。
- 从 `backend/yudao/yudao-server/pom.xml` 移除 `yudao-module-xunjing` 依赖。
- 删除 `backend/yudao/yudao-module-xunjing`。
- 数据库回滚使用上线前备份，或删除 `xunjing_*` 表和 `system_menu` 中 `880000` 段菜单。

验证命令：

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing -am -Dtest=XunjingConsoleServiceImplTest,XunjingAppServiceImplTest -Dsurefire.failIfNoSpecifiedTests=false test
mvn -pl yudao-server -am -DskipTests compile
npm run test:run -- scripts/xunjing-yudao-sql-contract.test.mjs
```

验证结果：

- `XunjingConsoleServiceImplTest` 与 `XunjingAppServiceImplTest` 通过，19 tests, 0 failures, 0 errors, 0 skipped。
- `yudao-server` reactor compile 通过，23 个 reactor 项全部 SUCCESS。
- 星河寻境 SQL 契约测试通过，2 tests passed。

负责人：Codex

### 2026-06-21 星河寻境 Admin Vue 工作台接入

日期：2026-06-21
提交：未提交
模块：`yudao-ui-admin-vue3`
文件：

```text
backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xunjing/console/index.ts
backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xunjing/console/index.vue
scripts/xunjing-admin-ui-contract.test.mjs
```

变更原因：Admin API 和菜单已落地，但 Yudao Admin 还缺真实运营页面，无法让运营人员完成一期后台核心动作。

变更内容：

- 新增 `xunjing/console/index` 管理端页面，对应 `system_menu.component`。
- 新增星河寻境 console API client，统一封装 `/xunjing/console/**` 管理端接口，并暴露 `runCrawlerSourceImport` 采集运行和 `runAiEvalSet` 评测运行调用。
- 管理端页面覆盖资源包编辑、知识文档审核、图影中华素材审核、素材公开/AI/宣传使用开关、二维码启停、资料导入批量审核、P0 就绪度、数据看板和公益报告生成。
- 新增前端静态契约测试，锁住 API client、菜单路由组件、核心运营区和权限点。

是否影响原生功能：不修改 Yudao 原生页面和组件，只新增 `xunjing` 业务目录。

是否可独立迁移：是。

回滚方案：

- 删除 `src/api/xunjing/console/index.ts`。
- 删除 `src/views/xunjing/console/index.vue`。
- 删除 `scripts/xunjing-admin-ui-contract.test.mjs`。
- 如需隐藏菜单，删除 `xunjing-module.sql` 中 `880000` 段菜单或在数据库中停用该菜单。

验证命令：

```bash
npm run test:run -- scripts/xunjing-admin-ui-contract.test.mjs
cd backend/yudao/yudao-ui/yudao-ui-admin-vue3
corepack pnpm install --frozen-lockfile
NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/vue-tsc --noEmit --pretty false 2>&1 | rg "(src/api/xunjing|src/views/xunjing)" || true
```

验证结果：

- 星河寻境 Admin UI 契约测试通过，2 tests passed。
- 按项目 tsconfig 过滤 `src/api/xunjing` 与 `src/views/xunjing` 后无新增文件类型错误。
- 完整 `vue-tsc` 仍因 Yudao 原工程既有 BPM、Mall、Pay、System 等类型债务失败，本次未处理无关模块。

负责人：Codex

### 2026-06-21 星河寻境业务平台部署门禁脚本

日期：2026-06-21
提交：未提交
模块：部署验收 / 后台上线门禁
文件：

```text
scripts/verify-xunjing-platform-readiness.mjs
scripts/verify-xunjing-platform-readiness.test.mjs
package.json
docs/02_开发规划/星河寻境业务平台部署说明.md
docs/superpowers/plans/2026-06-21-xinghexunjing-yudao-backend.md
```

变更原因：业务平台部署说明已有人工检查清单，但缺少可执行门禁，容易在预发/上线时漏掉独立 Yudao 文件、SQL seed、Admin client、环境隔离或公开 App API 联调。

变更内容：

- 新增 `verify-xunjing-platform-readiness.mjs`，检查 Yudao 后台资产、Yudao AI 管理 SQL、`xunjing-module.sql`、喀什 P0 seed、Admin API client 和 Admin 页面契约。
- 支持 `--static` 只跑仓库静态门禁，适合本地和 CI。
- 支持 `--env-file` 检查 staging/production 环境变量完整性，并阻断复用 XingheAI2026V2、Hermes、XOS 等上游运行资源。
- 支持 `--base-url` 和 `--tenant-id` 检查 `/admin/`、`/app-api/xunjing/resource/package`、`/app-api/xunjing/public-report/summary`，贴合 Yudao 多租户请求头要求。
- 支持 `--include-write-check` 显式检查 `/app-api/xunjing/resource/events`，该检查会新增访问事件，只用于 staging 或灰度环境。
- 支持 `--skip-admin-check` 用于本地只启动 `yudao-server.jar` 的后台 API smoke；预发和生产仍默认检查 `/admin/`。
- 支持 `--include-ai-check` 在预发环境显式调用一次 `/app-api/xunjing/ai/chat`，验证 answer、sources、safetyStatus。
- 新增 npm 命令 `xunjing:platform:verify` 和 `xunjing:platform:verify:static`。
- 部署文档补充静态门禁、环境隔离门禁和 live 联调门禁命令。

是否影响原生功能：不修改 Yudao 原生代码，只新增外部验收脚本和文档。

是否可独立迁移：是。

回滚方案：

- 删除 `scripts/verify-xunjing-platform-readiness.mjs`。
- 删除 `scripts/verify-xunjing-platform-readiness.test.mjs`。
- 从 `package.json` 删除 `xunjing:platform:verify` 和 `xunjing:platform:verify:static`。
- 从业务平台部署说明删除“可执行部署门禁”小节。

验证命令：

```bash
npm run test:run -- scripts/verify-xunjing-platform-readiness.test.mjs
npm run xunjing:platform:verify:static
```

验证结果：

- 星河寻境业务平台部署门禁测试通过，4 tests passed。
- 静态门禁通过，检查项包含 `static-files`、`sql-schema`、`seed-data`、`admin-ui-contract`。

负责人：Codex

### 2026-06-21 星河寻境本地依赖栈

日期：2026-06-21
提交：未提交
模块：部署联调 / 本地依赖
文件：

```text
ops/xunjing-platform.compose.yml
ops/xunjing-platform.env.example
ops/mysql-init/xunjing-init.sh
scripts/xunjing-platform-compose.test.mjs
package.json
.gitignore
docs/02_开发规划/星河寻境业务平台部署说明.md
docs/superpowers/plans/2026-06-21-xinghexunjing-yudao-backend.md
```

变更原因：后台已有代码和 SQL，但缺少星河寻境独立 MySQL、Redis、Qdrant、MinIO 的标准启动入口，容易误连 XingheAI2026V2 或只停在内存测试。

变更内容：

- 新增 `ops/xunjing-platform.compose.yml`，定义 `xunjing-mysql`、`xunjing-redis`、`xunjing-qdrant`、`xunjing-minio` 和 `xunjing-minio-init`。
- MySQL 独立库默认 `yudao_xinghe_xunjing`，首次创建 volume 时通过 `ops/mysql-init/xunjing-init.sh` 顺序导入 `ruoyi-vue-pro.sql`、`yudao-ai-module.sql`、`xunjing-module.sql`、`xunjing-seed-kashgar-p0.sql`。
- 初始化脚本对 Yudao 基础 SQL 使用 `mysql --force` 容忍上游快照非依赖序错误，再强制校验 `ai_api_key`、`ai_model`、`ai_knowledge`、`xunjing_%` 表和 `xunjing_resource_package.package_code='KASHGAR-MAP-001'`。
- Redis、Qdrant、MinIO 使用独立容器和独立 volume，MinIO 初始化独立 bucket `xinghe-xunjing`。
- Redis 显式启用本项目本地密码 `xunjing_local_redis_password`，避免应用侧 Redisson 认证配置和容器实际状态不一致。
- 新增 `ops/xunjing-platform.env.example`，只放本地示例值，不放真实生产密钥。
- `.gitignore` 忽略 `ops/*.env`，保留 `ops/*.env.example`。
- 新增 `xunjing:platform:deps:config`、`xunjing:platform:deps:up`、`xunjing:platform:deps:down` npm 命令。
- 部署说明补充本地依赖栈启动、端口冲突处理和重建空库方式。

是否影响原生功能：不修改 Yudao 原生代码；只新增本项目独立依赖运行入口。

是否可独立迁移：是。

回滚方案：

- 删除 `ops/xunjing-platform.compose.yml`。
- 删除 `ops/xunjing-platform.env.example`。
- 删除 `ops/mysql-init/xunjing-init.sh`。
- 删除 `scripts/xunjing-platform-compose.test.mjs`。
- 从 `package.json` 删除 `xunjing:platform:deps:*` 命令。
- 从 `.gitignore` 删除 `ops/*.env` 和 `!ops/*.env.example`。

验证命令：

```bash
npm run test:run -- scripts/xunjing-platform-compose.test.mjs
docker compose -f ops/xunjing-platform.compose.yml --env-file ops/xunjing-platform.env.example config
```

验证结果：

- 星河寻境依赖栈契约测试通过，4 tests passed。
- Docker Compose 配置展开成功。
- 2026-06-21 本机真实启动通过：`xunjing-mysql`、`xunjing-redis`、`xunjing-qdrant`、`xunjing-minio` 可启动；MySQL 初始化生成 `17` 张 `xunjing_%` 表，`KASHGAR-MAP-001` seed 和 `5` 条 AI 评测题存在。

负责人：Codex

### 2026-06-21 Yudao 运行配置独立化

日期：2026-06-21
提交：未提交
模块：Yudao Server 配置 / 环境变量
文件：

```text
backend/yudao/yudao-server/src/main/resources/application.yaml
backend/yudao/yudao-server/src/main/resources/application-local.yaml
backend/yudao/yudao-server/src/main/resources/application-dev.yaml
.env.example
.env.local.example
ops/xunjing-platform.env.example
docs/02_开发规划/环境变量清单.md
docs/02_开发规划/星河寻境业务平台部署说明.md
scripts/xunjing-yudao-config-contract.test.mjs
scripts/verify-xunjing-platform-readiness.mjs
scripts/verify-xunjing-platform-readiness.test.mjs
```

变更原因：复制来的 Yudao local/dev profile 默认连接 `ruoyi-vue-pro` 和外部 Redis，不符合星河寻境独立项目要求，容易运行时串库。

变更内容：

- `application-local.yaml`、`application-dev.yaml` 的 master/slave datasource 改为 `${MYSQL_HOST}`、`${MYSQL_PORT}`、`${MYSQL_DATABASE}`、`${MYSQL_USERNAME}`、`${MYSQL_PASSWORD}` 驱动。
- 本地默认数据库改为 `yudao_xinghe_xunjing`，默认端口跟 compose 依赖栈一致：MySQL `33306`、Redis `36379`。
- 本地/dev Redis 配置改为显式 `REDIS_PASSWORD`，和 compose 依赖栈保持一致。
- 本地/dev 增加 `YUDAO_API_ENCRYPT_REQUEST_KEY`、`YUDAO_API_ENCRYPT_RESPONSE_KEY` 默认环境变量占位，避免 Yudao API 加密配置空值启动失败。
- dev profile 移除外部 Redis `400-infra.server.iocoder.cn`，改为本地或环境变量注入。
- `application.yaml` 的 Qdrant collection、host、gRPC port 改为 `QDRANT_TEXT_COLLECTION`、`QDRANT_HOST`、`QDRANT_GRPC_PORT`。
- `application.yaml` 默认关闭 Spring AI Chat/Embedding/Image/Moderation/Audio/Video/Rerank 和 DashScope 自动客户端；有真实 key 后再显式启用，避免无 key 本地启动失败。
- `.env.example`、`.env.local.example`、`ops/xunjing-platform.env.example`、环境变量清单和部署说明同步新增 Qdrant host/gRPC、Redis password、Yudao API 加密 key、Spring AI 自动配置开关和 `XUNJING_TENANT_ID`。
- 部署门禁把 `XUNJING_TENANT_ID`、`QDRANT_HOST`、`QDRANT_GRPC_PORT`、`REDIS_PASSWORD` 纳入必填检查。
- 新增配置契约测试，防止 active datasource 回退到 `ruoyi-vue-pro` 或外部 Redis。

是否影响原生功能：只改运行配置默认值和环境变量注入，不修改 Yudao 业务代码。

是否可独立迁移：是。

回滚方案：

- 回退上述三个 `application*.yaml` 的 datasource/Redis/Qdrant 配置。
- 删除 `scripts/xunjing-yudao-config-contract.test.mjs`。
- 从环境变量文档和示例中删除新增 Qdrant host/gRPC 字段。

验证命令：

```bash
npm run test:run -- scripts/xunjing-yudao-config-contract.test.mjs
ruby -e 'require "yaml"; %w[application.yaml application-local.yaml application-dev.yaml].each { |f| YAML.load_stream(File.read("backend/yudao/yudao-server/src/main/resources/#{f}")); puts "#{f} ok" }'
```

验证结果：

- 星河寻境 Yudao 配置契约测试通过，4 tests passed。
- `application.yaml`、`application-local.yaml`、`application-dev.yaml` 均可被 YAML parser 正常解析。

负责人：Codex

### 2026-06-21 Yudao Server 本地运行闭环

日期：2026-06-21
提交：未提交
模块：`yudao-server`
文件：

```text
backend/yudao/yudao-server/pom.xml
backend/yudao/yudao-server/src/main/resources/application.yaml
backend/yudao/yudao-server/src/main/resources/application-local.yaml
backend/yudao/yudao-server/src/main/resources/application-dev.yaml
docs/02_开发规划/星河寻境业务平台部署说明.md
docs/superpowers/plans/2026-06-21-xinghexunjing-yudao-backend.md
```

变更原因：复制来的 Yudao Server 默认运行时会加载非 P0 模块和需要真实 key 的 Spring AI 自动客户端，本地独立依赖栈启动时会出现 API 加密 key 空值、Redisson 认证不一致、AIVideo 无关 bean 和 DashScope/OpenAI 无 key 自动配置失败。

变更内容：

- `yudao-server` 运行依赖保留 system、infra、ai、xunjing，移除 P0 不需要的 `yudao-module-aivideo` 运行依赖；根 `backend/yudao/pom.xml` 仍保留模块源码，后续可单独启用。
- local/dev profile 与 compose 依赖栈对齐，默认连接独立 MySQL `33306`、Redis `36379`、Qdrant `36334`、MinIO `39000`。
- Spring AI 和 DashScope/OpenAI 自动客户端默认关闭；真实模型联调时通过环境变量和 Yudao AI 管理显式启用。
- App API live 验证明确要求 `tenant-id` 请求头，喀什 P0 本地 seed 使用 `tenant_id=1`。

是否影响原生功能：收窄 `yudao-server` 本项目运行依赖和默认配置，不删除源码模块；对星河寻境 P0 是必要启动条件。

是否可独立迁移：是。

回滚方案：

- 如需启用 AIVideo，在确认相关表、adapter 和配置齐全后恢复 `yudao-server/pom.xml` 中 `yudao-module-aivideo` 依赖。
- 如需启用真实 AI provider，在环境变量中设置对应 key，并把相关 `SPRING_AI_MODEL_*`、`DASHSCOPE_*_ENABLED` 显式改为目标值。

验证命令：

```bash
cd backend/yudao
mvn -pl yudao-server -am -DskipTests package
SPRING_PROFILES_ACTIVE=local ... java -jar yudao-server/target/yudao-server.jar
curl -H 'tenant-id: 1' 'http://127.0.0.1:48080/app-api/xunjing/resource/package?packageCode=KASHGAR-MAP-001'
curl -H 'tenant-id: 1' 'http://127.0.0.1:48080/app-api/xunjing/public-report/summary?packageCode=KASHGAR-MAP-001'
```

验证结果：

- `YudaoServerApplication` 可在本机 `48080` 启动并输出 `项目启动成功！`。
- 资源包接口返回 `code=0`、`packageCode=KASHGAR-MAP-001`、标题 `喀什古城研学地图`。
- 公益报告摘要接口返回 `code=0`，包含 `p0Ready`、`reviewedKnowledgeCount`、`reviewedMediaCount`、`aiGenerationCount` 等字段。

负责人：Codex

### 2026-06-21 公益报告学校维度统计口径修正

日期：2026-06-21
提交：未提交
模块：`yudao-module-xunjing`
文件：

```text
backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/console/XunjingConsoleServiceImpl.java
backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/dal/mysql/importitem/XunjingImportItemMapper.java
backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/console/XunjingConsoleServiceImplTest.java
docs/02_开发规划/星河寻境后台接口索引.md
```

变更原因：公益报告生成接口支持传入 `schoolId`，但原实现仍按整个项目统计资源包、互动、素材使用和 AI 调用，学校报告会混入其它学校数据，影响公益交付可信度。

变更内容：

- `generatePublicReport` 在 `schoolId` 有值时改为只统计该学校名下资源包及其知识、素材、地图点、地球仪、二维码、互动事件、素材使用、AI 调用和待审核导入项。
- 项目级 `getReadiness(projectId)` 和数据看板保持项目总览口径。
- AI 评测集和配额规则仍按项目级配置统计，因为它们是项目级质量与成本门禁。
- 新增学校维度公益报告单测，覆盖两个学校各有资源包和使用数据时，单校报告 `metricsJson` 只计入本校数据。

是否影响原生功能：不影响 Yudao 原生模块；只修正星河寻境公益报告统计口径。

是否可独立迁移：是。

回滚方案：

- 将 `generatePublicReport` 恢复为调用项目级 `getReadiness(projectId)`。
- 删除 `XunjingImportItemMapper.selectCountByPackageIdsAndReviewStatus` 和对应学校维度单测。

验证命令：

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing -am -Dtest=XunjingConsoleServiceImplTest#testGeneratePublicReportScopesMetricsToSchoolWhenSchoolIdProvided -Dsurefire.failIfNoSpecifiedTests=false test
mvn -pl yudao-module-xunjing -am -Dtest=XunjingConsoleServiceImplTest,XunjingAppServiceImplTest -Dsurefire.failIfNoSpecifiedTests=false test
```

验证结果：

- 新增学校维度单测先失败，修正后通过。
- `XunjingConsoleServiceImplTest` 与 `XunjingAppServiceImplTest` 共 27 个测试通过。

负责人：Codex

## 4. 禁止事项

- 不把文旅业务表塞进 `yudao-module-ai`。
- 不为短期需求直接修改 system/infra 的核心权限逻辑。
- 不把真实 API Key、Token 或 Cookie 写入配置文件。
- 不从 XingheAI2026V2 直接覆盖本项目 `backend/yudao`。
