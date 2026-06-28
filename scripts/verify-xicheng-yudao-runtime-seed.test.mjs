import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import {
  buildRuntimeSeedEvidence,
  buildRuntimeSeedSql,
  parseMetricRows,
  resolveEvidenceFile,
  resolveMysqlInvocation,
  validateRuntimeSeedEnv
} from './verify-xicheng-yudao-runtime-seed.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const env = {
  XUNJING_TENANT_ID: '1',
  MYSQL_HOST: '127.0.0.1',
  MYSQL_PORT: '33306',
  MYSQL_DATABASE: 'yudao_xinghe_xunjing',
  MYSQL_USERNAME: 'xunjing',
  MYSQL_PASSWORD: 'local-password',
  MYSQL_CONTAINER: 'xunjing-mysql'
}

describe('Xicheng Yudao runtime seed verifier', () => {
  test('builds a tenant-scoped SQL probe for the local candidate backend seed', () => {
    const sql = buildRuntimeSeedSql(env)

    expect(sql).toContain('SET NAMES utf8mb4')
    expect(sql).toContain('SET @tenant_id := 1')
    expect(sql).toContain("package_code = 'XICHENG-MAP-001'")
    expect(sql).toContain("region_code = 'beijing-xicheng'")
    expect(sql).toContain('xunjing_resource_package')
    expect(sql).toContain('xunjing_poi')
    expect(sql).toContain('xunjing_knowledge_document')
    expect(sql).toContain('xunjing_map_point')
    expect(sql).toContain('xunjing_qrcode')
  })

  test('parses MySQL metric output and marks runtime seed ready without hiding production review blockers', () => {
    const rows = [
      'packageCount\t1',
      'poiTotal\t80',
      'poiApprovedPublished\t80',
      'poiGeoReviewRequired\t80',
      'poiLicenseReviewRequired\t80',
      'knowledgeDocuments\t84',
      'mapPoints\t80',
      'qrCodes\t1',
      'publicReportLocalCandidate\t1',
      'publicReportProductionReady\t0',
      'samplePoiCodes\txicheng-baitasi,xicheng-emperors-temple,xicheng-beihai-park'
    ].join('\n')

    const evidence = buildRuntimeSeedEvidence({
      env,
      metrics: parseMetricRows(rows),
      client: 'container',
      checkedAt: '2026-06-28T12:00:00.000Z'
    })

    expect(evidence.artifactType).toBe('xicheng-yudao-runtime-seed')
    expect(evidence.ok).toBe(true)
    expect(evidence.status).toBe('YUDAO_XICHENG_LOCAL_SEED_READY')
    expect(evidence.summary.packageCode).toBe('XICHENG-MAP-001')
    expect(evidence.summary.regionCode).toBe('beijing-xicheng')
    expect(evidence.summary.poiTotal).toBe(80)
    expect(evidence.summary.knowledgeDocuments).toBe(84)
    expect(evidence.summary.mapPoints).toBe(80)
    expect(evidence.summary.localCandidateReady).toBe(true)
    expect(evidence.summary.productionReady).toBe(false)
    expect(evidence.summary.productionBlockers).toContain('80 Xicheng POIs still require coordinate review')
    expect(evidence.summary.productionBlockers).toContain('80 Xicheng POIs still require source license review')
    expect(evidence.checks.map((check) => check.name)).toContain('secret-redaction')
    expect(JSON.stringify(evidence)).not.toContain(env.MYSQL_PASSWORD)
  })

  test('fails local candidate readiness when the runtime database is missing Xicheng POIs', () => {
    const evidence = buildRuntimeSeedEvidence({
      env,
      client: 'local',
      checkedAt: '2026-06-28T12:00:00.000Z',
      metrics: {
        packageCount: 1,
        poiTotal: 5,
        poiApprovedPublished: 5,
        poiGeoReviewRequired: 5,
        poiLicenseReviewRequired: 5,
        knowledgeDocuments: 4,
        mapPoints: 5,
        qrCodes: 1,
        publicReportLocalCandidate: 1,
        publicReportProductionReady: 0,
        samplePoiCodes: 'xicheng-baitasi'
      }
    })

    expect(evidence.ok).toBe(false)
    expect(evidence.status).toBe('YUDAO_XICHENG_LOCAL_SEED_NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('runtime database must contain at least 80 Xicheng POIs')
  })

  test('resolves safe MySQL invocations for local, container, and docker clients', () => {
    expect(resolveMysqlInvocation(env, {
      mysqlClient: 'local',
      hasLocalMysql: true,
      hasDocker: false
    })).toMatchObject({
      client: 'local',
      command: 'mysql',
      env: {
        MYSQL_PWD: env.MYSQL_PASSWORD
      }
    })

    const containerInvocation = resolveMysqlInvocation(env, {
      mysqlClient: 'container',
      hasLocalMysql: false,
      hasDocker: true
    })
    expect(containerInvocation.client).toBe('container')
    expect(containerInvocation.args).toContain('exec')
    expect(containerInvocation.args).toContain(env.MYSQL_CONTAINER)
    expect(containerInvocation.args).toContain('--host=127.0.0.1')
    expect(containerInvocation.args).toContain('--port=3306')
    expect(containerInvocation.args.join(' ')).not.toContain(env.MYSQL_PASSWORD)

    const dockerInvocation = resolveMysqlInvocation({
      ...env,
      MYSQL_CLIENT: 'docker'
    }, {
      hasLocalMysql: false,
      hasDocker: true
    })
    expect(dockerInvocation.client).toBe('docker')
    expect(dockerInvocation.args).toContain('run')
    expect(dockerInvocation.args).toContain('mysql:8.4')
  })

  test('keeps evidence output under qa tmp or workbench and exposes the npm script', async () => {
    expect(resolveEvidenceFile(rootDir, 'qa/xicheng-yudao-runtime-seed-evidence.json')).toBe(
      resolve(rootDir, 'qa/xicheng-yudao-runtime-seed-evidence.json')
    )
    expect(() => resolveEvidenceFile(rootDir, 'xicheng-yudao-runtime-seed-evidence.json')).toThrow(
      'evidence file must be under qa/, tmp/ or workbench/'
    )

    const packageJson = JSON.parse(await readFile(resolve(rootDir, 'package.json'), 'utf8'))
    const statusDoc = await readFile(
      resolve(rootDir, 'docs/04_AI交接任务书/西城P0后台上线状态.md'),
      'utf8'
    )

    expect(packageJson.scripts['xunjing:yudao:runtime-seed:verify']).toBe(
      'node scripts/verify-xicheng-yudao-runtime-seed.mjs'
    )
    expect(statusDoc).toContain('npm run xunjing:yudao:runtime-seed:verify')
  })

  test('rejects missing required database env without printing secrets', () => {
    expect(() => validateRuntimeSeedEnv({ ...env, MYSQL_PASSWORD: '' })).toThrow(
      'MYSQL_PASSWORD is required for Xicheng Yudao runtime seed verification'
    )
  })
})
