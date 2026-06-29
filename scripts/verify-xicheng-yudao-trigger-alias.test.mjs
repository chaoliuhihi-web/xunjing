import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

import {
  buildTriggerAliasEvidence,
  buildTriggerAliasSql,
  parseTriggerAliasRows
} from './verify-xicheng-yudao-trigger-alias.mjs'

describe('Xicheng Yudao trigger alias verifier', () => {
  test('builds a tenant-scoped SQL probe for the Shichahai and Yandai trigger conflict', () => {
    const sql = buildTriggerAliasSql({ XUNJING_TENANT_ID: '1' })

    expect(sql).toContain('SET NAMES utf8mb4')
    expect(sql).toContain('SET @tenant_id := 1')
    expect(sql).toContain("poi_code = 'xicheng-shichahai'")
    expect(sql).toContain("poi_code = 'xicheng-yandai-xiejie'")
    expect(sql).toContain('shichahaiHasYandaiAlias')
    expect(sql).toContain('yandaiHasAlias')
    expect(sql).toContain('yandaiHasTriggerKeyword')
  })

  test('fails when Shichahai still contains the Yandai Xiejie alias', () => {
    const rows = [
      'shichahaiExists\t1',
      'yandaiExists\t1',
      'shichahaiHasYandaiAlias\t1',
      'yandaiHasAlias\t1',
      'yandaiHasTriggerKeyword\t1'
    ].join('\n')

    const evidence = buildTriggerAliasEvidence({
      metrics: parseTriggerAliasRows(rows),
      checkedAt: '2026-06-29T04:00:00.000Z',
      client: 'container'
    })

    expect(evidence.ok).toBe(false)
    expect(evidence.status).toBe('YUDAO_XICHENG_TRIGGER_ALIAS_REVIEW_REQUIRED')
    expect(evidence.blockers).toContain('xicheng-shichahai aliases_json must not contain 烟袋斜街')
  })

  test('passes only when Yandai owns its alias and trigger keyword', () => {
    const rows = [
      'shichahaiExists\t1',
      'yandaiExists\t1',
      'shichahaiHasYandaiAlias\t0',
      'yandaiHasAlias\t1',
      'yandaiHasTriggerKeyword\t1'
    ].join('\n')

    const evidence = buildTriggerAliasEvidence({
      metrics: parseTriggerAliasRows(rows),
      checkedAt: '2026-06-29T04:00:00.000Z',
      client: 'container'
    })

    expect(evidence.ok).toBe(true)
    expect(evidence.status).toBe('YUDAO_XICHENG_TRIGGER_ALIAS_READY')
    expect(evidence.summary.packageCode).toBe('XICHENG-MAP-001')
    expect(evidence.summary.regionCode).toBe('beijing-xicheng')
    expect(evidence.blockers).toEqual([])
  })

  test('documents the runtime patch and exposes the npm command', async () => {
    const rootDir = path.resolve('.')
    const packageJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'))
    const patchSql = await readFile(
      path.join(rootDir, 'backend/yudao/sql/mysql/xunjing-patch-xicheng-trigger-alias-20260629.sql'),
      'utf8'
    )
    const deployDoc = await readFile(
      path.join(rootDir, 'docs/02_开发规划/星河寻境业务平台部署说明.md'),
      'utf8'
    )
    const statusDoc = await readFile(
      path.join(rootDir, 'docs/04_AI交接任务书/西城P0后台上线状态.md'),
      'utf8'
    )

    expect(packageJson.scripts['xunjing:yudao:trigger-alias:verify']).toBe(
      'node scripts/verify-xicheng-yudao-trigger-alias.mjs'
    )
    expect(patchSql).toContain('xicheng-shichahai')
    expect(patchSql).toContain('xicheng-yandai-xiejie')
    expect(patchSql).toContain('JSON_CONTAINS')
    expect(patchSql).toContain('烟袋斜街')
    expect(deployDoc).toContain('xunjing:yudao:trigger-alias:verify')
    expect(deployDoc).toContain('xunjing-patch-xicheng-trigger-alias-20260629.sql')
    expect(statusDoc).toContain('xunjing:yudao:trigger-alias:verify')
  })
})
