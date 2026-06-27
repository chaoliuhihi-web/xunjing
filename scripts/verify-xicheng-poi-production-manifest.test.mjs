import { spawnSync } from 'node:child_process'
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
      licenseStatus: 'APPROVED',
      licenseEvidenceRef: `oss://xunjing-review/xicheng/${poiCode}/source-license-approval.pdf`,
      licenseReviewedBy: 'xicheng-license-reviewer',
      licenseReviewedAt: '2026-06-27'
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

async function writeJson(rootDir, relativePath, value) {
  const filePath = path.join(rootDir, relativePath)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`)
  return filePath
}

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-poi-manifest-'))
  tempDirs.push(rootDir)
  return rootDir
}

function runManifestGate(args, options = {}) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/verify-xicheng-poi-production-manifest.mjs'),
    ...args
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
    ...options
  })
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('xicheng POI production manifest gate', () => {
  test('accepts an 80 POI production manifest with approved source geo and review evidence', async () => {
    const rootDir = await createTempRoot()
    const manifestPath = await writeJson(rootDir, 'workbench/xicheng-production-pois.json', productionManifest())

    const result = runManifestGate(['--manifest', manifestPath, '--root', rootDir])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('PRODUCTION_POI_MANIFEST_READY')
    expect(report.summary).toMatchObject({
      manifestFile: manifestPath,
      totalPoiCount: 80,
      targetPoiCount: 80,
      productionReady: true
    })
    expect(report.summary.manifestSha256).toMatch(/^[a-f0-9]{64}$/)
    expect(report.checks.map((check) => check.name)).toEqual([
      'manifest-shape',
      'manifest-production-flags',
      'poi-count',
      'poi-identity',
      'poi-coordinates',
      'poi-triggers',
      'poi-source-license',
      'poi-field-evidence',
      'poi-content',
      'poi-audit'
    ])
    expect(report.blockers).toEqual([])
  })

  test('fails closed and writes evidence for incomplete or unapproved production POIs', async () => {
    const rootDir = await createTempRoot()
    const manifestPath = await writeJson(rootDir, 'workbench/xicheng-production-pois.json', productionManifest({
      productionReady: false,
      pois: [productionPoi(1, {
        aliases: ['西城生产点位001'],
        coordType: 'BD09',
        source: {
          sourceTitle: '未授权来源',
          sourceUrl: 'http://localhost/source',
          sourceType: 'UNKNOWN',
          licenseStatus: 'REVIEW_REQUIRED'
        },
        trigger: {
          gpsRadiusMeters: 1200,
          ocrKeywords: ['西城生产点位001'],
          photoLabels: ['xicheng'],
          minConfidence: 0.5
        },
        fieldEvidence: {
          photoEvidenceStatus: 'REVIEW_REQUIRED',
          triggerSmokeStatus: 'FAILED',
          evidenceRefs: ['file:///tmp/raw-field-photo.jpg'],
          verifiedBy: '',
          verifiedAt: ''
        },
        content: {
          shortIntro: '太短',
          recommendedQuestions: ['一个问题']
        },
        audit: {
          reviewStatus: 'APPROVED',
          geoStatus: 'REVIEW_REQUIRED',
          licenseStatus: 'REVIEW_REQUIRED',
          status: 'DRAFT',
          reviewedBy: '',
          reviewedAt: ''
        }
      })]
    }))
    const evidencePath = path.join(rootDir, 'tmp/xicheng-poi-manifest-evidence.json')

    const result = runManifestGate([
      '--manifest', manifestPath,
      '--root', rootDir,
      '--evidence-file', 'tmp/xicheng-poi-manifest-evidence.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(evidencePath, 'utf8'))
    expect(evidence.artifactType).toBe('xicheng-poi-production-manifest-readiness')
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('80 production-ready POIs required; found 1/80')
    expect(evidence.blockers.join('\n')).toContain('xicheng-prod-poi-001 source.licenseStatus must be APPROVED')
    expect(evidence.blockers.join('\n')).toContain('xicheng-prod-poi-001 source.licenseEvidenceRef must include a source license evidence reference')
    expect(evidence.blockers.join('\n')).toContain('xicheng-prod-poi-001 source.licenseReviewedBy is required')
    expect(evidence.blockers.join('\n')).toContain('xicheng-prod-poi-001 source.licenseReviewedAt is required')
    expect(evidence.blockers.join('\n')).toContain('xicheng-prod-poi-001 fieldEvidence.photoEvidenceStatus must be APPROVED')
    expect(evidence.blockers.join('\n')).toContain('xicheng-prod-poi-001 fieldEvidence.evidenceRefs must include at least one object-storage or HTTPS reference')
    expect(evidence.blockers.join('\n')).toContain('xicheng-prod-poi-001 audit.geoStatus must be APPROVED')
  })

  test('rejects manifest evidence paths outside qa tmp or workbench', async () => {
    const rootDir = await createTempRoot()
    const manifestPath = await writeJson(rootDir, 'workbench/xicheng-production-pois.json', productionManifest())

    const result = runManifestGate([
      '--manifest', manifestPath,
      '--root', rootDir,
      '--evidence-file', 'xicheng-poi-manifest-evidence.json'
    ])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('evidence file must be under qa/, tmp/ or workbench/')
  })

  test('exposes the manifest gate through npm scripts and deployment docs', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
    const deployDoc = await readFile('docs/02_开发规划/星河寻境业务平台部署说明.md', 'utf8')

    expect(packageJson.scripts['xunjing:xicheng:poi:manifest:gate']).toBe(
      'node scripts/verify-xicheng-poi-production-manifest.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:xicheng:poi:manifest:gate')
    expect(deployDoc).toContain('PRODUCTION_POI_MANIFEST_READY')
  })
})
