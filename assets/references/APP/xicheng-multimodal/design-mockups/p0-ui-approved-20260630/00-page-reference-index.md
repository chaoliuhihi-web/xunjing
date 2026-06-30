# 西城 P0 APP 新版 UI 参考图索引

本目录存放 2026-06-30 确认后的西城 P0 APP 新版页面效果图。上一级 `design-mockups/` 下原有 11 张图作为历史参考保留；实现时优先参考本目录。

## 使用原则

- 按文件名前缀顺序理解完整链路，不按图片生成时间理解。
- 开发前先读 `20-frontend-implementation-handoff.md`；主线程接手时直接按 `21-main-thread-prompt.md` 执行。
- 扫码页采用单入口自动识别，不再做多个模式选择入口。
- 页面实现必须复用西城视觉系统：米白纸感背景、深绿主色、金色点缀、小京讲解人物、圆角卡片、来源与审核状态提示。
- APP 页面单文件不得超过 3500 行；接近上限时拆组件、配置、请求层或样式文件。
- AI 回答页必须展示 `sources`；遇到 `safetyStatus=BLOCKED` 时显示“无已审核来源，不能回答”，不得本地编造。

## 页面清单

| 文件 | 页面 | 主要用途 | 建议实现位置 |
| --- | --- | --- | --- |
| `01-home-xicheng-ai-companion.jpg` | 西城首页 | 扫一扫、问小京、路线推荐、最近识别、生成游记入口 | `pages/xicheng/home/home.vue` |
| `02-scan-auto-recognition-entry.jpg` | 扫一扫 | 一个识别入口，自动判断二维码、照片、OCR、地点、路线图 | 建议新增 `pages/xicheng/scan/scan.vue` |
| `03-recognition-result-sources.jpg` | 识别结果 | 展示 POI、置信度、来源、推荐问题和进入小京入口 | `pages/xicheng/scan-result/scan-result.vue` |
| `04-xiaojing-chat-answer-sources.jpg` | 问问小京 | 展示 AI 回答、资料来源、推荐问题、继续追问 | `pages/ai-guide/ai-guide.vue` |
| `05-route-list-official-routes.jpg` | 路线列表 | 官方路线、亲子研学、城市漫步等路线入口 | 建议新增 `pages/xicheng/routes/routes.vue` |
| `06-route-detail-cultural-route.jpg` | 路线详情 | 路线地图、站点时间线、打卡任务、开始记录 | `pages/xicheng/route-detail/route-detail.vue` |
| `07-poi-guide-baitasi.jpg` | POI 详情 | 地点图文、播放讲解、问小京、加入游记 | 建议新增 `pages/xicheng/poi/poi.vue` |
| `08-ai-guide-playback.jpg` | AI 讲解播放 | 讲解播放器、正文、来源、相关问题 | `pages/ai-guide/ai-guide.vue` |
| `09-footprint-records-timeline.jpg` | 我的西城足迹 | 识别、问答、路线记录汇总，生成今日游记 | 建议新增 `pages/xicheng/footprint/footprint.vue` |
| `10-travelogue-generate-draft.jpg` | 生成游记 | 汇总素材、选择风格、预览 AI 草稿 | `pages/xicheng/travelogue/travelogue.vue` |
| `11-travelogue-editor-share-review.jpg` | 编辑游记/分享 | 编辑标题、照片、路线、AI 补充、标签、保存、分享、发布审核 | `pages/xicheng/travelogue/travelogue.vue` |
| `12-inspiration-import-ai-poi-route.jpg` | 导入灵感 | 粘贴攻略/图文线索，AI 提取地点，匹配官方 POI，生成可走路线 | `pages/xicheng/inspiration/inspiration.vue` |
| `13-city-ops-report-dashboard.jpg` | 城市运营报告 | 识别量、热门 POI、路线完成率、分享作品、审核安全 | 建议新增 `pages/xicheng/ops-report/ops-report.vue` |
| `14-recognition-empty-no-approved-source.jpg` | 识别失败/无来源 | 识别不到可信地点、无已审核来源、重新识别和文字输入兜底 | `pages/xicheng/scan-result/scan-result.vue` |
| `15-xiaojing-blocked-no-source.jpg` | 小京 BLOCKED | `safetyStatus=BLOCKED` 时展示“无已审核来源，不能回答”和安全替代入口 | `pages/ai-guide/ai-guide.vue` |
| `16-route-recording-live-checkin.jpg` | 路线记录中 | 开始记录后的地图、进度、下一站、到达打卡、亲子任务 | 建议新增 `pages/xicheng/recording/recording.vue` |
| `17-route-passport-badges-study-tasks.jpg` | 路线护照/徽章/研学任务 | 打卡印章、路线徽章、亲子研学任务和积分成长 | 建议新增 `pages/xicheng/passport/passport.vue` |
| `18-share-poster-pdf-memento-review.jpg` | 分享海报/PDF 纪念 | 分享海报预览、PDF 纪念册、研学报告、隐私设置、提交审核 | 建议新增 `pages/xicheng/share/share.vue` |
| `19-my-works-review-status.jpg` | 我的作品/审核状态 | 已发布、审核中、需修改、驳回原因、继续编辑和分享 | 建议新增 `pages/xicheng/works/works.vue` |
| `20-frontend-implementation-handoff.md` | 前端实现交接 | 页面路由、组件拆分、状态矩阵、接口字段、验收命令 | 开发前必读 |
| `21-main-thread-prompt.md` | 主线程提示词 | 给主线程或下一位 AI 的直接执行提示词 | 主线程接手时使用 |

## 实现拆分建议

- `components/xicheng/XichengPageShell.vue`：通用背景、顶部栏、安全区。
- `components/xicheng/XichengXiaojingHero.vue`：小京人物、气泡、场景头图。
- `components/xicheng/XichengSourceList.vue`：资料来源、审核状态、BLOCKED 提示。
- `components/xicheng/XichengPoiCard.vue`：POI 卡片、识别标签、位置。
- `components/xicheng/XichengRouteCard.vue`：路线卡片、时长、站点。
- `components/xicheng/XichengBottomActionBar.vue`：底部主操作按钮。
- `components/xicheng/XichengStatusEmpty.vue`：识别失败、无来源、审核中、需修改等状态。
- `components/xicheng/XichengPassportStamp.vue`：路线护照打卡印章、徽章和锁定状态。
- `components/xicheng/XichengWorkReviewCard.vue`：作品审核状态、驳回原因、继续编辑入口。

## 验收重点

- 首页第一屏能清楚看到“西城 AI 旅伴”和主入口。
- 扫一扫只有一个主识别入口，辅助能力只作为自动识别说明。
- 识别结果、小京回答、AI 讲解都必须有来源区域。
- 游记链路能从识别/路线/足迹进入，并生成可编辑草稿。
- 导入灵感必须走“AI 提取地点 -> 匹配官方 POI -> 生成可走路线”。
- 运营报告只展示汇总与审核数据，不暴露用户隐私。
- `safetyStatus=BLOCKED` 和空 `sources` 都必须有明确页面状态，不能落成空白或本地兜底答案。
- “开始记录”后必须有路线记录中页面，支持打卡、任务进度和暂停。
- 运营增长闭环必须覆盖路线护照、打卡徽章、亲子研学任务、分享海报、PDF 纪念册和作品审核状态。
