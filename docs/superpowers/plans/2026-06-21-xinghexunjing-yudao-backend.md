# 星河寻境 Yudao 后台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用独立 Yudao 做完图秀中华新疆首站 P0 后台闭环：一本书 / 一张地图 / 一个地球仪 -> 扫码 -> 权威讲解 -> AI 问答有来源 -> 使用数据回传 -> 公益报告样例。

**Architecture:** 生产后台以 `backend/yudao` 为星河寻境独立后台入口，从迁移源复制一份 Yudao 后单独演进，不与 XingheAI2026V2 共用源码目录、运行库、数据库、Redis、对象存储或 Qdrant collection。星河寻境业务新增在 `yudao-module-xunjing`，通过服务层挂接本项目内复制出来的 `yudao-module-ai` 模型、Key、角色和知识库能力，通过 infra file 承接文件上传，通过 Yudao 权限菜单承接运营后台。`kb-service` 与 `crawler-gateway` 的既有实现只作为迁移参考或内部 worker 来源，不另起一套长期管理后台。

**Tech Stack:** Java 17、Spring Boot、Yudao、MyBatis Plus、MySQL、Redis、Vue3 Yudao Admin、Yudao AI Module、Qdrant、Object Storage、Yudao Job。

## 2026-06-21 Implementation Checkpoint

本计划已按“附件收敛版”推进过一轮实现。后续 AI 接手时，以以下当前事实为准，不要再照搬本文后半段早期草稿里的 `xj_*` 表名、`yudao-module-xunjing-server` 嵌套结构或 `services/api` 路线。

当前已落地：

- 独立 Yudao 已复制到 `backend/yudao`，迁移源记录在 `docs/02_开发规划/Yudao迁移源记录.md`。
- 当前业务模块采用 `backend/yudao/yudao-module-xunjing` 单模块结构，并已接入 `backend/yudao/pom.xml` 与 `backend/yudao/yudao-server/pom.xml`。
- 生产脚本统一使用 `backend/yudao/sql/mysql/xunjing-module.sql`，P0 表名统一为 `xunjing_*`。
- 喀什样板种子数据在 `backend/yudao/sql/mysql/xunjing-seed-kashgar-p0.sql`。
- 当前接口契约以 `docs/02_开发规划/星河寻境后台接口索引.md` 为准。
- 当前部署和上线检查以 `docs/02_开发规划/星河寻境业务平台部署说明.md` 为准。
- 当前架构边界以 `docs/02_开发规划/星河寻境一期后台Yudao架构规划.md` 为准。
- Admin API 已补资源包、知识文档、素材、二维码、资料导入项的分页查询，以及资源包更新、知识审核、素材审核、二维码启停、资料导入批量审核。
- Admin API 已补地图点、地球仪模型、采集来源、素材调用、AI 评测集、AI 评测题、AI 配额和 AI 调用日志分页查询，Vue3 Admin API client 已同步。
- AI 评测集已补 5 类固定 seed 场景，并对 `unknown_answer` / `real_time` 风险标签执行拒答口径门禁。
- 已补 `scripts/verify-xunjing-platform-readiness.mjs` 业务平台部署门禁，可检查后台资产、SQL、P0 seed、Admin client、环境隔离和可选 live App API/AI 链路。
- 已补 `ops/xunjing-platform.compose.yml` 独立依赖栈，覆盖 MySQL、Redis、Qdrant、MinIO；MySQL 首次创建 volume 时通过 `ops/mysql-init/xunjing-init.sh` 顺序导入 Yudao 基础 SQL、星河寻境模块 SQL、喀什 P0 seed，并校验 `xunjing_resource_package.package_code='KASHGAR-MAP-001'`。
- `application-local.yaml`、`application-dev.yaml` 和基础 Qdrant 配置已改为环境变量驱动，默认指向星河寻境独立库和 compose 本地端口，不再激活默认 `ruoyi-vue-pro` 或外部 Redis。
- `yudao-server` 当前运行依赖已收窄为 system、infra、ai、xunjing；P0 不启用 `yudao-module-aivideo`，避免无关 adapter 和表结构影响星河寻境后台启动。
- Spring AI 与 DashScope/OpenAI 自动客户端默认关闭；有真实 key 后再通过环境变量和 Yudao AI 管理显式启用。
- Yudao 多租户要求小程序和 live 门禁调用 `/app-api/xunjing/**` 时带 `tenant-id` 请求头；喀什 P0 本地 seed 使用 `tenant_id=1`。

已通过的新鲜验证：

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing -am -Dtest=XunjingConsoleServiceImplTest,XunjingAppServiceImplTest -Dsurefire.failIfNoSpecifiedTests=false test
mvn -pl yudao-server -am -DskipTests package
npm run test:run -- scripts/verify-xunjing-platform-readiness.test.mjs
npm run test:run -- scripts/xunjing-platform-compose.test.mjs
npm run test:run -- scripts/xunjing-yudao-config-contract.test.mjs
npm run xunjing:platform:verify:static
docker compose -f ops/xunjing-platform.compose.yml --env-file ops/xunjing-platform.env.example config
ruby -e 'require "yaml"; %w[application.yaml application-local.yaml application-dev.yaml].each { |f| YAML.load_stream(File.read("backend/yudao/yudao-server/src/main/resources/#{f}")); puts "#{f} ok" }'
```

本地真实联调也已通过：

- 独立依赖栈启动：MySQL `33306`、Redis `36379`、Qdrant `36333/36334`、MinIO `39000/39001`。
- MySQL seed 验证：`tenant_id=1`，`17` 张 `xunjing_%` 表，`KASHGAR-MAP-001` 资源包，`5` 条 AI 评测题。
- Yudao Server 以 `SPRING_PROFILES_ACTIVE=local` 在 `48080` 启动并输出 `项目启动成功！`。
- 带 `tenant-id: 1` 请求头访问 `/app-api/xunjing/resource/package?packageCode=KASHGAR-MAP-001` 返回 `code=0` 和标题 `喀什古城研学地图`。
- 带 `tenant-id: 1` 请求头访问 `/app-api/xunjing/public-report/summary?packageCode=KASHGAR-MAP-001` 返回 `code=0` 和 P0 看板字段。

当前仍未完成，不要误判为已上线：

- 尚未部署到真实 staging 域名，也没有生产 `staging.env`/`production.env`、真实对象存储、真实 AI Key 和预发公网/内网域名结果。
- App 问答已接入 Yudao AI 知识库段落召回，并复用 `AiModelService` 默认 Chat 模型生成最终回答；模型未配置、异常或返回空内容时降级为 P0 可测编排文本。
- 资料导入目前完成“待审核项 -> 审核发布为知识文档”闭环，未做通用爬虫、定时爬虫或复杂 connector。

## Global Constraints

- 当前小程序前端由其他 AI 负责，本计划只覆盖 Yudao 后台、管理端、后台 API、App API 契约和后台验收门禁。
- 默认从 Gitee `origin` 同步最新代码；本项目只推送到 Gitee，不要求 GitHub remote。
- 正式推送只推送到 Gitee。
- 真实 API Key、Token、密码、Cookie 不写入 Markdown、源码、测试快照或 Git 提交。
- 星河寻境是独立项目，Yudao 必须复制到本仓库独立维护，不允许用 symlink、submodule 或运行时直连原 XingheAI2026V2 后台。
- 后台功能全部用 Yudao 承接，不新增长期独立管理后台。
- 不破坏 `yudao-module-ai` 原生模型、Key、角色、知识库、绘图、写作、工作流能力。
- 文旅图片库不是 `ai_image` 生图记录，必须独立建 `xj_media_asset`。
- 知识内容必须有来源、审核状态和可调用场景，正式 AI 输出必须返回 sources。
- P0 不做完整通用爬虫，只做资料导入与采集审核。
- P0 不做 AI 旅行记录、游记生成、PDF 纪念页、图片向量、视频关键帧、视频摘要和复杂图片 AI 标注。
- P0 必须有 AI 评测集、调用配额、缓存和成本统计。

---

## Backend Scope

本计划负责：

- Yudao 工程迁移与运行。
- Yudao AI 模块启用和星河寻境挂接。
- 星河寻境业务模块 `yudao-module-xunjing`。
- 项目、学校、资源包、图书、章节、地图点位、地球仪点位、二维码、基础图片库、AI 生成日志、公益报告。
- 管理端菜单、权限、列表、表单、审核、看板。
- 面向小程序的 `/app-api/xunjing/*` 接口契约。
- 知识库、基础图片库、资料导入审核、AI 编排、数据看板和公益报告的后台闭环。

本计划不负责：

- C 端小程序页面布局、视觉还原、UniApp 组件实现。
- 小程序底部导航、动效、参考图还原。
- 对外官网或营销页。

## Migration Sources

- Yudao 主工程：`/Users/bruce/Developer/work/XingheAI2026V2/vendor/xingheai-yudao`
- Yudao AI 模块：`/Users/bruce/Developer/work/XingheAI2026V2/vendor/xingheai-yudao/yudao-module-ai`
- Yudao 管理端：`/Users/bruce/Developer/work/XingheAI2026V2/vendor/xingheai-yudao/yudao-ui/yudao-ui-admin-vue3`
- 知识库参考：`/Users/bruce/Developer/work/XingheAI2026V2/xingheai/services/kb-service`
- 爬虫网关参考：`/Users/bruce/Developer/work/XingheAI2026V2/xingheai/services/crawler-gateway`
- 本地模型解析 fallback：`/Users/bruce/Developer/work/XingheAI2026V2/xingheai/services/yudao-lite`

## File Structure

```text
backend/
  yudao/
    pom.xml
    yudao-server/
    yudao-module-system/
    yudao-module-infra/
    yudao-module-member/
    yudao-module-ai/
    yudao-module-xunjing/
      pom.xml
      yudao-module-xunjing-api/
      yudao-module-xunjing-server/
        pom.xml
        src/main/java/cn/iocoder/yudao/module/xunjing/
          controller/admin/xunjing/
          controller/app/xunjing/
          convert/xunjing/
          dal/dataobject/xunjing/
          dal/mysql/xunjing/
          enums/xunjing/
          service/xunjing/
          job/xunjing/
        src/test/java/cn/iocoder/yudao/module/xunjing/
    yudao-ui/yudao-ui-admin-vue3/
      src/api/xinghe/xunjing/
      src/views/xinghe/xunjing/
    sql/mysql/
      xinghe_xunjing_schema.sql
      xinghe_xunjing_menu.sql

docs/
  02_开发规划/
    星河寻境一期后台Yudao实施规划.md
    环境变量清单.md
```

## API Prefixes

Admin API：

```text
/admin-api/xunjing/console/projects
/admin-api/xunjing/console/schools
/admin-api/xunjing/console/resource-packages
/admin-api/xunjing/console/knowledge-documents
/admin-api/xunjing/console/media-assets
/admin-api/xunjing/console/map-points
/admin-api/xunjing/console/globe-models
/admin-api/xunjing/console/crawler-sources
/admin-api/xunjing/console/import-items
/admin-api/xunjing/console/ai-eval-sets
/admin-api/xunjing/console/ai-eval-cases
/admin-api/xunjing/console/ai-quota-rules
/admin-api/xunjing/console/ai-generation-logs
/admin-api/xunjing/console/readiness
/admin-api/xunjing/console/public-reports
```

App API contract for mini-program：

```text
GET  /app-api/xunjing/resource/package?packageCode=KASHGAR-MAP-001
POST /app-api/xunjing/scan/resolve
POST /app-api/xunjing/ai/chat
POST /app-api/xunjing/reading/ask
POST /app-api/xunjing/map/explain
POST /app-api/xunjing/globe/explain
POST /app-api/xunjing/resource/events
GET  /app-api/xunjing/public-report/summary
```

`/app-api/xunjing/resource/events` 已支持 App 侧只传 `packageCode` 或二维码 `sceneCode`；后台会校验公开资源包，写入 `packageId`、`schoolId`，并把 `sceneCode`、`qrCodeId` 和前端原始 payload 放入 `payloadJson`，`eventType=SCAN` 时同步增加二维码扫码数。

## Data Model

Use these table names in the first backend milestone:

```text
xj_region
xj_public_welfare_project
xj_school
xj_resource_package
xj_scenic_area
xj_scenic_spot
xj_official_guide
xj_checkin_spot
xj_book
xj_book_chapter
xj_map_resource
xj_map_point
xj_globe_device
xj_globe_point
xj_audio_resource
xj_media_asset
xj_qrcode
xunjing_ai_generation_log
xj_ai_eval_set
xj_ai_eval_case
xj_ai_eval_run
xj_ai_quota_rule
xj_import_source
xj_import_job
xj_import_item
xj_import_asset
xj_public_report
xj_public_metric_daily
```

Common columns on every table:

```sql
creator varchar(64) default '' comment '创建者',
create_time datetime not null default current_timestamp comment '创建时间',
updater varchar(64) default '' comment '更新者',
update_time datetime not null default current_timestamp on update current_timestamp comment '更新时间',
deleted bit(1) not null default b'0' comment '是否删除',
tenant_id bigint not null default 0 comment '租户编号'
```

Core schema excerpt for the first migration file:

```sql
create table xj_scenic_area (
  id bigint not null auto_increment comment '景区编号',
  region_id bigint not null comment '地区编号',
  name varchar(128) not null comment '景区名称',
  subtitle varchar(255) default '' comment '副标题',
  cover_url varchar(512) default '' comment '封面图',
  map_image_url varchar(512) default '' comment '地图图',
  ai_chat_role_id bigint default null comment 'Yudao AI 角色编号',
  ai_knowledge_id bigint default null comment 'Yudao AI 知识库编号',
  official_intro text comment '官方介绍',
  travel_tips text comment '旅行提示',
  status tinyint not null default 0 comment '状态：0启用 1停用',
  sort int not null default 0 comment '排序',
  creator varchar(64) default '' comment '创建者',
  create_time datetime not null default current_timestamp comment '创建时间',
  updater varchar(64) default '' comment '更新者',
  update_time datetime not null default current_timestamp on update current_timestamp comment '更新时间',
  deleted bit(1) not null default b'0' comment '是否删除',
  tenant_id bigint not null default 0 comment '租户编号',
  primary key (id),
  key idx_xj_scenic_area_region (region_id),
  key idx_xj_scenic_area_ai_role (ai_chat_role_id),
  key idx_xj_scenic_area_ai_knowledge (ai_knowledge_id)
) comment='星河寻境景区';

create table xj_media_asset (
  id bigint not null auto_increment comment '素材编号',
  title varchar(160) not null comment '素材标题',
  asset_type tinyint not null comment '素材类型：1图片 2视频 3音频 4文档',
  region_id bigint default null comment '地区编号',
  scenic_area_id bigint default null comment '景区编号',
  scenic_spot_id bigint default null comment '景点编号',
  file_url varchar(512) not null comment '文件地址',
  cover_url varchar(512) default '' comment '封面地址',
  source_uri varchar(512) default '' comment '来源地址',
  source_org varchar(128) default '' comment '来源机构',
  creator_name varchar(128) default '' comment '创作者',
  copyright_owner varchar(128) default '' comment '版权方',
  license_scope varchar(255) default '' comment '授权范围',
  can_public bit(1) not null default b'0' comment '可公开展示',
  can_ai_use bit(1) not null default b'0' comment '可用于AI',
  can_promotion_use bit(1) not null default b'0' comment '可用于宣传',
  ai_tags json comment 'AI标签',
  ai_description text comment 'AI描述',
  human_description text comment '人工说明',
  audit_status tinyint not null default 0 comment '审核状态：0待审 1通过 2拒绝',
  status tinyint not null default 0 comment '状态：0启用 1停用',
  creator varchar(64) default '' comment '创建者',
  create_time datetime not null default current_timestamp comment '创建时间',
  updater varchar(64) default '' comment '更新者',
  update_time datetime not null default current_timestamp on update current_timestamp comment '更新时间',
  deleted bit(1) not null default b'0' comment '是否删除',
  tenant_id bigint not null default 0 comment '租户编号',
  primary key (id),
  key idx_xj_media_asset_scenic (scenic_area_id, scenic_spot_id),
  key idx_xj_media_asset_audit (audit_status),
  key idx_xj_media_asset_ai_use (can_ai_use)
) comment='星河寻境文旅影像资产';

create table xj_qrcode (
  id bigint not null auto_increment comment '二维码编号',
  name varchar(128) not null comment '二维码名称',
  target_type tinyint not null comment '目标类型：1景区 2景点 3图书 4章节 5活动',
  target_id bigint not null comment '目标编号',
  scene_code varchar(64) not null comment '场景码',
  path varchar(255) not null comment '小程序路径',
  scan_count bigint not null default 0 comment '扫码次数',
  status tinyint not null default 0 comment '状态：0启用 1停用',
  creator varchar(64) default '' comment '创建者',
  create_time datetime not null default current_timestamp comment '创建时间',
  updater varchar(64) default '' comment '更新者',
  update_time datetime not null default current_timestamp on update current_timestamp comment '更新时间',
  deleted bit(1) not null default b'0' comment '是否删除',
  tenant_id bigint not null default 0 comment '租户编号',
  primary key (id),
  unique key uk_xj_qrcode_scene (scene_code),
  key idx_xj_qrcode_target (target_type, target_id)
) comment='星河寻境二维码';

create table xunjing_ai_generation_log (
  id bigint not null auto_increment comment '日志编号',
  biz_type varchar(64) not null comment '业务类型',
  biz_id bigint default null comment '业务编号',
  user_id bigint default null comment '用户编号',
  ai_model_id bigint default null comment 'Yudao AI 模型编号',
  ai_chat_role_id bigint default null comment 'Yudao AI 角色编号',
  ai_knowledge_id bigint default null comment 'Yudao AI 知识库编号',
  prompt_summary varchar(512) default '' comment '提示摘要',
  output_summary varchar(512) default '' comment '输出摘要',
  source_refs json comment '来源引用',
  input_tokens int not null default 0 comment '输入 token',
  output_tokens int not null default 0 comment '输出 token',
  cost_amount decimal(12, 6) not null default 0 comment '成本',
  safety_status tinyint not null default 0 comment '安全状态：0通过 1拦截 2人工复核',
  status tinyint not null default 0 comment '状态：0成功 1失败',
  error_message varchar(1024) default '' comment '错误信息',
  creator varchar(64) default '' comment '创建者',
  create_time datetime not null default current_timestamp comment '创建时间',
  updater varchar(64) default '' comment '更新者',
  update_time datetime not null default current_timestamp on update current_timestamp comment '更新时间',
  deleted bit(1) not null default b'0' comment '是否删除',
  tenant_id bigint not null default 0 comment '租户编号',
  primary key (id),
  key idx_xunjing_ai_generation_log_biz (biz_type, biz_id),
  key idx_xunjing_ai_generation_log_user (user_id),
  key idx_xunjing_ai_generation_log_create_time (create_time)
) comment='星河寻境AI生成日志';
```

## Task 1: Repository And Yudao Baseline

**Files:**
- Create: `backend/yudao/`
- Create: `.env.example`
- Create: `docs/02_开发规划/环境变量清单.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: source Yudao tree from `/Users/bruce/Developer/work/XingheAI2026V2/vendor/xingheai-yudao`
- Produces: runnable Yudao backend and admin source under `backend/yudao`

- [ ] **Step 1: Verify remotes and add GitHub remote**

Run:

```bash
git remote -v
git remote add github <github-ssh-url>
git remote -v
```

Expected: output includes one Gitee remote and one GitHub remote. Use the project GitHub SSH URL supplied by the repository owner.

- [ ] **Step 2: Copy Yudao source without target artifacts**

Run:

```bash
rsync -a \
  --exclude '.git' \
  --exclude 'target' \
  --exclude 'node_modules' \
  --exclude '.runtime' \
  /Users/bruce/Developer/work/XingheAI2026V2/vendor/xingheai-yudao/ \
  backend/yudao/
```

Expected: `backend/yudao/pom.xml` exists and no `target/` directories are copied.

- [ ] **Step 3: Add secret-safe env examples**

Create `.env.example` with:

```dotenv
SPRING_PROFILES_ACTIVE=local
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=yudao_xinghe_xunjing
MYSQL_USERNAME=root
MYSQL_PASSWORD=
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
QWEN_API_KEY=
DASHSCOPE_API_KEY=
QWEN_BASE_URL=
QWEN_MODEL=
QWEN_EMBEDDING_API_KEY=
QWEN_EMBEDDING_BASE_URL=
QWEN_EMBEDDING_MODEL=
SCN_QDRANT_URL=
SCN_QDRANT_COLLECTION=xinghe_xunjing
SCN_QDRANT_API_KEY=
INTERNAL_AUTH_TOKEN=
```

- [ ] **Step 4: Update ignore rules**

Ensure `.gitignore` contains:

```gitignore
.env
.env.local
.runtime/
**/target/
**/node_modules/
backend/yudao/**/.flattened-pom.xml
```

- [ ] **Step 5: Compile Yudao baseline**

Run:

```bash
cd backend/yudao
mvn -DskipTests clean package
```

Expected: Maven build succeeds. If dependency download fails, record the exact repository or artifact error in the task log.

- [ ] **Step 6: Commit baseline**

Run:

```bash
git add .gitignore .env.example docs/02_开发规划/环境变量清单.md backend/yudao
git commit -m "chore: add yudao backend baseline"
```

## Task 2: Xunjing Module Skeleton

**Files:**
- Modify: `backend/yudao/pom.xml`
- Modify: `backend/yudao/yudao-server/pom.xml`
- Modify: `backend/yudao/yudao-module-xunjing/pom.xml`
- Create: `backend/yudao/yudao-module-xunjing/yudao-module-xunjing-server/pom.xml`
- Create: `backend/yudao/yudao-module-xunjing/yudao-module-xunjing-server/src/main/java/cn/iocoder/yudao/module/xunjing/enums/ErrorCodeConstants.java`
- Create: `backend/yudao/yudao-module-xunjing/yudao-module-xunjing-server/src/main/java/cn/iocoder/yudao/module/xunjing/enums/xunjing/XjAuditStatusEnum.java`
- Create: `backend/yudao/sql/mysql/xinghe_xunjing_schema.sql`

**Interfaces:**
- Consumes: Yudao module conventions and common framework.
- Produces: compiled `yudao-module-xunjing-server` module with schema file.

- [ ] **Step 1: Add module dependency**

Ensure `backend/yudao/yudao-server/pom.xml` depends on:

```xml
<dependency>
    <groupId>cn.iocoder.boot</groupId>
    <artifactId>yudao-module-xunjing-server</artifactId>
    <version>${revision}</version>
</dependency>
```

- [ ] **Step 2: Create module error constants**

Create:

```java
package cn.iocoder.yudao.module.xunjing.enums;

import cn.iocoder.yudao.framework.common.exception.ErrorCode;

public interface ErrorCodeConstants {

    ErrorCode XJ_SCENIC_AREA_NOT_EXISTS = new ErrorCode(1_200_100_001, "景区不存在");
    ErrorCode XJ_SCENIC_SPOT_NOT_EXISTS = new ErrorCode(1_200_100_002, "景点不存在");
    ErrorCode XJ_MEDIA_ASSET_NOT_EXISTS = new ErrorCode(1_200_100_003, "素材不存在");
    ErrorCode XJ_MEDIA_ASSET_NOT_APPROVED = new ErrorCode(1_200_100_004, "素材未审核通过");
    ErrorCode XJ_QRCODE_NOT_EXISTS = new ErrorCode(1_200_100_005, "二维码不存在");
    ErrorCode XJ_QRCODE_DISABLED = new ErrorCode(1_200_100_006, "二维码已停用");
    ErrorCode XJ_KNOWLEDGE_SOURCE_REQUIRED = new ErrorCode(1_200_100_007, "AI 输出缺少知识来源");

}
```

- [ ] **Step 3: Create audit enum**

Create:

```java
package cn.iocoder.yudao.module.xunjing.enums.xunjing;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum XjAuditStatusEnum {
    PENDING(0, "待审核"),
    APPROVED(1, "审核通过"),
    REJECTED(2, "审核拒绝");

    private final Integer status;
    private final String name;
}
```

- [ ] **Step 4: Create schema migration**

Create `backend/yudao/sql/mysql/xinghe_xunjing_schema.sql` using the data model section in this plan. Add all `xj_*` tables in one migration file for the first milestone.

- [ ] **Step 5: Compile module**

Run:

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing/yudao-module-xunjing-server -am -DskipTests compile
```

Expected: compile succeeds.

- [ ] **Step 6: Commit module skeleton**

Run:

```bash
git add backend/yudao/pom.xml backend/yudao/yudao-server/pom.xml backend/yudao/yudao-module-xunjing backend/yudao/sql/mysql/xinghe_xunjing_schema.sql
git commit -m "feat: add xunjing yudao module skeleton"
```

## Task 3: Scenic Content Admin APIs

**Files:**
- Create: `backend/yudao/yudao-module-xunjing/yudao-module-xunjing-server/src/main/java/cn/iocoder/yudao/module/xunjing/dal/dataobject/xunjing/XjScenicAreaDO.java`
- Create: `backend/yudao/yudao-module-xunjing/yudao-module-xunjing-server/src/main/java/cn/iocoder/yudao/module/xunjing/dal/mysql/xunjing/XjScenicAreaMapper.java`
- Create: `backend/yudao/yudao-module-xunjing/yudao-module-xunjing-server/src/main/java/cn/iocoder/yudao/module/xunjing/service/xunjing/scenic/XjScenicAreaService.java`
- Create: `backend/yudao/yudao-module-xunjing/yudao-module-xunjing-server/src/main/java/cn/iocoder/yudao/module/xunjing/service/xunjing/scenic/XjScenicAreaServiceImpl.java`
- Create: `backend/yudao/yudao-module-xunjing/yudao-module-xunjing-server/src/main/java/cn/iocoder/yudao/module/xunjing/controller/admin/xunjing/scenic/XjScenicAreaController.java`
- Repeat the same pattern for scenic spot, official guide and checkin spot.

**Interfaces:**
- Produces admin CRUD endpoints:
  - `POST /admin-api/xunjing/scenic-area/create`
  - `PUT /admin-api/xunjing/scenic-area/update`
  - `DELETE /admin-api/xunjing/scenic-area/delete`
  - `GET /admin-api/xunjing/scenic-area/get`
  - `GET /admin-api/xunjing/scenic-area/page`

- [ ] **Step 1: Write service test for create and update**

Create `XjScenicAreaServiceImplTest.java` with:

```java
@Test
public void createScenicArea_success() {
    XjScenicAreaSaveReqVO reqVO = new XjScenicAreaSaveReqVO();
    reqVO.setRegionId(1L);
    reqVO.setName("喀什古城");
    reqVO.setSubtitle("一座活着的西域古城");
    reqVO.setStatus(0);

    Long id = scenicAreaService.createScenicArea(reqVO);

    XjScenicAreaDO scenicArea = scenicAreaMapper.selectById(id);
    assertEquals("喀什古城", scenicArea.getName());
    assertEquals(1L, scenicArea.getRegionId());
}
```

- [ ] **Step 2: Implement DO fields**

`XjScenicAreaDO` must include:

```java
private Long id;
private Long regionId;
private String name;
private String subtitle;
private String coverUrl;
private String mapImageUrl;
private Long aiChatRoleId;
private Long aiKnowledgeId;
private String officialIntro;
private String travelTips;
private Integer status;
private Integer sort;
```

- [ ] **Step 3: Implement validation**

`XjScenicAreaServiceImpl.validateScenicAreaExists(Long id)` must throw `XJ_SCENIC_AREA_NOT_EXISTS` when mapper returns null.

- [ ] **Step 4: Implement controller permissions**

Use permissions:

```text
xinghe:xunjing-scenic-area:create
xinghe:xunjing-scenic-area:update
xinghe:xunjing-scenic-area:delete
xinghe:xunjing-scenic-area:query
```

- [ ] **Step 5: Run tests**

Run:

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing/yudao-module-xunjing-server -Dtest=XjScenicAreaServiceImplTest test
```

Expected: test passes.

- [ ] **Step 6: Commit scenic APIs**

Run:

```bash
git add backend/yudao/yudao-module-xunjing
git commit -m "feat: add xunjing scenic admin APIs"
```

## Task 3A: Public Project, School, Resource Package, Map And Globe P0

**Files:**
- Create: `.../dal/dataobject/xunjing/XjPublicWelfareProjectDO.java`
- Create: `.../dal/dataobject/xunjing/XjSchoolDO.java`
- Create: `.../dal/dataobject/xunjing/XjResourcePackageDO.java`
- Create: `.../dal/dataobject/xunjing/XjMapResourceDO.java`
- Create: `.../dal/dataobject/xunjing/XjMapPointDO.java`
- Create: `.../dal/dataobject/xunjing/XjGlobeDeviceDO.java`
- Create: `.../dal/dataobject/xunjing/XjGlobePointDO.java`
- Create: `.../dal/dataobject/xunjing/XjAudioResourceDO.java`
- Create: `.../service/xunjing/project/XjPublicProjectService.java`
- Create: `.../service/xunjing/map/XjMapExplainService.java`
- Create: `.../service/xunjing/globe/XjGlobeExplainService.java`
- Create: `.../controller/admin/xunjing/project/XjPublicProjectController.java`
- Create: `.../controller/admin/xunjing/school/XjSchoolController.java`
- Create: `.../controller/admin/xunjing/resource/XjResourcePackageController.java`
- Create: `.../controller/admin/xunjing/map/XjMapController.java`
- Create: `.../controller/admin/xunjing/globe/XjGlobeController.java`
- Create: `.../controller/app/xunjing/map/AppXjMapController.java`
- Create: `.../controller/app/xunjing/globe/AppXjGlobeController.java`

**Interfaces:**
- Produces P0 project backbone:
  - public welfare project
  - school / recipient unit
  - book-map-globe resource package
  - map point explanation
  - globe point explanation or pre-generated audio

- [ ] **Step 1: Write P0 resource package test**

Create a service test that creates project `图秀中华公益行动·新疆首站`, creates one school, binds one book, one map resource and one globe device into a resource package, then asserts package status is enabled.

- [ ] **Step 2: Implement project and school CRUD**

Required fields:

```text
project: projectName, sponsorOrg, regionId, startDate, status
school: projectId, schoolName, regionId, contactName, status
```

- [ ] **Step 3: Implement resource package**

Required fields:

```text
projectId
schoolId
packageName
bookId
mapAssetId
globeDeviceId
enabledAt
status
```

- [ ] **Step 4: Implement map explanation**

`POST /app-api/xunjing/map/explain` must accept `mapPointId` and return `title`, `explain`, `audioUrl`, `sources`.

- [ ] **Step 5: Implement globe explanation**

`POST /app-api/xunjing/globe/explain` must accept `globePointId` or `pointCode` and return `title`, `explain`, `audioUrl`, `sources`.

- [ ] **Step 6: Run tests**

Run:

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing/yudao-module-xunjing-server -Dtest=XjPublicProjectServiceImplTest,XjMapExplainServiceImplTest,XjGlobeExplainServiceImplTest test
```

Expected: resource package can be created and map/globe explanations include sources.

- [ ] **Step 7: Commit P0 project backbone**

Run:

```bash
git add backend/yudao/yudao-module-xunjing
git commit -m "feat: add xunjing public project resource backbone"
```

## Task 4: Basic Media Asset Library P0

**Files:**
- Create: `.../dal/dataobject/xunjing/XjMediaAssetDO.java`
- Create: `.../dal/mysql/xunjing/XjMediaAssetMapper.java`
- Create: `.../service/xunjing/media/XjMediaAssetService.java`
- Create: `.../service/xunjing/media/XjMediaAssetServiceImpl.java`
- Create: `.../controller/admin/xunjing/media/XjMediaAssetController.java`

**Interfaces:**
- Consumes Yudao infra file URLs.
- Produces P0 media management with upload, source, license, audit, availability flags and usage logs. AI tagging is P1.

- [ ] **Step 1: Write audit gate test**

Create a test that inserts a media asset with `canAiUse=false`, then calls `mediaAssetService.validateCanUseForAi(id)`.

Expected: service throws `XJ_MEDIA_ASSET_NOT_APPROVED` or a specific `can_ai_use` error constant.

- [ ] **Step 2: Implement asset fields**

`XjMediaAssetDO` must include all fields from `xj_media_asset`, especially:

```java
private Boolean canPublic;
private Boolean canAiUse;
private Boolean canPromotionUse;
private Integer auditStatus;
private String licenseScope;
private String aiTags;
private String aiDescription;
private String humanDescription;
```

- [ ] **Step 3: Implement admin operations**

Admin operations:

```text
create asset
update asset metadata
page query by assetType, scenicAreaId, auditStatus, canAiUse
approve asset
reject asset
mark featured
write usage log
```

- [ ] **Step 4: Implement usage log**

Every public display, AI use, report use or promotion use must write `xunjing_media_usage_log` with `assetId`, `bizType`, `bizId`, `sceneCode`, `usedBy`, `usedAt`.

- [ ] **Step 5: Run tests**

Run:

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing/yudao-module-xunjing-server -Dtest=XjMediaAssetServiceImplTest test
```

Expected: tests pass, media audit gate blocks unapproved AI use, and usage is logged.

- [ ] **Step 6: Commit media library**

Run:

```bash
git add backend/yudao/yudao-module-xunjing
git commit -m "feat: add xunjing media asset library"
```

## Task 5: Book, Chapter And Reading Backend

**Files:**
- Create: `.../dal/dataobject/xunjing/XjBookDO.java`
- Create: `.../dal/dataobject/xunjing/XjBookChapterDO.java`
- Create: `.../service/xunjing/book/XjBookService.java`
- Create: `.../service/xunjing/book/XjReadingService.java`
- Create: `.../controller/admin/xunjing/book/XjBookController.java`
- Create: `.../controller/admin/xunjing/book/XjBookChapterController.java`
- Create: `.../controller/app/xunjing/reading/AppXjReadingController.java`

**Interfaces:**
- Admin manages books and chapters.
- App API supports scan reading and Q&A:
  - `POST /app-api/xunjing/reading/start`
  - `POST /app-api/xunjing/reading/ask`

- [ ] **Step 1: Write reading source test**

Create a service test where chapter has `aiKnowledgeId=10L`, user asks “这一章讲了什么”. The mocked knowledge search returns two source snippets. Assert response contains `answer`, `sources[0].title`, `sources[0].segmentId`.

- [ ] **Step 2: Implement book and chapter CRUD**

Fields:

```text
book: title, subtitle, coverUrl, author, publisher, isbn, aiKnowledgeId, status
chapter: bookId, chapterNo, title, summary, content, aiKnowledgeId, qrcodeId, status
```

- [ ] **Step 3: Implement reading prompt policy**

`XjReadingService.startReading` returns:

```json
{
  "chapterId": 1,
  "chapterTitle": "第一章",
  "oneMinuteSummary": "...",
  "keyPoints": ["...", "...", "..."],
  "suggestedQuestions": ["这里适合孩子怎么理解？", "这一段和喀什有什么关系？"],
  "sources": []
}
```

Sources may be empty only for static chapter metadata. AI-generated answers must include sources.

- [ ] **Step 4: Run tests**

Run:

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing/yudao-module-xunjing-server -Dtest=XjReadingServiceImplTest test
```

Expected: tests pass and generated reading answer contains sources.

- [ ] **Step 5: Commit reading backend**

Run:

```bash
git add backend/yudao/yudao-module-xunjing
git commit -m "feat: add xunjing reading backend"
```

## Task 6: QR Code And Scan Resolution

**Files:**
- Create: `.../dal/dataobject/xunjing/XjQrcodeDO.java`
- Create: `.../service/xunjing/qrcode/XjQrcodeService.java`
- Create: `.../controller/admin/xunjing/qrcode/XjQrcodeController.java`
- Create: `.../controller/app/xunjing/scan/AppXjScanController.java`

**Interfaces:**
- Admin creates QR scene codes.
- App resolves scene code to business target.

- [ ] **Step 1: Write scan test**

Insert `xj_qrcode` with `sceneCode="ks_old_city_001"`, `targetType=1`, `targetId=100L`, `path="/pages/scenic/companion"`. Call `resolve("ks_old_city_001")`.

Expected:

```json
{
  "targetType": 1,
  "targetId": 100,
  "path": "/pages/scenic/companion",
  "params": {
    "scenicAreaId": "100"
  }
}
```

- [ ] **Step 2: Implement disabled guard**

If `status != 0`, throw `XJ_QRCODE_DISABLED`.

- [ ] **Step 3: Increment scan count**

On successful app scan, increment `scan_count` in the same service call.

- [ ] **Step 4: Run tests**

Run:

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing/yudao-module-xunjing-server -Dtest=XjQrcodeServiceImplTest test
```

Expected: active QR resolves and disabled QR fails.

- [ ] **Step 5: Commit QR backend**

Run:

```bash
git add backend/yudao/yudao-module-xunjing
git commit -m "feat: add xunjing qrcode backend"
```

## Task 7: P0 AI RAG, Eval And Cost Control

**Files:**
- Create: `.../service/xunjing/ai/XjAiCompanionService.java`
- Create: `.../service/xunjing/ai/XjKnowledgeSearchAdapter.java`
- Create: `.../service/xunjing/ai/YudaoAiModelAdapter.java`
- Create: `.../service/xunjing/ai/XjAiEvalService.java`
- Create: `.../service/xunjing/ai/XjAiQuotaService.java`
- Create: `.../controller/app/xunjing/ai/AppXjAiController.java`
- Create: `.../controller/app/xunjing/scenic/AppXjScenicController.java`
- Create: `.../controller/admin/xunjing/ai/XjAiEvalController.java`
- Create: `.../controller/admin/xunjing/ai/XjAiCostController.java`

**Interfaces:**
- Consumes:
  - Yudao AI role id from scenic area.
  - Yudao knowledge id from scenic area, scenic spot or book chapter.
  - Yudao model config from `yudao-module-ai`.
- Produces:
  - `POST /app-api/xunjing/ai/chat`
  - `POST /app-api/xunjing/map/explain`
  - `POST /app-api/xunjing/globe/explain`
  - `POST /admin-api/xunjing/ai-eval/run`

- [ ] **Step 1: Write RAG source enforcement test**

Mock model output and knowledge search. If the answer has no source references for `bizType=scenic_chat`, assert service throws `XJ_KNOWLEDGE_SOURCE_REQUIRED`.

- [ ] **Step 2: Implement knowledge search adapter**

Adapter method signature:

```java
List<XjKnowledgeSourceRespDTO> search(Long aiKnowledgeId, String query, Integer topK, Map<String, Object> filters);
```

Response fields:

```java
private String title;
private String sourceUri;
private String segmentId;
private String content;
private BigDecimal score;
```

- [ ] **Step 3: Implement AI chat request**

App request fields:

```java
private Long scenicAreaId;
private Long scenicSpotId;
private Long bookChapterId;
private String message;
private String scene;
```

Scene values:

```text
scenic_chat
spot_explain
map_explain
globe_explain
quiz_generate
reading_ask
```

- [ ] **Step 4: Log every generation**

Write one `xunjing_ai_generation_log` record for every AI call, including `bizType`, `bizId`, `modelId`, `chatRoleId`, `knowledgeId`, `sourceRefs`, tokens and failure message.

- [ ] **Step 5: Implement eval set and quota**

Create fixed P0 eval questions for Xinjiang, map boundary, ethnic, religious and unknown-answer scenarios. Add quota checks for member, qrcode, school, project and scene code before model calls. High-frequency identical questions should hit cache before model calls.

- [ ] **Step 6: Run tests**

Run:

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing/yudao-module-xunjing-server -Dtest=XjAiCompanionServiceImplTest,XjAiEvalServiceImplTest,XjAiQuotaServiceImplTest test
```

Expected: answer includes sources, eval run persists results, quota blocks over-limit calls and log record is created.

- [ ] **Step 7: Commit AI orchestration**

Run:

```bash
git add backend/yudao/yudao-module-xunjing
git commit -m "feat: add xunjing ai companion orchestration"
```

## Task 8: Public Metrics And Report P0

**Files:**
- Create: `.../dal/dataobject/xunjing/XjPublicMetricDailyDO.java`
- Create: `.../dal/dataobject/xunjing/XjPublicReportDO.java`
- Create: `.../service/xunjing/report/XjPublicReportService.java`
- Create: `.../controller/admin/xunjing/report/XjPublicReportController.java`
- Create: `.../controller/app/xunjing/report/AppXjPublicReportController.java`
- Create: `.../job/xunjing/XjPublicMetricDailyJob.java`

**Interfaces:**
- Produces:
  - `GET /app-api/xunjing/public-report/summary`
  - `GET /admin-api/xunjing/dashboard/summary`
  - `POST /admin-api/xunjing/public-report/generate`

- [ ] **Step 1: Write public report summary test**

Seed one project, one school, one resource package, scan logs, QA logs and audio play logs. Assert summary returns school count, resource package count, scan count, QA count and audio play count.

- [ ] **Step 2: Implement daily metrics**

Aggregate by `projectId`, `schoolId`, `date`, `scanCount`, `qaCount`, `audioPlayCount`, `knowledgeVisitCount`, `resourcePackageEnabledCount`.

- [ ] **Step 3: Implement report sample generation**

Generate a report record with `reportType=public_welfare_summary`, date range and file URL or HTML snapshot URL.

- [ ] **Step 4: Run tests**

Run:

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing/yudao-module-xunjing-server -Dtest=XjPublicReportServiceImplTest test
```

Expected: public report summary and sample report are generated from traceable backend metrics.

- [ ] **Step 5: Commit public report**

Run:

```bash
git add backend/yudao/yudao-module-xunjing
git commit -m "feat: add xunjing public report metrics"
```

## Task 9: Trip Records And User Works (P1 Deferred)

**Files:**
- Create: `.../dal/dataobject/xunjing/XjTripDO.java`
- Create: `.../dal/dataobject/xunjing/XjTripRecordDO.java`
- Create: `.../dal/dataobject/xunjing/XjUserWorkDO.java`
- Create: `.../service/xunjing/trip/XjTripService.java`
- Create: `.../service/xunjing/work/XjUserWorkService.java`
- Create: `.../controller/app/xunjing/trip/AppXjTripController.java`
- Create: `.../controller/app/xunjing/work/AppXjUserWorkController.java`
- Create: `.../controller/admin/xunjing/work/XjUserWorkController.java`

**Interfaces:**
- Produces trip and work APIs:
  - `POST /app-api/xunjing/trip/create`
  - `POST /app-api/xunjing/trip/record/create`
  - `POST /app-api/xunjing/trip/day-summary`
  - `POST /app-api/xunjing/trip/generate`
  - `GET /app-api/xunjing/works/list`

- [ ] **Step 1: Write trip generation test**

Create trip with one text record and one media asset. Generate `workType=xiaohongshu`. Assert user work is persisted and `xunjing_ai_generation_log.bizType="trip_generate"`.

- [ ] **Step 2: Implement record types**

Record types:

```text
1 text
2 image
3 audio
4 video
5 location
```

- [ ] **Step 3: Implement work types**

Work types:

```text
travel_note
moments
xiaohongshu
share_card
pdf_memory
```

- [ ] **Step 4: Implement admin moderation**

Admin can page query user works and set:

```text
auditStatus: 0待审 1通过 2拒绝
visible: true or false
```

- [ ] **Step 5: Run tests**

Run:

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing/yudao-module-xunjing-server -Dtest=XjTripServiceImplTest,XjUserWorkServiceImplTest test
```

Expected: work generation persists user work and AI log.

- [ ] **Step 6: Commit trips and works**

Run:

```bash
git add backend/yudao/yudao-module-xunjing
git commit -m "feat: add xunjing trip and work backend"
```

## Task 10: Import Intake Inside Yudao P0

**Files:**
- Create: `.../dal/dataobject/xunjing/XjImportSourceDO.java`
- Create: `.../dal/dataobject/xunjing/XjImportJobDO.java`
- Create: `.../dal/dataobject/xunjing/XjImportItemDO.java`
- Create: `.../dal/dataobject/xunjing/XjImportAssetDO.java`
- Create: `.../service/xunjing/imports/XjImportService.java`
- Create: `.../controller/admin/xunjing/imports/XjImportController.java`

**Interfaces:**
- Consumes crawler gateway contracts only as reference.
- Produces Yudao-managed PDF/Word/official URL/material package import jobs, import assets and review flow.

- [ ] **Step 1: Implement import job states**

States:

```text
0 draft
1 processing
2 succeeded
3 failed
4 reviewing
5 published
```

- [ ] **Step 2: Implement allowed source guard**

Admin request must include:

```java
private String sourceUrl;
private String sourceOrg;
private String licenseNote;
private Long targetKnowledgeId;
```

Reject create when `sourceOrg` or `licenseNote` is blank.

- [ ] **Step 3: Implement review publish**

Only reviewed import assets can publish into:

```text
Yudao AI knowledge document
xj_media_asset
```

- [ ] **Step 4: Run tests**

Run:

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing/yudao-module-xunjing-server -Dtest=XjImportServiceImplTest test
```

Expected: missing license note fails, reviewed import asset can publish.

- [ ] **Step 5: Commit import intake**

Run:

```bash
git add backend/yudao/yudao-module-xunjing
git commit -m "feat: add xunjing import intake"
```

## Task 11: Yudao Admin UI And Menus

**Files:**
- Create: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xinghe/xunjing/project/index.ts`
- Create: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xinghe/xunjing/resourcePackage/index.ts`
- Create: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xinghe/xunjing/map/index.ts`
- Create: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xinghe/xunjing/globe/index.ts`
- Create: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xinghe/xunjing/mediaAsset/index.ts`
- Create: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xinghe/xunjing/qrcode/index.ts`
- Create: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xinghe/xunjing/project/index.vue`
- Create: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xinghe/xunjing/resourcePackage/index.vue`
- Create: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xinghe/xunjing/map/index.vue`
- Create: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xinghe/xunjing/globe/index.vue`
- Create: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xinghe/xunjing/mediaAsset/index.vue`
- Create: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xinghe/xunjing/qrcode/index.vue`
- Create: `backend/yudao/sql/mysql/xinghe_xunjing_menu.sql`

**Interfaces:**
- Consumes admin APIs from tasks 3 through 9.
- Produces usable Yudao admin menus.

- [ ] **Step 1: Create menu SQL**

Menus:

```text
星河寻境
  基础看板
  公益项目
  学校管理
  资源包管理
  地区管理
  图书管理
  章节管理
  地图资源
  地球仪绑定
  知识资产库
  资料导入
  图影中华图片库
  二维码管理
  AI评测集
  AI生成日志
  成本统计
  公益报告
```

Permissions must match controller permissions.

- [ ] **Step 2: Create admin API clients**

Each API file exports:

```ts
export const getPage = (params: PageParam) => request.get({ url: '/xinghe/xunjing/scenic-area/page', params })
export const get = (id: number) => request.get({ url: '/xinghe/xunjing/scenic-area/get?id=' + id })
export const create = (data: FormVO) => request.post({ url: '/xinghe/xunjing/scenic-area/create', data })
export const update = (data: FormVO) => request.put({ url: '/xinghe/xunjing/scenic-area/update', data })
export const remove = (id: number) => request.delete({ url: '/xinghe/xunjing/scenic-area/delete?id=' + id })
```

- [ ] **Step 3: Create list and form pages**

Each page must support:

```text
search
create
update
delete
enable or disable
audit action when applicable
```

- [ ] **Step 4: Build admin UI**

Run:

```bash
cd backend/yudao/yudao-ui/yudao-ui-admin-vue3
pnpm install
pnpm build:prod
```

Expected: build succeeds.

- [ ] **Step 5: Commit admin UI**

Run:

```bash
git add backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xinghe backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xinghe backend/yudao/sql/mysql/xinghe_xunjing_menu.sql
git commit -m "feat: add xunjing yudao admin UI"
```

## Task 12: Seed Data And End-to-End Backend Smoke

**Files:**
- Create: `backend/yudao/sql/mysql/xinghe_xunjing_seed_kashgar.sql`
- Create: `backend/yudao/yudao-module-xunjing/yudao-module-xunjing-server/src/test/java/cn/iocoder/yudao/module/xunjing/XjBackendSmokeTest.java`
- Create: `docs/04_AI交接任务书/星河寻境后台联调说明.md`

**Interfaces:**
- Produces backend data and smoke flow for the mini-program AI.

- [ ] **Step 1: Seed Kashgar sample data**

Seed must include:

```text
1 region: 新疆喀什
1 public welfare project: 图秀中华公益行动·新疆首站
1 school
1 resource package
1 knowledge mapping
1 book
10 book chapters
1 map resource
5 map points
1 globe device
5 globe points
20 media assets
20 QR codes: book chapter, map point, globe point
1 public report sample
```

- [ ] **Step 2: Run backend smoke**

Smoke cases:

```text
GET /app-api/xunjing/home
POST /app-api/xunjing/scan/resolve
POST /app-api/xunjing/ai/chat
POST /app-api/xunjing/reading/start
POST /app-api/xunjing/map/explain
POST /app-api/xunjing/globe/explain
GET /app-api/xunjing/public-report/summary
GET /admin-api/xunjing/dashboard/summary
```

- [ ] **Step 3: Verify RAG source rule**

Smoke must fail the build if `ai/chat`, `reading/ask`, `map/explain` or `globe/explain` returns an answer without `sources`.

- [ ] **Step 4: Run all backend tests**

Run:

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing/yudao-module-xunjing-server -am test
```

Expected: all Xunjing module tests pass.

- [ ] **Step 5: Commit seeds and smoke docs**

Run:

```bash
git add backend/yudao/sql/mysql/xinghe_xunjing_seed_kashgar.sql backend/yudao/yudao-module-xunjing/yudao-module-xunjing-server/src/test/java docs/04_AI交接任务书/星河寻境后台联调说明.md
git commit -m "test: add xunjing backend smoke seed"
```

## Acceptance Gate

Backend is acceptable for frontend integration only when all are true:

- Yudao backend starts.
- Yudao admin UI logs in.
- `yudao-module-ai` model, API Key, chat role and knowledge pages are usable.
- Xunjing menus appear in Yudao admin.
- Admin can create public project, school, resource package, book chapter, map point, globe point, media asset and QR code.
- Media asset has copyright, license, audit and AI-use controls.
- QR resolve API returns target type, target id, path and params.
- AI chat, reading ask, map explain and globe explain return answer plus sources.
- Every AI call writes `xunjing_ai_generation_log`.
- Import result cannot enter knowledge or media library before review.
- AI eval set can run and cost quota blocks over-limit calls.
- Public report summary can be generated from backend metrics.
- No real secrets appear in `git diff`.
- Final push goes to both GitHub and Gitee.

## Final Push

Run only after acceptance:

```bash
git status --short
git push github HEAD
git push origin HEAD
```

Expected: both remotes contain the same commit hash.
