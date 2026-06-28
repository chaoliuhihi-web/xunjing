import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, test } from 'vitest'

import {
  applyXichengYudaoProductionSeed,
  validateProductionSeedEvidenceForApply
} from './apply-xicheng-yudao-production-seed.mjs'

const tempDirs = []

const env = {
  XUNJING_TENANT_ID: '1',
  MYSQL_HOST: 'xunjing-prod-mysql.internal',
  MYSQL_PORT: '3306',
  MYSQL_DATABASE: 'yudao_xinghe_xunjing_prod',
  MYSQL_USERNAME: 'xunjing_prod',
  MYSQL_PASSWORD: 'prod-db-password'
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-yudao-seed-apply-'))
  tempDirs.push(rootDir)
  return rootDir
}

async function writeFixtureFiles(rootDir, overrides = {}) {
  const seedSqlFile = path.join(rootDir, 'workbench/xicheng-poi-production-seed.sql')
  const seedEvidenceFile = path.join(rootDir, 'qa/xicheng-poi-production-seed-evidence.json')
  const seedSql = overrides.seedSql || [
    '/* Generated from reviewed Xicheng POI production manifest. */',
    "SELECT 'xicheng production seed apply fixture';"
  ].join('\n')
  await mkdir(path.dirname(seedSqlFile), { recursive: true })
  await mkdir(path.dirname(seedEvidenceFile), { recursive: true })
  await writeFile(seedSqlFile, seedSql)
  await writeFile(seedEvidenceFile, `${JSON.stringify({
    artifactType: 'xicheng-poi-production-seed-readiness',
    ok: true,
    status: 'PRODUCTION_POI_SEED_READY',
    checkedAt: '2026-06-28T12:00:00.000Z',
    summary: {
      sqlFile: seedSqlFile,
      sqlSha256: sha256(seedSql),
      poiCount: 80,
      minPoiCount: 80,
      productionReady: true,
      regionCode: 'beijing-xicheng',
      packageCode: 'XICHENG-MAP-001',
      poiSeedCount: 80,
      targetP0PoiCount: 80,
      ...(overrides.summary || {})
    },
    checks: [
      { name: 'sql-file', ok: true },
      { name: 'seed-shape', ok: true },
      { name: 'seed-preconditions', ok: true },
      { name: 'poi-count', ok: true },
      { name: 'poi-approval', ok: true },
      { name: 'production-metrics', ok: true },
      { name: 'review-batch-metrics', ok: true },
      { name: 'field-evidence', ok: true },
      { name: 'source-license-evidence', ok: true },
      { name: 'source-documents', ok: true }
    ],
    blockers: [],
    ...(overrides.evidence || {})
  }, null, 2)}\n`)
  return { seedSqlFile, seedEvidenceFile, seedSql }
}

function readyRuntimeRows() {
  return [
    'packageCount\t1',
    'poiTotal\t80',
    'poiApprovedPublished\t80',
    'poiGeoReviewRequired\t0',
    'poiLicenseReviewRequired\t0',
    'knowledgeDocuments\t84',
    'mapPoints\t80',
    'qrCodes\t1',
    'publicReportLocalCandidate\t1',
    'publicReportProductionReady\t1',
    'samplePoiCodes\txicheng-baitasi,xicheng-gongwangfu'
  ].join('\n')
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('Xicheng Yudao production seed apply', () => {
  test('fails closed unless the destructive apply flag is explicit', async () => {
    const rootDir = await createTempRoot()
    const { seedSqlFile, seedEvidenceFile } = await writeFixtureFiles(rootDir)
    const spawnCalls = []

    await expect(applyXichengYudaoProductionSeed({
      rootDir,
      env,
      seedSqlPath: seedSqlFile,
      seedEvidencePath: seedEvidenceFile,
      runtimeEvidenceFile: 'qa/xicheng-yudao-runtime-seed-production-evidence.json',
      confirmed: false,
      mysqlOptions: { mysqlClient: 'local', hasLocalMysql: true, hasDocker: false },
      spawnImpl: (...args) => {
        spawnCalls.push(args)
        return { status: 0, stdout: readyRuntimeRows(), stderr: '' }
      }
    })).rejects.toThrow('explicit --confirm-apply-xicheng-production-seed is required')

    expect(spawnCalls).toEqual([])
  })

  test('validates the production seed evidence against the SQL file before applying', async () => {
    const rootDir = await createTempRoot()
    const { seedSqlFile, seedEvidenceFile } = await writeFixtureFiles(rootDir)

    await expect(validateProductionSeedEvidenceForApply({
      rootDir,
      seedSqlPath: seedSqlFile,
      seedEvidencePath: seedEvidenceFile
    })).resolves.toMatchObject({
      seedSqlFile,
      seedEvidenceFile,
      seedSqlSha256: sha256(await readFile(seedSqlFile, 'utf8')),
      poiCount: 80,
      packageCode: 'XICHENG-MAP-001',
      regionCode: 'beijing-xicheng'
    })
  })

  test('rejects stale or mismatched seed evidence before touching the target database', async () => {
    const rootDir = await createTempRoot()
    const { seedSqlFile, seedEvidenceFile } = await writeFixtureFiles(rootDir, {
      summary: {
        sqlSha256: '0'.repeat(64)
      }
    })

    await expect(validateProductionSeedEvidenceForApply({
      rootDir,
      seedSqlPath: seedSqlFile,
      seedEvidencePath: seedEvidenceFile
    })).rejects.toThrow('seed evidence sqlSha256 must match the SQL file content')
  })

  test('applies the verified SQL and immediately writes production runtime evidence', async () => {
    const rootDir = await createTempRoot()
    const { seedSqlFile, seedEvidenceFile, seedSql } = await writeFixtureFiles(rootDir)
    const spawnInputs = []

    const report = await applyXichengYudaoProductionSeed({
      rootDir,
      env,
      seedSqlPath: seedSqlFile,
      seedEvidencePath: seedEvidenceFile,
      runtimeEvidenceFile: 'qa/xicheng-yudao-runtime-seed-production-evidence.json',
      applyEvidenceFile: 'qa/xicheng-yudao-production-seed-apply-evidence.json',
      confirmed: true,
      mysqlOptions: { mysqlClient: 'local', hasLocalMysql: true, hasDocker: false },
      spawnImpl: (_command, _args, options) => {
        spawnInputs.push(options.input)
        return spawnInputs.length === 1
          ? { status: 0, stdout: '', stderr: '' }
          : { status: 0, stdout: readyRuntimeRows(), stderr: '' }
      },
      checkedAt: '2026-06-28T12:00:00.000Z'
    })

    expect(spawnInputs).toHaveLength(2)
    expect(spawnInputs[0]).toBe(seedSql)
    expect(spawnInputs[1]).toContain('xunjing_resource_package')
    expect(report).toMatchObject({
      artifactType: 'xicheng-yudao-production-seed-apply',
      ok: true,
      status: 'YUDAO_XICHENG_PRODUCTION_SEED_APPLIED',
      summary: {
        seedSqlFile,
        seedEvidenceFile,
        runtimeEvidenceFile: path.join(rootDir, 'qa/xicheng-yudao-runtime-seed-production-evidence.json'),
        runtimeSeedStatus: 'YUDAO_XICHENG_PRODUCTION_SEED_READY',
        runtimeSeedProductionReady: true,
        targetDatabase: 'yudao_xinghe_xunjing_prod'
      }
    })
    expect(JSON.stringify(report)).not.toContain(env.MYSQL_PASSWORD)

    const runtimeEvidence = JSON.parse(await readFile(
      path.join(rootDir, 'qa/xicheng-yudao-runtime-seed-production-evidence.json'),
      'utf8'
    ))
    expect(runtimeEvidence.status).toBe('YUDAO_XICHENG_PRODUCTION_SEED_READY')

    const applyEvidence = JSON.parse(await readFile(
      path.join(rootDir, 'qa/xicheng-yudao-production-seed-apply-evidence.json'),
      'utf8'
    ))
    expect(applyEvidence.summary.seedSqlSha256).toBe(sha256(seedSql))
  })

  test('exposes the apply command through npm scripts and deployment docs', async () => {
    const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
    const packageJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'))
    const deployDoc = await readFile(path.join(rootDir, 'docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(path.join(rootDir, 'docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:yudao:production-seed:apply']).toBe(
      'node scripts/apply-xicheng-yudao-production-seed.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:yudao:production-seed:apply')
    expect(statusDoc).toContain('npm run xunjing:yudao:production-seed:apply')
  })
})
