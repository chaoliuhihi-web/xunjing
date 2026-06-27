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
    const appService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java'
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
    expect(appService).toContain('recordTriggerResolveEventIfPossible')
    expect(appService).toContain('buildTriggerResolveEventPayload')
    expect(appService).toContain('EventType.TRIGGER_RESOLVE')
    expect(appService).toContain('resolveAppEventQrCode(reqVO, hasText(reqVO.getPackageCode()))')
    expect(appService).not.toContain('payload.put("imageBase64"')
    expect(enums).toContain('TRIGGER_RESOLVE("TRIGGER_RESOLVE")')
    expect(enums).toContain('ERROR_FEEDBACK("ERROR_FEEDBACK")')
    expect(appTest).toContain('testResolveMultimodalTriggerUsesPublishedPoiFromDatabase')
    expect(appTest).toContain('testResolveMultimodalTriggerRecordsRecognitionEventWhenPackageProvided')
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
      '妙应寺白塔',
      '历代帝王庙',
      '北海公园',
      '西城 AI 旅伴 P0 固定评测集'
    ]) {
      expect(seed).toContain(snippet)
    }

    const poiRows = xichengPoiSeedRows(seed)
    expect(poiRows).toHaveLength(24)
    expect(seed.match(/"poiId":"xicheng-/g) ?? []).toHaveLength(24)
    for (const row of poiRows) {
      const poiCode = row.match(/'(?<poiCode>xicheng-[^']+)'/)?.groups?.poiCode
      expect(poiCode).toBeTruthy()
      expect(row).toContain("'beijing-xicheng'")
      expect(row).toContain("'P0'")
      expect(row).toContain("'GCJ02'")
      expect(row).toContain("'sourceUrl',@xicheng_source_url")
      expect(row).toContain('"gpsRadiusMeters":')
      expect(row).toContain('"ocrKeywords":[')
      expect(row).toContain('"photoLabels":[')
      expect(row).toContain(`"poiId":"${poiCode}"`)
      expect(row).toContain('"shortIntro":"')
      expect(row).toContain('"recommendedQuestions":[')
      expect(row).toContain("'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED'")
    }
    expect(seed).toContain('INSERT INTO `xunjing_poi`')
    expect(seed).toContain('INSERT INTO `xunjing_knowledge_document`')
    expect(seed).toContain("CONCAT(`name`, ' POI 级已审核来源')")
    expect(seed).toContain('xicheng-baitasi')
    expect(seed).toContain('POI 级已审核来源')
    expect(seed).toContain("JSON_UNQUOTE(JSON_EXTRACT(`content_json`, '$.shortIntro'))")
    expect(seed).toContain("CONCAT(@xicheng_source_url, _utf8mb4'#%')")
    expect(seed).toContain('INSERT INTO `xunjing_ai_eval_case`')
    expect(seed).toContain('@xicheng_source_url COLLATE utf8mb4_unicode_ci')
  })
})
