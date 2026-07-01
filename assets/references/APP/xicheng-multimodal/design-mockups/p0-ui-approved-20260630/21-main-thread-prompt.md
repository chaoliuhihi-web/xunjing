# 给主线程的前端开发提示词

你接手星河寻境西城 P0 APP 前端开发。请按下面要求继续，不要另起分支。

仓库：

- GitHub: `git@github.com:chaoliuhihi-web/xunjing.git`
- Gitee: `git@gitee.com:xinghetech/xinghexunjing.git`

分支：

- 稳定主线：`product/city-companion-main`，不直接开发
- 当前开发分支：`feature/xicheng-p0`

先执行：

```bash
git fetch --all --prune
git checkout feature/xicheng-p0
git pull --ff-only
```

开发范围：

- 只改 `assets/references/APP/kashgar-mini-program/`
- UI 参考和交接文档在：`assets/references/APP/xicheng-multimodal/design-mockups/p0-ui-approved-20260630/`
- 先读：
  - `00-page-reference-index.md`
  - `20-frontend-implementation-handoff.md`
  - `01` 到 `19` 是主链路页面，`30` 到 `38` 是权限、不可用、暂停、素材不足、未登录和隐私公开范围等补充分支状态页，`39` 到 `44` 是游记预览、编辑、朋友圈、小红书和 PDF 打印发布闭环，`45` 到 `48` 是游记模板化生成和长期回看体验。

不要改：

- `backend/yudao/`
- `backend/yudao/sql/mysql/`
- `scripts/`

除非用户明确要求。

目标：

按 `p0-ui-approved-20260630` 的 `01` 到 `19` 页面参考图，把西城 APP P0 客户端页面实现完整。主链路必须跑通：

`西城首页 -> 扫一扫/拍照/OCR/GPS/文本识别 -> 识别结果页 -> 带 regionCode + poiCode + poiName 进入小京 -> 展示 AI 回答和来源 -> 路线记录 -> 生成游记草稿 -> 选择模板 -> 模板定制 -> 精美游记阅读 -> 发布到星河/朋友圈/小红书 -> PDF 打印`

优先级：

1. 首页、扫一扫、识别结果、小京问答先对齐新版 UI。
2. 扫一扫必须是一个主入口，自动识别内容，不要做多个入口选择。
3. 识别结果页必须展示 `sources`。
4. 小京问答页必须处理 `suggestedQuestions`、`sources`、`safetyStatus=BLOCKED`。
5. `safetyStatus=BLOCKED` 时只显示“无已审核来源，不能回答”，不要本地编造。
6. 保持所有 `/app-api/xunjing/**` 请求带 `tenant-id`。
7. 生产模式不能把 `XICHENG_DEVELOPMENT_TRIGGER_FIXTURE` 当真实结果。
8. 新增功能不要继续堆进 `ai-guide.vue`、`travelogue.vue`；接近 3500 行必须拆组件或新增页面。
9. 西城页面系统图标统一用 `components/xicheng-icon/xicheng-icon.vue`，不要手写 `‹`、`›`、`▶`、`↻`，也不要复用旧 `/static/tabbar/*.png` 做系统图标。
10. 游记发布必须支持游记预览、深度编辑、发布渠道、朋友圈预览、小红书预览、PDF 打印预览。
11. 朋友圈、小红书发布按系统分享或平台 SDK 唤起用户确认；客户端不得绕过平台规则静默发布。
12. PDF 纪念册必须支持保存 PDF、预览全部页面、A4 打印设置、系统打印或分享 PDF。
13. 游记生成必须支持模板选择和模板定制，让图片与文字按模板自动精排，成品适合长期收藏和随时回看。

需要新增或补齐的页面：

- `pages/xicheng/poi/poi.vue`
- `pages/xicheng/footprint/footprint.vue`
- `pages/xicheng/recording/recording.vue`
- `pages/xicheng/passport/passport.vue`
- `pages/xicheng/share/share.vue`
- `pages/xicheng/works/works.vue`
- `pages/xicheng/ops-report/ops-report.vue`
- `pages/xicheng/pdf-print/pdf-print.vue`
- `pages/xicheng/travelogue-reader/travelogue-reader.vue`

优先拆这些组件：

- `components/xicheng-icon/xicheng-icon.vue`：已落地，业务语义名包括 `back`、`next`、`edit`、`refresh`、`play`、`qa`、`source`、`locked`、`route`、`passport`、`study`、`explore`、`routes`、`travelogue`、`mine`
- `components/xicheng/XichengPageShell.vue`
- `components/xicheng/XichengXiaojingHero.vue`
- `components/xicheng/XichengSourceList.vue`
- `components/xicheng/XichengStatusEmpty.vue`
- `components/xicheng/XichengPoiCard.vue`
- `components/xicheng/XichengRouteCard.vue`
- `components/xicheng/XichengBottomActionBar.vue`
- `components/xicheng/XichengPassportStamp.vue`
- `components/xicheng/XichengWorkReviewCard.vue`

验证要求：

```bash
cd assets/references/APP/kashgar-mini-program
for f in tests/*.test.mjs; do node "$f" || exit 1; done
npm run build
node tests/xicheng-app-page-size-budget.test.mjs
cd /Users/bruce/Developer/work/AI文旅/01_星河寻境
npm run test:run
```

提交规则：

- 小步提交，小步推送到 `feature/xicheng-p0`
- 不推 `master`
- 不推 `product/city-companion-main`
- 不提交 `node_modules/`、`dist/`、`unpackage/`、`tmp/`、密钥、真实 token
- 提交后同步推 GitHub 和 Gitee

如果发现必须改后端接口，先停止并说明需要用户处理，不要自己改 `backend/yudao/`。
