import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-yudao-release-preflight-'))
  tempDirs.push(rootDir)
  return rootDir
}

function runPreflight(args, options = {}) {
  return spawnSync(process.execPath, [
    path.resolve('scripts/run-xicheng-yudao-release-preflight.mjs'),
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

describe('xicheng Yudao release preflight', () => {
  test('runs release gate and exports blocker tasks from the same evidence', async () => {
    const rootDir = await createTempRoot()
    await mkdir(path.join(rootDir, 'backend/yudao/sql/mysql'), { recursive: true })
    await mkdir(path.join(rootDir, 'backend/yudao/yudao-server/target'), { recursive: true })

    const result = runPreflight([
      '--root', rootDir,
      '--env-file', 'ops/xunjing-platform.env.example',
      '--runtime-seed-evidence', 'tmp/xicheng-yudao-runtime-seed-production-evidence.json',
      '--release-evidence', 'qa/xicheng-yudao-release-evidence.json',
      '--tasks-output', 'workbench/xicheng-yudao-release-blocker-tasks.csv',
      '--poi-tasks-output', 'workbench/xicheng-yudao-release-poi-blocker-tasks.csv'
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    const releaseEvidenceFile = path.join(rootDir, 'qa/xicheng-yudao-release-evidence.json')
    const tasksOutputFile = path.join(rootDir, 'workbench/xicheng-yudao-release-blocker-tasks.csv')
    const poiTasksOutputFile = path.join(rootDir, 'workbench/xicheng-yudao-release-poi-blocker-tasks.csv')
    const handoffOutputFile = path.join(rootDir, 'workbench/xicheng-yudao-release-handoff.md')

    expect(report).toMatchObject({
      artifactType: 'xicheng-yudao-release-preflight',
      ok: false,
      status: 'NOT_READY',
      summary: {
        releaseEvidenceFile,
        tasksOutputFile,
        poiTasksOutputFile,
        handoffOutputFile,
        appReadinessEvidenceFile: path.join(rootDir, 'qa/xicheng-app-readiness-evidence.json'),
        appReadinessStatus: 'MISSING',
        appReadinessBlockerCount: 1,
        appReadinessCommand: expect.stringContaining('npm run xunjing:platform:verify'),
        finalEvidencePackageCommand: expect.stringContaining('npm run xunjing:xicheng:release:evidence:package'),
        poiEvidenceBootstrapCommand: expect.stringContaining('npm run xunjing:xicheng:poi:review:pack'),
        poiTaskCount: expect.any(Number),
        releaseStatus: 'NOT_READY'
      }
    })
    expect(report.summary.finalEvidencePackageCommand).toContain('--stage production')
    expect(report.summary.finalEvidencePackageCommand).toContain('--release-evidence qa/xicheng-yudao-release-evidence.json')
    expect(report.summary.finalEvidencePackageCommand).toContain('--poi-workbook-evidence qa/xicheng-poi-review-workbook-evidence.json')
    expect(report.summary.finalEvidencePackageCommand).toContain('--poi-manifest-evidence qa/xicheng-poi-manifest-evidence.json')
    expect(report.summary.finalEvidencePackageCommand).toContain('--poi-seed-evidence qa/xicheng-poi-production-seed-evidence.json')
    expect(report.summary.finalEvidencePackageCommand).toContain('--poi-source-coverage-evidence qa/xicheng-poi-source-coverage-evidence.json')
    expect(report.summary.finalEvidencePackageCommand).toContain('--poi-source-review-apply-evidence qa/xicheng-poi-source-review-apply-evidence.json')
    expect(report.summary.finalEvidencePackageCommand).toContain('--poi-production-review-apply-evidence qa/xicheng-poi-production-review-apply-evidence.json')
    expect(report.summary.finalEvidencePackageCommand).toContain('--app-readiness-evidence qa/xicheng-app-readiness-evidence.json')
    expect(report.summary.finalEvidencePackageCommand).toContain('--evidence-file qa/xicheng-release-evidence-package.json')
    expect(report.summary.appReadinessCommand).toContain('--env-file ops/xunjing-platform.env.example')
    expect(report.summary.appReadinessCommand).toContain('--base-url https://your-production-domain/')
    expect(report.summary.appReadinessCommand).toContain('--tenant-id 1')
    expect(report.summary.appReadinessCommand).toContain('--skip-admin-check')
    expect(report.summary.appReadinessCommand).toContain('--include-xicheng-app-check')
    expect(report.summary.appReadinessCommand).toContain('--include-xicheng-trigger-check')
    expect(report.summary.appReadinessCommand).toContain('--evidence-file qa/xicheng-app-readiness-evidence.json')
    expect(report.appReadiness).toMatchObject({
      ok: false,
      status: 'MISSING',
      blockers: [
        'APP readiness evidence is missing; run summary.appReadinessCommand before final evidence package'
      ]
    })
    expect(report.summary.poiEvidenceBootstrapCommand).toContain('--production-review workbench/xicheng-poi-production-review-summary.csv')
    expect(report.summary.taskCount).toBeGreaterThan(0)
    expect(report.summary.ownerLaneCounts).toMatchObject({
      'platform-ops': expect.any(Number),
      'ai-platform': expect.any(Number),
      'poi-data': expect.any(Number)
    })
    expect(report.summary.ownerLaneBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ownerLane: 'platform-ops',
          taskCount: expect.any(Number),
          checkNames: expect.arrayContaining(['runtime-env']),
          verificationCommands: expect.arrayContaining([
            expect.stringContaining('npm run xunjing:yudao:release:gate')
          ])
        }),
        expect.objectContaining({
          ownerLane: 'poi-data',
          taskCount: expect.any(Number),
          checkNames: expect.arrayContaining(['xicheng-production-poi-evidence']),
          verificationCommands: expect.arrayContaining([
            expect.stringContaining('npm run xunjing:xicheng:poi:')
          ])
        })
      ])
    )
    expect(report.blockers).toContain(
      'Yudao release gate blockers remain; complete ownerLane CSV rows before preprod or production release'
    )

    const releaseEvidence = JSON.parse(await readFile(releaseEvidenceFile, 'utf8'))
    expect(releaseEvidence).toMatchObject({
      artifactType: 'xicheng-yudao-release-readiness',
      status: 'NOT_READY',
      summary: {
        runtimeSeedEvidenceFile: path.join(rootDir, 'tmp/xicheng-yudao-runtime-seed-production-evidence.json')
      }
    })

    const tasksCsv = await readFile(tasksOutputFile, 'utf8')
    expect(tasksCsv).toContain('checkName,blockerIndex,blocker,ownerLane,taskDetail,requiredEvidence,verificationCommand,taskStatus,sourceEvidenceFile')
    expect(tasksCsv).toContain(releaseEvidenceFile)
    const poiTasksCsv = await readFile(poiTasksOutputFile, 'utf8')
    expect(poiTasksCsv).toContain('poiTaskKey,poiCode,checkName,blockerIndex,blocker,ownerLane,taskDetail,requiredEvidence,verificationCommand,taskStatus,sourceEvidenceFile')

    const handoffMarkdown = await readFile(handoffOutputFile, 'utf8')
    expect(handoffMarkdown).toContain('# Xicheng Yudao Release Handoff')
    expect(handoffMarkdown).toContain('Status: `NOT_READY`')
    expect(handoffMarkdown).toContain(`Release evidence: \`${releaseEvidenceFile}\``)
    expect(handoffMarkdown).toContain(`Blocker tasks CSV: \`${tasksOutputFile}\``)
    expect(handoffMarkdown).toContain(`POI tasks CSV: \`${poiTasksOutputFile}\``)
    expect(handoffMarkdown).toContain('## Owner Lanes')
    expect(handoffMarkdown).toContain('### platform-ops')
    expect(handoffMarkdown).toContain('### poi-data')
    expect(handoffMarkdown).toContain('## POI Evidence Bootstrap')
    expect(handoffMarkdown).toContain('npm run xunjing:xicheng:poi:review:pack')
    expect(handoffMarkdown).toContain('workbench/xicheng-poi-production-review-summary.csv')
    expect(handoffMarkdown).toContain('## APP Readiness Evidence')
    expect(handoffMarkdown).toContain('Status: `MISSING`')
    expect(handoffMarkdown).toContain('APP readiness evidence is missing')
    expect(handoffMarkdown).toContain('npm run xunjing:platform:verify')
    expect(handoffMarkdown).toContain('--include-xicheng-app-check')
    expect(handoffMarkdown).toContain('--include-xicheng-trigger-check')
    expect(handoffMarkdown).toContain('--evidence-file qa/xicheng-app-readiness-evidence.json')
    expect(handoffMarkdown).toContain('npm run xunjing:xicheng:release:evidence:package')
    expect(handoffMarkdown).toContain('Do not mark production ready until')
  })

  test('exposes the preflight through npm scripts and handoff docs', async () => {
    const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8'))
    const deployDoc = await readFile(path.resolve('docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(path.resolve('docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:yudao:release:preflight']).toBe(
      'node scripts/run-xicheng-yudao-release-preflight.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:yudao:release:preflight')
    expect(statusDoc).toContain('npm run xunjing:yudao:release:preflight')
    expect(deployDoc).toContain('xicheng-yudao-release-poi-blocker-tasks.csv')
    expect(statusDoc).toContain('xicheng-yudao-release-poi-blocker-tasks.csv')
    expect(deployDoc).toContain('xicheng-yudao-release-handoff.md')
    expect(statusDoc).toContain('xicheng-yudao-release-handoff.md')
    expect(deployDoc).toContain('--handoff-output')
    expect(statusDoc).toContain('--handoff-output')
    expect(deployDoc).toContain('summary.poiEvidenceBootstrapCommand')
    expect(statusDoc).toContain('summary.poiEvidenceBootstrapCommand')
    expect(deployDoc).toContain('summary.appReadinessCommand')
    expect(statusDoc).toContain('summary.appReadinessCommand')
    expect(deployDoc).toContain('summary.appReadinessStatus')
    expect(statusDoc).toContain('summary.appReadinessStatus')
    expect(deployDoc).toContain('POI Evidence Bootstrap')
    expect(statusDoc).toContain('POI Evidence Bootstrap')
    expect(deployDoc).toContain('APP Readiness Evidence')
    expect(statusDoc).toContain('APP Readiness Evidence')
    expect(deployDoc).toContain('tenant-id: 1')
    expect(statusDoc).toContain('tenant-id: 1')
    expect(deployDoc).toContain('YUDAO_XICHENG_LOCAL_SEED_READY')
    expect(statusDoc).toContain('YUDAO_XICHENG_LOCAL_SEED_READY')
  })
})
