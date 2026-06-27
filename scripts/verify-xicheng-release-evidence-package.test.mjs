import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []
const freshCheckedAt = () => new Date().toISOString()
const staleCheckedAt = () => new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-release-evidence-package-'))
  tempDirs.push(rootDir)
  return rootDir
}

async function writeJson(rootDir, relativePath, value) {
  const filePath = path.join(rootDir, relativePath)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`)
  return filePath
}

function releaseEvidence(overrides = {}) {
  return {
    artifactType: 'xicheng-yudao-release-readiness',
    ok: true,
    status: 'PRODUCTION_READY_CANDIDATE',
    stage: 'production',
    checkedAt: freshCheckedAt(),
    summary: {
      stage: 'production',
      status: 'PRODUCTION_READY_CANDIDATE',
      totalChecks: 10,
      passedChecks: 10,
      failedChecks: 0,
      blockerCount: 0
    },
    checks: [
      { name: 'runtime-env', ok: true },
      { name: 'https-app-api-domain', ok: true },
      { name: 'real-wechat-app', ok: true },
      { name: 'real-ai-provider', ok: true },
      { name: 'vision-ocr-service', ok: true },
      { name: 'object-storage', ok: true },
      { name: 'full-yudao-baseline', ok: true },
      { name: 'xicheng-production-poi-evidence', ok: true },
      { name: 'xicheng-production-poi', ok: true },
      { name: 'xicheng-source-license', ok: true }
    ],
    blockers: [],
    ...overrides
  }
}

function manifestEvidence(overrides = {}) {
  return {
    artifactType: 'xicheng-poi-production-manifest-readiness',
    ok: true,
    status: 'PRODUCTION_POI_MANIFEST_READY',
    checkedAt: freshCheckedAt(),
    summary: {
      regionCode: 'beijing-xicheng',
      packageCode: 'XICHENG-MAP-001',
      totalPoiCount: 80,
      targetPoiCount: 80,
      productionReady: true
    },
    checks: [
      { name: 'manifest-shape', ok: true },
      { name: 'manifest-production-flags', ok: true },
      { name: 'poi-count', ok: true },
      { name: 'poi-identity', ok: true },
      { name: 'poi-coordinates', ok: true },
      { name: 'poi-triggers', ok: true },
      { name: 'poi-source-license', ok: true },
      { name: 'poi-field-evidence', ok: true },
      { name: 'poi-content', ok: true },
      { name: 'poi-audit', ok: true }
    ],
    blockers: [],
    ...overrides
  }
}

function seedEvidence(overrides = {}) {
  return {
    artifactType: 'xicheng-poi-production-seed-readiness',
    ok: true,
    status: 'PRODUCTION_POI_SEED_READY',
    checkedAt: freshCheckedAt(),
    summary: {
      poiCount: 80,
      minPoiCount: 80,
      productionReady: true,
      poiSeedCount: 80,
      targetP0PoiCount: 80
    },
    checks: [
      { name: 'sql-file', ok: true },
      { name: 'seed-shape', ok: true },
      { name: 'poi-count', ok: true },
      { name: 'poi-approval', ok: true },
      { name: 'production-metrics', ok: true },
      { name: 'field-evidence', ok: true },
      { name: 'source-documents', ok: true }
    ],
    blockers: [],
    ...overrides
  }
}

function appReadinessEvidence(overrides = {}) {
  return {
    ok: true,
    checkedAt: freshCheckedAt(),
    summary: {
      baseUrl: 'https://xunjing-api.xingheai.net',
      tenantId: '1'
    },
    checks: [
      { name: 'live-xicheng-scan-resolve', ok: true },
      { name: 'live-xicheng-error-feedback', ok: true },
      { name: 'live-xicheng-ai-chat-sourced', ok: true },
      { name: 'live-xicheng-ai-chat-blocked', ok: true },
      { name: 'live-xicheng-trigger-baitasi', ok: true },
      { name: 'live-xicheng-trigger-gongwangfu', ok: true },
      { name: 'live-xicheng-trigger-planetarium', ok: true }
    ],
    ...overrides
  }
}

function runPackageGate(args) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/verify-xicheng-release-evidence-package.mjs'),
    ...args
  ], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('xicheng release evidence package gate', () => {
  test('accepts a complete production release evidence package and writes package evidence', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeJson(rootDir, 'qa/xicheng-yudao-release-evidence.json', releaseEvidence())
    const manifestPath = await writeJson(rootDir, 'qa/xicheng-poi-manifest-evidence.json', manifestEvidence())
    const seedPath = await writeJson(rootDir, 'qa/xicheng-poi-production-seed-evidence.json', seedEvidence())
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const outputPath = path.join(rootDir, 'qa/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'qa/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report.artifactType).toBe('xicheng-release-evidence-package')
    expect(report.status).toBe('XICHENG_RELEASE_EVIDENCE_PACKAGE_READY')
    expect(report.summary).toMatchObject({
      stage: 'production',
      releaseStatus: 'PRODUCTION_READY_CANDIDATE',
      appReadinessCheckCount: 7,
      blockerCount: 0
    })
    expect(report.checks.map((check) => check.name)).toEqual([
      'release-gate-evidence',
      'poi-manifest-evidence',
      'poi-seed-evidence',
      'app-readiness-evidence',
      'secret-safety'
    ])
    expect(report.blockers).toEqual([])
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('XICHENG_RELEASE_EVIDENCE_PACKAGE_READY')
  })

  test('fails closed when POI evidence was generated before field evidence gates existed', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeJson(rootDir, 'qa/xicheng-yudao-release-evidence.json', releaseEvidence())
    const manifestPath = await writeJson(rootDir, 'qa/xicheng-poi-manifest-evidence.json', manifestEvidence({
      checks: [
        { name: 'manifest-shape', ok: true },
        { name: 'manifest-production-flags', ok: true },
        { name: 'poi-count', ok: true },
        { name: 'poi-identity', ok: true },
        { name: 'poi-coordinates', ok: true },
        { name: 'poi-triggers', ok: true },
        { name: 'poi-source-license', ok: true },
        { name: 'poi-content', ok: true },
        { name: 'poi-audit', ok: true }
      ]
    }))
    const seedPath = await writeJson(rootDir, 'qa/xicheng-poi-production-seed-evidence.json', seedEvidence({
      checks: [
        { name: 'sql-file', ok: true },
        { name: 'seed-shape', ok: true },
        { name: 'poi-count', ok: true },
        { name: 'poi-approval', ok: true },
        { name: 'production-metrics', ok: true },
        { name: 'source-documents', ok: true }
      ]
    }))
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('manifest evidence must include poi-field-evidence')
    expect(evidence.blockers.join('\n')).toContain('seed evidence must include field-evidence')
  })

  test('fails closed when production APP readiness evidence comes from a local HTTP server', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeJson(rootDir, 'qa/xicheng-yudao-release-evidence.json', releaseEvidence())
    const manifestPath = await writeJson(rootDir, 'qa/xicheng-poi-manifest-evidence.json', manifestEvidence())
    const seedPath = await writeJson(rootDir, 'qa/xicheng-poi-production-seed-evidence.json', seedEvidence())
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence({
      summary: {
        baseUrl: 'http://127.0.0.1:48080',
        tenantId: '1'
      }
    }))
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence baseUrl must be a non-local HTTPS URL for production')
  })

  test('fails closed when package input evidence is missing checkedAt timestamp', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeJson(rootDir, 'qa/xicheng-yudao-release-evidence.json', releaseEvidence())
    const manifestPath = await writeJson(rootDir, 'qa/xicheng-poi-manifest-evidence.json', manifestEvidence())
    const seedPath = await writeJson(rootDir, 'qa/xicheng-poi-production-seed-evidence.json', seedEvidence({
      checkedAt: undefined
    }))
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('seed evidence checkedAt must be a valid timestamp')
  })

  test('fails closed when package input evidence is older than the allowed freshness window', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeJson(rootDir, 'qa/xicheng-yudao-release-evidence.json', releaseEvidence())
    const manifestPath = await writeJson(rootDir, 'qa/xicheng-poi-manifest-evidence.json', manifestEvidence({
      checkedAt: staleCheckedAt()
    }))
    const seedPath = await writeJson(rootDir, 'qa/xicheng-poi-production-seed-evidence.json', seedEvidence())
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('manifest evidence checkedAt must be within the last 24 hours')
  })

  test('fails closed for incomplete APP evidence or raw secret-like values', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeJson(rootDir, 'qa/xicheng-yudao-release-evidence.json', releaseEvidence({
      leakedConfig: {
        MYSQL_PASSWORD: 'prod-db-password'
      }
    }))
    const manifestPath = await writeJson(rootDir, 'qa/xicheng-poi-manifest-evidence.json', manifestEvidence())
    const seedPath = await writeJson(rootDir, 'qa/xicheng-poi-production-seed-evidence.json', seedEvidence())
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence({
      checks: [
        { name: 'live-xicheng-scan-resolve', ok: true },
        { name: 'live-xicheng-ai-chat-sourced', ok: true }
      ]
    }))
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence must include live-xicheng-error-feedback')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence must include live-xicheng-trigger-baitasi')
    expect(evidence.blockers.join('\n')).toContain('release evidence contains raw secret-like value')
  })

  test('rejects package evidence output paths outside qa tmp or workbench', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeJson(rootDir, 'qa/xicheng-yudao-release-evidence.json', releaseEvidence())
    const manifestPath = await writeJson(rootDir, 'qa/xicheng-poi-manifest-evidence.json', manifestEvidence())
    const seedPath = await writeJson(rootDir, 'qa/xicheng-poi-production-seed-evidence.json', seedEvidence())
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('evidence file must be under qa/, tmp/ or workbench/')
  })

  test('exposes the release evidence package gate through npm scripts and deployment docs', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
    const deployDoc = await readFile('docs/02_开发规划/星河寻境业务平台部署说明.md', 'utf8')

    expect(packageJson.scripts['xunjing:xicheng:release:evidence:package']).toBe(
      'node scripts/verify-xicheng-release-evidence-package.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:xicheng:release:evidence:package')
    expect(deployDoc).toContain('XICHENG_RELEASE_EVIDENCE_PACKAGE_READY')
  })
})
