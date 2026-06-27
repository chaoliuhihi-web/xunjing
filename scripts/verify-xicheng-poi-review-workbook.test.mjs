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
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-poi-review-workbook-'))
  tempDirs.push(rootDir)
  return rootDir
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function workbookRow(index, overrides = {}) {
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
    name: `Xicheng Production POI ${suffix}`,
    displayName: `Xicheng Production POI ${suffix}`,
    aliases: `Xicheng Production POI ${suffix}|Production POI ${suffix}|Xicheng Alias ${suffix}`,
    category: categories[(index - 1) % categories.length],
    priority: 'P0',
    address: `No. ${index} Reviewed Road, Xicheng, Beijing`,
    latitude: 39.88 + index / 10000,
    longitude: 116.34 + index / 10000,
    coordType: 'GCJ02',
    sourceTitle: `Reviewed source for Xicheng Production POI ${suffix}`,
    sourceUrl: `https://www.bjxch.gov.cn/xicheng/reviewed/${suffix}`,
    sourceType: 'OFFICIAL_PUBLIC',
    licenseStatus: 'APPROVED',
    licenseEvidenceRef: `oss://xunjing-review/xicheng/${poiCode}/source-license-approval.pdf`,
    licenseReviewedBy: 'xicheng-license-reviewer',
    licenseReviewedAt: '2026-06-28',
    gpsRadiusMeters: 180,
    ocrKeywords: `Xicheng Production POI ${suffix}|Production POI ${suffix}`,
    photoLabels: 'xicheng|landmark',
    minConfidence: 0.85,
    photoEvidenceStatus: 'APPROVED',
    triggerSmokeStatus: 'PASSED',
    fieldEvidenceRefs: `oss://xunjing-review/xicheng/${poiCode}/field-photo-001.jpg`,
    fieldVerifiedBy: 'xicheng-field-reviewer',
    fieldVerifiedAt: '2026-06-28',
    shortIntro: `Reviewed production-ready Xicheng POI ${suffix} with source, geo and field trigger evidence.`,
    recommendedQuestions: `What is notable about POI ${suffix}?|How should I visit POI ${suffix}?|What nearby route can connect with POI ${suffix}?`,
    reviewStatus: 'APPROVED',
    geoStatus: 'APPROVED',
    auditLicenseStatus: 'APPROVED',
    status: 'PUBLISHED',
    reviewedBy: 'xicheng-content-reviewer',
    reviewedAt: '2026-06-28',
    ...overrides
  }
}

function workbookCsv(rowOverrides = {}) {
  const rows = Array.from({ length: 80 }, (_, index) => {
    const row = workbookRow(index + 1, rowOverrides[index + 1] || {})
    return workbookHeader.map((field) => csvCell(row[field])).join(',')
  })
  return `${[workbookHeader.join(','), ...rows].join('\n')}\n`
}

async function writeWorkbook(rootDir, text) {
  const filePath = path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.csv')
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, text)
  return filePath
}

function runWorkbookGate(args) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/verify-xicheng-poi-review-workbook.mjs'),
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

describe('xicheng POI review workbook readiness gate', () => {
  test('accepts a completed 80 row production review workbook and writes evidence', async () => {
    const rootDir = await createTempRoot()
    const workbookText = workbookCsv()
    const workbookPath = await writeWorkbook(rootDir, workbookText)
    const evidencePath = path.join(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json')

    const result = runWorkbookGate([
      '--root', rootDir,
      '--workbook', 'workbench/xicheng-production-pois.review-workbook.csv',
      '--evidence-file', 'qa/xicheng-poi-review-workbook-evidence.json'
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-review-workbook-readiness',
      ok: true,
      status: 'XICHENG_POI_REVIEW_WORKBOOK_READY',
      summary: {
        workbookFile: workbookPath,
        workbookSha256: sha256(workbookText),
        workbookRows: 80,
        minPoiCount: 80,
        categoryCount: 8,
        placeholderCount: 0,
        workbookReadyPoiCount: 80,
        workbookPendingPoiCount: 0,
        pendingPoiCodes: []
      }
    })
    expect(report.checks.map((check) => check.name)).toEqual([
      'workbook-file',
      'workbook-shape',
      'poi-count',
      'poi-identity',
      'poi-source-license',
      'poi-field-evidence',
      'poi-content-audit',
      'no-placeholder-cells'
    ])
    expect(JSON.parse(await readFile(evidencePath, 'utf8')).summary.workbookSha256).toBe(sha256(workbookText))
  })

  test('fails closed when workbook still contains placeholder or unapproved review values', async () => {
    const rootDir = await createTempRoot()
    await writeWorkbook(rootDir, workbookCsv({
      80: {
        poiCode: 'TODO-xicheng-poi-080',
        sourceUrl: 'https://www.bjxch.gov.cn/xicheng/reviewed/080',
        licenseStatus: 'REVIEW_REQUIRED',
        photoEvidenceStatus: 'REVIEW_REQUIRED',
        triggerSmokeStatus: 'REVIEW_REQUIRED',
        status: 'REVIEW_REQUIRED'
      }
    }))

    const result = runWorkbookGate([
      '--root', rootDir,
      '--workbook', 'workbench/xicheng-production-pois.review-workbook.csv'
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.summary).toMatchObject({
      totalCheckCount: 8,
      passedCheckCount: 3,
      failedCheckCount: 5,
      blockerCount: 6,
      workbookReadyPoiCount: 79,
      workbookPendingPoiCount: 1,
      pendingPoiCodes: ['TODO-xicheng-poi-080']
    })
    expect(report.summary.blockerBreakdown).toEqual([
      { name: 'workbook-file', ok: true, blockerCount: 0 },
      { name: 'workbook-shape', ok: true, blockerCount: 0 },
      { name: 'poi-count', ok: true, blockerCount: 0 },
      { name: 'poi-identity', ok: false, blockerCount: 1 },
      { name: 'poi-source-license', ok: false, blockerCount: 1 },
      { name: 'poi-field-evidence', ok: false, blockerCount: 2 },
      { name: 'poi-content-audit', ok: false, blockerCount: 1 },
      { name: 'no-placeholder-cells', ok: false, blockerCount: 1 }
    ])
    expect(report.blockers.join('\n')).toContain('TODO-xicheng-poi-080 poiCode must be a stable xicheng-* slug')
    expect(report.blockers.join('\n')).toContain('TODO-xicheng-poi-080 source.licenseStatus must be APPROVED')
    expect(report.blockers.join('\n')).toContain('workbook contains placeholder review values')
  })

  test('exposes the workbook gate through npm scripts and deployment docs', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
    const deployDoc = await readFile('docs/02_开发规划/星河寻境业务平台部署说明.md', 'utf8')
    const statusDoc = await readFile('docs/04_AI交接任务书/西城P0后台上线状态.md', 'utf8')

    expect(packageJson.scripts['xunjing:xicheng:poi:workbook:gate']).toBe(
      'node scripts/verify-xicheng-poi-review-workbook.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:xicheng:poi:workbook:gate')
    expect(deployDoc).toContain('XICHENG_POI_REVIEW_WORKBOOK_READY')
    expect(deployDoc).toContain('xicheng-poi-review-workbook-evidence.json')
    expect(deployDoc).toContain('blockerBreakdown')
    expect(deployDoc).toContain('workbookReadyPoiCount')
    expect(statusDoc).toContain('blockerBreakdown')
    expect(statusDoc).toContain('workbookReadyPoiCount')
  })
})
