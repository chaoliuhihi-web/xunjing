import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-poi-review-tasks-'))
  tempDirs.push(rootDir)
  return rootDir
}

async function writeJson(rootDir, filePath, value) {
  const resolvedFile = path.join(rootDir, filePath)
  await mkdir(path.dirname(resolvedFile), { recursive: true })
  await writeFile(resolvedFile, `${JSON.stringify(value, null, 2)}\n`)
  return resolvedFile
}

function runTaskExport(args) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/export-xicheng-poi-review-tasks.mjs'),
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

describe('xicheng POI review task export', () => {
  test('exports workbook pending POI blockers into an assignee CSV', async () => {
    const rootDir = await createTempRoot()
    const evidencePath = await writeJson(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json', {
      artifactType: 'xicheng-poi-review-workbook-readiness',
      ok: false,
      status: 'NOT_READY',
      checkedAt: '2026-06-28T00:00:00.000Z',
      summary: {
        workbookReadyPoiCount: 79,
        workbookPendingPoiCount: 1,
        pendingPoiCodes: ['TODO-xicheng-poi-080'],
        pendingPoiTasks: [
          {
            poiCode: 'TODO-xicheng-poi-080',
            poiIndex: 80,
            workbookRowNumber: 81,
            blockerGroups: [
              'poi-identity',
              'poi-source-license',
              'no-placeholder-cells'
            ]
          }
        ]
      }
    })
    const outputFile = path.join(rootDir, 'workbench/xicheng-poi-review-tasks.csv')

    const result = runTaskExport([
      '--root', rootDir,
      '--workbook-evidence', 'qa/xicheng-poi-review-workbook-evidence.json',
      '--output', 'workbench/xicheng-poi-review-tasks.csv'
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-review-tasks',
      ok: false,
      status: 'REVIEW_TASKS_REQUIRED',
      summary: {
        sourceEvidenceFile: evidencePath,
        outputFile,
        pendingPoiCount: 1,
        taskCount: 3,
        ownerLaneCounts: {
          'data-review': 1,
          'source-license': 1,
          cleanup: 1
        }
      }
    })

    const csv = await readFile(outputFile, 'utf8')
    expect(csv).toContain('workbookRowNumber,poiIndex,poiCode,blockerGroup,ownerLane,taskDetail,requiredEvidence,workbookColumns,taskStatus,sourceEvidenceFile')
    expect(csv).toContain(`81,80,TODO-xicheng-poi-080,poi-identity,data-review,Fill stable POI identity fields for an approved Xicheng P0 location.,Official POI name address category aliases and stable xicheng-* code.,poiCode|name|displayName|aliases|category|priority|address,TODO,${evidencePath}`)
    expect(csv).toContain(`81,80,TODO-xicheng-poi-080,poi-source-license,source-license,Approve source license and attach non-local source evidence.,Official HTTPS source URL source type license approval reviewer and evidence reference.,sourceTitle|sourceUrl|sourceType|licenseStatus|licenseEvidenceRef|licenseReviewedBy|licenseReviewedAt,TODO,${evidencePath}`)
    expect(csv).toContain(`81,80,TODO-xicheng-poi-080,no-placeholder-cells,cleanup,Replace all TODO TBD PLACEHOLDER REVIEW_REQUIRED or Chinese pending markers.,Workbook row contains no placeholder or review-required values.,all columns,TODO,${evidencePath}`)
  })

  test('exports an empty task CSV when workbook evidence is ready', async () => {
    const rootDir = await createTempRoot()
    await writeJson(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json', {
      artifactType: 'xicheng-poi-review-workbook-readiness',
      ok: true,
      status: 'XICHENG_POI_REVIEW_WORKBOOK_READY',
      checkedAt: '2026-06-28T00:00:00.000Z',
      summary: {
        workbookReadyPoiCount: 80,
        workbookPendingPoiCount: 0,
        pendingPoiCodes: [],
        pendingPoiTasks: []
      }
    })

    const result = runTaskExport([
      '--root', rootDir,
      '--workbook-evidence', 'qa/xicheng-poi-review-workbook-evidence.json',
      '--output', 'workbench/xicheng-poi-review-tasks.csv'
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-review-tasks',
      ok: true,
      status: 'REVIEW_TASKS_READY',
      summary: {
        pendingPoiCount: 0,
        taskCount: 0,
        ownerLaneCounts: {}
      }
    })
    expect(await readFile(path.join(rootDir, 'workbench/xicheng-poi-review-tasks.csv'), 'utf8')).toBe(
      'workbookRowNumber,poiIndex,poiCode,blockerGroup,ownerLane,taskDetail,requiredEvidence,workbookColumns,taskStatus,sourceEvidenceFile\n'
    )
  })

  test('exposes the task export through npm scripts and handoff docs', async () => {
    const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8'))
    const deployDoc = await readFile(path.resolve('docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(path.resolve('docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:xicheng:poi:tasks:export']).toBe(
      'node scripts/export-xicheng-poi-review-tasks.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:xicheng:poi:tasks:export')
    expect(statusDoc).toContain('npm run xunjing:xicheng:poi:tasks:export')
  })
})
