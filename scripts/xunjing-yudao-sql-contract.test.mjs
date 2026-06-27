import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const moduleSqlPath = 'backend/yudao/sql/mysql/xunjing-module.sql'
const yudaoAiSqlPath = 'backend/yudao/sql/mysql/yudao-ai-module.sql'
const seedSqlPath = 'backend/yudao/sql/mysql/xunjing-seed-kashgar-p0.sql'
const xichengSeedSqlPath = 'backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql'

async function readText(path) {
  return await readFile(resolve(rootDir, path), 'utf8')
}

describe('xunjing yudao sql contract', () => {
  test('keeps P0 media and AI cost-control columns in the module schema', async () => {
    const sql = await readText(moduleSqlPath)

    expect(sql).toContain("`can_public` bit(1) NOT NULL DEFAULT b'1'")
    expect(sql).toContain("`can_ai_use` bit(1) NOT NULL DEFAULT b'1'")
    expect(sql).toContain("`can_promotion_use` bit(1) NOT NULL DEFAULT b'0'")
    expect(sql).toContain("`cache_enabled` bit(1) NOT NULL DEFAULT b'1'")
    expect(sql).toContain("`cache_hit` bit(1) NOT NULL DEFAULT b'0'")
    expect(sql).toContain('`idx_xunjing_ai_log_qrcode`')
    expect(sql).toContain('xunjing:map-point:query')
    expect(sql).toContain('xunjing:globe-model:query')
  })

  test('seeds staging data for all P0 AI quota scopes', async () => {
    const seed = await readText(seedSqlPath)

    for (const scope of ['PROJECT', 'SCHOOL', 'PACKAGE', 'QRCODE', 'USER']) {
      expect(seed).toContain(`'${scope}'`)
    }
    expect(seed).toContain('QR-KASHGAR-MAP-001')
    expect(seed).toContain('"quotaRuleCount":5')
    expect(seed).toContain('"aiEvalCaseCount":5')
    expect(seed).toContain('新疆首站 P0 固定评测集')
    expect(seed.match(/INSERT INTO `xunjing_ai_eval_case`/g) ?? []).toHaveLength(5)
    for (const riskTag of ['map_boundary', 'ethnic', 'religious', 'unknown_answer']) {
      expect(seed).toContain(riskTag)
    }
    expect(seed).toContain('cache_enabled')
  })

  test('keeps Xicheng POI seed data maintainable and gateable', async () => {
    const moduleSql = await readText(moduleSqlPath)
    const seed = await readText(xichengSeedSqlPath)

    for (const snippet of [
      'CREATE TABLE IF NOT EXISTS `xunjing_poi`',
      '`poi_code` varchar(64)',
      '`region_code` varchar(64)',
      '`aliases_json` text',
      '`trigger_json` text',
      '`source_json` text',
      '`review_status` varchar(32)',
      '`geo_status` varchar(32)',
      '`license_status` varchar(32)',
      '`uk_xunjing_poi_code_tenant`'
    ]) {
      expect(moduleSql).toContain(snippet)
    }

    expect(seed).toContain('XICHENG-2026-P0')
    expect(seed).toContain('XICHENG-MAP-001')
    expect(seed).toContain('QR-XICHENG-MAP-001')
    expect(seed).toContain('beijing-xicheng')
    expect(seed.match(/"poiId":"xicheng-/g) ?? []).toHaveLength(24)
    expect(seed).toContain('"targetP0PoiCount":80')
    expect(seed).toContain('"productionReady":false')
  })

  test('includes Yudao AI management schema in independent platform initialization', async () => {
    const aiSql = await readText(yudaoAiSqlPath)
    const compose = await readText('ops/xunjing-platform.compose.yml')
    const initScript = await readText('ops/mysql-init/xunjing-init.sh')

    for (const table of [
      'ai_api_key',
      'ai_model',
      'ai_chat_role',
      'ai_chat_conversation',
      'ai_chat_message',
      'ai_knowledge',
      'ai_knowledge_document',
      'ai_knowledge_segment',
      'ai_image',
      'ai_music',
      'ai_write',
      'ai_workflow',
      'ai_mind_map',
      'ai_tool'
    ]) {
      expect(aiSql).toContain(`CREATE TABLE IF NOT EXISTS \`${table}\``)
    }

    expect(aiSql).not.toContain('sk-')
    expect(aiSql).not.toContain('AIza')
    expect(compose).toContain('xunjing-yudao-runtime-minimal.sql:/opt/xunjing-sql/02-xunjing-yudao-runtime-minimal.sql:ro')
    expect(compose).toContain('yudao-ai-module.sql:/opt/xunjing-sql/03-yudao-ai-module.sql:ro')
    expect(initScript).toContain('/opt/xunjing-sql/02-xunjing-yudao-runtime-minimal.sql')
    expect(initScript).toContain('/opt/xunjing-sql/03-yudao-ai-module.sql')
    expect(initScript).toContain("table_name in ('ai_api_key', 'ai_model', 'ai_knowledge')")
  })
})
