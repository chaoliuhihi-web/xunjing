import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []

function productionPoi(index, overrides = {}) {
  const suffix = String(index).padStart(3, '0')
  const poiCode = `xicheng-prod-poi-${suffix}`
  const categories = [
    'heritage_site',
    'museum',
    'park_scenic',
    'historic_district',
    'culture_space',
    'science_museum',
    'citywalk_street',
    'urban_landmark'
  ]
  return {
    poiCode,
    regionCode: 'beijing-xicheng',
    packageCode: 'XICHENG-MAP-001',
    name: `西城生产点位${suffix}`,
    displayName: `西城生产点位${suffix}`,
    aliases: [`西城生产点位${suffix}`, `生产点位${suffix}`, `别名${suffix}`],
    category: categories[(index - 1) % categories.length],
    priority: 'P0',
    address: `北京市西城区生产审核路${index}号`,
    latitude: 39.88 + index / 10000,
    longitude: 116.34 + index / 10000,
    coordType: 'GCJ02',
    source: {
      sourceTitle: `西城生产点位${suffix}官方审核来源`,
      sourceUrl: `https://www.bjxch.gov.cn/xicheng/poi/${suffix}`,
      sourceType: 'OFFICIAL',
      licenseStatus: 'APPROVED'
    },
    trigger: {
      gpsRadiusMeters: 180,
      ocrKeywords: [`西城生产点位${suffix}`, `生产点位${suffix}`],
      photoLabels: ['xicheng', 'landmark'],
      minConfidence: 0.85
    },
    fieldEvidence: {
      photoEvidenceStatus: 'APPROVED',
      triggerSmokeStatus: 'PASSED',
      evidenceRefs: [`oss://xunjing-review/xicheng/${poiCode}/field-photo-001.jpg`],
      verifiedBy: 'xicheng-field-reviewer',
      verifiedAt: '2026-06-27'
    },
    content: {
      shortIntro: `西城生产点位${suffix}已完成来源授权、坐标复核和内容审核，可用于生产试运营讲解。`,
      recommendedQuestions: [
        `西城生产点位${suffix}有什么看点？`,
        `这里适合怎么游览？`,
        `附近可以串联哪些西城点位？`
      ]
    },
    audit: {
      reviewStatus: 'APPROVED',
      geoStatus: 'APPROVED',
      licenseStatus: 'APPROVED',
      status: 'PUBLISHED',
      reviewedBy: 'xicheng-content-reviewer',
      reviewedAt: '2026-06-27'
    },
    ...overrides
  }
}

function productionManifest(overrides = {}) {
  return {
    regionCode: 'beijing-xicheng',
    packageCode: 'XICHENG-MAP-001',
    targetP0PoiCount: 80,
    productionReady: true,
    pois: Array.from({ length: 80 }, (_, index) => productionPoi(index + 1)),
    ...overrides
  }
}

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-poi-seed-verify-'))
  tempDirs.push(rootDir)
  return rootDir
}

async function writeFileInRoot(rootDir, relativePath, value) {
  const filePath = path.join(rootDir, relativePath)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, value)
  return filePath
}

async function writeJson(rootDir, relativePath, value) {
  return writeFileInRoot(rootDir, relativePath, `${JSON.stringify(value, null, 2)}\n`)
}

function runGenerator(args) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/generate-xicheng-poi-production-seed.mjs'),
    ...args
  ], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })
}

function runSeedGate(args) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/verify-xicheng-poi-production-seed.mjs'),
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

describe('xicheng POI production seed SQL gate', () => {
  test('accepts generated production SQL and writes release evidence', async () => {
    const rootDir = await createTempRoot()
    const manifestPath = await writeJson(rootDir, 'workbench/xicheng-production-pois.json', productionManifest())
    const sqlPath = path.join(rootDir, 'tmp/xicheng-poi-production-seed.sql')
    const evidencePath = path.join(rootDir, 'qa/xicheng-poi-production-seed-evidence.json')

    const generated = runGenerator([
      '--manifest', manifestPath,
      '--root', rootDir,
      '--output', 'tmp/xicheng-poi-production-seed.sql'
    ])
    expect(generated.status).toBe(0)

    const result = runSeedGate([
      '--sql', sqlPath,
      '--root', rootDir,
      '--evidence-file', 'qa/xicheng-poi-production-seed-evidence.json'
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report.artifactType).toBe('xicheng-poi-production-seed-readiness')
    expect(report.status).toBe('PRODUCTION_POI_SEED_READY')
    expect(report.summary).toMatchObject({
      poiCount: 80,
      minPoiCount: 80,
      productionReady: true,
      sqlFile: sqlPath
    })
    expect(report.summary.sqlSha256).toMatch(/^[a-f0-9]{64}$/)
    expect(report.checks.map((check) => check.name)).toEqual([
      'sql-file',
      'seed-shape',
      'poi-count',
      'poi-approval',
      'production-metrics',
      'field-evidence',
      'source-documents'
    ])
    expect(report.blockers).toEqual([])

    const evidence = JSON.parse(await readFile(evidencePath, 'utf8'))
    expect(evidence.status).toBe('PRODUCTION_POI_SEED_READY')
  })

  test('fails closed for incomplete or unreviewed production SQL', async () => {
    const rootDir = await createTempRoot()
    const sqlPath = await writeFileInRoot(rootDir, 'tmp/xicheng-poi-production-seed.sql', `/*
 Generated from reviewed Xicheng POI production manifest.
*/
INSERT INTO \`xunjing_poi\`
(\`package_id\`, \`poi_code\`, \`review_status\`, \`geo_status\`, \`license_status\`, \`status\`)
VALUES
(@map_package_id, 'xicheng-prod-poi-001', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'DRAFT');
INSERT INTO \`xunjing_knowledge_document\` (\`title\`) VALUES ('POI 级生产来源');
INSERT INTO \`xunjing_map_point\` (\`title\`) VALUES ('xicheng-prod-poi-001');
INSERT INTO \`xunjing_public_report\` (\`metrics_json\`) VALUES ('{"productionReady":false,"poiSeedCount":1,"targetP0PoiCount":80}');
`)
    const evidencePath = path.join(rootDir, 'tmp/xicheng-poi-production-seed-evidence.json')

    const result = runSeedGate([
      '--sql', sqlPath,
      '--root', rootDir,
      '--evidence-file', 'tmp/xicheng-poi-production-seed-evidence.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(evidencePath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('80 production POI seed rows required; found 1/80')
    expect(evidence.blockers.join('\n')).toContain('seed SQL must not contain REVIEW_REQUIRED or DRAFT')
    expect(evidence.blockers.join('\n')).toContain('production metrics must include "productionReady":true')
    expect(evidence.blockers.join('\n')).toContain('seed SQL must include approved field evidence for each production POI')
  })

  test('rejects seed evidence paths outside qa tmp or workbench', async () => {
    const rootDir = await createTempRoot()
    const manifestPath = await writeJson(rootDir, 'workbench/xicheng-production-pois.json', productionManifest())
    const sqlPath = path.join(rootDir, 'tmp/xicheng-poi-production-seed.sql')

    const generated = runGenerator([
      '--manifest', manifestPath,
      '--root', rootDir,
      '--output', 'tmp/xicheng-poi-production-seed.sql'
    ])
    expect(generated.status).toBe(0)

    const result = runSeedGate([
      '--sql', sqlPath,
      '--root', rootDir,
      '--evidence-file', 'xicheng-poi-production-seed-evidence.json'
    ])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('evidence file must be under qa/, tmp/ or workbench/')
  })

  test('exposes the seed SQL gate through npm scripts and deployment docs', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
    const deployDoc = await readFile('docs/02_开发规划/星河寻境业务平台部署说明.md', 'utf8')

    expect(packageJson.scripts['xunjing:xicheng:poi:seed:verify']).toBe(
      'node scripts/verify-xicheng-poi-production-seed.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:xicheng:poi:seed:verify')
    expect(deployDoc).toContain('PRODUCTION_POI_SEED_READY')
  })
})
