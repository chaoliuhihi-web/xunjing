import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const xichengSeedPath = 'backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql'

async function readText(path) {
  return await readFile(resolve(rootDir, path), 'utf8')
}

function xichengPoiSeedRows(seed) {
  return seed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("(@map_package_id, 'xicheng-"))
}

describe('xicheng backend launch readiness', () => {
  test('gates Xicheng P0 backend launch seed and verifier coverage', async () => {
    expect(existsSync(resolve(rootDir, xichengSeedPath))).toBe(true)

    const verifier = await readText('scripts/verify-xunjing-platform-readiness.mjs')
    const seed = await readText(xichengSeedPath)
    const moduleSql = await readText('backend/yudao/sql/mysql/xunjing-module.sql')
    const triggerEngine = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingMultimodalTriggerEngine.java'
    )
    const visionService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingVisionRecognitionService.java'
    )
    const appService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java'
    )
    const appVo = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java'
    )
    const enums = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/enums/XunjingEnums.java'
    )
    const appTest = await readText(
      'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java'
    )

    expect(verifier).toContain('xunjing-seed-xicheng-p0.sql')
    expect(verifier).toContain('xicheng-seed-data')
    expect(verifier).toContain('checkXichengPoiSeedQuality')
    expect(verifier).toContain('xicheng-poi-seed-quality')
    expect(verifier).toContain('xicheng-trigger-backend')
    expect(verifier).toContain('xicheng-ai-source-guard-backend')
    expect(verifier).toContain('xicheng-app-event-backend')
    expect(verifier).toContain('includeXichengAppCheck')
    expect(verifier).toContain('--include-xicheng-app-check')
    expect(verifier).toContain('includeXichengTriggerCheck')
    expect(verifier).toContain('--include-xicheng-trigger-check')
    expect(verifier).toContain('live-xicheng-scan-resolve')
    expect(verifier).toContain('live-xicheng-ai-chat-sourced')
    expect(verifier).toContain('live-xicheng-ai-chat-blocked')
    expect(verifier).toContain('live-xicheng-trigger-baitasi')
    expect(verifier).toContain('live-xicheng-trigger-gongwangfu')
    expect(verifier).toContain('live-xicheng-trigger-planetarium')
    expect(verifier).toContain('recordTriggerResolveEventIfPossible')
    expect(verifier).toContain('EventType.TRIGGER_RESOLVE')
    expect(verifier).toContain('ERROR_FEEDBACK("ERROR_FEEDBACK")')
    expect(verifier).toContain('testRecordAppErrorFeedbackEventKeepsXichengContext')
    expect(verifier).toContain('testResolveMultimodalTriggerRecordsRecognitionEventWhenPackageProvided')
    expect(moduleSql).toContain('CREATE TABLE IF NOT EXISTS `xunjing_poi`')
    expect(triggerEngine).toContain('XunjingPoiMapper')
    expect(triggerEngine).toContain('loadDatabasePoiProfiles')
    expect(triggerEngine).toContain('selectPublishedListByRegionCode')
    expect(triggerEngine).toContain('buildSceneSignalContextText')
    expect(triggerEngine).toContain('detectSceneSignalIntent')
    expect(triggerEngine).toContain('detectAgentDecisionIntent(sceneSignals)')
    expect(triggerEngine).toContain('detectRealtimeRouteIntent(sceneSignals)')
    expect(triggerEngine).toContain('"nearbyActivitySummary"')
    expect(triggerEngine).toContain('"merchantServiceSummary"')
    expect(triggerEngine).toContain('"routeRecommendationSummary"')
    expect(triggerEngine).toContain('"menuItemNames"')
    expect(triggerEngine).toContain('"spiceLevelSummary"')
    expect(triggerEngine).toContain('"halalSuitabilityText"')
    expect(triggerEngine).toContain('"dishRecommendationSummary"')
    expect(triggerEngine).toContain('"signOriginalText"')
    expect(triggerEngine).toContain('"signTranslationText"')
    expect(triggerEngine).toContain('"signPronunciationText"')
    expect(triggerEngine).toContain('"signNavigationHint"')
    expect(triggerEngine).toContain('isOutdoorDiscomfortWeather')
    expect(triggerEngine).toContain('isNightLocalTime')
    expect(triggerEngine).toContain('case "activity" -> autoTrigger ? "open_activity_handoff" : "confirm_activity_handoff"')
    expect(triggerEngine).toContain('case "activity" -> "/pages/activity/recommend" + query')
    expect(triggerEngine).toContain('case "translate" -> autoTrigger ? "start_sign_translation" : "confirm_sign_translation"')
    expect(triggerEngine).toContain('case "translate" -> "/pages/ai-guide/detail" + query')
    expect(triggerEngine).toContain('case "safety" -> autoTrigger ? "start_safety_advisory" : "confirm_safety_advisory"')
    expect(triggerEngine).toContain('case "safety" -> "/pages/ai-guide/detail" + query')
    expect(triggerEngine).toContain('case "interpret" -> autoTrigger ? "start_scene_interpretation" : "confirm_scene_interpretation"')
    expect(triggerEngine).toContain('case "interpret" -> "/pages/ai-guide/detail" + query')
    expect(triggerEngine).toContain('case "photo" -> autoTrigger ? "start_photo_advice" : "confirm_photo_advice"')
    expect(triggerEngine).toContain('case "photo" -> "/pages/ai-guide/detail" + query')
    expect(triggerEngine).toContain('scene_context_alias')
    expect(triggerEngine).toContain('containsAny(explicitText, List.of("游记", "旅行记录", "生成游记", "打卡", "徽章"))')
    expect(visionService).toContain('recognizeImage(reqVO)')
    expect(visionService).toContain('mergeVisionSceneSignals(reqVO, recognition)')
    expect(visionService).toContain('VISION_SCENE_SIGNAL_TEXT_KEYS')
    expect(visionService).toContain('buildVisionRecognitionEvidence')
    expect(visionService).toContain('visionRecognitionStatus')
    expect(visionService).toContain('visionRecognitionModel')
    expect(visionService).toContain('visionRecognitionLabelCount')
    expect(visionService).toContain('"menuItemNames"')
    expect(visionService).toContain('"spiceLevelSummary"')
    expect(visionService).toContain('"halalSuitabilityText"')
    expect(visionService).toContain('"dishRecommendationSummary"')
    expect(visionService).toContain('"signOriginalText"')
    expect(visionService).toContain('"signTranslationText"')
    expect(visionService).toContain('"signPronunciationText"')
    expect(visionService).toContain('"signNavigationHint"')
    expect(visionService).toContain('inferVisionSceneDomain(labels, caption, ocrText, sceneSignals)')
    for (const domain of [
      'architecture',
      'artifact',
      'menu',
      'food',
      'sign',
      'intangible_heritage',
      'plant',
      'animal',
      'person',
      'activity'
    ]) {
      expect(visionService).toContain(`new SceneDomainRule("${domain}"`)
    }
    expect(appService).toContain('recordTriggerResolveEventIfPossible')
    expect(appService).toContain('buildTriggerResolveEventPayload')
    expect(appService).toContain('buildTriggerMatchedSignalsPayload(respVO)')
    expect(appService).toContain('payload.put("matchedSignals", buildTriggerMatchedSignalsPayload(respVO))')
    expect(appService).toContain('TRIGGER_SCENE_SIGNAL_TEXT_KEYS')
    expect(appService).toContain('buildTriggerSceneSignalsPayload(reqVO.getSceneSignals())')
    expect(appService).toContain('"visionRecognitionStatus"')
    expect(appService).toContain('"visionRecognitionModel"')
    expect(appService).toContain('"knowledgeGraphKeywords"')
    expect(appService).toContain('"relatedTopicKeywords"')
    expect(appService).toContain('"visitorProfileSummary"')
    expect(appService).toContain('"visitorGroup"')
    expect(appService).toContain('"interestTags"')
    expect(appService).toContain('"preferredLanguageText"')
    expect(appService).toContain('"nearbyActivitySummary"')
    expect(appService).toContain('"merchantServiceSummary"')
    expect(appService).toContain('"routeRecommendationSummary"')
    expect(appService).toContain('"menuItemNames"')
    expect(appService).toContain('"spiceLevelSummary"')
    expect(appService).toContain('"halalSuitabilityText"')
    expect(appService).toContain('"dishRecommendationSummary"')
    expect(appService).toContain('"signOriginalText"')
    expect(appService).toContain('"signTranslationText"')
    expect(appService).toContain('"signPronunciationText"')
    expect(appService).toContain('"signNavigationHint"')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "知识图谱线索", sceneSignals, "knowledgeGraphKeywords")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "关联话题", sceneSignals, "relatedTopicKeywords")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "当前时间", sceneSignals, "localTimeText")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "当前天气", sceneSignals, "weatherText")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "当前朝向", sceneSignals, "headingText")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "游客画像", sceneSignals, "visitorProfileSummary")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "同行人", sceneSignals, "visitorGroup")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "兴趣偏好", sceneSignals, "interestTags")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "偏好语言", sceneSignals, "preferredLanguageText")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "附近活动", sceneSignals, "nearbyActivitySummary")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "商家服务", sceneSignals, "merchantServiceSummary")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "路线建议", sceneSignals, "routeRecommendationSummary")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "菜单菜品", sceneSignals, "menuItemNames")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "辣度", sceneSignals, "spiceLevelSummary")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "清真信息", sceneSignals, "halalSuitabilityText")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "推荐点单", sceneSignals, "dishRecommendationSummary")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "路牌原文", sceneSignals, "signOriginalText")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "路牌翻译", sceneSignals, "signTranslationText")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "发音", sceneSignals, "signPronunciationText")')
    expect(appService).toContain('putPreviousJsonMemoryPart(parts, "导航提示", sceneSignals, "signNavigationHint")')
    expect(appService).toContain('putTriggerSceneSignalNumber(payload, sceneSignals, "visionRecognitionLabelCount", false)')
    expect(appService).toContain('hydrateMultimodalTriggerMemoryFromPreviousResolve(reqVO)')
    expect(appService).toContain('hydrateMultimodalTriggerMemoryFromPreviousAsk(resourcePackage, reqVO)')
    expect(appService).toContain('shouldUsePreviousAskForTriggerMemory(previousAskEvent, previousResolveEvent)')
    expect(appService).toContain('triggerRequiresRealSystem(action, intent)')
    expect(appService).toContain('"activity".equals(intent)')
    expect(appService).toContain('"活动票务"')
    expect(appService).toContain('"translate".equals(intent)')
    expect(appService).toContain('"路牌翻译"')
    expect(appService).toContain('"safety".equals(intent)')
    expect(appService).toContain('"安全提醒"')
    expect(appService).toContain('"interpret".equals(intent)')
    expect(appService).toContain('"深度识境"')
    expect(appService).toContain('"photo".equals(intent)')
    expect(appService).toContain('"拍照建议"')
    expect(appService).toContain('hasFreshMultimodalTriggerSignal(reqVO)')
    expect(appService).not.toContain('payload.put("sceneSignals", reqVO.getSceneSignals())')
    expect(appService).not.toContain('payload.put("candidates", respVO.getCandidates())')
    expect(appService).toContain('EventType.TRIGGER_RESOLVE')
    expect(appService).toContain('resolveAppEventQrCode(reqVO, hasText(reqVO.getPackageCode()))')
    expect(appService).not.toContain('payload.put("imageBase64"')
    expect(appVo).toContain('private Map<String, Object> sceneSignals;')
    expect(enums).toContain('TRIGGER_RESOLVE("TRIGGER_RESOLVE")')
    expect(enums).toContain('ERROR_FEEDBACK("ERROR_FEEDBACK")')
    expect(appTest).toContain('testResolveMultimodalTriggerUsesPublishedPoiFromDatabase')
    expect(appTest).toContain('testResolveMultimodalTriggerUsesSceneSignalsForIntentAndContextMatch')
    expect(appTest).toContain('testResolveMultimodalTriggerUsesOperationSignalsForContextMatch')
    expect(appTest).toContain('testResolveMultimodalTriggerUsesMenuSignalsForIntentAndContextMatch')
    expect(appTest).toContain('testResolveMultimodalTriggerUsesSignTranslationSignalsForIntentAndContextMatch')
    expect(appTest).toContain('testResolveMultimodalTriggerUsesPhotoAdviceIntent')
    expect(appTest).toContain('testResolveMultimodalTriggerRecordsRecognitionEventWhenPackageProvided')
    expect(appTest).toContain('testResolveMultimodalTriggerUsesVisionProviderOcrWhenClientOnlySendsPhoto')
    expect(appTest).toContain('testResolveMultimodalTriggerRecordsSceneSignalsWithoutRawRecognitionContext')
    expect(appTest).toContain('testResolveMultimodalTriggerHydratesContinuousContextFromPreviousTriggerEvent')
    expect(appTest).toContain('testResolveMultimodalTriggerDoesNotReusePreviousSceneIntentWhenFreshOcrExists')
    expect(appTest).toContain('testResolveMultimodalTriggerHydratesContinuousContextFromPreviousAskEvent')
    expect(appTest).toContain('testResolveMultimodalTriggerUsesLatestAskWhenItIsNewerThanPreviousTrigger')
    expect(appTest).toContain('testAnswerUsesKnowledgeGraphSignalsFromPreviousTriggerForSourceSearch')
    expect(appTest).toContain('testAnswerUsesVisitorProfileSignalsFromPreviousTriggerForSourceSearch')
    expect(appTest).toContain('testAnswerUsesRealtimeEnvironmentSignalsFromPreviousTriggerForSourceSearch')
    expect(appTest).toContain('testAnswerUsesOperationSignalsFromPreviousTriggerForSourceSearch')
    expect(appTest).toContain('testAnswerUsesMenuSignalsFromPreviousTriggerForSourceSearch')
    expect(appTest).toContain('testAnswerUsesSignTranslationSignalsFromPreviousTriggerForSourceSearch')
    expect(appTest).toContain('testAnswerHydratesPhotoAdviceHandoffFromTrigger')
    expect(appTest).toContain('testAnswerMarksMerchantTriggerHandoffAsRealSystemRequired')
    expect(appTest).toContain('testRecordAppErrorFeedbackEventKeepsXichengContext')
    expect(appTest).toContain('testAnswerBlocksWhenReviewedSourcesDoNotMatchXichengPoiContext')

    for (const snippet of [
      'XICHENG-2026-P0',
      'XICHENG-MAP-001',
      'QR-XICHENG-MAP-001',
      'beijing-xicheng',
      '"regionCode":"beijing-xicheng"',
      '"reviewStatus":"APPROVED"',
      '"geoStatus":"REVIEW_REQUIRED"',
      '"licenseStatus":"REVIEW_REQUIRED"',
      '"poiId":"xicheng-baitasi"',
      '"poiId":"xicheng-emperors-temple"',
      '"poiId":"xicheng-beihai-park"',
      '"poiId":"xicheng-shichahai"',
      '"poiId":"xicheng-dashilar"',
      '西城区文物保护单位（81处）',
      'https://www.bjxch.gov.cn/xcfw/whfw/xxxq/pnidpv736523.html',
      '妙应寺白塔',
      '历代帝王庙',
      '北海公园',
      '西城 AI 旅伴 P0 固定评测集'
    ]) {
      expect(seed).toContain(snippet)
    }

    const poiRows = xichengPoiSeedRows(seed)
    expect(poiRows).toHaveLength(80)
    expect(seed.match(/"poiId":"xicheng-/g) ?? []).toHaveLength(80)
    for (const row of poiRows) {
      const poiCode = row.match(/'(?<poiCode>xicheng-[^']+)'/)?.groups?.poiCode
      expect(poiCode).toBeTruthy()
      expect(row).toContain("'beijing-xicheng'")
      expect(row).toContain("'P0'")
      expect(row).toContain("'GCJ02'")
      expect(row).toMatch(/'sourceUrl',@xicheng_[a-z0-9_]*source_url/)
      expect(row).toContain('"gpsRadiusMeters":')
      expect(row).toContain('"ocrKeywords":[')
      expect(row).toContain('"photoLabels":[')
      expect(row).toContain(`"poiId":"${poiCode}"`)
      expect(row).toContain('"shortIntro":"')
      expect(row).toContain('"recommendedQuestions":[')
      expect(row).toContain("'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED'")
      const heritageNumber = poiCode.match(/^xicheng-heritage-(\d{3})-/)?.[1]
      if (heritageNumber) {
        expect(row).toContain(`'heritageNo',${Number.parseInt(heritageNumber, 10)}`)
      }
    }
    expect(seed).toContain('INSERT INTO `xunjing_poi`')
    expect(seed).toContain('INSERT INTO `xunjing_knowledge_document`')
    expect(seed).toContain("CONCAT(`name`, ' POI 级已审核来源')")
    expect(seed).toContain('xicheng-baitasi')
    expect(seed).toContain('@xicheng_baitasi_source_url')
    expect(seed).toContain('@xicheng_emperors_temple_source_url')
    expect(seed).toContain('@xicheng_shichahai_source_url')
    expect(seed).toContain('@xicheng_gongwangfu_source_url')
    expect(seed).toContain('@xicheng_niujie_source_url')
    expect(seed).toContain('@xicheng_financial_street_source_url')
    for (const row of poiRows.slice(0, 24)) {
      expect(row).not.toContain("'sourceUrl',@xicheng_source_url")
    }
    expect(seed).toContain('POI 级已审核来源')
    expect(seed).toContain("JSON_UNQUOTE(JSON_EXTRACT(`content_json`, '$.shortIntro'))")
    expect(seed).toContain("CONCAT(@xicheng_source_url, _utf8mb4'#%')")
    expect(seed).toContain('INSERT INTO `xunjing_ai_eval_case`')
    expect(seed).toContain('@xicheng_source_url COLLATE utf8mb4_unicode_ci')
  })
})
