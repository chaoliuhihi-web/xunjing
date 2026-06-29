**Xicheng P0 Visual QA**
- Reference design pack: `01-home-xiaojing-xicheng.png`, `02-recognition-result-baitasi.png`, `03-ask-xiaojing-chat.png`, `04-route-detail-baitasi-culture.png`, `05-travelogue-generation.png`, `06-scan-entry.png`, `07-route-list.png`, `08-poi-guide-baitasi.png`, `09-ai-guide-playback.png`, `10-xicheng-footprint.png`, and `11-travelogue-editor-share.png`.
- Covered flow: `home -> scan-result -> xiaojing -> route-detail -> travelogue`.
- Screens covered by source: 西城首页、小京形象、扫一扫/拍照/OCR/GPS/文本识别入口、白塔寺识别结果、已审核来源、小京问答、路线详情、路线护照、生成游记草稿、分享海报、PDF纪念册、作品审核、本地足迹和运营报告。
- Implementation surface: `pages/xicheng/home/home.vue`, `pages/xicheng/scan-result/scan-result.vue`, `pages/ai-guide/ai-guide.vue`, `pages/xicheng/route-detail/route-detail.vue`, `pages/xicheng/inspiration/inspiration.vue`, and `pages/xicheng/travelogue/travelogue.vue`.
- Current smoke artifact: `/tmp/xicheng-p0-current/current-head-ai-guide-from-official-poi-smoke.png`.
- Current smoke result: direct 白塔寺 scan-result route renders official POI confidence, reviewed source card, and recommended route; tapping 问小京 opens Xiaojing with `regionCode`, `packageCode`, `poiCode`, `poiName`, and companion context preserved.
- Source safety result: official POI source context remains visible in Xiaojing, and empty-source copy is not shown for the verified 白塔寺 path.
- Visual alignment: the first viewport uses the shared 西城 warm paper surface, ink green hierarchy, gold section accents, rounded paper cards, Xiaojing avatar, compact action chips, and bottom-safe spacing defined in `styles/xicheng-theme.scss`.
- Operations-readiness coverage: local journey materials, route passport progress, parent-child study task evidence, share assets, review package, sanitized public preview, local data clear, track quality, safety status counts, and city operations report are present in the travelogue surface.
- Remaining release gate: production launch still requires non-local HTTPS APP readiness evidence and production Yudao/AI/Qdrant/OCR/OSS/POI evidence; the current visual QA only proves APP front-end flow and source-context behavior.
- Preprod evidence handoff: follow `docs/xicheng-app-preprod-evidence-runbook.md` to build with `VITE_XUNJING_YUDAO_APP_BASE_URL="$XUNJING_APP_API_BASE_URL"` and `VITE_XUNJING_TENANT_ID`, then capture `qa/xicheng-app-readiness-evidence.json` against a non-local HTTPS Yudao gateway before release.

**Source Visual Truth**
- Launch source: `/Users/bruce/Developer/work/AI文旅/01_星河寻境/assets/references/APP/参考图/ChatGPT Image 2026年6月21日 00_46_15 (1).png`
- Play home source: `/Users/bruce/Developer/work/AI文旅/01_星河寻境/assets/references/APP/参考图/ChatGPT Image 2026年6月21日 00_46_16 (2).png`
- Home source: `/Users/bruce/Developer/work/AI文旅/01_星河寻境/assets/references/APP/参考图/ChatGPT Image 2026年6月21日 00_46_18 (6).png`
- Story source: `/Users/bruce/Developer/work/AI文旅/01_星河寻境/assets/references/APP/参考图/ChatGPT Image 2026年6月21日 00_46_19 (7).png`
- Itinerary source: `/Users/bruce/Developer/work/AI文旅/01_星河寻境/assets/references/APP/参考图/ChatGPT Image 2026年6月21日 00_46_20 (8).png`
- Diary generator source: `/Users/bruce/Developer/work/AI文旅/01_星河寻境/assets/references/APP/参考图/ChatGPT Image 2026年6月21日 00_46_20 (9).png`
- Implementation screenshots:
  - `/Users/bruce/Developer/work/AI文旅/01_星河寻境/kashgar-landing-entry-mobile.png`
  - `/Users/bruce/Developer/work/AI文旅/01_星河寻境/kashgar-play-home-mobile.png`
  - `/Users/bruce/Developer/work/AI文旅/01_星河寻境/kashgar-home-travel-notes-mobile-final.png`
  - `/Users/bruce/Developer/work/AI文旅/01_星河寻境/kashgar-story-entry-click-result.png`
  - `/Users/bruce/Developer/work/AI文旅/01_星河寻境/kashgar-my-itinerary-mobile.png`
  - `/Users/bruce/Developer/work/AI文旅/01_星河寻境/kashgar-diary-generator-mobile.png`
- Full-view comparison evidence:
  - `/Users/bruce/Developer/work/AI文旅/01_星河寻境/story-detail-design-qa-comparison.png`
  - `/Users/bruce/Developer/work/AI文旅/01_星河寻境/itinerary-design-qa-comparison.png`
  - `/Users/bruce/Developer/work/AI文旅/01_星河寻境/diary-generator-design-qa-comparison.png`
- Focused region comparison evidence: full-view evidence is sufficient for this pass because the current work targets first-screen layout, visible copy, primary imagery, and the home-to-story entry flow.

**Viewport And State**
- Viewport: 430 x 844.
- State: launch entry, play home, travel-notes home, first travel-note card opened into the story detail page, my itinerary first viewport, and AI guide diary-generation mode.
- Target platform: UniApp APP. H5 runtime is used only for visual inspection.

**Findings**
- No P0, P1, or P2 issues found for the current launch-to-play-to-home-to-story-to-itinerary-to-diary-generation flow.
- Fonts and typography: major hierarchy matches the sources: brand/search/section headers on home, Songti-style story title, compact tags, metadata, and bottom actions on detail. Exact system font rendering still depends on iOS/Android device fonts.
- Spacing and layout rhythm: launch keeps the large title, pill tag row, illustrated map, assistant speech, and primary entry action in the first mobile viewport; play home keeps the hero, three action cards, recommended places, guide strip, entry action, and tabbar without CTA overlap; home preserves the reference order and density; detail keeps the same top nav, centered play affordance, right action rail, story copy, and bottom composer structure; itinerary keeps the hero card, day tabs, timeline, audio chips, fixed action, and bottom navigation structure; diary generation keeps the photo collage, element chips, mode tabs, two-card preview area, and primary actions in the first mobile viewport.
- Colors and visual tokens: warm cream home surface and dark cinematic story surface match the supplied direction. The story bottom gradient is intentionally stronger to keep native text legible.
- Image quality and asset fidelity: visible assets are local Kashgar assets under `static/kashgar/`; full-screen source screenshots are not shipped as app assets.
- Copy and content: key visible text matches the supplied references, including `喀小寻带你玩喀什`, `古城故事 / 丝路风物 / 特色美食 / 官方攻略`, `进入喀什`, `扫一扫`, `跟着游记去旅行`, `记录旅行`, `推荐打卡地`, `官方攻略`, `进入导览`, `搜索目的地/景点/游记`, `喀什文旅地图`, `跟着游记`, `沿着石巷去看喀什`, `星河漫游记`, `我的旅行日程`, `喀什亲子之旅`, `喀小寻已为你整理`, `调整行程安排`, `生成我的喀什游记`, `沿着石巷，把喀什写进今天`, `一键生成`, `收藏`, and `说点什么…`.
- API boundary: existing online calls remain the default. `request/config.js` points at `https://kashi.weiapp.net/`; login keeps `api2/user/get_user`; user profile save keeps `api2/user/user_save`; AI chat uses the Yudao APP proxy at `/app-api/xunjing/ai/chat` first, then renders a Kashgar-local guide answer if that route is not yet available on the online gateway.

**Patches Made Since Previous QA Pass**
- Added the reference 1 launch entry as `mode=landing` inside the existing `pages/index/index.vue` route.
- Added the reference 2 play home as `mode=play` inside the existing `pages/index/index.vue` route, reusing the existing `kashgarActions`, `kashgarPlaces`, `goToMap`, and AI guide navigation.
- Added `tests/kashgar-landing-play-home.test.mjs` for the two local index branches.
- Added `tests/online-api-first-contract.test.mjs` and `docs/online-api-first-contract.md` to lock the online-first API policy.
- Replaced the earlier homepage branch with the reference 6 travel-notes layout.
- Added a local Kashgar story branch to `theaterDetail.vue` for reference 7.
- Routed homepage travel-note cards to `theaterDetail?dramaId=701&localStory=1`.
- Recut the story background as `static/kashgar/story-stone-alley-final.png` so embedded reference controls do not overlap native UI.
- Added the reference 8 itinerary branch in `subPackages/user/my/my.vue`, while keeping the original profile branch and its `api2` calls available.
- Cropped itinerary assets into `static/kashgar/itinerary-*.png`.
- Raised the fixed itinerary action above the center tabbar avatar and added bottom timeline space for APP safe-area behavior.
- Added the reference 9 diary-generation mode inside the existing `pages/ai-guide/ai-guide.vue` AI guide page instead of creating a separate frontend path.
- Routed the original homepage `target: 'diary'` action to `/pages/ai-guide/ai-guide?mode=diary`.
- Cropped the diary collage and assistant character into `static/kashgar/diary-generator-*.png`.
- Moved AI guide chat from client-side third-party credentials to the Yudao APP proxy while keeping original `api2/*` login and profile calls.
- Added AI guide fallback rendering for unavailable Yudao APP proxy responses so the chat page still produces a useful Kashgar guide answer.

**Follow-up Polish**
- P3: the story background crop is darker and less street-depth-heavy than the source because the clean asset avoids embedded controls from the supplied image.
- P3: exact APP safe-area/status-bar behavior should still be reviewed in HBuilderX on iOS and Android devices.

final result: passed
