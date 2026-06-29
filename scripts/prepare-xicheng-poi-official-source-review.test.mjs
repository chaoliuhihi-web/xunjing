import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-official-source-review-'))
  await mkdir(path.join(rootDir, 'workbench'), { recursive: true })
  await mkdir(path.join(rootDir, 'qa'), { recursive: true })
  tempDirs.push(rootDir)
  return rootDir
}

function runPrepare(rootDir, extraArgs = []) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/prepare-xicheng-poi-official-source-review.mjs'),
    '--root',
    rootDir,
    '--source-review',
    'workbench/xicheng-poi-source-review-summary.csv',
    '--source-coverage-evidence',
    'qa/xicheng-poi-source-coverage-evidence.json',
    '--output',
    'workbench/xicheng-poi-source-review-summary.csv',
    '--evidence-file',
    'qa/xicheng-poi-official-source-review-evidence.json',
    ...extraArgs
  ], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })
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

function csvRows(text) {
  const rows = parseCsv(text)
  const header = rows[0]
  return rows.slice(1).map((row) => Object.fromEntries(header.map((field, index) => [
    field,
    row[index] || ''
  ])))
}

async function writeSourceReview(rootDir, rows) {
  const header = 'sourceTitle,sourceUrl,sourceType,poiCount,poiCodes,poiNames,licenseStatus,licenseEvidenceRef,licenseReviewedBy,licenseReviewedAt,nextAction'
  await writeFile(path.join(rootDir, 'workbench/xicheng-poi-source-review-summary.csv'), [
    header,
    ...rows.map((row) => [
      row.sourceTitle,
      row.sourceUrl,
      row.sourceType,
      row.poiCount,
      row.poiCodes,
      row.poiNames,
      row.licenseStatus || 'REVIEW_REQUIRED',
      row.licenseEvidenceRef || '',
      row.licenseReviewedBy || '',
      row.licenseReviewedAt || '',
      row.nextAction || 'pending'
    ].join(','))
  ].join('\n') + '\n')
}

async function writeCoverageEvidence(rootDir, overrides = {}) {
  const sourceReviewFile = path.join(rootDir, 'workbench/xicheng-poi-source-review-summary.csv')
  const evidenceFile = path.join(rootDir, 'qa/xicheng-poi-source-coverage-evidence.json')
  await writeFile(evidenceFile, `${JSON.stringify({
    artifactType: 'xicheng-poi-source-coverage',
    ok: true,
    status: 'SOURCE_COVERAGE_READY',
    checkedAt: '2026-06-29T02:00:00.000Z',
    summary: {
      sourceReviewFile,
      evidenceFile,
      sourceReviewRows: 2,
      sourceGroupCount: 2,
      poiCount: 3,
      coveredPoiCount: 3,
      uncoveredPoiCount: 0,
      uncoveredPoiCodes: [],
      sourceGroups: [
        {
          sourceTitle: 'Official source',
          sourceUrl: 'https://www.bjxch.gov.cn/official.html',
          sourceType: 'OFFICIAL_PUBLIC',
          poiCount: 2,
          coveredPoiCount: 2,
          uncoveredPoiCount: 0,
          coveredPoiCodes: ['xicheng-a', 'xicheng-b']
        },
        {
          sourceTitle: 'Partner source',
          sourceUrl: 'https://example.com/partner.html',
          sourceType: 'PARTNER_LICENSED',
          poiCount: 1,
          coveredPoiCount: 1,
          uncoveredPoiCount: 0,
          coveredPoiCodes: ['xicheng-c']
        }
      ]
    },
    checks: [
      { name: 'source-review-file', ok: true },
      { name: 'source-pages', ok: true },
      { name: 'poi-source-coverage', ok: true },
      { name: 'secret-redaction', ok: true }
    ],
    blockers: [],
    ...overrides
  }, null, 2)}\n`)
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('prepare official public Xicheng POI source review', () => {
  test('approves covered OFFICIAL_PUBLIC source groups without approving non-official rows', async () => {
    const rootDir = await createTempRoot()
    await writeSourceReview(rootDir, [
      {
        sourceTitle: 'Official source',
        sourceUrl: 'https://www.bjxch.gov.cn/official.html',
        sourceType: 'OFFICIAL_PUBLIC',
        poiCount: '2',
        poiCodes: 'xicheng-a|xicheng-b',
        poiNames: 'A|B'
      },
      {
        sourceTitle: 'Partner source',
        sourceUrl: 'https://example.com/partner.html',
        sourceType: 'PARTNER_LICENSED',
        poiCount: '1',
        poiCodes: 'xicheng-c',
        poiNames: 'C'
      }
    ])
    await writeCoverageEvidence(rootDir)

    const result = runPrepare(rootDir)

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-official-source-review-prepare',
      ok: false,
      status: 'OFFICIAL_SOURCE_REVIEW_REMAINS',
      summary: {
        approvedSourceGroupCount: 1,
        pendingSourceGroupCount: 1,
        appliedPoiCount: 2,
        pendingPoiCount: 1
      }
    })
    const rows = csvRows(await readFile(path.join(rootDir, 'workbench/xicheng-poi-source-review-summary.csv'), 'utf8'))
    expect(rows[0]).toMatchObject({
      licenseStatus: 'APPROVED',
      licenseEvidenceRef: 'https://www.bjxch.gov.cn/official.html',
      licenseReviewedBy: 'xicheng-official-public-source-review',
      licenseReviewedAt: '2026-06-29'
    })
    expect(rows[1]).toMatchObject({
      licenseStatus: 'REVIEW_REQUIRED',
      licenseEvidenceRef: '',
      licenseReviewedBy: '',
      licenseReviewedAt: ''
    })
  })

  test('rejects stale source coverage evidence that references a different source review CSV', async () => {
    const rootDir = await createTempRoot()
    await writeSourceReview(rootDir, [
      {
        sourceTitle: 'Official source',
        sourceUrl: 'https://www.bjxch.gov.cn/official.html',
        sourceType: 'OFFICIAL_PUBLIC',
        poiCount: '1',
        poiCodes: 'xicheng-a',
        poiNames: 'A'
      }
    ])
    await writeCoverageEvidence(rootDir, {
      summary: {
        sourceReviewFile: path.join(rootDir, 'workbench/stale-source-review.csv'),
        evidenceFile: path.join(rootDir, 'qa/xicheng-poi-source-coverage-evidence.json'),
        sourceReviewRows: 1,
        sourceGroupCount: 1,
        poiCount: 1,
        coveredPoiCount: 1,
        uncoveredPoiCount: 0,
        uncoveredPoiCodes: []
      }
    })

    const result = runPrepare(rootDir)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('source coverage evidence must reference the same source review CSV')
  })
})
