# 城市 AI 旅伴多 AI 协作任务书

更新时间：2026-06-27

## 接手目标

统一从 `product/city-companion-main` 接手，先把西城 AI 旅伴做成完整 P0 产品，再复用为喀什、其它城市和国家公园内容包。

不要再从 `handoff/xicheng-app-yudao-dev`、本地 `master`、旧压缩包或零散文件继续开发。

## 接手命令

GitHub 优先：

```bash
git clone https://github.com/chaoliuhihi-web/xunjing.git
cd xunjing
git fetch --all --prune
git checkout product/city-companion-main
git pull --ff-only
```

Gitee 备用：

```bash
git clone git@gitee.com:xinghetech/xinghexunjing.git
cd xinghexunjing
git fetch origin --prune
git checkout product/city-companion-main
git pull --ff-only
```

## 接手前必须阅读

1. `AGENTS.md`
2. `README.md`
3. `docs/00_项目总览/资料索引.md`
4. `docs/02_开发规划/开发入口说明.md`
5. `docs/02_开发规划/城市AI旅伴产品代码结构与多AI协作规范.md`
6. `docs/01_产品规划/西城AI旅伴真实试运营版_PRD_v0.2.md`
7. `docs/superpowers/specs/2026-06-27-xicheng-p0-full-loop-design.md`
8. `docs/04_AI交接任务书/城市AI旅伴多AI协作任务书.md`

## 当前主线范围

P0-Core：

1. 西城首页。
2. 拍照 / OCR / 定位识别。
3. 小京 AI 讲解。
4. 推荐路线。
5. Citywalk 轨迹记录。
6. 旅行素材盒。
7. 游记草稿。

P0-运营增长：

1. 路线护照。
2. 打卡任务。
3. 徽章。
4. 亲子研学任务。
5. 分享海报。
6. 作品审核。

P0-内容生产和汇报：

1. 一键导入灵感。
2. POI 匹配和用户确认。
3. PDF 纪念册。
4. 城市运营报告。

## 不进入当前主线

以下能力不进入西城 P0 主线：

1. 图书章节伴读。
2. 地球仪点位讲解。
3. 全网链接爬取。
4. 后台静默长期定位。
5. 复杂社交关系、排行榜和积分商城。
6. 酒店、机票、账单和旅游电商。

如果后续要恢复图书或地球仪，请单独开产品分支，不要混入 `product/city-companion-main`。

## 固定开发目录

APP：

```text
assets/references/APP/kashgar-mini-program/
```

Yudao 后台：

```text
backend/yudao/yudao-module-xunjing/
```

SQL：

```text
backend/yudao/sql/mysql/
```

门禁脚本：

```text
scripts/
```

文档：

```text
docs/
```

临时文件：

```text
tmp/
workbench/
qa/
```

## 分工任务卡

### AI-App

分支：

```bash
git checkout -b feat/app-xicheng-p0-home
```

优先任务：

1. 把西城首页从现有喀什页面中抽成 `region` 可配置模式。
2. 接入 `request/xunjing/trigger.js`。
3. 完成识别结果页、小京讲解入口、路线推荐入口。
4. 增加 APP 契约测试，覆盖 `tenant-id`、`regionCode`、`packageCode`、识别结果字段。

### AI-Backend-App

分支：

```bash
git checkout -b feat/backend-app-xicheng-trigger-chat
```

优先任务：

1. 拆分 `AppXunjingTriggerController` 和 `AppXunjingChatController`。
2. 将 trigger service 保持为真实 POI 识别，不依赖前端 mock。
3. AI 回答必须绑定来源；无来源返回阻断态。
4. 不在源码、测试快照或 Markdown 写真实密钥。

### AI-Backend-Admin

分支：

```bash
git checkout -b feat/backend-admin-xicheng-poi-route
```

优先任务：

1. 建立真实 POI、POI 别名、POI 来源、路线、路线点位后台管理。
2. 建立 SQL 和权限菜单。
3. 管理页只做运营录入、审核和复核，不做面向游客的页面。
4. 后台契约测试覆盖新增 API 和菜单权限。

### AI-QA

分支：

```bash
git checkout -b qa/xicheng-p0-gates
```

优先任务：

1. 固化 APP 静态契约测试。
2. 固化 Yudao SQL 契约测试。
3. 固化 Admin UI 契约测试。
4. 生成 release evidence，区分本地候选、生产预览和真实上线。

### AI-Product

分支：

```bash
git checkout -b docs/city-companion-p0-task-cards
```

优先任务：

1. 把 `docs/superpowers/specs/2026-06-27-xicheng-p0-full-loop-design.md` 拆成可执行任务卡。
2. 明确 P0 / P1 / 后置边界。
3. 为喀什复用补内容包字段清单。

## 提交规则

每个 AI 提交前运行：

```bash
git status --short
git diff --check
```

涉及根目录脚本：

```bash
npm run test:run
```

涉及 APP：

```bash
cd assets/references/APP/kashgar-mini-program
npm test
npm run build
```

涉及 Yudao 静态门禁：

```bash
npm run xunjing:platform:verify:static
```

提交信息示例：

```text
feat: add xicheng trigger app contract
feat: add xicheng poi admin schema
test: cover xicheng city companion gates
docs: add city companion task cards
```

## 推送规则

功能分支推 GitHub：

```bash
git push -u github <branch>
```

需要国内设备接手时同步推 Gitee：

```bash
git push -u origin <branch>
```

长期主线只由集成负责人推送：

```bash
git push github product/city-companion-main
git push origin product/city-companion-main
```

## 当前上线硬阻塞

1. 真实微信 AppID。
2. HTTPS 后端域名。
3. OCR / 视觉识别服务。
4. 上传凭证和对象存储。
5. 审核过的西城 POI、路线和知识来源。

这些阻塞只能通过真实配置和真实验收关闭。
