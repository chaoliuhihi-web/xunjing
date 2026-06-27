import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []

const workbookHeader = [
  'poiCode',
  'name',
  'displayName',
  'aliases',
  'category',
  'priority',
  'address',
  'latitude',
  'longitude',
  'coordType',
  'sourceTitle',
  'sourceUrl',
  'sourceType',
  'licenseStatus',
  'licenseEvidenceRef',
  'licenseReviewedBy',
  'licenseReviewedAt',
  'gpsRadiusMeters',
  'ocrKeywords',
  'photoLabels',
  'minConfidence',
  'photoEvidenceStatus',
  'triggerSmokeStatus',
  'fieldEvidenceRefs',
  'fieldVerifiedBy',
  'fieldVerifiedAt',
  'shortIntro',
  'recommendedQuestions',
  'reviewStatus',
  'geoStatus',
  'auditLicenseStatus',
  'status',
  'reviewedBy',
  'reviewedAt'
]

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-poi-workbook-'))
  tempDirs.push(rootDir)
  return rootDir
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function productionWorkbookRow(index) {
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
    name: `西城生产点位${suffix}`,
    displayName: `西城生产点位${suffix}`,
    aliases: `西城生产点位${suffix}|生产点位${suffix}|西城别名${suffix}`,
    category: categories[(index - 1) % categories.length],
    priority: 'P0',
    address: `北京市西城区生产审核路${index}号`,
    latitude: 39.88 + index / 10000,
    longitude: 116.34 + index / 10000,
    coordType: 'GCJ02',
    sourceTitle: `西城生产点位${suffix}官方审核来源`,
    sourceUrl: `https://www.bjxch.gov.cn/xicheng/reviewed/${suffix}`,
    sourceType: 'OFFICIAL_PUBLIC',
    licenseStatus: 'APPROVED',
    licenseEvidenceRef: `oss://xunjing-review/xicheng/${poiCode}/source-license-approval.pdf`,
    licenseReviewedBy: 'xicheng-license-reviewer',
    licenseReviewedAt: '2026-06-28',
    gpsRadiusMeters: 180,
    ocrKeywords: `西城生产点位${suffix}|生产点位${suffix}`,
    photoLabels: 'xicheng|landmark',
    minConfidence: 0.85,
    photoEvidenceStatus: 'APPROVED',
    triggerSmokeStatus: 'PASSED',
    fieldEvidenceRefs: `oss://xunjing-review/xicheng/${poiCode}/field-photo-001.jpg`,
    fieldVerifiedBy: 'xicheng-field-reviewer',
    fieldVerifiedAt: '2026-06-28',
    shortIntro: `西城生产点位${suffix}已完成来源授权、坐标复核和现场触发测试，可用于生产试运营讲解。`,
    recommendedQuestions: `西城生产点位${suffix}有什么看点？|这里适合怎么游览？|附近可以串联哪些西城点位？`,
    reviewStatus: 'APPROVED',
    geoStatus: 'APPROVED',
    auditLicenseStatus: 'APPROVED',
    status: 'PUBLISHED',
    reviewedBy: 'xicheng-content-reviewer',
    reviewedAt: '2026-06-28'
  }
}

function buildWorkbookCsv() {
  const rows = Array.from({ length: 80 }, (_, index) => {
    const row = productionWorkbookRow(index + 1)
    return workbookHeader.map((field) => csvCell(row[field])).join(',')
  })
  return `${[workbookHeader.join(','), ...rows].join('\n')}\n`
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

async function writeFileInRoot(rootDir, relativePath, content) {
  const filePath = path.join(rootDir, relativePath)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, content)
  return filePath
}

function runWorkbookImporter(args) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/build-xicheng-poi-production-manifest-from-workbook.mjs'),
    ...args
  ], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })
}

function runManifestGate(args) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/verify-xicheng-poi-production-manifest.mjs'),
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

describe('xicheng POI production manifest workbook importer', () => {
  test('converts a reviewed workbook into a manifest accepted by the production manifest gate', async () => {
    const rootDir = await createTempRoot()
    const workbookText = buildWorkbookCsv()
    const workbookPath = await writeFileInRoot(rootDir, 'workbench/xicheng-production-pois.review-workbook.csv', workbookText)
    const manifestPath = path.join(rootDir, 'workbench/xicheng-production-pois.json')

    const result = runWorkbookImporter([
      '--root', rootDir,
      '--workbook', 'workbench/xicheng-production-pois.review-workbook.csv',
      '--output', 'workbench/xicheng-production-pois.json',
      '--production-ready',
      '--batch-code', 'xicheng-p0-poi-review-20260628',
      '--data-owner', 'xicheng-cultural-tourism-review-team',
      '--source-compiled-by', 'xicheng-source-compiler',
      '--source-compiled-at', '2026-06-28',
      '--reviewed-by', 'xicheng-production-reviewer',
      '--reviewed-at', '2026-06-28',
      '--evidence-package-ref', 'oss://xunjing-review/xicheng/review-batches/xicheng-p0-poi-review-20260628.zip'
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-production-manifest-from-workbook',
      ok: true,
      status: 'PRODUCTION_MANIFEST_DRAFT_GENERATED',
      summary: {
        workbookFile: workbookPath,
        workbookSha256: sha256(workbookText),
        outputFile: manifestPath,
        workbookRows: 80,
        productionReady: true,
        reviewBatchCode: 'xicheng-p0-poi-review-20260628'
      }
    })

    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    expect(manifest).toMatchObject({
      regionCode: 'beijing-xicheng',
      packageCode: 'XICHENG-MAP-001',
      targetP0PoiCount: 80,
      productionReady: true,
      sourceWorkbook: {
        workbookFile: workbookPath,
        workbookSha256: sha256(workbookText),
        rowCount: 80,
        arraySeparator: '|'
      },
      reviewBatch: {
        batchCode: 'xicheng-p0-poi-review-20260628',
        evidencePackageRef: 'oss://xunjing-review/xicheng/review-batches/xicheng-p0-poi-review-20260628.zip'
      }
    })
    expect(manifest.pois).toHaveLength(80)
    expect(manifest.pois[0]).toMatchObject({
      poiCode: 'xicheng-prod-poi-001',
      regionCode: 'beijing-xicheng',
      packageCode: 'XICHENG-MAP-001',
      aliases: ['西城生产点位001', '生产点位001', '西城别名001'],
      source: {
        sourceType: 'OFFICIAL_PUBLIC',
        licenseStatus: 'APPROVED'
      },
      trigger: {
        ocrKeywords: ['西城生产点位001', '生产点位001'],
        photoLabels: ['xicheng', 'landmark']
      },
      fieldEvidence: {
        photoEvidenceStatus: 'APPROVED',
        triggerSmokeStatus: 'PASSED',
        evidenceRefs: ['oss://xunjing-review/xicheng/xicheng-prod-poi-001/field-photo-001.jpg']
      },
      audit: {
        reviewStatus: 'APPROVED',
        geoStatus: 'APPROVED',
        licenseStatus: 'APPROVED',
        status: 'PUBLISHED'
      }
    })

    const gateResult = runManifestGate([
      '--manifest', manifestPath,
      '--root', rootDir,
      '--evidence-file', 'tmp/xicheng-poi-manifest-evidence.json'
    ])
    expect(gateResult.status).toBe(0)
    const gateReport = JSON.parse(gateResult.stdout)
    expect(gateReport.status).toBe('PRODUCTION_POI_MANIFEST_READY')
  })

  test('rejects manifest output outside qa tmp or workbench', async () => {
    const rootDir = await createTempRoot()
    await writeFileInRoot(rootDir, 'workbench/xicheng-production-pois.review-workbook.csv', buildWorkbookCsv())

    const result = runWorkbookImporter([
      '--root', rootDir,
      '--workbook', 'workbench/xicheng-production-pois.review-workbook.csv',
      '--output', 'xicheng-production-pois.json'
    ])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('output file must be under qa/, tmp/ or workbench/')
  })

  test('exposes the workbook importer through npm scripts and deployment docs', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
    const deployDoc = await readFile('docs/02_开发规划/星河寻境业务平台部署说明.md', 'utf8')
    const statusDoc = await readFile('docs/04_AI交接任务书/西城P0后台上线状态.md', 'utf8')

    expect(packageJson.scripts['xunjing:xicheng:poi:manifest:from-workbook']).toBe(
      'node scripts/build-xicheng-poi-production-manifest-from-workbook.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:xicheng:poi:manifest:from-workbook')
    expect(deployDoc).toContain('--workbook workbench/xicheng-production-pois.review-workbook.csv')
    expect(deployDoc).toContain('sourceWorkbook.workbookSha256')
    expect(statusDoc).toContain('npm run xunjing:xicheng:poi:manifest:from-workbook')
  })
})
