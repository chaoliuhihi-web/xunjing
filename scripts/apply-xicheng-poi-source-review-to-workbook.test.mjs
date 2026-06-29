import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []
const sourceUrl = 'https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html#xicheng-emperors-temple'
const heritageSourceUrl = 'https://www.bjxch.gov.cn/xcfw/whfw/xxxq/pnidpv736523.html'

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-poi-source-review-apply-'))
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

function runSourceReviewApply(rootDir, extraArgs = []) {
  return runNodeScript('scripts/apply-xicheng-poi-source-review-to-workbook.mjs', [
    '--root', rootDir,
    '--workbook', 'workbench/xicheng-production-pois.review-workbook.csv',
    '--source-review', 'workbench/xicheng-poi-source-review-summary.csv',
    '--output', 'workbench/xicheng-production-pois.review-workbook.source-applied.csv',
    '--evidence-file', 'qa/xicheng-poi-source-review-apply-evidence.json',
    ...extraArgs
  ])
}

async function writeReadySourceCoverageEvidence(rootDir) {
  const sourceReviewFile = path.join(rootDir, 'workbench/xicheng-poi-source-review-summary.csv')
  const evidenceFile = path.join(rootDir, 'qa/xicheng-poi-source-coverage-evidence.json')
  await writeFile(evidenceFile, `${JSON.stringify({
    artifactType: 'xicheng-poi-source-coverage',
    ok: true,
    status: 'SOURCE_COVERAGE_READY',
    checkedAt: '2026-06-28T10:00:00.000Z',
    summary: {
      sourceReviewFile,
      evidenceFile,
      sourceReviewRows: 2,
      sourceGroupCount: 2,
      poiCount: 80,
      coveredPoiCount: 80,
      uncoveredPoiCount: 0,
      uncoveredPoiCodes: []
    },
    checks: [
      { name: 'source-review-file', ok: true },
      { name: 'source-pages', ok: true },
      { name: 'poi-source-coverage', ok: true },
      { name: 'secret-redaction', ok: true }
    ],
    blockers: []
  }, null, 2)}\n`)
  return evidenceFile
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

function approvedSourceReviewCsv() {
  return [
    'sourceTitle,sourceUrl,sourceType,poiCount,poiCodes,poiNames,licenseStatus,licenseEvidenceRef,licenseReviewedBy,licenseReviewedAt,nextAction',
    [
      '西城区 3A 及以下旅游景区名录：历代帝王庙',
      sourceUrl,
      'OFFICIAL_PUBLIC',
      '1',
      '',
      '',
      'APPROVED',
      'oss://xunjing-review/xicheng/source-license/a-level-directory-approval.pdf',
      'xicheng-source-reviewer',
      '2026-06-28',
      'approved by source group'
    ].join(','),
    [
      '西城区文物保护单位（81处）',
      heritageSourceUrl,
      'OFFICIAL_PUBLIC',
      '56',
      '',
      '',
      'REVIEW_REQUIRED',
      '',
      '',
      '',
      'pending'
    ].join(',')
  ].join('\n') + '\n'
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('xicheng POI source review workbook apply', () => {
  test('requires ready source coverage evidence before applying approved source groups', async () => {
    const rootDir = await createTempRoot()
    expect(runReviewPack(rootDir).status).toBe(0)
    await writeFile(path.join(rootDir, 'workbench/xicheng-poi-source-review-summary.csv'), approvedSourceReviewCsv())

    const result = runSourceReviewApply(rootDir)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('--source-coverage-evidence is required')
  })

  test('applies approved source groups to matching workbook rows without marking remaining rows ready', async () => {
    const rootDir = await createTempRoot()
    expect(runReviewPack(rootDir).status).toBe(0)
    await writeFile(path.join(rootDir, 'workbench/xicheng-poi-source-review-summary.csv'), approvedSourceReviewCsv())
    const sourceCoverageEvidenceFile = await writeReadySourceCoverageEvidence(rootDir)

    const result = runSourceReviewApply(rootDir, [
      '--source-coverage-evidence', 'qa/xicheng-poi-source-coverage-evidence.json'
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    const outputFile = path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.source-applied.csv')
    const evidenceFile = path.join(rootDir, 'qa/xicheng-poi-source-review-apply-evidence.json')
    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-source-review-apply',
      ok: false,
      status: 'SOURCE_REVIEW_DATA_REMAINS',
      summary: {
        workbookFile: path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.csv'),
        sourceReviewFile: path.join(rootDir, 'workbench/xicheng-poi-source-review-summary.csv'),
        sourceCoverageEvidenceFile,
        sourceCoverageStatus: 'SOURCE_COVERAGE_READY',
        sourceCoverageCoveredPoiCount: 80,
        sourceCoverageUncoveredPoiCount: 0,
        outputFile,
        evidenceFile,
        workbookRows: 80,
        sourceReviewRows: 2,
        approvedSourceGroupCount: 1,
        appliedPoiCount: 1,
        pendingSourcePoiCount: 79
      }
    })
    expect(report.blockers).toContain('79 workbook POIs still require source license review')
    expect(report.note).toContain('not production evidence')

    const rows = workbookRows(await readFile(outputFile, 'utf8'))
    const emperorsTemple = rows.find((row) => row.poiCode === 'xicheng-emperors-temple')
    const heritage = rows.find((row) => row.poiCode === 'xicheng-heritage-001-sanguanmiao')
    expect(emperorsTemple).toMatchObject({
      sourceUrl,
      sourceType: 'OFFICIAL_PUBLIC',
      licenseStatus: 'APPROVED',
      licenseEvidenceRef: 'oss://xunjing-review/xicheng/source-license/a-level-directory-approval.pdf',
      licenseReviewedBy: 'xicheng-source-reviewer',
      licenseReviewedAt: '2026-06-28'
    })
    expect(heritage).toMatchObject({
      sourceUrl: heritageSourceUrl,
      sourceType: 'OFFICIAL_PUBLIC',
      licenseStatus: 'REVIEW_REQUIRED',
      licenseEvidenceRef: '',
      licenseReviewedBy: '',
      licenseReviewedAt: ''
    })

    const evidence = JSON.parse(await readFile(evidenceFile, 'utf8'))
    expect(evidence.summary.outputSha256).toMatch(/^[a-f0-9]{64}$/)
    expect(evidence.summary.appliedSourceGroups).toEqual([
      {
        sourceUrl,
        sourceType: 'OFFICIAL_PUBLIC',
        poiCount: 1,
        licenseEvidenceRef: 'oss://xunjing-review/xicheng/source-license/a-level-directory-approval.pdf'
      }
    ])
  })

  test('exposes the source review apply command through npm scripts and deployment docs', async () => {
    const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8'))
    const deployDoc = await readFile(path.resolve('docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(path.resolve('docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:xicheng:poi:source-review:apply']).toBe(
      'node scripts/apply-xicheng-poi-source-review-to-workbook.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:xicheng:poi:source-review:apply')
    expect(deployDoc).toContain('--source-coverage-evidence qa/xicheng-poi-source-coverage-evidence.json')
    expect(deployDoc).toContain('workbench/xicheng-production-pois.review-workbook.source-applied.csv')
    expect(deployDoc).toContain('qa/xicheng-poi-source-review-apply-evidence.json')
    expect(statusDoc).toContain('xicheng:poi:source-review:apply')
    expect(statusDoc).toContain('--source-coverage-evidence qa/xicheng-poi-source-coverage-evidence.json')
    expect(statusDoc).toContain('SOURCE_REVIEW_DATA_REMAINS')
  })
})
