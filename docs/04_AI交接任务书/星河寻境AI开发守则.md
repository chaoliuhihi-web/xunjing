# 星河寻境 AI 开发守则

更新时间：2026-06-30

本守则给接手星河寻境的其它 AI 和工程师使用。任何开发前必须先读本文件，再按当前任务范围执行。这里的目标不是替代产品 PRD，而是防止分支、目录、接口、安全和上线门禁失控。

## 一、必读顺序

1. `AGENTS.md`
2. `README.md`
3. `docs/00_项目总览/资料索引.md`
4. `docs/02_开发规划/开发入口说明.md`
5. `docs/02_开发规划/城市AI旅伴产品代码结构与多AI协作规范.md`
6. `docs/04_AI交接任务书/星河寻境AI开发守则.md`
7. 做西城 P0 APP UI 时，再读 `assets/references/APP/xicheng-multimodal/design-mockups/p0-ui-approved-20260630/00-page-reference-index.md`、`20-frontend-implementation-handoff.md`、`21-main-thread-prompt.md`

如果文档之间出现冲突，优先级为：用户最新明确指令 > `AGENTS.md` > 本守则 > 交接任务书 > 历史规划文档。

## 二、代码同步和分支

1. 默认先从 GitHub 同步最新代码：

```bash
git fetch --all --prune
git checkout feature/xicheng-p0
git pull --ff-only
```

2. 当前西城 P0 只使用两个长期分支：
   - `product/city-companion-main`：稳定主线，不直接开发。
   - `feature/xicheng-p0`：当前西城 P0 唯一开发分支。
3. 不要新开 `feat/*`、`docs/*`、`qa/*` 等临时分支，除非用户在当次任务里明确要求。
4. 不要推 `master`，不要直接推 `product/city-companion-main`。
5. 提交后必须同步推送到 GitHub 和 Gitee：

```bash
git push github feature/xicheng-p0
git push origin feature/xicheng-p0
```

6. 推送后用下面命令确认双端一致：

```bash
git rev-list --left-right --count HEAD...github/feature/xicheng-p0
git rev-list --left-right --count HEAD...origin/feature/xicheng-p0
```

两个结果都应为 `0 0`。

## 三、仓库边界

1. 根仓库是正式交付仓库，不要把 `assets/references/APP/kashgar-mini-program/.git` 当作整项目交付目标。
2. 当前 APP 开发范围默认只限：

```text
assets/references/APP/kashgar-mini-program/
```

3. 未经用户明确要求，不要修改：

```text
backend/yudao/
backend/yudao/sql/mysql/
scripts/
```

4. 临时文件、截图、构建物、浏览器日志只能放入 `tmp/`、`workbench/`、`.playwright-mcp/`、`qa/` 或已有约定目录，不要散落到仓库根目录。
5. 不要提交 `node_modules/`、`dist/`、`unpackage/`、`tmp/`、`workbench/`、`.playwright-mcp/`、密钥、真实 token、发布包或调试日志。

## 四、工作树纪律

1. 动手前必须看清工作树：

```bash
git status --short --branch --untracked-files=all
```

2. 不要删除、重置、覆盖用户未提交改动。
3. 如果发现与本任务无关的脏文件，只说明并绕开，不要顺手整理。
4. 提交时只 stage 本任务文件，不要把设计稿、构建产物、父线程正在修改的 APP 文件夹带进去。

## 五、产品架构原则

1. 产品形态采用“通用城市旅伴底座 + 城市内容包”。
2. 喀什代码是可复用基线，不是西城体验的最终形态。
3. 西城 P0 主链优先闭环：

```text
西城首页 -> 扫一扫/拍照/OCR/GPS/文本识别 -> 识别结果页 -> 带 regionCode + poiCode + poiName 进入小京 -> 展示 AI 回答和来源 -> 开始记录 -> 生成游记草稿
```

4. 运营增长能力优先落在 P0 可运营功能上：路线护照、打卡徽章、亲子研学任务、分享海报、作品审核、PDF 纪念册、城市运营报告。
5. “一键抄作业”类功能可以借鉴 Gooh 旅记、圆周旅迹，但必须做成官方可控链路：

```text
导入灵感 -> AI 提取地点 -> 匹配官方 POI -> 生成可走路线 -> 用户确认 -> 可分享/可审核
```

## 六、APP 前端规则

1. 不要继续向 `pages/index/index.vue`、`pages/ai-guide/ai-guide.vue`、`pages/xicheng/travelogue/travelogue.vue` 堆代码。
2. APP 单页面文件硬上限为 3500 行，接近 3200 行就应该拆组件、配置、请求层或样式文件。
3. 优先复用和扩展这些位置：

```text
assets/references/APP/kashgar-mini-program/config/regions/xicheng.js
assets/references/APP/kashgar-mini-program/request/xunjing/
assets/references/APP/kashgar-mini-program/components/xicheng/
assets/references/APP/kashgar-mini-program/pages/xicheng/
```

4. 新增页面时必须同步检查：
   - `pages.json`
   - `App.vue` 公共路由/样式
   - 相关 `tests/*.test.mjs`
   - 页面行数门禁
5. 页面设计要贴合新版 UI 参考目录，不要恢复成喀什默认视觉或脚手架默认视觉。

## 七、接口和安全契约

1. `/app-api/xunjing/**` 请求必须带 `tenant-id`。
2. 西城 P0 前端必须对齐后端字段：
   - `suggestedQuestions`
   - `sources`
   - `safetyStatus`
3. `safetyStatus=BLOCKED` 时，小京页只能显示：

```text
无已审核来源，不能回答
```

4. `BLOCKED` 场景不得本地编造讲解、不得用前端 mock 兜底成真实回答。
5. 识别结果页必须展示 `sources`，让用户能看见来源依据。
6. 生产模式不能把 `XICHENG_DEVELOPMENT_TRIGGER_FIXTURE` 当真实识别结果。
7. 如果必须改后端接口，先停止并说明需要后端处理，不要擅自改 `backend/yudao/`。

## 八、验证门禁

改 APP 前端至少运行：

```bash
cd assets/references/APP/kashgar-mini-program
for f in tests/*.test.mjs; do node "$f" || exit 1; done
npm run build
```

改根项目至少运行：

```bash
npm run test:run
```

改 APP 页面结构时，必须确认页面文件没有超过 3500 行，并确保相关门禁仍通过。

提交前至少运行：

```bash
git diff --check
```

## 九、上线判断口径

1. 测试通过不等于可以上线。
2. 上线至少还要有真实 AppID、HTTPS 后端域名、真实 OCR/视觉识别服务、上传和对象存储配置、已审核的西城 POI/路线/知识来源。
3. 无法验证真实生产链路时，只能说“本地候选通过”或“测试门禁通过”，不能说“已可上线”。

## 十、交接输出格式

其它 AI 完成任务后，必须给出：

1. 改了哪些文件。
2. 跑了哪些命令，结果是什么。
3. 是否提交，提交 hash 是什么。
4. 是否已同步 GitHub 和 Gitee。
5. 当前还剩哪些 blocker 或需要人工配置的事项。
