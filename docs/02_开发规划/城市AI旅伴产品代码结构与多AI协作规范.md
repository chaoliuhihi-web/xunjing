# 城市 AI 旅伴产品代码结构与多 AI 协作规范

更新时间：2026-06-27

## 结论

星河寻境后续不再按“西城一次性项目”组织代码，而是按“城市 / 景区 / 国家公园 AI 旅伴产品底座 + 内容包”组织。

当前首个产品内容包是西城。西城先把 P0 做完整，后续喀什、其它城市和国家公园应主要替换区域配置、POI、路线、素材、知识库、视觉资产和运营模板，不复制一套业务代码。

## 统一分支

长期开发分支：

```text
product/city-companion-main
```

分支来源：

```text
origin/master @ 6476c6c
+ cherry-pick github/codex/xicheng-p0-full-loop-docs-github @ f1335a7
```

不要继续使用以下分支作为开发主线：

```text
handoff/xicheng-app-yudao-dev
```

该分支只作为混合现场保留，不再提交、不再推送、不再要求其它设备 checkout。

## 远端策略

GitHub 作为协作中心：

```text
github = https://github.com/chaoliuhihi-web/xunjing.git
```

Gitee 作为同步远端和国内部署备份：

```text
origin = git@gitee.com:xinghetech/xinghexunjing.git
```

所有长期分支和 release 分支必须同步推送到两个远端。功能分支至少推 GitHub；需要给国内设备接手时同步推 Gitee。

禁止直接推送：

```text
main
master
product/city-companion-main
release/*
```

功能开发必须从 `product/city-companion-main` 新建分支，通过 PR 或明确审核后合并。

## 产品分层

### 产品底座

产品底座包含通用能力：

1. 多模态识别：拍照、OCR、GPS、文本。
2. AI 讲解：绑定已审核来源，不允许无来源编造。
3. POI：真实点位、别名、识别关键词、内容来源、审核状态。
4. 路线：Citywalk、点位顺序、适合人群、时长和距离。
5. 轨迹和素材盒：用户主动记录照片、OCR、定位、识别、备注和任务结果。
6. 游记：基于素材生成可编辑草稿。
7. 分享：海报、PDF 纪念册。
8. 运营：作品审核、城市运营报告、误触发和内容优化建议。

### 内容包

内容包只承载区域差异：

```text
regionCode
regionName
companionName
defaultPackageCode
uiProfileJson
aiPromptProfileJson
triggerProfileJson
POI seed
route seed
task seed
badge seed
visual assets
report templates
```

西城内容包建议使用：

```text
regionCode = XICHENG
companionName = 小京
```

喀什内容包建议使用：

```text
regionCode = KASHGAR
companionName = 小星
```

国家公园内容包建议使用：

```text
regionCode = NATIONAL_PARK_<CODE>
companionName = 按项目配置
```

## 前端目录规划

当前 APP 代码继续放在：

```text
assets/references/APP/kashgar-mini-program/
```

短期不改顶层目录名，避免大规模迁移影响构建和历史。后续可在稳定后重命名为 `city-companion-mini-program`，重命名前必须单独开迁移分支。

目标内部结构：

```text
assets/references/APP/kashgar-mini-program/
  config/
    regions/
      xicheng.js
      kashgar.js
      national-park-template.js
  request/
    xunjing/
      trigger.js
      chat.js
      route.js
      track.js
      travelogue.js
      work.js
      report.js
  pages/
    xicheng/
      home/
      scan-result/
      ai-guide/
      route-detail/
      material-box/
      travelogue/
      passport/
  tests/
    xicheng-*.test.mjs
```

迁移原则：

1. 不在页面里硬编码西城业务常量，优先从 `config/regions/<region>.js` 读取。
2. 识别、问答、路线、轨迹、游记等 API 调用进入 `request/xunjing/`。
3. 页面可以先有 `pages/xicheng/`，但组件和请求层必须保持可复用。
4. 新增喀什或其它城市时，先新增 region config 和 seed，不复制整套页面。

## 后端目录规划

后端继续放在：

```text
backend/yudao/yudao-module-xunjing/
```

现有 `AppXunjingController` 和 `XunjingAppServiceImpl` 已经承担过多职责。后续新增能力时必须按领域拆分，不继续把所有逻辑塞回单文件。

目标结构：

```text
controller/app/
  AppXunjingTriggerController.java
  AppXunjingChatController.java
  AppXunjingRouteController.java
  AppXunjingTrackController.java
  AppXunjingTravelogueController.java
  AppXunjingWorkController.java
  AppXunjingReportController.java

service/app/
  trigger/
  chat/
  route/
  track/
  travelogue/
  work/
  report/

controller/admin/
  poi/
  route/
  task/
  badge/
  work/
  report/

dal/dataobject/
  region/
  poi/
  route/
  track/
  material/
  travelogue/
  work/
  report/

dal/mysql/
  region/
  poi/
  route/
  track/
  material/
  travelogue/
  work/
  report/
```

拆分规则：

1. 用户侧 API 只放 `/app-api/xunjing/**`。
2. 后台运营 API 只放 Yudao admin console。
3. controller 不写业务规则，只做请求校验、权限、返回包装。
4. service 按领域拆分，领域间通过明确 DTO 或 mapper 查询协作。
5. AI 调用、缓存、来源约束和安全拦截放在 chat / generation 相关 service，不散落到页面或 controller。

## SQL 规划

当前基础 SQL：

```text
backend/yudao/sql/mysql/xunjing-module.sql
backend/yudao/sql/mysql/xunjing-seed-kashgar-p0.sql
```

后续新增西城和城市旅伴表时，不建议继续无限扩展一个大 SQL 文件。建议拆分为：

```text
backend/yudao/sql/mysql/xunjing-core.sql
backend/yudao/sql/mysql/xunjing-city-companion.sql
backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql
backend/yudao/sql/mysql/xunjing-seed-kashgar-p0.sql
```

第一阶段如果为了兼容现有门禁仍需要保留 `xunjing-module.sql`，新增表可以先进入该文件，但必须同步维护 `xunjing-city-companion.sql` 的目标结构文档，避免后续迁移失控。

## 多 AI 分工

### AI-Product

负责：

1. PRD、任务书、验收标准。
2. 城市内容包字段定义。
3. P0 / P1 / 后置范围裁剪。
4. 每轮开发前确认不把图书、地球仪等旧方向混入西城主线。

默认分支：

```text
docs/city-companion-product-<date>
```

### AI-App

负责：

1. 小程序页面。
2. `request/xunjing/` 请求层。
3. 西城首页、识别结果、小京讲解、路线详情、素材盒、游记生成。
4. APP 静态测试和构建。

默认分支：

```text
feat/app-xicheng-<feature>
```

### AI-Backend-App

负责：

1. `/app-api/xunjing/**` 用户侧接口。
2. trigger、chat、route、track、travelogue、work、report service。
3. 真实来源约束、租户头、AI 成本和缓存。

默认分支：

```text
feat/backend-app-xicheng-<feature>
```

### AI-Backend-Admin

负责：

1. Yudao 后台菜单和管理页。
2. POI、路线、任务、徽章、作品审核、城市报告。
3. SQL、权限、Mapper、后台契约测试。

默认分支：

```text
feat/backend-admin-xicheng-<feature>
```

### AI-QA

负责：

1. 门禁脚本。
2. APP 契约测试。
3. Yudao SQL / API / Admin UI 契约测试。
4. release evidence。

默认分支：

```text
qa/xicheng-p0-<gate>
```

## 多设备接手命令

GitHub：

```bash
git clone https://github.com/chaoliuhihi-web/xunjing.git
cd xunjing
git fetch github --prune 2>/dev/null || true
git fetch origin --prune
git checkout product/city-companion-main
git pull --ff-only
```

Gitee：

```bash
git clone git@gitee.com:xinghetech/xinghexunjing.git
cd xinghexunjing
git fetch origin --prune
git checkout product/city-companion-main
git pull --ff-only
```

如果 clone 后没有 `github` remote：

```bash
git remote add github https://github.com/chaoliuhihi-web/xunjing.git
git fetch github --prune
```

## 功能开发流程

每个 AI 开始前：

```bash
git fetch --all --prune
git checkout product/city-companion-main
git pull --ff-only
git checkout -b feat/<scope>
```

每个 AI 提交前：

```bash
git status --short
git diff --check
npm run test:run
```

涉及 APP 时追加：

```bash
cd assets/references/APP/kashgar-mini-program
npm test
npm run build
```

涉及 Yudao / SQL / 门禁时追加：

```bash
npm run xunjing:platform:verify:static
```

如果本机缺 Java / Maven，必须在最终说明里明确“Java/Maven 未验证”，不能写“后端已完整通过编译”。

## PR 要求

PR 描述必须包含：

```text
目标：
改动范围：
不改范围：
涉及路径：
验证命令：
未验证项：
上线阻塞：
是否涉及密钥：
```

禁止在 PR 中提交：

```text
tmp/
workbench/
dist/
target/
node_modules/
.env
.runtime/
真实 API Key
Token
Cookie
```

## 当前上线硬阻塞

西城 APP 上线前仍需要真实资源：

1. 真实微信 AppID。
2. HTTPS 后端域名。
3. OCR / 视觉识别服务。
4. 上传凭证和对象存储配置。
5. 真实 POI、路线和审核过的知识来源。

这些阻塞不通过 mock、示例 key 或本地假接口关闭。
