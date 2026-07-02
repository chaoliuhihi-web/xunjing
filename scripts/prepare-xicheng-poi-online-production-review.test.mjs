import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-poi-online-production-review-'))
  tempDirs.push(rootDir)
  await mkdir(path.join(rootDir, 'workbench'), { recursive: true })
  await mkdir(path.join(rootDir, 'qa'), { recursive: true })
  return rootDir
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function stringifyCsv(header, rows) {
  return [
    header.map(csvCell).join(','),
    ...rows.map((row) => header.map((field) => csvCell(row[field])).join(','))
  ].join('\n') + '\n'
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]
    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') {
        inQuotes = false
      } else {
        cell += char
      }
      continue
    }
    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n' || char === '\r') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      if (char === '\r' && next === '\n') {
        index += 1
      }
    } else {
      cell += char
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((items) => items.some((item) => String(item || '').trim()))
}

function rowsByHeader(csvText) {
  const rows = parseCsv(csvText)
  const header = rows[0]
  return rows.slice(1).map((row) => Object.fromEntries(header.map((field, index) => [field, row[index] || ''])))
}

const workbookHeader = [
  'poiCode',
  'name',
  'sourceTitle',
  'sourceUrl',
  'sourceType',
  'licenseStatus',
  'licenseEvidenceRef',
  'licenseReviewedBy',
  'licenseReviewedAt',
  'latitude',
  'longitude',
  'photoEvidenceStatus',
  'triggerSmokeStatus',
  'fieldEvidenceRefs',
  'fieldVerifiedBy',
  'fieldVerifiedAt',
  'reviewStatus',
  'geoStatus',
  'auditLicenseStatus',
  'status',
  'reviewedBy',
  'reviewedAt'
]

const productionReviewHeader = [
  'poiCode',
  'photoEvidenceStatus',
  'triggerSmokeStatus',
  'fieldEvidenceRefs',
  'fieldVerifiedBy',
  'fieldVerifiedAt',
  'reviewStatus',
  'geoStatus',
  'auditLicenseStatus',
  'status',
  'reviewedBy',
  'reviewedAt',
  'nextAction'
]

const onlineSourceRows = [
  {
    poiCode: 'xicheng-baitasi',
    name: '妙应寺白塔',
    sourceTitle: '妙应寺白塔公开来源',
    sourceUrl: 'https://www.bjxch.gov.cn/zt/xjkjmp/xxxq/pnidpv969571.html',
    sourceType: 'OFFICIAL_PUBLIC',
    licenseStatus: 'APPROVED',
    licenseEvidenceRef: 'https://www.bjxch.gov.cn/zt/xjkjmp/xxxq/pnidpv969571.html',
    licenseReviewedBy: 'xicheng-official-public-source-review',
    licenseReviewedAt: '2026-07-02',
    latitude: '39.9231',
    longitude: '116.35726'
  },
  {
    poiCode: 'xicheng-emperors-temple',
    name: '历代帝王庙',
    sourceTitle: '西城区 3A 及以下旅游景区名录：历代帝王庙',
    sourceUrl: 'https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html#xicheng-emperors-temple',
    sourceType: 'OFFICIAL_PUBLIC',
    licenseStatus: 'APPROVED',
    licenseEvidenceRef: 'https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html#xicheng-emperors-temple',
    licenseReviewedBy: 'xicheng-official-public-source-review',
    licenseReviewedAt: '2026-07-02',
    latitude: '39.91893',
    longitude: '116.36587'
  }
]

async function writeReviewFiles(rootDir, {
  sourcePageFetchMode = 'live',
  uncoveredPoiCount = 0,
  sourcePageOk = true
} = {}) {
  const workbookRows = onlineSourceRows.map((row) => ({
    ...row,
    photoEvidenceStatus: 'REVIEW_REQUIRED',
    triggerSmokeStatus: 'NOT_RUN',
    fieldEvidenceRefs: '',
    fieldVerifiedBy: '',
    fieldVerifiedAt: '',
    reviewStatus: 'REVIEW_REQUIRED',
    geoStatus: 'REVIEW_REQUIRED',
    auditLicenseStatus: 'REVIEW_REQUIRED',
    status: 'DRAFT',
    reviewedBy: '',
    reviewedAt: ''
  }))
  const productionRows = onlineSourceRows.map((row) => ({
    poiCode: row.poiCode,
    photoEvidenceStatus: 'REVIEW_REQUIRED',
    triggerSmokeStatus: 'PASSED',
    fieldEvidenceRefs: '',
    fieldVerifiedBy: '',
    fieldVerifiedAt: '',
    reviewStatus: 'REVIEW_REQUIRED',
    geoStatus: 'REVIEW_REQUIRED',
    auditLicenseStatus: 'REVIEW_REQUIRED',
    status: 'DRAFT',
    reviewedBy: '',
    reviewedAt: '',
    nextAction: 'Attach field evidence, approve geo/content/license audit, and keep evidence refs non-local.'
  }))
  const workbookText = stringifyCsv(workbookHeader, workbookRows)
  const productionReviewText = stringifyCsv(productionReviewHeader, productionRows)
  const workbookFile = path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.source-applied.csv')
  const productionReviewFile = path.join(rootDir, 'workbench/xicheng-poi-production-review-summary.csv')
  await writeFile(workbookFile, workbookText)
  await writeFile(productionReviewFile, productionReviewText)
  const sourceCoverageEvidenceFile = path.join(rootDir, 'qa/xicheng-poi-source-coverage-evidence.json')
  await writeFile(sourceCoverageEvidenceFile, `${JSON.stringify({
    artifactType: 'xicheng-poi-source-coverage',
    ok: uncoveredPoiCount === 0 && sourcePageOk,
    status: uncoveredPoiCount === 0 && sourcePageOk ? 'SOURCE_COVERAGE_READY' : 'SOURCE_COVERAGE_REVIEW_REQUIRED',
    checkedAt: '2026-07-02T00:00:00.000Z',
    summary: {
      sourceReviewFile: path.join(rootDir, 'workbench/xicheng-poi-source-review-summary.csv'),
      sourcePageFetchMode,
      sourcePages: onlineSourceRows.map((row) => ({
        sourceUrl: row.sourceUrl,
        fetchMode: sourcePageFetchMode,
        ok: sourcePageOk,
        httpStatus: sourcePageOk ? 200 : 503,
        sourceTextLength: sourcePageOk ? 4096 : 0,
        sourceTextSha256: sourcePageOk ? sha256(row.sourceUrl) : ''
      })),
      sourceGroups: onlineSourceRows.map((row) => ({
        sourceTitle: row.sourceTitle,
        sourceUrl: row.sourceUrl,
        sourceType: row.sourceType,
        poiCount: 1,
        coveredPoiCount: sourcePageOk ? 1 : 0,
        uncoveredPoiCount: sourcePageOk ? 0 : 1,
        coveredPoiCodes: sourcePageOk ? [row.poiCode] : [],
        uncoveredPoiCodes: sourcePageOk ? [] : [row.poiCode]
      })),
      poiCount: onlineSourceRows.length,
      coveredPoiCount: onlineSourceRows.length - uncoveredPoiCount,
      uncoveredPoiCount,
      uncoveredPoiCodes: uncoveredPoiCount > 0 ? [onlineSourceRows[0].poiCode] : []
    },
    checks: [
      { name: 'source-page-fetch', ok: sourcePageOk },
      { name: 'poi-source-coverage', ok: uncoveredPoiCount === 0 }
    ],
    blockers: uncoveredPoiCount > 0 ? ['source coverage remains'] : []
  }, null, 2)}\n`)
  await writeFile(path.join(rootDir, 'qa/xicheng-poi-source-review-apply-evidence.json'), `${JSON.stringify({
    artifactType: 'xicheng-poi-source-review-apply',
    ok: true,
    status: 'SOURCE_REVIEW_APPLIED',
    checkedAt: '2026-07-02T00:10:00.000Z',
    summary: {
      outputFile: workbookFile,
      outputSha256: sha256(workbookText),
      appliedPoiCount: onlineSourceRows.length,
      pendingSourcePoiCount: 0,
      sourceCoverageStatus: 'SOURCE_COVERAGE_READY',
      sourceCoverageUncoveredPoiCount: 0
    },
    blockers: []
  }, null, 2)}\n`)
  await writeFile(path.join(rootDir, 'qa/xicheng-poi-trigger-smoke-apply-evidence.json'), `${JSON.stringify({
    artifactType: 'xicheng-poi-trigger-smoke-apply',
    ok: true,
    status: 'TRIGGER_SMOKE_APPLIED',
    checkedAt: '2026-07-02T00:20:00.000Z',
    summary: {
      outputFile: productionReviewFile,
      outputSha256: sha256(productionReviewText),
      appliedPoiCount: onlineSourceRows.length,
      pendingTriggerSmokePoiCount: 0
    },
    blockers: []
  }, null, 2)}\n`)
}

function runPrepare(rootDir, extraArgs = []) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/prepare-xicheng-poi-online-production-review.mjs'),
    '--root', rootDir,
    '--workbook', 'workbench/xicheng-production-pois.review-workbook.source-applied.csv',
    '--production-review', 'workbench/xicheng-poi-production-review-summary.csv',
    '--source-coverage-evidence', 'qa/xicheng-poi-source-coverage-evidence.json',
    '--source-review-apply-evidence', 'qa/xicheng-poi-source-review-apply-evidence.json',
    '--trigger-smoke-apply-evidence', 'qa/xicheng-poi-trigger-smoke-apply-evidence.json',
    '--output', 'workbench/xicheng-poi-production-review-summary.online-applied.csv',
    '--evidence-file', 'qa/xicheng-poi-online-production-review-evidence.json',
    ...extraArgs
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

describe('xicheng POI online production review preparation', () => {
  test('prepares approved production review rows from live official public source coverage', async () => {
    const rootDir = await createTempRoot()
    await writeReviewFiles(rootDir)

    const result = runPrepare(rootDir, ['--reviewed-at', '2026-07-02'])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-online-production-review-prepare',
      ok: true,
      status: 'ONLINE_PRODUCTION_REVIEW_PREPARED',
      summary: {
        productionReviewRows: 2,
        preparedPoiCount: 2,
        pendingOnlineReviewPoiCount: 0,
        sourcePageFetchMode: 'live',
        sourceCoverageStatus: 'SOURCE_COVERAGE_READY',
        sourceReviewApplyStatus: 'SOURCE_REVIEW_APPLIED',
        triggerSmokeApplyStatus: 'TRIGGER_SMOKE_APPLIED'
      }
    })
    expect(report.note).toContain('online official/public source evidence')
    const outputRows = rowsByHeader(await readFile(
      path.join(rootDir, 'workbench/xicheng-poi-production-review-summary.online-applied.csv'),
      'utf8'
    ))
    expect(outputRows).toHaveLength(2)
    expect(outputRows[0]).toMatchObject({
      poiCode: 'xicheng-baitasi',
      photoEvidenceStatus: 'APPROVED',
      triggerSmokeStatus: 'PASSED',
      fieldEvidenceRefs: 'https://www.bjxch.gov.cn/zt/xjkjmp/xxxq/pnidpv969571.html',
      fieldVerifiedBy: 'xicheng-online-official-public-source-review',
      fieldVerifiedAt: '2026-07-02',
      reviewStatus: 'APPROVED',
      geoStatus: 'APPROVED',
      auditLicenseStatus: 'APPROVED',
      status: 'PUBLISHED',
      reviewedBy: 'xicheng-online-official-public-source-review',
      reviewedAt: '2026-07-02'
    })
    expect(outputRows[0].nextAction).toContain('Run production-review:apply')
  })

  test('rejects non-live source coverage evidence before preparing approved rows', async () => {
    const rootDir = await createTempRoot()
    await writeReviewFiles(rootDir, { sourcePageFetchMode: 'fixture' })

    const result = runPrepare(rootDir)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('source coverage evidence sourcePageFetchMode must be live')
  })

  test('exposes the online production review command through npm scripts', async () => {
    const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8'))

    expect(packageJson.scripts['xunjing:xicheng:poi:production-review:prepare-online']).toBe(
      'node scripts/prepare-xicheng-poi-online-production-review.mjs'
    )
  })
})
