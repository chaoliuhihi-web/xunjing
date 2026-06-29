import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-poi-production-review-tasks-'))
  tempDirs.push(rootDir)
  return rootDir
}

function runProductionReviewTaskExport(args, options = {}) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/export-xicheng-poi-production-review-tasks.mjs'),
    ...args
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
    ...options
  })
}

function productionReviewCsv(rows) {
  return [
    'poiCode,photoEvidenceStatus,triggerSmokeStatus,fieldEvidenceRefs,fieldVerifiedBy,fieldVerifiedAt,reviewStatus,geoStatus,auditLicenseStatus,status,reviewedBy,reviewedAt,nextAction',
    ...rows
  ].join('\n') + '\n'
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('xicheng POI production review task export', () => {
  test('exports missing field tasks from production review summary without approving data', async () => {
    const rootDir = await createTempRoot()
    const productionReviewFile = path.join(rootDir, 'workbench/xicheng-poi-production-review-summary.csv')
    await mkdir(path.dirname(productionReviewFile), { recursive: true })
    await writeFile(productionReviewFile, productionReviewCsv([
      'xicheng-baitasi,REVIEW_REQUIRED,PASSED,,,,REVIEW_REQUIRED,REVIEW_REQUIRED,REVIEW_REQUIRED,DRAFT,,,Attach field evidence.',
      'xicheng-ready,APPROVED,PASSED,https://cdn.example.com/xicheng/ready/photo.jpg,field-team,2026-06-29,APPROVED,APPROVED,APPROVED,PUBLISHED,reviewer,2026-06-29,Ready.',
      'xicheng-trigger,APPROVED,NOT_RUN,https://cdn.example.com/xicheng/trigger/photo.jpg,field-team,2026-06-29,APPROVED,APPROVED,APPROVED,PUBLISHED,reviewer,2026-06-29,Run trigger smoke.'
    ]))

    const result = runProductionReviewTaskExport([
      '--root', rootDir,
      '--production-review', 'workbench/xicheng-poi-production-review-summary.csv',
      '--output', 'workbench/xicheng-poi-production-review-tasks.csv',
      '--evidence-file', 'qa/xicheng-poi-production-review-tasks-evidence.json'
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-production-review-tasks',
      ok: false,
      status: 'PRODUCTION_REVIEW_TASKS_REQUIRED',
      summary: {
        productionReviewFile,
        outputFile: path.join(rootDir, 'workbench/xicheng-poi-production-review-tasks.csv'),
        evidenceFile: path.join(rootDir, 'qa/xicheng-poi-production-review-tasks-evidence.json'),
        productionReviewRows: 3,
        readyPoiCount: 1,
        pendingPoiCount: 2,
        taskCount: 11,
        ownerLaneCounts: {
          'field-review': 4,
          'content-audit': 4,
          'geo-audit': 1,
          'source-license': 1,
          'trigger-smoke': 1
        }
      }
    })
    expect(report.summary.ownerLaneBreakdown).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ownerLane: 'field-review',
        taskCount: 4,
        poiCount: 1,
        fields: [
          'fieldEvidenceRefs',
          'fieldVerifiedAt',
          'fieldVerifiedBy',
          'photoEvidenceStatus'
        ]
      }),
      expect.objectContaining({
        ownerLane: 'trigger-smoke',
        taskCount: 1,
        poiCount: 1,
        poiCodes: ['xicheng-trigger']
      })
    ]))
    expect(report.blockers).toContain('production review field tasks remain; complete field-level CSV rows before production review apply')

    const taskCsv = await readFile(path.join(rootDir, 'workbench/xicheng-poi-production-review-tasks.csv'), 'utf8')
    expect(taskCsv).toContain('poiCode,fieldName,ownerLane,currentValue,expectedValue,taskDetail,requiredEvidence,taskStatus,productionReviewFile')
    expect(taskCsv).toContain('xicheng-baitasi,photoEvidenceStatus,field-review,REVIEW_REQUIRED,APPROVED')
    expect(taskCsv).toContain('xicheng-baitasi,fieldEvidenceRefs,field-review,EMPTY,non-local https/oss/cos/s3 evidence ref')
    expect(taskCsv).toContain('xicheng-trigger,triggerSmokeStatus,trigger-smoke,NOT_RUN,PASSED')

    const evidence = JSON.parse(await readFile(path.join(rootDir, 'qa/xicheng-poi-production-review-tasks-evidence.json'), 'utf8'))
    expect(evidence.summary).toMatchObject({
      pendingPoiCount: 2,
      readyPoiCount: 1,
      taskCount: 11
    })
  })

  test('reports ready when production review summary has no missing fields', async () => {
    const rootDir = await createTempRoot()
    const productionReviewFile = path.join(rootDir, 'workbench/xicheng-poi-production-review-summary.csv')
    await mkdir(path.dirname(productionReviewFile), { recursive: true })
    await writeFile(productionReviewFile, productionReviewCsv([
      'xicheng-ready,APPROVED,PASSED,oss://xunjing-review/xicheng/ready/photo.jpg,field-team,2026-06-29,APPROVED,APPROVED,APPROVED,PUBLISHED,reviewer,2026-06-29,Ready.'
    ]))

    const result = runProductionReviewTaskExport([
      '--root', rootDir,
      '--production-review', 'workbench/xicheng-poi-production-review-summary.csv',
      '--output', 'workbench/xicheng-poi-production-review-tasks.csv',
      '--evidence-file', 'qa/xicheng-poi-production-review-tasks-evidence.json'
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-production-review-tasks',
      ok: true,
      status: 'PRODUCTION_REVIEW_TASKS_READY',
      summary: {
        productionReviewRows: 1,
        readyPoiCount: 1,
        pendingPoiCount: 0,
        taskCount: 0
      },
      tasks: [],
      blockers: []
    })
  })

  test('exposes the production review task export through npm scripts and docs', async () => {
    const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8'))
    const deployDoc = await readFile(path.resolve('docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(path.resolve('docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:xicheng:poi:production-review:tasks:export']).toBe(
      'node scripts/export-xicheng-poi-production-review-tasks.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:xicheng:poi:production-review:tasks:export')
    expect(deployDoc).toContain('workbench/xicheng-poi-production-review-tasks.csv')
    expect(deployDoc).toContain('qa/xicheng-poi-production-review-tasks-evidence.json')
    expect(statusDoc).toContain('PRODUCTION_REVIEW_TASKS_REQUIRED')
    expect(statusDoc).toContain('workbench/xicheng-poi-production-review-tasks.csv')
  })
})
