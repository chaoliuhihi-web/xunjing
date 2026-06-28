import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-poi-review-pack-'))
  tempDirs.push(rootDir)
  return rootDir
}

function runReviewPack(args, options = {}) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/create-xicheng-poi-production-review-pack.mjs'),
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

describe('xicheng POI production review pack', () => {
  test('creates the default prefilled review pack without marking it production ready', async () => {
    const rootDir = await createTempRoot()

    const result = runReviewPack([
      '--root', rootDir
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    const outputFile = path.join(rootDir, 'workbench/xicheng-production-pois.prefilled.json')
    const reviewChecklistFile = path.join(rootDir, 'workbench/xicheng-production-pois.review-checklist.csv')
    const reviewWorkbookFile = path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.csv')
    const reviewPacketFile = path.join(rootDir, 'workbench/xicheng-production-pois.review-packet.json')
    const workbookEvidenceFile = path.join(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json')
    const reviewTasksFile = path.join(rootDir, 'workbench/xicheng-poi-review-tasks.csv')

    expect(report).toMatchObject({
      artifactType: 'xicheng-poi-production-review-pack',
      ok: false,
      status: 'REVIEW_DATA_REQUIRED',
      summary: {
        outputFile,
        reviewChecklistFile,
        reviewWorkbookFile,
        reviewPacketFile,
        workbookEvidenceFile,
        reviewTasksFile,
        poiSlots: 80,
        importedPoiCount: 24,
        todoPoiSlots: 56,
        productionReady: false,
        workbookGateStatus: 'NOT_READY',
        workbookReadyPoiCount: 0,
        workbookPendingPoiCount: 80,
        reviewTaskStatus: 'REVIEW_TASKS_REQUIRED'
      }
    })
    expect(report.blockers).toContain('review workbook still contains TODO or REVIEW_REQUIRED placeholders')
    expect(report.blockers).toContain('workbook review tasks remain; complete ownerLane CSV rows before production release')
    expect(report.nextCommands).toContain(
      'npm run xunjing:xicheng:poi:workbook:gate -- --workbook workbench/xicheng-production-pois.review-workbook.csv --evidence-file qa/xicheng-poi-review-workbook-evidence.json'
    )
    expect(report.nextCommands).toContain(
      'npm run xunjing:xicheng:poi:tasks:export -- --workbook-evidence qa/xicheng-poi-review-workbook-evidence.json --output workbench/xicheng-poi-review-tasks.csv'
    )

    const manifest = JSON.parse(await readFile(outputFile, 'utf8'))
    expect(manifest.seedSource).toMatchObject({
      localCandidateOnly: true,
      importedPoiCount: 24
    })
    expect(manifest.productionReady).toBe(false)
    expect(manifest.pois).toHaveLength(80)

    const workbook = await readFile(reviewWorkbookFile, 'utf8')
    expect(workbook).toContain('TODO-xicheng-poi-025')
    expect(workbook).toContain('REVIEW_REQUIRED')

    const workbookEvidence = JSON.parse(await readFile(workbookEvidenceFile, 'utf8'))
    expect(workbookEvidence).toMatchObject({
      artifactType: 'xicheng-poi-review-workbook-readiness',
      ok: false,
      status: 'NOT_READY',
      summary: {
        workbookFile: reviewWorkbookFile,
        workbookRows: 80,
        workbookPendingPoiCount: 80
      }
    })

    const reviewTasks = await readFile(reviewTasksFile, 'utf8')
    expect(reviewTasks).toContain('workbookRowNumber,poiIndex,poiCode,blockerGroup,ownerLane,taskStatus,sourceEvidenceFile')
    expect(reviewTasks).toContain('TODO-xicheng-poi-025')
    expect(reviewTasks).toContain('source-license')

    const reviewPacket = JSON.parse(await readFile(reviewPacketFile, 'utf8'))
    expect(reviewPacket).toMatchObject({
      artifactType: 'xicheng-poi-production-review-packet',
      ok: false,
      status: 'REVIEW_DATA_REQUIRED',
      summary: {
        poiSlots: 80,
        importedPoiCount: 24,
        todoPoiSlots: 56,
        productionReady: false
      }
    })
    expect(await readFile(reviewChecklistFile, 'utf8')).toContain('TODO-xicheng-poi-025')
  })

  test('exposes the review pack through npm scripts and handoff docs', async () => {
    const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8'))
    const deployDoc = await readFile(path.resolve('docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(path.resolve('docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:xicheng:poi:review:pack']).toBe(
      'node scripts/create-xicheng-poi-production-review-pack.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:xicheng:poi:review:pack')
    expect(deployDoc).toContain('qa/xicheng-poi-review-workbook-evidence.json')
    expect(deployDoc).toContain('workbench/xicheng-poi-review-tasks.csv')
    expect(deployDoc).toContain('--workbook-evidence qa/xicheng-poi-review-workbook-evidence.json')
    expect(deployDoc).toContain('--review-tasks workbench/xicheng-poi-review-tasks.csv')
    expect(statusDoc).toContain('npm run xunjing:xicheng:poi:review:pack')
    expect(statusDoc).toContain('workbookGateStatus')
    expect(statusDoc).toContain('reviewTaskStatus')
  })
})
