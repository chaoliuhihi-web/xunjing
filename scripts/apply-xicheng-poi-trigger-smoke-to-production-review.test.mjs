import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-trigger-smoke-apply-'))
  await mkdir(path.join(rootDir, 'workbench'), { recursive: true })
  await mkdir(path.join(rootDir, 'qa'), { recursive: true })
  tempDirs.push(rootDir)
  return rootDir
}

function runApply(rootDir) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/apply-xicheng-poi-trigger-smoke-to-production-review.mjs'),
    '--root',
    rootDir,
    '--production-review',
    'workbench/xicheng-poi-production-review-summary.csv',
    '--trigger-smoke-evidence',
    'qa/xicheng-poi-trigger-smoke-evidence.json',
    '--output',
    'workbench/xicheng-poi-production-review-summary.csv',
    '--evidence-file',
    'qa/xicheng-poi-trigger-smoke-apply-evidence.json'
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

async function writeProductionReview(rootDir) {
  const header = 'poiCode,photoEvidenceStatus,triggerSmokeStatus,fieldEvidenceRefs,fieldVerifiedBy,fieldVerifiedAt,reviewStatus,geoStatus,auditLicenseStatus,status,reviewedBy,reviewedAt,nextAction'
  await writeFile(path.join(rootDir, 'workbench/xicheng-poi-production-review-summary.csv'), [
    header,
    'xicheng-baitasi,REVIEW_REQUIRED,NOT_RUN,,,,REVIEW_REQUIRED,REVIEW_REQUIRED,REVIEW_REQUIRED,DRAFT,,,pending',
    'xicheng-emperors-temple,REVIEW_REQUIRED,NOT_RUN,,,,REVIEW_REQUIRED,REVIEW_REQUIRED,REVIEW_REQUIRED,DRAFT,,,pending'
  ].join('\n') + '\n')
}

async function writeTriggerEvidence(rootDir, overrides = {}) {
  await writeFile(path.join(rootDir, 'qa/xicheng-poi-trigger-smoke-evidence.json'), `${JSON.stringify({
    artifactType: 'xicheng-poi-trigger-smoke',
    ok: false,
    status: 'XICHENG_POI_TRIGGER_SMOKE_REVIEW_REQUIRED',
    checkedAt: '2026-06-29T03:00:00.000Z',
    summary: {
      workbookRows: 2,
      passedPoiCount: 1,
      failedPoiCount: 1,
      passedPoiCodes: ['xicheng-baitasi'],
      failedPoiCodes: ['xicheng-emperors-temple'],
      results: [
        {
          poiCode: 'xicheng-baitasi',
          smokeStatus: 'PASSED',
          confidence: 0.96,
          targetPath: '/pages/ai-guide/detail?poiCode=xicheng-baitasi&packageCode=XICHENG-MAP-001'
        },
        {
          poiCode: 'xicheng-emperors-temple',
          smokeStatus: 'FAILED',
          error: 'trigger smoke did not resolve expected POI'
        }
      ]
    },
    blockers: ['xicheng-emperors-temple trigger smoke did not resolve expected POI'],
    ...overrides
  }, null, 2)}\n`)
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('apply Xicheng trigger smoke to production review summary', () => {
  test('marks only passed trigger smoke rows without approving field or content review', async () => {
    const rootDir = await createTempRoot()
    await writeProductionReview(rootDir)
    await writeTriggerEvidence(rootDir)

    const result = runApply(rootDir)

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-trigger-smoke-apply',
      ok: false,
      status: 'TRIGGER_SMOKE_APPLY_REMAINS',
      summary: {
        productionReviewRows: 2,
        appliedPoiCount: 1,
        pendingTriggerSmokePoiCount: 1
      }
    })
    const rows = csvRows(await readFile(path.join(rootDir, 'workbench/xicheng-poi-production-review-summary.csv'), 'utf8'))
    expect(rows.find((row) => row.poiCode === 'xicheng-baitasi')).toMatchObject({
      photoEvidenceStatus: 'REVIEW_REQUIRED',
      triggerSmokeStatus: 'PASSED',
      reviewStatus: 'REVIEW_REQUIRED',
      geoStatus: 'REVIEW_REQUIRED',
      auditLicenseStatus: 'REVIEW_REQUIRED',
      status: 'DRAFT'
    })
    expect(rows.find((row) => row.poiCode === 'xicheng-emperors-temple')).toMatchObject({
      triggerSmokeStatus: 'NOT_RUN'
    })
  })

  test('rejects non trigger-smoke evidence', async () => {
    const rootDir = await createTempRoot()
    await writeProductionReview(rootDir)
    await writeTriggerEvidence(rootDir, {
      artifactType: 'wrong-artifact'
    })

    const result = runApply(rootDir)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('trigger smoke evidence artifactType must be xicheng-poi-trigger-smoke')
  })
})
