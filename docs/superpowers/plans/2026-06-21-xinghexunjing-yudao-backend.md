# 星河寻境 Yudao 后台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Yudao 做完星河寻境一期真实可上线后台，支撑小程序前端的扫码 AI 旅伴、扫码伴读、知识库、图片库、旅行记录、游记生成和运营管理。

**Architecture:** 生产后台以 `backend/yudao` 为星河寻境独立后台入口，从迁移源复制一份 Yudao 后单独演进，不与 XingheAI2026V2 共用源码目录、运行库、数据库、Redis、对象存储或 Qdrant collection。星河寻境业务新增在 `yudao-module-xunjing`，通过服务层挂接本项目内复制出来的 `yudao-module-ai` 模型、Key、角色和知识库能力，通过 infra file 承接文件上传，通过 Yudao 权限菜单承接运营后台。`kb-service` 与 `crawler-gateway` 的既有实现只作为迁移参考或内部 worker 来源，不另起一套长期管理后台。

**Tech Stack:** Java 17、Spring Boot、Yudao、MyBatis Plus、MySQL、Redis、Vue3 Yudao Admin、Yudao AI Module、Qdrant、Object Storage、Yudao Job。

## Global Constraints

- 当前小程序前端由其他 AI 负责，本计划只覆盖 Yudao 后台、管理端、后台 API、App API 契约和后台验收门禁。
- 默认从 GitHub 同步最新代码，但当前仓库只有 Gitee `origin`，正式开发前必须补 GitHub remote。
- 正式推送必须同时推送 GitHub 和 Gitee。
- 真实 API Key、Token、密码、Cookie 不写入 Markdown、源码、测试快照或 Git 提交。
- 星河寻境是独立项目，Yudao 必须复制到本仓库独立维护，不允许用 symlink、submodule 或运行时直连原 XingheAI2026V2 后台。
- 后台功能全部用 Yudao 承接，不新增长期独立管理后台。
- 不破坏 `yudao-module-ai` 原生模型、Key、角色、知识库、绘图、写作、工作流能力。
- 文旅图片库不是 `ai_image` 生图记录，必须独立建 `xj_media_asset`。
- 知识内容必须有来源、审核状态和可调用场景，正式 AI 输出必须返回 sources。
- 爬虫只采集授权或公开可用资料，采集结果必须先进入待审核。

---

## Backend Scope

本计划负责：

- Yudao 工程迁移与运行。
- Yudao AI 模块启用和星河寻境挂接。
- 星河寻境业务模块 `yudao-module-xunjing`。
- 景区、景点、攻略、打卡点、图书、章节、二维码、图片库、用户作品、AI 生成日志。
- 管理端菜单、权限、列表、表单、审核、看板。
- 面向小程序的 `/app-api/xinghe/xunjing/*` 接口契约。
- 知识库、图片库、爬虫导入、AI 编排的后台闭环。

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
/admin-api/xinghe/xunjing/region
/admin-api/xinghe/xunjing/scenic-area
/admin-api/xinghe/xunjing/scenic-spot
/admin-api/xinghe/xunjing/guide
/admin-api/xinghe/xunjing/checkin-spot
/admin-api/xinghe/xunjing/book
/admin-api/xinghe/xunjing/book-chapter
/admin-api/xinghe/xunjing/media-asset
/admin-api/xinghe/xunjing/qrcode
/admin-api/xinghe/xunjing/user-work
/admin-api/xinghe/xunjing/ai-log
/admin-api/xinghe/xunjing/crawler
/admin-api/xinghe/xunjing/dashboard
```

App API contract for mini-program：

```text
GET  /app-api/xinghe/xunjing/home
POST /app-api/xinghe/xunjing/scan/resolve
GET  /app-api/xinghe/xunjing/scenic/companion
POST /app-api/xinghe/xunjing/scenic/explain
POST /app-api/xinghe/xunjing/ai/chat
POST /app-api/xinghe/xunjing/reading/start
POST /app-api/xinghe/xunjing/reading/ask
POST /app-api/xinghe/xunjing/trip/create
POST /app-api/xinghe/xunjing/trip/record/create
POST /app-api/xinghe/xunjing/trip/day-summary
POST /app-api/xinghe/xunjing/trip/generate
GET  /app-api/xinghe/xunjing/works/list
```

## Data Model

Use these table names in the first backend milestone:

```text
xj_region
xj_scenic_area
xj_scenic_spot
xj_official_guide
xj_checkin_spot
xj_book
xj_book_chapter
xj_media_asset
xj_qrcode
xj_trip
xj_trip_record
xj_user_work
xj_ai_generation_log
xj_crawl_job
xj_crawl_asset
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

create table xj_ai_generation_log (
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
  key idx_xj_ai_generation_log_biz (biz_type, biz_id),
  key idx_xj_ai_generation_log_user (user_id),
  key idx_xj_ai_generation_log_create_time (create_time)
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
  - `POST /admin-api/xinghe/xunjing/scenic-area/create`
  - `PUT /admin-api/xinghe/xunjing/scenic-area/update`
  - `DELETE /admin-api/xinghe/xunjing/scenic-area/delete`
  - `GET /admin-api/xinghe/xunjing/scenic-area/get`
  - `GET /admin-api/xinghe/xunjing/scenic-area/page`

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

## Task 4: Media Asset Library

**Files:**
- Create: `.../dal/dataobject/xunjing/XjMediaAssetDO.java`
- Create: `.../dal/mysql/xunjing/XjMediaAssetMapper.java`
- Create: `.../service/xunjing/media/XjMediaAssetService.java`
- Create: `.../service/xunjing/media/XjMediaAssetServiceImpl.java`
- Create: `.../controller/admin/xunjing/media/XjMediaAssetController.java`
- Create: `.../job/xunjing/XjMediaAiTagJob.java`

**Interfaces:**
- Consumes Yudao infra file URLs.
- Produces media management with audit, license and AI-use controls.

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
trigger AI tagging
```

- [ ] **Step 4: Implement AI tagging job contract**

`XjMediaAiTagJob` accepts `mediaAssetId`, reads file URL, invokes the configured model through Yudao AI service or internal AI adapter, then writes `aiTags` and `aiDescription`. If model call fails, keep the asset and write failure to `xj_ai_generation_log`.

- [ ] **Step 5: Run tests**

Run:

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing/yudao-module-xunjing-server -Dtest=XjMediaAssetServiceImplTest test
```

Expected: tests pass and media audit gate blocks unapproved AI use.

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
  - `POST /app-api/xinghe/xunjing/reading/start`
  - `POST /app-api/xinghe/xunjing/reading/ask`

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

## Task 7: AI Companion And RAG Orchestration

**Files:**
- Create: `.../service/xunjing/ai/XjAiCompanionService.java`
- Create: `.../service/xunjing/ai/XjKnowledgeSearchAdapter.java`
- Create: `.../service/xunjing/ai/YudaoAiModelAdapter.java`
- Create: `.../controller/app/xunjing/ai/AppXjAiController.java`
- Create: `.../controller/app/xunjing/scenic/AppXjScenicController.java`

**Interfaces:**
- Consumes:
  - Yudao AI role id from scenic area.
  - Yudao knowledge id from scenic area, scenic spot or book chapter.
  - Yudao model config from `yudao-module-ai`.
- Produces:
  - `POST /app-api/xinghe/xunjing/ai/chat`
  - `POST /app-api/xinghe/xunjing/scenic/explain`

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
reading_ask
trip_summary
trip_generate
```

- [ ] **Step 4: Log every generation**

Write one `xj_ai_generation_log` record for every AI call, including `bizType`, `bizId`, `modelId`, `chatRoleId`, `knowledgeId`, `sourceRefs`, tokens and failure message.

- [ ] **Step 5: Run tests**

Run:

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing/yudao-module-xunjing-server -Dtest=XjAiCompanionServiceImplTest test
```

Expected: answer includes sources and log record is created.

- [ ] **Step 6: Commit AI orchestration**

Run:

```bash
git add backend/yudao/yudao-module-xunjing
git commit -m "feat: add xunjing ai companion orchestration"
```

## Task 8: Trip Records And User Works

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
  - `POST /app-api/xinghe/xunjing/trip/create`
  - `POST /app-api/xinghe/xunjing/trip/record/create`
  - `POST /app-api/xinghe/xunjing/trip/day-summary`
  - `POST /app-api/xinghe/xunjing/trip/generate`
  - `GET /app-api/xinghe/xunjing/works/list`

- [ ] **Step 1: Write trip generation test**

Create trip with one text record and one media asset. Generate `workType=xiaohongshu`. Assert user work is persisted and `xj_ai_generation_log.bizType="trip_generate"`.

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

## Task 9: Crawler Intake Inside Yudao

**Files:**
- Create: `.../dal/dataobject/xunjing/XjCrawlJobDO.java`
- Create: `.../dal/dataobject/xunjing/XjCrawlAssetDO.java`
- Create: `.../service/xunjing/crawler/XjCrawlerService.java`
- Create: `.../controller/admin/xunjing/crawler/XjCrawlerController.java`
- Create: `.../job/xunjing/XjCrawlerRunJob.java`

**Interfaces:**
- Consumes crawler gateway contracts from `xingheai/services/crawler-gateway`.
- Produces Yudao-managed crawl jobs, crawl assets and review flow.

- [ ] **Step 1: Implement crawl job states**

States:

```text
0 draft
1 queued
2 running
3 succeeded
4 failed
5 reviewed
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

Only reviewed crawl assets can publish into:

```text
Yudao AI knowledge document
xj_media_asset
```

- [ ] **Step 4: Run tests**

Run:

```bash
cd backend/yudao
mvn -pl yudao-module-xunjing/yudao-module-xunjing-server -Dtest=XjCrawlerServiceImplTest test
```

Expected: missing license note fails, reviewed asset can publish.

- [ ] **Step 5: Commit crawler intake**

Run:

```bash
git add backend/yudao/yudao-module-xunjing
git commit -m "feat: add xunjing crawler intake"
```

## Task 10: Yudao Admin UI And Menus

**Files:**
- Create: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xinghe/xunjing/scenicArea/index.ts`
- Create: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xinghe/xunjing/mediaAsset/index.ts`
- Create: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xinghe/xunjing/qrcode/index.ts`
- Create: `backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xinghe/xunjing/scenicArea/index.vue`
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
  地区管理
  景区管理
  景点管理
  官方攻略
  打卡点
  图书管理
  章节管理
  影像资产库
  二维码管理
  采集审核
  用户作品
  AI生成日志
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

## Task 11: Seed Data And End-to-End Backend Smoke

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
1 scenic area: 喀什古城
5 scenic spots
1 official guide
5 checkin spots
1 AI companion role mapping
1 knowledge mapping
1 book
10 book chapters
20 media assets
2 QR codes: scenic and reading chapter
```

- [ ] **Step 2: Run backend smoke**

Smoke cases:

```text
GET /app-api/xinghe/xunjing/home
POST /app-api/xinghe/xunjing/scan/resolve
GET /app-api/xinghe/xunjing/scenic/companion
POST /app-api/xinghe/xunjing/ai/chat
POST /app-api/xinghe/xunjing/reading/start
POST /app-api/xinghe/xunjing/trip/generate
GET /admin-api/xinghe/xunjing/dashboard/summary
```

- [ ] **Step 3: Verify RAG source rule**

Smoke must fail the build if `ai/chat` or `reading/ask` returns an answer without `sources`.

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
- Admin can create scenic area, scenic spot, guide, book chapter, media asset and QR code.
- Media asset has copyright, license, audit and AI-use controls.
- QR resolve API returns target type, target id, path and params.
- AI chat and reading ask return answer plus sources.
- Every AI call writes `xj_ai_generation_log`.
- Crawler result cannot enter knowledge or media library before review.
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
