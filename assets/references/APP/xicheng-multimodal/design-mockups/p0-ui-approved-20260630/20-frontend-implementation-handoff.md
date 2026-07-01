# 西城 P0 APP 前端页面实现交接

本交接面向 `assets/references/APP/kashgar-mini-program/` 的 UniApp 前端开发。实现时以本目录 `01` 到 `19` 的新版 UI 参考图为准，上一级旧版 `design-mockups/` 只作为历史参考，不再作为开发目标。

## 结论

当前 19 张页面参考图足够支撑西城 P0 客户端开发。它们覆盖了主链路、异常态、安全态、路线记录、游记分享、作品审核和运营报告。后续不需要先继续补视觉稿，可以进入前端实现。

## 强制边界

- 只改 `assets/references/APP/kashgar-mini-program/` 内前端代码，除非用户明确扩大范围。
- 不改 `backend/yudao/`、`backend/yudao/sql/mysql/`、`scripts/`。
- 不提交 `node_modules/`、`dist/`、`unpackage/`、`tmp/`、密钥、真实 token。
- APP 页面单文件不得超过 3500 行；`pages/ai-guide/ai-guide.vue` 和 `pages/xicheng/travelogue/travelogue.vue` 已接近 3000 行，新增功能必须拆页面或组件。
- `/app-api/xunjing/**` 请求必须保留 `tenant-id`。
- 生产模式不能把 `XICHENG_DEVELOPMENT_TRIGGER_FIXTURE` 当真实结果。

## 已有页面与新增页面

| UI 图 | 页面 | 当前状态 | 实现策略 |
| --- | --- | --- | --- |
| `01-home-xicheng-ai-companion.jpg` | 西城首页 | 已有 `pages/xicheng/home/home.vue` | 按新版视觉收敛第一屏和入口，不堆更多业务块 |
| `02-scan-auto-recognition-entry.jpg` | 扫一扫 | 已有 `pages/xicheng/scan/scan.vue` | 单入口自动识别；不要恢复多模式选择 |
| `03-recognition-result-sources.jpg` | 识别结果 | 已有 `pages/xicheng/scan-result/scan-result.vue` | 补强来源、推荐问题、进入小京参数 |
| `04-xiaojing-chat-answer-sources.jpg` | 问问小京 | 已有 `pages/ai-guide/ai-guide.vue` | 保留安全来源逻辑，视觉和来源卡片对齐 |
| `05-route-list-official-routes-import-guide-v3.png` | 文旅地图/路线列表 | 已有 `pages/xicheng/routes/routes.vue` | 对齐地图 POI、导入攻略、路线卡片、筛选、跳转 |
| `06-route-detail-cultural-route.jpg` | 路线详情 | 已有 `pages/xicheng/route-detail/route-detail.vue` | 强化地图、时间线、开始记录入口 |
| `07-poi-guide-baitasi.jpg` | POI 详情 | 未独立 | 新增 `pages/xicheng/poi/poi.vue` |
| `08-ai-guide-playback.jpg` | AI 讲解播放 | 可复用 `pages/ai-guide/ai-guide.vue` | 用 mode 或 context 区分播放态，不另堆大块逻辑 |
| `09-footprint-records-timeline.jpg` | 我的西城足迹 | 未独立 | 新增 `pages/xicheng/footprint/footprint.vue` |
| `10-travelogue-generate-draft.jpg` | 生成游记 | 已有 `pages/xicheng/travelogue/travelogue.vue` | 只保留生成/编辑主容器，复杂块拆组件 |
| `11-travelogue-editor-share-review.jpg` | 编辑游记/分享 | 已有 `pages/xicheng/travelogue/travelogue.vue` | 分享和审核入口拆到新分享页 |
| `12-inspiration-import-ai-poi-route.jpg` | 导入灵感 | 已有 `pages/xicheng/inspiration/inspiration.vue` | 保持“AI 提取地点 -> 匹配官方 POI -> 生成可走路线” |
| `13-city-ops-report-dashboard.jpg` | 城市运营报告 | 未独立 | 新增 `pages/xicheng/ops-report/ops-report.vue` |
| `14-recognition-empty-no-approved-source.jpg` | 识别失败/无来源 | 归属识别结果 | 作为 `scan-result` 的 empty/blocked 状态 |
| `15-xiaojing-blocked-no-source.jpg` | 小京 BLOCKED | 归属小京页 | 作为 `ai-guide` 的 BLOCKED 状态 |
| `16-route-recording-live-checkin.jpg` | 路线记录中 | 未独立 | 新增 `pages/xicheng/recording/recording.vue` |
| `17-route-passport-badges-study-tasks.jpg` | 路线护照/徽章/研学任务 | 未独立 | 新增 `pages/xicheng/passport/passport.vue` |
| `18-share-poster-pdf-memento-review.jpg` | 分享海报/PDF 纪念 | 未独立 | 新增 `pages/xicheng/share/share.vue` |
| `19-my-works-review-status.jpg` | 我的作品/审核状态 | 未独立 | 新增 `pages/xicheng/works/works.vue` |

补充分支状态页：

| UI 图 | 页面 | 当前状态 | 实现策略 |
| --- | --- | --- | --- |
| `30-map-poi-bottom-sheet-navigation.jpg` | 地图 POI 点击弹层 | 归属地图/POI | 地图点位点击后用底部弹层展示介绍、来源、问小京、加入路线和导航去这里 |
| `31-inspiration-generated-route-result.jpg` | 导入攻略生成路线结果 | 归属导入灵感 | AI 提取地点并匹配官方 POI 后，展示路线结果和开始记录入口 |
| `32-scan-permission-denied-fallback.jpg` | 扫一扫权限失败 | 归属扫一扫 | 相机/定位未授权时提供开启权限、上传图片、粘贴文字、手动输入 |
| `33-xiaojing-ai-unavailable-timeout.jpg` | 小京 AI 不可用 | 归属小京页 | AI 超时或不可用时不编造，展示重试和官方来源入口 |
| `34-route-recording-paused-finish.jpg` | 路线记录暂停/结束 | 归属路线记录中 | 支持暂停、继续、结束并生成游记素材 |
| `35-travelogue-insufficient-materials.jpg` | 游记素材不足 | 归属游记生成 | 素材不足时禁止生成草稿，引导补素材 |
| `36-travelogue-generation-failed-retry.jpg` | 游记生成失败 | 归属游记生成 | 生成失败保留素材，提供重试和手动编辑 |
| `37-my-logged-out-visitor-mode.jpg` | 我的未登录 | 归属我的 | 游客模式和手机号登录，登录后同步游记、草稿、收藏 |
| `38-privacy-public-scope-settings.jpg` | 公开范围设置 | 归属我的/分享 | 发布前设置正文、地点、照片、精确轨迹、问答记录公开范围 |

游记发布闭环补充页：

| UI 图 | 页面 | 当前状态 | 实现策略 |
| --- | --- | --- | --- |
| `39-travelogue-public-preview.jpg` | 游记公开预览 | 归属游记/分享 | 展示文章预览、来源、隐私状态，并提供继续编辑、生成 PDF、去发布 |
| `40-travelogue-rich-editor.jpg` | 游记深度编辑 | 归属游记编辑 | 标题、照片、路线、正文、小京补充和检查项拆成组件，避免继续扩大单文件 |
| `41-travelogue-publish-channel-settings.jpg` | 发布渠道设置 | 归属分享页 | 选择星河公开、朋友圈、小红书、PDF 打印，并展示发布前检查 |
| `42-travelogue-wechat-moments-preview.jpg` | 朋友圈发布预览 | 归属分享页 | 生成朋友圈图片、文案和标签，按系统能力唤起发布确认 |
| `43-travelogue-xiaohongshu-note-preview.jpg` | 小红书笔记预览 | 归属分享页 | 生成小红书标题、正文、图集和标签，按系统能力唤起发布确认 |
| `44-travelogue-pdf-print-preview.jpg` | PDF 打印预览 | 未独立 | 新增 `pages/xicheng/pdf-print/pdf-print.vue`，支持保存 PDF、预览全部和系统打印 |

## 页面流转

P0 主链路：

1. `home` 点击“扫一扫”进入 `scan`。
2. `scan` 自动识别二维码、拍照、OCR、GPS 或文本线索，统一进入 `scan-result`。
3. `scan-result` 展示 `poiName`、`poiCode`、`regionCode`、`sources`、`suggestedQuestions`。
4. `scan-result` 点击“问问小京”进入 `ai-guide`，必须带 `regionCode + poiCode + poiName + safetyStatus + sourceCount`。
5. `ai-guide` 展示 AI 回答、来源、推荐追问；`safetyStatus=BLOCKED` 时只显示“无已审核来源，不能回答”。
6. `route-detail` 点击“开始记录”进入 `recording`。
7. `recording` 完成打卡后进入 `passport` 或 `footprint`。
8. `footprint` 点击“生成今日游记”进入 `travelogue`。
9. `travelogue` 生成草稿后先进入游记预览和编辑，确认后进入 `share`。
10. `share` 选择星河公开、朋友圈、小红书和 PDF 打印；公开分享必须先完成隐私和来源检查。
11. `share` 的朋友圈/小红书只负责生成图片、文案、标签并唤起用户发布确认，不做静默发布。
12. `pdf-print` 生成可打印 PDF，支持保存 PDF、预览全部、系统打印或分享 PDF。
13. `works` 展示已发布、审核中、需修改作品。

运营扩展链路：

- `home/routes/inspiration` 都可以进入 `route-detail`。
- `route-detail/recording/passport` 都可以补充素材到 `travelogue`。
- `share` 可以生成朋友圈素材、小红书笔记素材、分享海报、PDF 纪念册和亲子研学报告。
- `ops-report` 只展示汇总数据和审核安全状态，不展示用户隐私。

## 接口字段与安全状态

识别结果和小京上下文必须统一使用这些字段：

```js
{
  regionCode: 'XICHENG',
  packageCode: 'xicheng-city-companion',
  sceneCode: 'xicheng-p0',
  sourceChannel: 'APP_UNIAPP',
  poiCode: 'baitasi',
  poiName: '白塔寺',
  safetyStatus: 'PASSED' | 'BLOCKED' | 'UNAVAILABLE',
  sources: [],
  sourceCount: 0,
  suggestedQuestions: []
}
```

处理规则：

- `sources` 为空且 `safetyStatus=BLOCKED`：不能展示 AI 编造内容。
- `safetyStatus=BLOCKED`：回答文案固定为“无已审核来源，不能回答”。
- `suggestedQuestions` 只展示后端或官方 POI 生成的安全问题。
- 进入小京时必须保留 `regionCode`、`poiCode`、`poiName`，便于缓存隔离和来源归因。

## 状态矩阵

| 场景 | 页面 | 必须展示 |
| --- | --- | --- |
| 正常识别 | `scan-result` | POI、置信度、来源、推荐问题、问小京入口 |
| 识别失败 | `scan-result` | “暂未识别到可信地点”、重新识别、输入文字、查看官方路线 |
| 无审核来源 | `scan-result` / `ai-guide` | “无已审核来源”、不能生成讲解或回答 |
| 小京 BLOCKED | `ai-guide` | “无已审核来源，不能回答”、来源 0 条、安全替代入口 |
| AI 超时/不可用 | `ai-guide` | 不编造，展示稍后重试和查看官方内容 |
| 权限未开启 | `scan` | 开启相机/定位权限、上传图片、粘贴文字、手动输入 |
| 路线记录中 | `recording` | 地图、进度、下一站、到达打卡、暂停记录 |
| 路线记录暂停 | `recording` | 暂停状态、继续记录、结束并生成游记素材 |
| 打卡完成 | `passport` | 印章、徽章、任务进度、继续路线 |
| 地图 POI 点击 | `routes` / `poi` | POI 简介、来源、问小京、加入路线、导航去这里 |
| 攻略导入成功 | `inspiration` | 匹配官方 POI、路线地图、开始记录、保存路线 |
| 游记草稿 | `travelogue` | 素材汇总、风格选择、草稿预览、继续编辑 |
| 游记素材不足 | `travelogue` | 禁止生成草稿、补素材清单、继续探索、添加照片 |
| 游记生成失败 | `travelogue` | 素材已保存、重新生成、手动编辑、失败原因 |
| 游记公开预览 | `travelogue` / `share` | 文章预览、来源、轨迹隐藏状态、继续编辑、生成 PDF、去发布 |
| 游记深度编辑 | `travelogue` | 标题、封面、照片、路线、正文、小京补充、隐私检查、来源检查 |
| 分享提交 | `share` | 渠道选择、海报/PDF 预览、朋友圈、小红书、隐私开关、提交审核 |
| 朋友圈发布 | `share` | 图片、文案、标签、隐私摘要、复制文案、保存图片、唤起发布确认 |
| 小红书发布 | `share` | 标题、正文、图集、标签、复制文案、保存图片、唤起发布确认 |
| PDF 打印 | `pdf-print` | A4 设置、页码预览、保存 PDF、预览全部、系统打印/分享 PDF |
| 未登录 | `works` | 游客模式、登录入口、登录后同步说明 |
| 公开范围设置 | `works` / `share` | 精确轨迹默认隐藏、正文/地点/照片/问答公开开关 |
| 作品审核中 | `works` | 审核中、预计时间、不可公开分享 |
| 作品需修改 | `works` | 驳回原因、继续编辑 |

## 组件拆分

优先新增这些组件，避免继续扩大页面文件：

- `components/xicheng/XichengPageShell.vue`：纸感背景、顶部栏、安全区。
- `components/xicheng/XichengXiaojingHero.vue`：小京人物、气泡、场景头图。
- `components/xicheng/XichengSourceList.vue`：资料来源、审核状态、BLOCKED 提示。
- `components/xicheng/XichengStatusEmpty.vue`：识别失败、无来源、审核中、需修改。
- `components/xicheng/XichengPoiCard.vue`：POI 卡片、识别标签、位置。
- `components/xicheng/XichengRouteCard.vue`：路线卡片、时长、站点。
- `components/xicheng/XichengBottomActionBar.vue`：底部主操作按钮。
- `components/xicheng/XichengPassportStamp.vue`：路线护照打卡印章、徽章和锁定状态。
- `components/xicheng/XichengWorkReviewCard.vue`：作品审核状态、驳回原因、继续编辑入口。
- `components/xicheng/XichengTraveloguePreview.vue`：游记公开预览、来源和隐私状态。
- `components/xicheng/XichengPublishChannelGrid.vue`：星河公开、朋友圈、小红书、PDF 打印渠道选择。
- `components/xicheng/XichengSocialSharePreview.vue`：朋友圈/小红书发布素材预览。
- `components/xicheng/XichengPdfPrintPreview.vue`：PDF 页码预览、A4 设置和系统打印入口。

公共数据、格式化与安全判断放到 `request/xunjing/` 或独立配置文件，不要散落在页面模板里。

## 图标体系

西城 P0 页面统一使用 `components/xicheng-icon/xicheng-icon.vue`，底层复用 `uni-icons`，页面只传业务语义名，不直接写 `uni-icons` 类型。

已落地业务语义：

- 导航和操作：`back`、`next`、`edit`、`refresh`、`play`、`qa`
- 识别和地图：`scan`、`photo`、`ocr`、`text`、`location`、`layer`、`source`、`locked`
- 运营和个人：`route`、`routes`、`passport`、`study`、`travelogue`、`mine`
- 首页底部导航：`explore`、`routes`、`travelogue`、`mine`

实现规则：

- 西城页面不要再手写 `‹`、`›`、`▶`、`↻` 这类操作符号。
- 西城页面不要复用 `/static/tabbar/xiake.png`、`xiake1.png`、`my.png`、`my1.png`、`ai_companion_avatar.png` 做系统图标。
- 新页面新增图标时，先扩展 `xicheng-icon` 的 `ICON_TYPE_MAP`，再在页面使用业务语义名。
- 图标体系门禁：`tests/xicheng-icon-system-coverage.test.mjs` 和 `tests/xicheng-unified-visual-assets.test.mjs`。

## 实现顺序

1. 先补公共组件和视觉变量，不改业务逻辑。
2. 对齐 `home`、`scan`、`scan-result`、`ai-guide` 四个主链路页面。
3. 补 `poi`、`recording`、`passport`、`footprint` 四个新增体验页。
4. 收敛 `travelogue`，把分享、PDF、审核状态拆到 `share` 和 `works`。
5. 补 `share` 的朋友圈、小红书发布素材预览，发布动作按系统分享/平台 SDK 唤起确认。
6. 新增 `pdf-print`，承接 PDF 纪念册保存、预览和打印，不继续堆进 `travelogue.vue`。
7. 补 `ops-report`，只用汇总 mock/接口字段，不引入隐私明细。
8. 更新 `pages.json` 路由。
9. 补测试并跑完整门禁。

## 验收命令

APP 目录：

```bash
cd assets/references/APP/kashgar-mini-program
for f in tests/*.test.mjs; do node "$f" || exit 1; done
npm run build
```

仓库根目录：

```bash
npm run test:run
```

页面大小门禁：

```bash
cd assets/references/APP/kashgar-mini-program
node tests/xicheng-app-page-size-budget.test.mjs
```

## 完成标准

- `01` 到 `19` 的页面职责都有对应实现或明确状态实现。
- 主链路可以从首页走到识别结果、小京、路线记录、生成游记、分享审核。
- 游记可以从生成草稿进入预览、编辑、发布渠道、朋友圈、小红书和 PDF 打印预览。
- `sources` 和 `safetyStatus=BLOCKED` 行为与后端契约一致。
- 新增页面已写入 `pages.json`。
- 大页面没有超过 3500 行。
- 所有 APP 测试、APP build、根目录测试通过。
