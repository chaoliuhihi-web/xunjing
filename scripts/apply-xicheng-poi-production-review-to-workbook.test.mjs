import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-poi-production-review-apply-'))
  tempDirs.push(rootDir)
  return rootDir
}

function runNodeScript(script, args) {
  return spawnSync(process.execPath, [
    path.resolve(script),
    ...args
  ], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })
}

function runReviewPack(rootDir) {
  return runNodeScript('scripts/create-xicheng-poi-production-review-pack.mjs', [
    '--root', rootDir,
    '--evidence-file', 'qa/xicheng-poi-production-review-pack-evidence.json',
    '--workbook-evidence', 'qa/xicheng-poi-review-workbook-evidence.json',
    '--review-tasks', 'workbench/xicheng-poi-review-tasks.csv',
    '--source-review', 'workbench/xicheng-poi-source-review-summary.csv'
  ])
}

function runProductionReviewApply(rootDir, extraArgs = []) {
  return runNodeScript('scripts/apply-xicheng-poi-production-review-to-workbook.mjs', [
    '--root', rootDir,
    '--workbook', 'workbench/xicheng-production-pois.review-workbook.csv',
    '--production-review', 'workbench/xicheng-poi-production-review-summary.csv',
    '--output', 'workbench/xicheng-production-pois.review-workbook.production-applied.csv',
    '--evidence-file', 'qa/xicheng-poi-production-review-apply-evidence.json',
    ...extraArgs
  ])
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

function workbookRows(csvText) {
  const rows = parseCsv(csvText)
  const header = rows[0]
  return rows.slice(1).map((row) => Object.fromEntries(header.map((field, index) => [field, row[index] || ''])))
}

function productionReviewCsv({ evidenceRef = 'oss://xunjing-review/xicheng/xicheng-baitasi/field-smoke-evidence.zip' } = {}) {
  return [
    'poiCode,photoEvidenceStatus,triggerSmokeStatus,fieldEvidenceRefs,fieldVerifiedBy,fieldVerifiedAt,reviewStatus,geoStatus,auditLicenseStatus,status,reviewedBy,reviewedAt',
    [
      'xicheng-baitasi',
      'APPROVED',
      'PASSED',
      evidenceRef,
      'xicheng-field-reviewer',
      '2026-06-28',
      'APPROVED',
      'APPROVED',
      'APPROVED',
      'PUBLISHED',
      'xicheng-content-reviewer',
      '2026-06-28'
    ].join(',')
  ].join('\n') + '\n'
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('xicheng POI production review workbook apply', () => {
  test('applies approved field geo and content review rows without marking remaining POIs ready', async () => {
    const rootDir = await createTempRoot()
    expect(runReviewPack(rootDir).status).toBe(0)
    await writeFile(path.join(rootDir, 'workbench/xicheng-poi-production-review-summary.csv'), productionReviewCsv())

    const result = runProductionReviewApply(rootDir)

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    const outputFile = path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.production-applied.csv')
    const evidenceFile = path.join(rootDir, 'qa/xicheng-poi-production-review-apply-evidence.json')
    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-production-review-apply',
      ok: false,
      status: 'PRODUCTION_REVIEW_DATA_REMAINS',
      summary: {
        workbookFile: path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.csv'),
        productionReviewFile: path.join(rootDir, 'workbench/xicheng-poi-production-review-summary.csv'),
        outputFile,
        evidenceFile,
        workbookRows: 80,
        productionReviewRows: 1,
        approvedReviewRowCount: 1,
        appliedPoiCount: 1,
        pendingProductionReviewPoiCount: 79
      }
    })
    expect(report.blockers).toContain('79 workbook POIs still require production field/content review')
    expect(report.note).toContain('not production evidence')

    const rows = workbookRows(await readFile(outputFile, 'utf8'))
    const baitasi = rows.find((row) => row.poiCode === 'xicheng-baitasi')
    const emperorsTemple = rows.find((row) => row.poiCode === 'xicheng-emperors-temple')
    expect(baitasi).toMatchObject({
      licenseStatus: 'REVIEW_REQUIRED',
      photoEvidenceStatus: 'APPROVED',
      triggerSmokeStatus: 'PASSED',
      fieldEvidenceRefs: 'oss://xunjing-review/xicheng/xicheng-baitasi/field-smoke-evidence.zip',
      fieldVerifiedBy: 'xicheng-field-reviewer',
      fieldVerifiedAt: '2026-06-28',
      reviewStatus: 'APPROVED',
      geoStatus: 'APPROVED',
      auditLicenseStatus: 'APPROVED',
      status: 'PUBLISHED',
      reviewedBy: 'xicheng-content-reviewer',
      reviewedAt: '2026-06-28'
    })
    expect(emperorsTemple).toMatchObject({
      photoEvidenceStatus: 'REVIEW_REQUIRED',
      triggerSmokeStatus: 'NOT_RUN',
      fieldEvidenceRefs: '',
      reviewStatus: 'REVIEW_REQUIRED',
      geoStatus: 'REVIEW_REQUIRED',
      auditLicenseStatus: 'REVIEW_REQUIRED'
    })

    const evidence = JSON.parse(await readFile(evidenceFile, 'utf8'))
    expect(evidence.summary.outputSha256).toMatch(/^[a-f0-9]{64}$/)
    expect(evidence.summary.appliedReviewRows).toEqual([
      {
        poiCode: 'xicheng-baitasi',
        fieldEvidenceRefCount: 1,
        reviewedBy: 'xicheng-content-reviewer',
        reviewedAt: '2026-06-28'
      }
    ])
  })

  test('rejects approved review rows that use local evidence references', async () => {
    const rootDir = await createTempRoot()
    expect(runReviewPack(rootDir).status).toBe(0)
    await writeFile(path.join(rootDir, 'workbench/xicheng-poi-production-review-summary.csv'), productionReviewCsv({
      evidenceRef: 'file:///Users/reviewer/Desktop/baitasi.jpg'
    }))

    const result = runProductionReviewApply(rootDir)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('fieldEvidenceRefs must include non-local HTTPS/object-storage references')
  })

  test('exposes the production review apply command through npm scripts and deployment docs', async () => {
    const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8'))
    const deployDoc = await readFile(path.resolve('docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(path.resolve('docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:xicheng:poi:production-review:apply']).toBe(
      'node scripts/apply-xicheng-poi-production-review-to-workbook.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:xicheng:poi:production-review:apply')
    expect(deployDoc).toContain('workbench/xicheng-production-pois.review-workbook.production-applied.csv')
    expect(deployDoc).toContain('qa/xicheng-poi-production-review-apply-evidence.json')
    expect(statusDoc).toContain('xicheng:poi:production-review:apply')
    expect(statusDoc).toContain('PRODUCTION_REVIEW_DATA_REMAINS')
  })
})
