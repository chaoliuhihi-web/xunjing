import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-yudao-release-preflight-'))
  tempDirs.push(rootDir)
  return rootDir
}

async function writeJson(rootDir, relativePath, value) {
  const filePath = path.join(rootDir, relativePath)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`)
  return filePath
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

function productionReviewCsv(rows) {
  return [
    'poiCode,photoEvidenceStatus,triggerSmokeStatus,fieldEvidenceRefs,fieldVerifiedBy,fieldVerifiedAt,reviewStatus,geoStatus,auditLicenseStatus,status,reviewedBy,reviewedAt,nextAction',
    ...rows
  ].join('\n') + '\n'
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function passedChecks(names) {
  return names.map((name) => ({ name, ok: true, detail: `${name} passed`, blockers: [] }))
}

function productionSeedSql() {
  const rows = Array.from({ length: 80 }, (_, index) => {
    const suffix = String(index + 1).padStart(3, '0')
    return [
      `(@map_package_id, 'xicheng-prod-poi-${suffix}', 'beijing-xicheng', 'Production POI ${suffix}', 'Production POI ${suffix}', '[]', 'museum', 'P0', 'Beijing Xicheng', 39.9000000, 116.3000000, 'GCJ02',`,
      " JSON_OBJECT('licenseStatus','APPROVED'), '{}',",
      ` '{"productionReady":true,"targetP0PoiCount":80,"regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001"}',`,
      " 'APPROVED', 'APPROVED', 'APPROVED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id)"
    ].join('')
  }).join(',\n')

  return [
    'INSERT INTO `xunjing_poi` VALUES',
    `${rows};`,
    'INSERT INTO `xunjing_resource_package` (`readiness_json`) VALUES (\'{"productionReady":true,"regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","poiSeedCount":80,"targetP0PoiCount":80,"reviewBatchCode":"xicheng-p0-poi-review-20260702","reviewBatchEvidencePackageRef":"oss://xunjing-review/xicheng/review-batches/xicheng-p0-poi-review-20260702.zip"}\');'
  ].join('\n')
}

async function writeDefaultPoiEvidenceFiles(rootDir) {
  const manifestFile = path.join(rootDir, 'workbench/xicheng-production-pois.json')
  const workbookFile = path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.production-applied.csv')
  const seedFile = path.join(rootDir, 'workbench/xicheng-poi-production-seed.sql')
  const manifestText = `${JSON.stringify({
    regionCode: 'beijing-xicheng',
    packageCode: 'XICHENG-MAP-001',
    productionReady: true,
    pois: Array.from({ length: 80 }, (_, index) => ({
      poiCode: `xicheng-prod-poi-${String(index + 1).padStart(3, '0')}`
    }))
  }, null, 2)}\n`
  const workbookText = [
    'poiCode,name,licenseStatus,photoEvidenceStatus,triggerSmokeStatus,reviewStatus,geoStatus,status',
    ...Array.from({ length: 80 }, (_, index) => {
      const suffix = String(index + 1).padStart(3, '0')
      return `xicheng-prod-poi-${suffix},Production POI ${suffix},APPROVED,APPROVED,PASSED,APPROVED,APPROVED,PUBLISHED`
    })
  ].join('\n') + '\n'
  const seedText = productionSeedSql()
  await mkdir(path.dirname(manifestFile), { recursive: true })
  await writeFile(manifestFile, manifestText)
  await writeFile(workbookFile, workbookText)
  await writeFile(seedFile, seedText)
  await writeJson(rootDir, 'qa/xicheng-poi-manifest-evidence.json', {
    artifactType: 'xicheng-poi-production-manifest-readiness',
    ok: true,
    status: 'PRODUCTION_POI_MANIFEST_READY',
    checkedAt: new Date().toISOString(),
    summary: {
      manifestFile,
      manifestSha256: sha256(manifestText),
      regionCode: 'beijing-xicheng',
      packageCode: 'XICHENG-MAP-001',
      totalPoiCount: 80,
      targetPoiCount: 80,
      productionReady: true,
      reviewBatchCode: 'xicheng-p0-poi-review-20260702',
      reviewBatchEvidencePackageRef: 'oss://xunjing-review/xicheng/review-batches/xicheng-p0-poi-review-20260702.zip',
      sourceWorkbookFile: workbookFile,
      sourceWorkbookSha256: sha256(workbookText)
    },
    checks: passedChecks([
      'manifest-shape',
      'manifest-production-flags',
      'manifest-review-batch',
      'poi-count',
      'poi-identity',
      'poi-coordinates',
      'poi-triggers',
      'poi-source-license',
      'poi-field-evidence',
      'poi-content',
      'media-assets',
      'poi-audit'
    ]),
    blockers: []
  })
  await writeJson(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json', {
    artifactType: 'xicheng-poi-review-workbook-readiness',
    ok: true,
    status: 'XICHENG_POI_REVIEW_WORKBOOK_READY',
    checkedAt: new Date().toISOString(),
    summary: {
      workbookFile,
      workbookSha256: sha256(workbookText),
      workbookRows: 80,
      minPoiCount: 80,
      categoryCount: 8,
      placeholderCount: 0,
      workbookReadyPoiCount: 80,
      workbookPendingPoiCount: 0,
      pendingPoiCodes: [],
      pendingPoiTasks: []
    },
    checks: passedChecks([
      'workbook-file',
      'workbook-shape',
      'poi-count',
      'poi-identity',
      'poi-source-license',
      'poi-field-evidence',
      'poi-content-audit',
      'no-placeholder-cells'
    ]),
    blockers: []
  })
  await writeJson(rootDir, 'qa/xicheng-poi-production-seed-evidence.json', {
    artifactType: 'xicheng-poi-production-seed-readiness',
    ok: true,
    status: 'PRODUCTION_POI_SEED_READY',
    checkedAt: new Date().toISOString(),
    summary: {
      sqlFile: seedFile,
      sqlSha256: sha256(seedText),
      poiCount: 80,
      minPoiCount: 80,
      productionReady: true,
      regionCode: 'beijing-xicheng',
      packageCode: 'XICHENG-MAP-001',
      targetP0PoiCount: 80,
      reviewBatchCode: 'xicheng-p0-poi-review-20260702',
      reviewBatchEvidencePackageRef: 'oss://xunjing-review/xicheng/review-batches/xicheng-p0-poi-review-20260702.zip'
    },
    checks: passedChecks([
      'sql-file',
      'seed-shape',
      'seed-preconditions',
      'poi-count',
      'poi-approval',
      'production-metrics',
      'review-batch-metrics',
      'field-evidence',
      'source-license-evidence',
      'media-assets',
      'source-documents'
    ]),
    blockers: []
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
      '--poi-tasks-output', 'workbench/xicheng-yudao-release-poi-blocker-tasks.csv',
      '--poi-summary-output', 'workbench/xicheng-yudao-release-poi-summary.csv'
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    const releaseEvidenceFile = path.join(rootDir, 'qa/xicheng-yudao-release-evidence.json')
    const tasksOutputFile = path.join(rootDir, 'workbench/xicheng-yudao-release-blocker-tasks.csv')
    const poiTasksOutputFile = path.join(rootDir, 'workbench/xicheng-yudao-release-poi-blocker-tasks.csv')
    const poiSummaryOutputFile = path.join(rootDir, 'workbench/xicheng-yudao-release-poi-summary.csv')
    const handoffOutputFile = path.join(rootDir, 'workbench/xicheng-yudao-release-handoff.md')

    expect(report).toMatchObject({
      artifactType: 'xicheng-yudao-release-preflight',
      ok: false,
      status: 'NOT_READY',
      summary: {
        releaseEvidenceFile,
        tasksOutputFile,
        poiTasksOutputFile,
        poiSummaryOutputFile,
        handoffOutputFile,
        appReadinessEvidenceFile: path.join(rootDir, 'qa/xicheng-app-readiness-evidence.json'),
        appReadinessStatus: 'MISSING',
        appReadinessBlockerCount: 1,
        appReadinessCommand: expect.stringContaining('npm run xunjing:platform:verify'),
        finalEvidencePackageCommand: expect.stringContaining('npm run xunjing:xicheng:release:evidence:package'),
        poiEvidenceBootstrapCommand: expect.stringContaining('npm run xunjing:xicheng:poi:review:pack'),
        productionReviewTasksCommand: expect.stringContaining('npm run xunjing:xicheng:poi:production-review:tasks:export'),
        productionReviewTasksStatus: 'MISSING',
        poiTaskCount: expect.any(Number),
        poiSummaryCount: expect.any(Number),
        releaseStatus: 'NOT_READY'
      }
    })
    expect(report.summary.finalEvidencePackageCommand).toContain('--stage production')
    expect(report.summary.finalEvidencePackageCommand).toContain('--release-evidence qa/xicheng-yudao-release-evidence.json')
    expect(report.summary.finalEvidencePackageCommand).toContain('--yudao-server-build-evidence qa/xicheng-yudao-server-build-evidence.json')
    expect(report.summary.finalEvidencePackageCommand).toContain('--yudao-server-smoke-evidence qa/xicheng-yudao-server-smoke-evidence.json')
    expect(report.summary.finalEvidencePackageCommand).toContain('--runtime-seed-evidence tmp/xicheng-yudao-runtime-seed-production-evidence.json')
    expect(report.summary.finalEvidencePackageCommand).toContain('--production-seed-apply-evidence qa/xicheng-yudao-production-seed-apply-evidence.json')
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
    expect(report.summary.productionReviewTasksCommand).toContain('--production-review workbench/xicheng-poi-production-review-summary.csv')
    expect(report.summary.productionReviewTasksCommand).toContain('--output workbench/xicheng-poi-production-review-tasks.csv')
    expect(report.summary.productionReviewTasksCommand).toContain('--owner-lane-output workbench/xicheng-poi-production-review-owner-lanes.csv')
    expect(report.summary.productionReviewTasksCommand).toContain('--evidence-file qa/xicheng-poi-production-review-tasks-evidence.json')
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
          ownerLane: 'app-ops',
          taskCount: expect.any(Number),
          checkNames: expect.arrayContaining(['app-readiness-evidence']),
          verificationCommands: expect.arrayContaining([
            expect.stringContaining('npm run xunjing:platform:verify')
          ])
        }),
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
        yudaoServerSmokeEvidenceFile: path.join(rootDir, 'qa/xicheng-yudao-server-smoke-evidence.json'),
        runtimeSeedEvidenceFile: path.join(rootDir, 'tmp/xicheng-yudao-runtime-seed-production-evidence.json')
      }
    })

    const tasksCsv = await readFile(tasksOutputFile, 'utf8')
    expect(tasksCsv).toContain('checkName,blockerIndex,blocker,ownerLane,taskDetail,requiredEvidence,verificationCommand,taskStatus,sourceEvidenceFile')
    expect(tasksCsv).toContain(releaseEvidenceFile)
    expect(tasksCsv).toContain('app-readiness-evidence,1,APP readiness evidence is missing; run summary.appReadinessCommand before final evidence package,app-ops')
    expect(tasksCsv).toContain('Generate Xicheng APP live readiness evidence against the release backend.')
    expect(tasksCsv).toContain('APP readiness evidence outputs xunjing-platform-readiness with live Xicheng APP and trigger checks.')
    expect(tasksCsv).toContain('npm run xunjing:platform:verify --')
    const poiTasksCsv = await readFile(poiTasksOutputFile, 'utf8')
    expect(poiTasksCsv).toContain('poiTaskKey,poiCode,checkName,blockerIndex,blocker,ownerLane,taskDetail,requiredEvidence,verificationCommand,taskStatus,sourceEvidenceFile')
    const poiSummaryCsv = await readFile(poiSummaryOutputFile, 'utf8')
    expect(poiSummaryCsv).toContain('poiCode,ownerLanes,blockerCount,checkNames,blockers,taskDetails,requiredEvidence,verificationCommands,taskStatus,sourceEvidenceFiles')

    const handoffMarkdown = await readFile(handoffOutputFile, 'utf8')
    expect(handoffMarkdown).toContain('# Xicheng Yudao Release Handoff')
    expect(handoffMarkdown).toContain('Status: `NOT_READY`')
    expect(handoffMarkdown).toContain(`Release evidence: \`${releaseEvidenceFile}\``)
    expect(handoffMarkdown).toContain(`Blocker tasks CSV: \`${tasksOutputFile}\``)
    expect(handoffMarkdown).toContain(`POI tasks CSV: \`${poiTasksOutputFile}\``)
    expect(handoffMarkdown).toContain(`POI summary CSV: \`${poiSummaryOutputFile}\``)
    expect(handoffMarkdown).toContain('## Owner Lanes')
    expect(handoffMarkdown).toContain('### platform-ops')
    expect(handoffMarkdown).toContain('### poi-data')
    expect(handoffMarkdown).toContain('## POI Evidence Bootstrap')
    expect(handoffMarkdown).toContain('npm run xunjing:xicheng:poi:review:pack')
    expect(handoffMarkdown).toContain('workbench/xicheng-poi-production-review-summary.csv')
    expect(handoffMarkdown).toContain('## Production Review Field Tasks')
    expect(handoffMarkdown).toContain('Status: `MISSING`')
    expect(handoffMarkdown).toContain('npm run xunjing:xicheng:poi:production-review:tasks:export')
    expect(handoffMarkdown).toContain('workbench/xicheng-poi-production-review-tasks.csv')
    expect(handoffMarkdown).toContain('workbench/xicheng-poi-production-review-owner-lanes.csv')
    expect(handoffMarkdown).toContain('qa/xicheng-poi-production-review-tasks-evidence.json')
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

  test('passes default POI evidence paths into the release gate', async () => {
    const rootDir = await createTempRoot()
    await mkdir(path.join(rootDir, 'backend/yudao/sql/mysql'), { recursive: true })
    await writeDefaultPoiEvidenceFiles(rootDir)

    const result = runPreflight([
      '--root', rootDir,
      '--env-file', 'ops/xunjing-platform.env.example',
      '--release-evidence', 'qa/xicheng-yudao-release-evidence.json',
      '--tasks-output', 'workbench/xicheng-yudao-release-blocker-tasks.csv',
      '--poi-tasks-output', 'workbench/xicheng-yudao-release-poi-blocker-tasks.csv',
      '--handoff-output', 'workbench/xicheng-yudao-release-handoff.md'
    ])

    expect(result.status).toBe(1)
    const releaseEvidence = JSON.parse(await readFile(
      path.join(rootDir, 'qa/xicheng-yudao-release-evidence.json'),
      'utf8'
    ))
    const poiEvidenceCheck = releaseEvidence.checks.find((check) => check.name === 'xicheng-production-poi-evidence')
    expect(poiEvidenceCheck?.summary).toMatchObject({
      poiManifestFile: path.join(rootDir, 'workbench/xicheng-production-pois.json'),
      sourceWorkbookFile: path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.production-applied.csv'),
      workbookEvidenceFile: path.join(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json'),
      productionPoiSeedSqlFile: path.join(rootDir, 'workbench/xicheng-poi-production-seed.sql')
    })
    expect(poiEvidenceCheck?.blockers).not.toEqual(expect.arrayContaining([
      'POI manifest evidence is required before production release',
      'POI workbook evidence is required before production release',
      'POI seed SQL evidence is required before production release'
    ]))
  })

  test('does not show POI evidence bootstrap when existing evidence already exports POI tasks', async () => {
    const rootDir = await createTempRoot()
    const productionReviewEvidenceFile = await writeJson(
      rootDir,
      'qa/xicheng-poi-production-review-apply-evidence.json',
      {
        artifactType: 'xicheng-poi-production-review-apply',
        ok: false,
        status: 'PRODUCTION_REVIEW_DATA_REMAINS',
        checkedAt: new Date().toISOString(),
        summary: {
          appliedPoiCount: 78,
          pendingProductionReviewPoiCount: 2,
          pendingProductionReviewPoiCodes: [
            'xicheng-baitasi',
            'xicheng-gongwangfu'
          ],
          sourceReviewApplyStatus: 'SOURCE_REVIEW_APPLIED',
          sourceReviewPendingSourcePoiCount: 0,
          sourceCoverageStatus: 'SOURCE_COVERAGE_READY',
          sourceCoverageUncoveredPoiCount: 0,
          triggerSmokeApplyEvidenceFile: 'qa/xicheng-poi-trigger-smoke-apply-evidence.json',
          triggerSmokeApplyStatus: 'TRIGGER_SMOKE_APPLIED',
          triggerSmokeAppliedPoiCount: 80,
          triggerSmokePendingPoiCount: 0,
          outputFile: 'workbench/xicheng-production-pois.review-workbook.production-applied.csv',
          outputSha256: '0'.repeat(64)
        },
        blockers: [
          '2 workbook POIs still require production field/content review'
        ]
      }
    )

    const result = runPreflight([
      '--root', rootDir,
      '--env-file', 'ops/xunjing-platform.env.example',
      '--release-evidence', 'qa/xicheng-yudao-release-evidence.json',
      '--tasks-output', 'workbench/xicheng-yudao-release-blocker-tasks.csv',
      '--poi-tasks-output', 'workbench/xicheng-yudao-release-poi-blocker-tasks.csv',
      '--handoff-output', 'workbench/xicheng-yudao-release-handoff.md',
      '--poi-production-review-apply-evidence', productionReviewEvidenceFile
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.summary.poiTaskCount).toBeGreaterThan(0)
    expect(report.summary.poiEvidenceBootstrapCommand).toBeUndefined()

    const handoffMarkdown = await readFile(
      path.join(rootDir, 'workbench/xicheng-yudao-release-handoff.md'),
      'utf8'
    )
    expect(handoffMarkdown).not.toContain('## POI Evidence Bootstrap')
    expect(handoffMarkdown).not.toContain('npm run xunjing:xicheng:poi:review:pack')
  })

  test('exports production review field tasks into the release handoff when the production review summary exists', async () => {
    const rootDir = await createTempRoot()
    await mkdir(path.join(rootDir, 'workbench'), { recursive: true })
    await writeFile(path.join(rootDir, 'workbench/xicheng-poi-production-review-summary.csv'), productionReviewCsv([
      'xicheng-baitasi,REVIEW_REQUIRED,PASSED,,,,REVIEW_REQUIRED,REVIEW_REQUIRED,REVIEW_REQUIRED,DRAFT,,,Attach field evidence.',
      'xicheng-ready,APPROVED,PASSED,https://cdn.example.com/xicheng/ready/photo.jpg,field-team,2026-06-29,APPROVED,APPROVED,APPROVED,PUBLISHED,reviewer,2026-06-29,Ready.'
    ]))

    const result = runPreflight([
      '--root', rootDir,
      '--env-file', 'ops/xunjing-platform.env.example',
      '--release-evidence', 'qa/xicheng-yudao-release-evidence.json',
      '--tasks-output', 'workbench/xicheng-yudao-release-blocker-tasks.csv',
      '--poi-tasks-output', 'workbench/xicheng-yudao-release-poi-blocker-tasks.csv',
      '--poi-summary-output', 'workbench/xicheng-yudao-release-poi-summary.csv',
      '--handoff-output', 'workbench/xicheng-yudao-release-handoff.md',
      '--production-review-tasks-output', 'workbench/xicheng-poi-production-review-tasks.csv',
      '--production-review-owner-lanes-output', 'workbench/xicheng-poi-production-review-owner-lanes.csv',
      '--production-review-owner-lane-dir', 'workbench/xicheng-poi-production-review-owner-lanes',
      '--production-review-tasks-evidence', 'qa/xicheng-poi-production-review-tasks-evidence.json'
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.summary).toMatchObject({
      productionReviewTasksStatus: 'PRODUCTION_REVIEW_TASKS_REQUIRED',
      productionReviewTaskCount: 10,
      productionReviewPendingPoiCount: 1,
      productionReviewTasksOutputFile: path.join(rootDir, 'workbench/xicheng-poi-production-review-tasks.csv'),
      productionReviewOwnerLanesOutputFile: path.join(rootDir, 'workbench/xicheng-poi-production-review-owner-lanes.csv'),
      productionReviewOwnerLaneTaskDir: path.join(rootDir, 'workbench/xicheng-poi-production-review-owner-lanes'),
      productionReviewTasksEvidenceFile: path.join(rootDir, 'qa/xicheng-poi-production-review-tasks-evidence.json')
    })
    expect(report.summary.productionReviewOwnerLaneTaskFiles).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ownerLane: 'field-review',
        taskCount: 4,
        poiCount: 1,
        taskFile: path.join(rootDir, 'workbench/xicheng-poi-production-review-owner-lanes/field-review.csv')
      }),
      expect.objectContaining({
        ownerLane: 'content-audit',
        taskCount: 4,
        poiCount: 1,
        taskFile: path.join(rootDir, 'workbench/xicheng-poi-production-review-owner-lanes/content-audit.csv')
      })
    ]))
    expect(report.productionReviewTasks).toMatchObject({
      ok: false,
      status: 'PRODUCTION_REVIEW_TASKS_REQUIRED',
      summary: {
        taskCount: 10,
        pendingPoiCount: 1
      }
    })

    const productionReviewTasksCsv = await readFile(
      path.join(rootDir, 'workbench/xicheng-poi-production-review-tasks.csv'),
      'utf8'
    )
    expect(productionReviewTasksCsv).toContain('xicheng-baitasi,photoEvidenceStatus,field-review,REVIEW_REQUIRED,APPROVED')
    expect(productionReviewTasksCsv).toContain('xicheng-baitasi,fieldEvidenceRefs,field-review,EMPTY,non-local https/oss/cos/s3 evidence ref')
    expect(productionReviewTasksCsv).not.toContain('xicheng-ready,')

    const productionReviewOwnerLanesCsv = await readFile(
      path.join(rootDir, 'workbench/xicheng-poi-production-review-owner-lanes.csv'),
      'utf8'
    )
    expect(productionReviewOwnerLanesCsv).toContain('ownerLane,taskCount,poiCount,fields,poiCodes,taskCsvFile,productionReviewFile,nextAction')
    expect(productionReviewOwnerLanesCsv).toContain('field-review,4,1,fieldEvidenceRefs|fieldVerifiedAt|fieldVerifiedBy|photoEvidenceStatus,xicheng-baitasi')
    expect(productionReviewOwnerLanesCsv).toContain('geo-audit,1,1,geoStatus,xicheng-baitasi')

    const fieldReviewCsv = await readFile(
      path.join(rootDir, 'workbench/xicheng-poi-production-review-owner-lanes/field-review.csv'),
      'utf8'
    )
    expect(fieldReviewCsv).toContain('xicheng-baitasi,photoEvidenceStatus,field-review,REVIEW_REQUIRED,APPROVED')
    expect(fieldReviewCsv).not.toContain('xicheng-ready,')

    const contentAuditCsv = await readFile(
      path.join(rootDir, 'workbench/xicheng-poi-production-review-owner-lanes/content-audit.csv'),
      'utf8'
    )
    expect(contentAuditCsv).toContain('xicheng-baitasi,reviewStatus,content-audit,REVIEW_REQUIRED,APPROVED')
    expect(contentAuditCsv).not.toContain('xicheng-ready,')

    const productionReviewTasksEvidence = JSON.parse(await readFile(
      path.join(rootDir, 'qa/xicheng-poi-production-review-tasks-evidence.json'),
      'utf8'
    ))
    expect(productionReviewTasksEvidence.summary).toMatchObject({
      productionReviewRows: 2,
      readyPoiCount: 1,
      pendingPoiCount: 1,
      taskCount: 10,
      ownerLaneTaskDir: path.join(rootDir, 'workbench/xicheng-poi-production-review-owner-lanes')
    })
    expect(productionReviewTasksEvidence.summary.ownerLaneTaskFiles).toEqual(
      report.summary.productionReviewOwnerLaneTaskFiles
    )

    const handoffMarkdown = await readFile(
      path.join(rootDir, 'workbench/xicheng-yudao-release-handoff.md'),
      'utf8'
    )
    expect(handoffMarkdown).toContain('## Production Review Field Tasks')
    expect(handoffMarkdown).toContain('Status: `PRODUCTION_REVIEW_TASKS_REQUIRED`')
    expect(handoffMarkdown).toContain('Task count: 10')
    expect(handoffMarkdown).toContain('Pending POIs: 1')
    expect(handoffMarkdown).toContain('Owner lane CSV:')
    expect(handoffMarkdown).toContain('workbench/xicheng-poi-production-review-owner-lanes.csv')
    expect(handoffMarkdown).toContain('Owner lane task dir:')
    expect(handoffMarkdown).toContain('workbench/xicheng-poi-production-review-owner-lanes')
    expect(handoffMarkdown).toContain('field-review.csv')
    expect(handoffMarkdown).toContain('### field-review')
  })

  test('does not surface stale production review tasks after production review apply evidence is ready', async () => {
    const rootDir = await createTempRoot()
    await mkdir(path.join(rootDir, 'workbench'), { recursive: true })
    await writeFile(path.join(rootDir, 'workbench/xicheng-poi-production-review-summary.csv'), productionReviewCsv([
      'xicheng-baitasi,REVIEW_REQUIRED,PASSED,,,,REVIEW_REQUIRED,REVIEW_REQUIRED,REVIEW_REQUIRED,DRAFT,,,Attach field evidence.'
    ]))
    const productionReviewApplyEvidenceFile = await writeJson(
      rootDir,
      'qa/xicheng-poi-production-review-apply-evidence.json',
      {
        artifactType: 'xicheng-poi-production-review-apply',
        ok: true,
        status: 'PRODUCTION_REVIEW_APPLIED',
        checkedAt: new Date().toISOString(),
        summary: {
          productionReviewFile: path.join(rootDir, 'workbench/xicheng-poi-production-review-summary.online-applied.csv'),
          productionReviewRows: 80,
          approvedReviewRowCount: 80,
          appliedPoiCount: 80,
          pendingProductionReviewPoiCount: 0,
          pendingProductionReviewPoiCodes: []
        },
        blockers: []
      }
    )

    const result = runPreflight([
      '--root', rootDir,
      '--env-file', 'ops/xunjing-platform.env.example',
      '--release-evidence', 'qa/xicheng-yudao-release-evidence.json',
      '--tasks-output', 'workbench/xicheng-yudao-release-blocker-tasks.csv',
      '--poi-tasks-output', 'workbench/xicheng-yudao-release-poi-blocker-tasks.csv',
      '--poi-summary-output', 'workbench/xicheng-yudao-release-poi-summary.csv',
      '--handoff-output', 'workbench/xicheng-yudao-release-handoff.md',
      '--production-review-tasks-output', 'workbench/xicheng-poi-production-review-tasks.csv',
      '--production-review-owner-lanes-output', 'workbench/xicheng-poi-production-review-owner-lanes.csv',
      '--production-review-owner-lane-dir', 'workbench/xicheng-poi-production-review-owner-lanes',
      '--production-review-tasks-evidence', 'qa/xicheng-poi-production-review-tasks-evidence.json',
      '--poi-production-review-apply-evidence', productionReviewApplyEvidenceFile
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.summary).toMatchObject({
      productionReviewTasksStatus: 'PRODUCTION_REVIEW_APPLIED',
      productionReviewTaskCount: 0,
      productionReviewPendingPoiCount: 0,
      productionReviewTasksEvidenceFile: productionReviewApplyEvidenceFile
    })
    expect(report.productionReviewTasks).toMatchObject({
      ok: true,
      status: 'PRODUCTION_REVIEW_APPLIED',
      summary: {
        taskCount: 0,
        pendingPoiCount: 0,
        productionReviewApplyEvidenceFile
      },
      blockers: []
    })
    expect(report.summary.productionReviewOwnerLaneTaskFiles).toEqual([])

    const handoffMarkdown = await readFile(
      path.join(rootDir, 'workbench/xicheng-yudao-release-handoff.md'),
      'utf8'
    )
    expect(handoffMarkdown).toContain('Status: `PRODUCTION_REVIEW_APPLIED`')
    expect(handoffMarkdown).toContain('Task count: 0')
    expect(handoffMarkdown).toContain('Pending POIs: 0')
    expect(handoffMarkdown).toContain('Production review apply evidence is ready; no field-level production review tasks are pending.')
    expect(handoffMarkdown).not.toContain('Status: `PRODUCTION_REVIEW_TASKS_REQUIRED`')
    expect(handoffMarkdown).not.toContain('field-review.csv')
  })

  test('rejects placeholder APP readiness backend domains', async () => {
    const rootDir = await createTempRoot()
    await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', {
      artifactType: 'xunjing-platform-readiness',
      ok: true,
      checkedAt: new Date().toISOString(),
      summary: {
        baseUrl: 'https://your-production-domain/',
        tenantId: '1',
        staticOnly: false,
        includeXichengAppCheck: true,
        includeXichengTriggerCheck: true,
        xichengRegionCode: 'beijing-xicheng',
        xichengPackageCode: 'XICHENG-MAP-001'
      },
      checks: [],
      blockers: []
    })

    const result = runPreflight([
      '--root', rootDir,
      '--env-file', 'ops/xunjing-platform.env.example',
      '--release-evidence', 'qa/xicheng-yudao-release-evidence.json',
      '--tasks-output', 'workbench/xicheng-yudao-release-blocker-tasks.csv',
      '--poi-tasks-output', 'workbench/xicheng-yudao-release-poi-blocker-tasks.csv',
      '--handoff-output', 'workbench/xicheng-yudao-release-handoff.md'
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.appReadiness.status).toBe('REVIEW_REQUIRED')
    expect(report.appReadiness.blockers).toContain(
      'APP readiness evidence baseUrl must be a real non-placeholder HTTPS URL'
    )

    const tasksCsv = await readFile(
      path.join(rootDir, 'workbench/xicheng-yudao-release-blocker-tasks.csv'),
      'utf8'
    )
    expect(tasksCsv).toContain('app-readiness-evidence,1,APP readiness evidence baseUrl must be a real non-placeholder HTTPS URL,app-ops')
  })

  test('rejects host.docker.internal APP readiness backend domains', async () => {
    const rootDir = await createTempRoot()
    await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', {
      artifactType: 'xunjing-platform-readiness',
      ok: true,
      checkedAt: new Date().toISOString(),
      summary: {
        baseUrl: 'https://host.docker.internal:48080',
        tenantId: '1',
        staticOnly: false,
        includeXichengAppCheck: true,
        includeXichengTriggerCheck: true,
        xichengRegionCode: 'beijing-xicheng',
        xichengPackageCode: 'XICHENG-MAP-001'
      },
      checks: [],
      blockers: []
    })

    const result = runPreflight([
      '--root', rootDir,
      '--env-file', 'ops/xunjing-platform.env.example',
      '--release-evidence', 'qa/xicheng-yudao-release-evidence.json',
      '--tasks-output', 'workbench/xicheng-yudao-release-blocker-tasks.csv',
      '--poi-tasks-output', 'workbench/xicheng-yudao-release-poi-blocker-tasks.csv',
      '--handoff-output', 'workbench/xicheng-yudao-release-handoff.md'
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.appReadiness.status).toBe('REVIEW_REQUIRED')
    expect(report.appReadiness.blockers).toContain(
      'APP readiness evidence baseUrl must be a non-local HTTPS URL'
    )
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
    expect(deployDoc).toContain('summary.productionReviewTasksCommand')
    expect(statusDoc).toContain('summary.productionReviewTasksCommand')
    expect(deployDoc).toContain('summary.productionReviewOwnerLanesOutputFile')
    expect(statusDoc).toContain('summary.productionReviewOwnerLanesOutputFile')
    expect(deployDoc).toContain('summary.productionReviewOwnerLaneTaskDir')
    expect(statusDoc).toContain('summary.productionReviewOwnerLaneTaskDir')
    expect(deployDoc).toContain('production-review-tasks')
    expect(statusDoc).toContain('production-review-tasks')
    expect(deployDoc).toContain('app-readiness-evidence')
    expect(statusDoc).toContain('app-readiness-evidence')
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
