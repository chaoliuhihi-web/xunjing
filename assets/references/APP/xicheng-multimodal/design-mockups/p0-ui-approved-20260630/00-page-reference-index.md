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
| `05-route-list-official-routes-import-guide-v3.png` | 西城文旅地图 | 地图 POI 点、分类筛选、导入攻略、选点生成线路、官方路线入口 | 建议新增 `pages/xicheng/routes/routes.vue` |
| `06-route-detail-cultural-route.jpg` | 路线详情 | 路线地图、站点时间线、打卡任务、开始记录 | `pages/xicheng/route-detail/route-detail.vue` |
| `07-poi-guide-baitasi.jpg` | POI 详情 | 地点图文、播放讲解、问小京、加入游记 | 建议新增 `pages/xicheng/poi/poi.vue` |
| `08-ai-guide-playback.jpg` | AI 讲解播放 | 讲解播放器、正文、来源、相关问题 | `pages/ai-guide/ai-guide.vue` |
| `09-footprint-records-timeline.jpg` | 我的西城足迹 | 识别、问答、路线记录汇总，生成今日游记 | 建议新增 `pages/xicheng/footprint/footprint.vue` |
| `10-travelogue-generate-draft.jpg` | 记录/游记生成 | 汇总识别、路线、照片和问答素材，一键生成游记草稿 | `pages/xicheng/travelogue/travelogue.vue` |
| `11-travelogue-editor-share-review.jpg` | 编辑游记/分享 | 编辑标题、照片、路线、AI 补充、标签、保存、分享、发布审核 | `pages/xicheng/travelogue/travelogue.vue` |
| `12-inspiration-import-ai-poi-route.jpg` | 导入灵感 | 粘贴攻略/图文线索，AI 提取地点，匹配官方 POI，生成可走路线 | `pages/xicheng/inspiration/inspiration.vue` |
| `13-city-ops-report-dashboard.jpg` | 城市运营报告 | 识别量、热门 POI、路线完成率、分享作品、审核安全 | 建议新增 `pages/xicheng/ops-report/ops-report.vue` |
| `14-recognition-empty-no-approved-source.jpg` | 识别失败/无来源 | 识别不到可信地点、无已审核来源、重新识别和文字输入兜底 | `pages/xicheng/scan-result/scan-result.vue` |
| `15-xiaojing-blocked-no-source.jpg` | 小京 BLOCKED | `safetyStatus=BLOCKED` 时展示“无已审核来源，不能回答”和安全替代入口 | `pages/ai-guide/ai-guide.vue` |
| `16-route-recording-live-checkin.jpg` | 路线记录中 | 开始记录后的地图、进度、下一站、到达打卡、亲子任务 | 建议新增 `pages/xicheng/recording/recording.vue` |
| `17-route-passport-badges-study-tasks.jpg` | 路线护照/徽章/研学任务 | 打卡印章、路线徽章、亲子研学任务和积分成长 | 建议新增 `pages/xicheng/passport/passport.vue` |
| `18-share-poster-pdf-memento-review.jpg` | 分享海报/PDF 纪念 | 分享海报预览、PDF 纪念册、研学报告、隐私设置、提交审核 | 建议新增 `pages/xicheng/share/share.vue` |
| `19-my-works-review-status.jpg` | 我的 | 登录信息、我的游记、草稿/收藏、隐私授权和账号设置 | 建议新增 `pages/xicheng/works/works.vue` |
| `20-frontend-implementation-handoff.md` | 前端实现交接 | 页面路由、组件拆分、状态矩阵、接口字段、验收命令 | 开发前必读 |
| `21-main-thread-prompt.md` | 主线程提示词 | 给主线程或下一位 AI 的直接执行提示词 | 主线程接手时使用 |

## 补充分支状态页

`30` 到 `38` 是 2026-07-01 补齐的状态和分支页面，用于消除开发时的异常态、权限态和二级设置页歧义。它们不替代 `01` 到 `19` 的主链路顺序。

| 文件 | 页面/状态 | 主要用途 | 建议实现位置 |
| --- | --- | --- | --- |
| `30-map-poi-bottom-sheet-navigation.jpg` | 地图 POI 点击弹层 | POI 点击后展示介绍、来源、问小京、加入路线和导航去这里 | `pages/xicheng/routes/routes.vue` / `pages/xicheng/poi/poi.vue` |
| `31-inspiration-generated-route-result.jpg` | 导入攻略生成路线结果 | 攻略地点提取后，展示已匹配官方 POI 和生成路线结果 | `pages/xicheng/inspiration/inspiration.vue` |
| `32-scan-permission-denied-fallback.jpg` | 扫一扫权限失败 | 相机/定位未授权时，引导开启权限并提供上传图片、粘贴文字、手动输入兜底 | `pages/xicheng/scan/scan.vue` |
| `33-xiaojing-ai-unavailable-timeout.jpg` | 小京 AI 不可用 | AI 超时或服务不可用时，不编造答案，提供重试和查看官方来源 | `pages/ai-guide/ai-guide.vue` |
| `34-route-recording-paused-finish.jpg` | 路线记录暂停/结束 | 路线记录暂停、继续、结束并生成游记素材 | `pages/xicheng/recording/recording.vue` |
| `35-travelogue-insufficient-materials.jpg` | 游记素材不足 | 素材不足不能生成草稿时，引导继续探索、添加照片和补足素材 | `pages/xicheng/travelogue/travelogue.vue` |
| `36-travelogue-generation-failed-retry.jpg` | 游记生成失败 | AI 生成草稿失败时，保留素材并提供重试和手动编辑 | `pages/xicheng/travelogue/travelogue.vue` |
| `37-my-logged-out-visitor-mode.jpg` | 我的未登录 | 游客模式、手机号登录、登录后同步游记草稿和收藏 | `pages/xicheng/works/works.vue` |
| `38-privacy-public-scope-settings.jpg` | 公开范围设置 | 发布前设置正文、地点、照片、精确轨迹和问答记录公开范围 | `pages/xicheng/works/works.vue` / `pages/xicheng/share/share.vue` |

## 游记预览、发布和打印补充页

`39` 到 `44` 是 2026-07-01 补齐的游记发布闭环页面，用于明确游记生成后的预览、编辑、发布渠道、朋友圈、小红书和 PDF 打印体验。第三方平台发布按系统分享/平台 SDK 能力唤起确认，不在客户端静默绕过用户确认。

| 文件 | 页面/状态 | 主要用途 | 建议实现位置 |
| --- | --- | --- | --- |
| `39-travelogue-public-preview.jpg` | 游记公开预览 | 游记文章预览、来源提示、轨迹隐藏状态、继续编辑、生成 PDF、去发布 | `pages/xicheng/travelogue/travelogue.vue` / `pages/xicheng/share/share.vue` |
| `40-travelogue-rich-editor.jpg` | 游记深度编辑 | 标题、封面、照片、路线、正文、小京补充、隐私检查和来源检查 | `pages/xicheng/travelogue/travelogue.vue` |
| `41-travelogue-publish-channel-settings.jpg` | 发布渠道设置 | 选择星河寻境公开游记、朋友圈、小红书、PDF 打印，并完成发布前检查 | `pages/xicheng/share/share.vue` |
| `42-travelogue-wechat-moments-preview.jpg` | 朋友圈发布预览 | 生成朋友圈图片、文案、标签和隐私摘要，并唤起朋友圈发布确认 | `pages/xicheng/share/share.vue` |
| `43-travelogue-xiaohongshu-note-preview.jpg` | 小红书笔记预览 | 生成小红书标题、正文、标签、图集和发布素材，并唤起小红书发布确认 | `pages/xicheng/share/share.vue` |
| `44-travelogue-pdf-print-preview.jpg` | PDF 打印预览 | PDF 纪念册页码预览、A4 打印设置、保存 PDF、系统打印/分享 PDF | 建议新增 `pages/xicheng/pdf-print/pdf-print.vue` |

## 模板化精美游记补充页

`45` 到 `48` 是 2026-07-01 补齐的模板化游记生成页面，用于让用户基于模板生成更精美、更值得长期回看的纪念游记。

| 文件 | 页面/状态 | 主要用途 | 建议实现位置 |
| --- | --- | --- | --- |
| `45-travelogue-template-gallery.jpg` | 游记模板库 | 展示城市漫步杂志、胡同手账、古建札记、相册纪念、PDF 纪念册等模板 | `pages/xicheng/travelogue/travelogue.vue` / `pages/xicheng/share/share.vue` |
| `46-travelogue-template-customization.jpg` | 模板细节定制 | 定制封面、标题、排版风格、内容重点、图片裁切、文字润色和隐私来源设置 | `pages/xicheng/travelogue/travelogue.vue` |
| `47-travelogue-keepsake-reader.jpg` | 精美游记成品阅读 | 以杂志式图文、路线故事线、照片叙事、小京来源补充展示成品游记 | 建议新增 `pages/xicheng/travelogue-reader/travelogue-reader.vue` |
| `48-travelogue-keepsake-library.jpg` | 我的纪念游记书架 | 长期保存的精美游记、PDF 纪念册、发布素材和草稿回看入口 | `pages/xicheng/works/works.vue` |

## 实现拆分建议

- `components/xicheng/XichengPageShell.vue`：通用背景、顶部栏、安全区。
- `components/xicheng/XichengXiaojingHero.vue`：小京人物、气泡、场景头图。
- `components/xicheng/XichengSourceList.vue`：资料来源、审核状态、BLOCKED 提示。
- `components/xicheng/XichengPoiCard.vue`：POI 卡片、识别标签、位置。
- `components/xicheng/XichengRouteCard.vue`：路线卡片、时长、站点。
- `components/xicheng/XichengBottomActionBar.vue`：底部主操作按钮。
- `components/xicheng/XichengStatusEmpty.vue`：识别失败、无来源、审核中、需修改等状态。
- `components/xicheng/XichengPassportStamp.vue`：路线护照打卡印章、徽章和锁定状态。
- `components/xicheng/XichengTravelogueListCard.vue`：我的游记列表、草稿/已保存状态、继续编辑入口。

## 验收重点

- 首页第一屏能清楚看到“西城 AI 旅伴”和主入口。
- 扫一扫只有一个主识别入口，辅助能力只作为自动识别说明。
- 识别结果、小京回答、AI 讲解都必须有来源区域。
- 地图主页面必须能看到多个 POI 点、分类筛选、选点状态，并支持从 POI 组合生成可走线路。
- 记录主页面以游记生成为核心，能汇总识别/路线/照片/问答素材并生成可编辑草稿。
- 游记发布闭环必须覆盖预览、深度编辑、发布渠道、朋友圈预览、小红书预览和 PDF 打印预览。
- 游记生成必须支持选择模板、定制封面和排版风格，成品要适合长期收藏和反复打开回看。
- 精美游记模板至少覆盖城市漫步杂志、胡同手账、古建札记、相册纪念、PDF 纪念册和简洁图文。
- 朋友圈、小红书发布必须先生成图片/文案/标签，再按系统分享或平台 SDK 唤起用户确认，不得默认静默发布。
- PDF 纪念册必须支持保存 PDF、预览全部页面、A4 打印设置和系统打印/分享 PDF。
- 导入灵感必须走“AI 提取地点 -> 匹配官方 POI -> 生成可走路线”。
- 我的主页面必须展示登录状态、账号信息、我的游记、草稿/收藏、隐私授权和账号设置，不放积分、护照、徽章、审核状态和亲子研学任务。
- 运营报告只展示汇总与审核数据，不暴露用户隐私。
- `safetyStatus=BLOCKED` 和空 `sources` 都必须有明确页面状态，不能落成空白或本地兜底答案。
- “开始记录”后必须有路线记录中页面，支持打卡、任务进度和暂停。
- 运营增长闭环必须覆盖路线护照、打卡徽章、亲子研学任务、分享海报、PDF 纪念册和作品审核状态。
