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

describe('xicheng backend launch readiness', () => {
  test('gates Xicheng P0 backend launch seed and verifier coverage', async () => {
    expect(existsSync(resolve(rootDir, xichengSeedPath))).toBe(true)

    const verifier = await readText('scripts/verify-xunjing-platform-readiness.mjs')
    const seed = await readText(xichengSeedPath)
    const moduleSql = await readText('backend/yudao/sql/mysql/xunjing-module.sql')
    const triggerEngine = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingMultimodalTriggerEngine.java'
    )
    const appTest = await readText(
      'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java'
    )

    expect(verifier).toContain('xunjing-seed-xicheng-p0.sql')
    expect(verifier).toContain('xicheng-seed-data')
    expect(verifier).toContain('xicheng-trigger-backend')
    expect(verifier).toContain('xicheng-ai-source-guard-backend')
    expect(verifier).toContain('includeXichengTriggerCheck')
    expect(verifier).toContain('--include-xicheng-trigger-check')
    expect(verifier).toContain('live-xicheng-trigger-baitasi')
    expect(verifier).toContain('live-xicheng-trigger-gongwangfu')
    expect(verifier).toContain('live-xicheng-trigger-planetarium')
    expect(moduleSql).toContain('CREATE TABLE IF NOT EXISTS `xunjing_poi`')
    expect(triggerEngine).toContain('XunjingPoiMapper')
    expect(triggerEngine).toContain('loadDatabasePoiProfiles')
    expect(triggerEngine).toContain('selectPublishedListByRegionCode')
    expect(appTest).toContain('testResolveMultimodalTriggerUsesPublishedPoiFromDatabase')
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

    expect(seed.match(/"poiId":"xicheng-/g) ?? []).toHaveLength(24)
    expect(seed).toContain('INSERT INTO `xunjing_poi`')
    expect(seed).toContain('INSERT INTO `xunjing_knowledge_document`')
    expect(seed).toContain('INSERT INTO `xunjing_ai_eval_case`')
  })
})
