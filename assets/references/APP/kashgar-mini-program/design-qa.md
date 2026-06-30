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
- Release evidence handoff: follow `docs/xicheng-app-preprod-evidence-runbook.md` to build with `VITE_XUNJING_YUDAO_APP_BASE_URL="$XUNJING_APP_API_BASE_URL"` and `VITE_XUNJING_TENANT_ID`, then capture `qa/xicheng-app-readiness-evidence.json` against a non-local HTTPS Yudao gateway before release.
- Remaining release gate: production launch still requires non-local HTTPS APP readiness evidence and production Yudao/AI/Qdrant/OCR/OSS/POI evidence; this QA file proves only APP front-end flow and source-context behavior.

**Viewport And State**
- Viewport: 390 x 844 and 430 x 844 mobile checks.
- State: 西城首页 first viewport, 白塔寺识别结果, 小京官方 POI context, route detail, and travelogue generation surface.
- Target platform: UniApp APP. H5 runtime is used only for local visual inspection.

**Findings**
- No P0 visual mismatch remains in the verified 西城 P0 main chain.
- Typography and density follow the supplied 西城 reference direction: compact operational hierarchy, paper-card grouping, restrained ink-green emphasis, and gold section accents.
- Source and safety copy stay evidence-first: reviewed source cards remain visible for verified POI context, while no-source states are handled by the safety-aware page logic.
- APP code-side readiness is green for current local gates, but production release still depends on external HTTPS evidence, production service smoke evidence, and POI production review completion.

**Verification Commands**
- `for f in tests/*.test.mjs; do node "$f" || exit 1; done`
- `npm run build`
- Root: `npm run test:run`
- Root: `npm run xunjing:platform:verify:static`

final result: passed
