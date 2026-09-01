# 寻境 C 端完整产品技术实施蓝图 v1.0

- 文档日期：2026-09-01
- 状态：CURRENT / IMPLEMENTATION BASELINE
- 产品依据：[寻境 C 端产品功能文档 v1.4](../01_产品规划/寻境C端产品功能文档_v1.4.md)
- 对象依据：[寻境业务对象与状态机文档 v1.2](../01_产品规划/寻境业务对象与状态机文档_v1.2.md)
- 执行入口：[寻境 C 端完整产品 AI 实施任务书 v1.0](../04_AI交接任务书/寻境C端完整产品AI实施任务书_v1.0.md)
- 验收依据：[寻境 C 端 P0 验收门禁 v1.0](../05_验收与证据/寻境C端P0验收门禁_v1.0.md)

## 1. 实施目标

在不另起技术栈、不重置现有未提交工作的前提下，把仓库里已经存在的路线、轻记录、成书 Worker、UniApp 页面和 Yudao 网关收敛成一款完整 C 端产品：

```text
小红书 / 抖音 / 视频号 / 自然访问
  -> H5 / 微信小程序双入口
  -> 行前计划或行后照片识别
  -> 同一个 Trip
  -> 计划 / 轻记录 / 实际旅程 / 数字作品
  -> 旅行书保护性预览
  -> 一次付款
  -> 印刷、物流、售后
  -> 作品库与个人旅行档案
```

“完整”表示六个产品闭环均有真实可运行路径；“落地”表示每条路径都有持久化、错误回退、真实接口和可重复验收。当前不实施合作方、加盟、分润和结算。

## 2. 当前代码事实与缺口

以下判断只描述当前仓库可见实现，不等于生产上线结论。

### 2.1 已有可复用资产

| 能力 | 当前位置 | 可复用结论 |
| --- | --- | --- |
| UniApp/H5/小程序基座 | `assets/references/APP/kashgar-mini-program/` | 继续作为 C 端正式前端，不另建平行 App |
| 行程导入和路线页面 | `pages/xicheng/inspiration/`、`pages/xicheng/routes/`、`pages/xicheng/route-detail/`、`request/xunjing/inspiration*.js` | 去除西城硬编码后并入通用 Trip |
| 行中记录与作品页 | `pages/xicheng/recording/`、`pages/xicheng/works/`、轨迹和素材相关组件 | 降低操作强度后复用 |
| 独立旅行书页面 | `pages/memory-book/app/app.vue` | 作为“旅行结束做作品”入口的迁移基础 |
| 成书云端客户端 | `request/xunjing/memoryBookCloud.js` | 已具备任务创建、代理图/原图上传、提交、修改、查询和制品访问契约 |
| Yudao 成书网关 | `controller/app/memorybook/`、`service/memorybook/` | 可继续代理 Worker，但鉴权、持久业务对象和错误模型需升级 |
| 成书 Worker | `services/memory-book-worker/` | 已有真实照片输入、Codex 编辑、SVG/PDF、逐页预览和机械 QA 基础 |
| 部署与门禁 | `ops/compose.prod.yml`、`scripts/memory-book-cloud-workflow.test.mjs`、根 `package.json` | 继续扩展，不创建 demo-only 发布路径 |
| Yudao 平台基座 | `backend/yudao/yudao-module-xunjing/` | Trip、作品、订单、履约业务继续进入本模块 |

### 2.2 当前必须解决的差距

1. 前端仍混有“拾光旅行书”、西城专属入口、三档套餐和定金/尾款等旧口径，与当前“寻境、双入口、单一标准书型、一次付款”冲突。
2. 独立旅行书页面已有本地作品模型，但尚未成为统一 `Trip`、`StoryProject`、`BookVersion`、`Order` 的服务端业务闭环。
3. 当前成书网关使用 `@PermitAll + owner token` 保护任务，适合作为过渡上传能力，不足以独立承担生产账户、隐私、订单和售后权限。
4. 当前 Worker API 能执行成书，但生产对象存储、持久队列、任务幂等、跨实例恢复、删除传播和容量门禁必须逐项验证，不能由本地 volume 或进程内状态代替。
5. 行前攻略、路线、行中记录、行后照片和旅行书仍分散在不同页面/本地模型，缺少统一 Trip API 和版本关系。
6. 动态预演、计划电影和真实回忆电影没有形成同一套可持久化、可回看、可分享的制品契约。
7. 当前未形成真实的一次付款、印刷任务、物流、退款、重印和用户订单查询闭环。
8. 小红书、抖音、视频号只在运营思路中存在，尚需可审计的 `sourcePlatform/sourceContentId/sourceCampaignId` 进入旅程和订单漏斗。

## 3. 目标技术架构

```text
H5 / 微信小程序 / UniApp APP
        |
        | /app-api/xunjing/** + tenant-id + user session
        v
Yudao yudao-module-xunjing
  ├─ Trip / Member / Invite
  ├─ PlanSource / PlanVersion / PreviewJob
  ├─ CheckIn / MediaAsset / ActualVisit
  ├─ StoryProject / MovieVersion / BookVersion
  ├─ Order / PaymentRecord / PrintJob / Shipment / AfterSaleCase
  └─ Admin：任务、例外、订单、履约、质量
        |
        ├─ MySQL：业务事实和状态
        ├─ Redis/队列：短期锁、幂等和异步任务协调
        ├─ 对象存储：原图、代理图、SVG、PDF、视频、QA
        ├─ 合规地图/POI 服务：地点匹配、路线显示、导航调起
        └─ Memory Book Worker / Movie Render Worker
```

### 3.1 所有权边界

- Yudao 是账户、权限、业务状态、订单和审计事实源。
- Worker 只执行可重试的媒体/成书任务，不拥有用户、订单和最终业务状态。
- 对象存储保存二进制；MySQL 只保存对象键、哈希、元数据和状态，不把原图写进数据库。
- 客户端只保存短期草稿和上传进度；任何“我的作品”“订单”“已完成”都以服务端为准。
- AI 负责提取、组织、生成和解释；确定性代码负责权限、状态、金额、哈希、页数、质量阈值和履约。

## 4. 代码落点

### 4.1 C 端

继续使用：

```text
assets/references/APP/kashgar-mini-program/
├── pages/                         # 页面壳和用户流程
├── components/xicheng/           # 可迁移的路线、作品、翻阅组件
├── modules/                       # 纯业务规则和客户端模型
├── request/xunjing/               # /app-api/xunjing/** 请求层
├── static/                        # 小体积正式静态资源
└── tests/                         # 可执行契约与页面测试
```

实施约束：

- 新通用代码使用 `xunjing` 或 `trip` 命名，不继续增加 `xicheng` 硬编码。
- 旧西城页面通过薄适配层复用通用组件，不能复制一套新业务逻辑。
- 页面只处理展示与交互；状态归一化、金额、排序、上传清单等放 `modules/` 或请求层。
- H5/小程序必须能完成首单；APP 仅增强完整轨迹、弱网和长期管理。

### 4.2 Yudao

继续使用：

```text
backend/yudao/yudao-module-xunjing/
└── src/main/java/cn/iocoder/yudao/module/xunjing/
    ├── controller/app/            # C 端 API
    ├── controller/admin/          # 运营后台 API
    ├── dal/dataobject/            # DO
    ├── dal/mysql/                 # Mapper
    ├── service/                   # 业务服务
    └── enums/                     # 状态和错误码
```

建议按子包建立 `trip`、`plan`、`journey`、`story`、`memorybook`、`order`，不新增独立 Maven 业务模块，不把旅行产品塞进 `yudao-module-ai`。

SQL 进入：

```text
backend/yudao/sql/mysql/xunjing-module.sql
backend/yudao/yudao-module-xunjing/src/test/resources/sql/
```

### 4.3 Worker 与制品

```text
services/memory-book-worker/
├── app/                            # 任务 API、编辑、排版和渲染
└── tests/                          # PDF/渲染/任务行为测试
```

生产任务必须包含：`jobNo`、`tenantId`、`userId`、`tripId`、输入 manifest 哈希、引擎版本、重试次数、输出哈希和错误代码。代理图用于快速首版，正式印刷版必须从原图重新生成并通过 QA。

## 5. 目标业务表

最终字段以 v1.2 状态机文档和数据库迁移为准。P0 至少需要以下业务表或等价持久对象：

```text
xunjing_trip
xunjing_trip_member
xunjing_trip_invite
xunjing_plan_source
xunjing_plan_version
xunjing_planned_day
xunjing_planned_waypoint
xunjing_planned_leg
xunjing_check_in
xunjing_media_asset
xunjing_actual_visit
xunjing_memory_event
xunjing_story_project
xunjing_movie_version
xunjing_book_version
xunjing_revision_request
xunjing_quality_check
xunjing_exception_review_case
xunjing_order
xunjing_payment_record
xunjing_print_job
xunjing_shipment
xunjing_after_sale_case
```

所有表包含 `tenant_id`、创建/更新时间、逻辑删除和必要审计字段。金额统一使用整数分；状态存稳定枚举码；外部文件只保存对象键和 SHA-256。

## 6. 目标 APP API 契约

以下为目标路径；实现前先搜索现有 Controller 和 VO，能扩展则不新建重复接口。所有 API 返回 Yudao `CommonResult`，必须带 `tenant-id`，上传原图和访问私人制品必须校验当前用户或受限临时令牌。

| 领域 | 方法与路径 | P0 结果 |
| --- | --- | --- |
| 旅程 | `POST /app-api/xunjing/trips` | 创建行前或行后 Trip |
| 旅程 | `GET /app-api/xunjing/trips/{id}` | 返回当前计划、实际旅程、作品和订单摘要 |
| 旅程 | `GET /app-api/xunjing/trips` | 当前用户的即将出发、旅行中、已完成列表 |
| 攻略 | `POST /app-api/xunjing/trips/{id}/plan-sources` | 提交 URL、正文或截图来源 |
| 攻略 | `GET /app-api/xunjing/plan-source-jobs/{jobNo}` | 查询解析状态、错误和回退要求 |
| 计划 | `PUT /app-api/xunjing/trips/{id}/plan` | 保存新的 `PlanVersion` |
| 预演 | `POST /app-api/xunjing/trips/{id}/preview-jobs` | 生成计划预演 |
| 邀请 | `POST /app-api/xunjing/trips/{id}/invites` | 创建只看或加入邀请 |
| 轻记录 | `POST /app-api/xunjing/trips/{id}/check-ins` | 保存“记下这里” |
| 素材 | `POST /app-api/xunjing/trips/{id}/upload-sessions` | 创建可恢复上传会话 |
| 素材 | `POST /app-api/xunjing/upload-sessions/{id}/complete` | 校验对象、数量、哈希并结束上传 |
| 重建 | `POST /app-api/xunjing/trips/{id}/reconstruction-jobs` | 从照片/计划/可选记录重建实际旅程 |
| 作品 | `POST /app-api/xunjing/trips/{id}/story-projects` | 创建故事、电影和书共享工程 |
| 电影 | `POST /app-api/xunjing/story-projects/{id}/movie-versions` | 创建计划或回忆电影版本 |
| 成书 | `POST /app-api/xunjing/story-projects/{id}/book-versions` | 创建旅行书版本；内部可复用现有 memory-books 网关 |
| 修改 | `POST /app-api/xunjing/book-versions/{id}/revisions` | 提交受限自然语言修改 |
| 订单 | `POST /app-api/xunjing/orders` | 根据已确认书稿和 SKU 创建订单 |
| 支付 | `POST /app-api/xunjing/orders/{id}/payment` | 创建一次付款单，服务端计算金额 |
| 履约 | `GET /app-api/xunjing/orders/{id}` | 查询支付、印刷、物流和售后状态 |
| 删除 | `DELETE /app-api/xunjing/trips/{id}` | 创建覆盖业务记录和对象存储的删除任务 |

API 必须使用 DTO/VO，不允许 `Map<String,Object>` 继续扩张到新业务接口。现有成书 `Map` 网关只能在迁移期保留，并需在任务 `XJ-C1-04` 中封装成类型化内部适配器。

## 7. 身份、隐私与权限

- 案例页和保护性样书可以匿名浏览。
- 选择原始照片前必须建立可恢复身份：微信授权、手机号登录或受限临时账户；付款前必须绑定正式用户。
- 临时 owner token 只能访问单个草稿任务，必须短期有效、可撤销、不可枚举，不能替代用户账户和订单权限。
- `OWNER`、`MEMBER`、`VIEWER` 的权限按 v1.2 文档执行；VIEWER 不得读取原图、精确轨迹、订单和收货信息。
- 原图、儿童照片、EXIF/GPS、酒店和家庭地址按敏感数据处理；分享制品默认模糊精确位置。
- 删除任务必须覆盖原图、代理图、缓存、预览、SVG、PDF、视频和可删除备份，同时保留法律要求的最小支付记录。

## 8. 异步任务与幂等

以下动作必须异步：链接解析、批量媒体处理、旅程重建、电影渲染、成书、高清重建、删除传播。

统一要求：

1. 客户端生成稳定 `clientRequestId`，服务端创建 `jobNo`。
2. 相同用户、相同 Trip、相同请求哈希重复提交时返回已有任务，不重复扣费或渲染。
3. 任务状态、进度、错误码和重试次数持久化，服务重启后可恢复。
4. 自动重试只处理明确的瞬时错误；内容不合法、权限失败、原图缺失和 QA 失败必须人工或用户处理。
5. 所有制品记录输入 manifest、代码版本、模型版本、模板版本和输出 SHA-256。
6. `COMPLETED` 只能在制品实际存在、可读取且 QA 通过后写入。

## 9. 支付与履约边界

- P0 只保留一个标准书型和一个服务端 SKU，价格由服务端返回，客户端不得自行计算实付金额。
- 用户可完整翻阅低清或带保护标识的首版，确认规格后一次付款。
- 支付回调必须验签、幂等并与订单金额核对；客户端成功页不能把跳转成功当付款成功。
- 只有 `Order=PAID` 且 `BookVersion=APPROVED` 才能创建 `PrintJob`。
- 印刷、发货、签收、退款、补发和重印分别留痕，不覆盖原始记录。
- 没有真实支付商户和印刷供应商时，任务状态必须为 `BLOCKED_ENV`；允许测试沙箱，但不得宣称真实履约完成。

## 10. 可观测性与运营后台

P0 后台至少能查看：

- Trip、来源、用户和当前状态。
- 上传会话、照片数量、失败文件和恢复次数。
- 链接解析、重建、电影、成书和删除任务。
- 每次生成的版本、输入/输出哈希和 QA 结果。
- 需要人工处理的高影响问题和例外审核。
- 订单、支付回调、印刷、物流、退款和重印。
- 来源平台到上传、付款和签收的漏斗。
- 单单模型、存储、印刷、物流、支付、人工和售后成本。

禁止在日志中打印 owner token、身份证、手机号全量、收货地址、原图签名 URL 或第三方密钥。

## 11. 分阶段垂直切片

### M0：权威口径与基线

锁定品牌、双入口、一个 SKU、状态枚举、接口前缀、测试命令和真实缺口。输出基线证据，不改业务行为。

### M1：行后成书与真实交易

完成 `行后入口 -> Trip -> 上传 -> 重建 -> BookVersion -> 保护性预览 -> 一次付款 -> PrintJob -> Shipment`。这是第一个必须真实贯通的垂直切片。

### M2：行前计划与动态预演

完成 `链接/正文/截图 -> PlanVersion -> 路线核对 -> PreviewJob -> 同行查看`，失败时回退到正文、截图或手工地点。

### M3：轻行中

完成 `今日行程 -> 调起第三方导航 -> 记下这里 -> 共同素材`。完整轨迹为 P1，不阻断 P0。

### M4：数字作品与档案

完成故事、足迹卡、回忆电影、作品库和基础个人足迹；计划电影与回忆电影严格区分。

### M5：生产门禁与试运营

完成异常流、删除、隐私、容量、弱网、任务恢复、真实支付/印刷环境和 30–50 人试运营证据。

## 12. 不允许的实现捷径

- 不创建新的 `services/api`、第二套前端或第二个旅行书 Worker。
- 不把 localStorage 中的作品、订单和支付状态当生产事实。
- 不用固定 JSON、定时器、硬编码图片或“生成成功”文案代替真实任务。
- 不默认开启持续定位，也不把完整轨迹设为成书前提。
- 不让模型决定订单金额、支付结果、隐私权限、状态跳转和是否可印刷。
- 不绕过第三方平台登录、付费墙、验证码和反抓取控制。
- 不把合作方、加盟、佣金和结算夹带进当前 C 端任务。
- 不在当前脏工作树中重置或顺带提交无关代码。
