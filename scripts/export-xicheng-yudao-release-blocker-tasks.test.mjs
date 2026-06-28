import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []
const releaseGateCommand = 'npm run xunjing:yudao:release:gate -- --stage production --expected-branch feature/xicheng-p0 --env-file /secure/path/production.env --evidence-file qa/xicheng-yudao-release-evidence.json'

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-release-blocker-tasks-'))
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
    path.resolve('scripts/export-xicheng-yudao-release-blocker-tasks.mjs'),
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

describe('xicheng Yudao release blocker task export', () => {
  test('exports release gate blockers into owner lane tasks', async () => {
    const rootDir = await createTempRoot()
    const releaseEvidencePath = await writeJson(rootDir, 'tmp/xicheng-yudao-release-evidence.json', {
      artifactType: 'xicheng-yudao-release-readiness',
      ok: false,
      status: 'NOT_READY',
      checkedAt: '2026-06-28T00:00:00.000Z',
      summary: {
        stage: 'production',
        failedChecks: 5,
        blockerCount: 5
      },
      checks: [
        {
          name: 'runtime-env',
          ok: false,
          blockers: [
            'Missing or placeholder production env: XUNJING_APP_API_BASE_URL, MYSQL_PASSWORD',
            'MYSQL_HOST must not point to a local host for production'
          ]
        },
        {
          name: 'real-wechat-app',
          ok: false,
          blockers: [
            'WX_MINIAPP_APPID must be configured with a real value'
          ]
        },
        {
          name: 'yudao-ai-model-bootstrap',
          ok: false,
          blockers: [
            'Yudao AI bootstrap evidence is required before production release'
          ]
        },
        {
          name: 'vision-ocr-service',
          ok: false,
          blockers: [
            'Vision OCR smoke evidence is required before production release'
          ]
        },
        {
          name: 'xicheng-production-poi-evidence',
          ok: false,
          blockers: [
            'POI manifest evidence is required before production release',
            'POI workbook evidence is required before production release',
            'POI seed SQL evidence is required before production release'
          ]
        },
        {
          name: 'release-source-revision',
          ok: true,
          blockers: []
        }
      ],
      blockers: [
        'Missing or placeholder production env: XUNJING_APP_API_BASE_URL, MYSQL_PASSWORD',
        'WX_MINIAPP_APPID must be configured with a real value',
        'Yudao AI bootstrap evidence is required before production release',
        'Vision OCR smoke evidence is required before production release',
        'POI manifest evidence is required before production release',
        'POI workbook evidence is required before production release'
      ]
    })
    const outputFile = path.join(rootDir, 'workbench/xicheng-yudao-release-blocker-tasks.csv')

    const result = runTaskExport([
      '--root', rootDir,
      '--release-evidence', 'tmp/xicheng-yudao-release-evidence.json',
      '--output', 'workbench/xicheng-yudao-release-blocker-tasks.csv'
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report).toMatchObject({
      artifactType: 'xicheng-yudao-release-blocker-tasks',
      ok: false,
      status: 'RELEASE_TASKS_REQUIRED',
      summary: {
        sourceEvidenceFile: releaseEvidencePath,
        outputFile,
        failedCheckCount: 5,
        taskCount: 9,
        ownerLaneCounts: {
          'platform-ops': 3,
          'app-ops': 1,
          'ai-platform': 1,
          'vision-ocr': 1,
          'poi-data': 3
        }
      }
    })

    const csv = await readFile(outputFile, 'utf8')
    expect(csv).toContain('checkName,blockerIndex,blocker,ownerLane,taskDetail,requiredEvidence,verificationCommand,taskStatus,sourceEvidenceFile')
    expect(csv).toContain(`runtime-env,1,XUNJING_APP_API_BASE_URL must be configured for production,platform-ops,Configure a non-local HTTPS APP API backend domain in the production env.,Release evidence records a non-local HTTPS appApiBaseUrl from production env.,${releaseGateCommand},TODO,${releaseEvidencePath}`)
    expect(csv).toContain(`runtime-env,2,MYSQL_PASSWORD must be configured for production,platform-ops,Configure production MySQL host credentials and profile settings.,Release gate runtime-env check passes without local host or placeholder database values.,${releaseGateCommand},TODO,${releaseEvidencePath}`)
    expect(csv).toContain(`runtime-env,3,MYSQL_HOST must not point to a local host for production,platform-ops,Configure production MySQL host credentials and profile settings.,Release gate runtime-env check passes without local host or placeholder database values.,${releaseGateCommand},TODO,${releaseEvidencePath}`)
    expect(csv).toContain(`real-wechat-app,1,WX_MINIAPP_APPID must be configured with a real value,app-ops,Configure real WeChat MP and Mini Program credentials outside Git.,Release gate real-wechat-app check passes using production secret store values.,${releaseGateCommand},TODO,${releaseEvidencePath}`)
    expect(csv).toContain(`yudao-ai-model-bootstrap,1,Yudao AI bootstrap evidence is required before production release,ai-platform,Run the Yudao AI model bootstrap against production or preprod MySQL and provide its secret-safe evidence file.,Release evidence records aiBootstrapEvidenceFile and aiBootstrapModel from YUDAO_AI_MODEL_BOOTSTRAPPED evidence.,npm run xunjing:ai:bootstrap -- --env-file /secure/path/production.env --evidence-file qa/xicheng-yudao-ai-bootstrap-evidence.json,TODO,${releaseEvidencePath}`)
    expect(csv).toContain(`vision-ocr-service,1,Vision OCR smoke evidence is required before production release,vision-ocr,Run the Xicheng OCR/vision provider smoke and provide its secret-safe evidence file.,Release evidence records visionOcrEvidenceFile and provider smoke metadata from XICHENG_VISION_OCR_SMOKE_READY evidence.,npm run xunjing:vision:smoke -- --env-file /secure/path/production.env --image-url https://your-cdn.example.com/xicheng/smoke/baitasi-test-card.jpg --evidence-file qa/xicheng-vision-ocr-smoke-evidence.json,TODO,${releaseEvidencePath}`)
    expect(csv).toContain(`xicheng-production-poi-evidence,1,POI manifest evidence is required before production release,poi-data,Generate production POI manifest evidence from the reviewed 80-row workbook.,Manifest gate outputs PRODUCTION_POI_MANIFEST_READY with review batch and source workbook hashes.,npm run xunjing:xicheng:poi:manifest:gate -- --manifest workbench/xicheng-production-pois.json --evidence-file qa/xicheng-poi-manifest-evidence.json,TODO,${releaseEvidencePath}`)
    expect(csv).toContain(`xicheng-production-poi-evidence,2,POI workbook evidence is required before production release,poi-data,Generate reviewed POI workbook evidence from 80 approved Xicheng POIs.,Workbook gate outputs XICHENG_POI_REVIEW_WORKBOOK_READY with pendingPoiTasks empty.,npm run xunjing:xicheng:poi:workbook:gate -- --workbook workbench/xicheng-production-pois.review-workbook.csv --evidence-file qa/xicheng-poi-review-workbook-evidence.json,TODO,${releaseEvidencePath}`)
    expect(csv).toContain(`xicheng-production-poi-evidence,3,POI seed SQL evidence is required before production release,poi-data,Generate and verify production POI seed SQL from the approved manifest.,Seed verify outputs PRODUCTION_POI_SEED_READY with sqlFile and sqlSha256.,npm run xunjing:xicheng:poi:seed:verify -- --sql workbench/xicheng-poi-production-seed.sql --evidence-file qa/xicheng-poi-production-seed-evidence.json,TODO,${releaseEvidencePath}`)
  })

  test('exports an empty task CSV when release evidence is ready', async () => {
    const rootDir = await createTempRoot()
    await writeJson(rootDir, 'qa/xicheng-yudao-release-evidence.json', {
      artifactType: 'xicheng-yudao-release-readiness',
      ok: true,
      status: 'PRODUCTION_READY_CANDIDATE',
      checkedAt: '2026-06-28T00:00:00.000Z',
      summary: {
        stage: 'production',
        failedChecks: 0,
        blockerCount: 0
      },
      checks: [
        {
          name: 'runtime-env',
          ok: true,
          blockers: []
        }
      ],
      blockers: []
    })

    const result = runTaskExport([
      '--root', rootDir,
      '--release-evidence', 'qa/xicheng-yudao-release-evidence.json',
      '--output', 'workbench/xicheng-yudao-release-blocker-tasks.csv'
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report).toMatchObject({
      artifactType: 'xicheng-yudao-release-blocker-tasks',
      ok: true,
      status: 'RELEASE_TASKS_READY',
      summary: {
        failedCheckCount: 0,
        taskCount: 0,
        ownerLaneCounts: {}
      }
    })
    expect(await readFile(path.join(rootDir, 'workbench/xicheng-yudao-release-blocker-tasks.csv'), 'utf8')).toBe(
      'checkName,blockerIndex,blocker,ownerLane,taskDetail,requiredEvidence,verificationCommand,taskStatus,sourceEvidenceFile\n'
    )
  })

  test('exposes the release task export through npm scripts and handoff docs', async () => {
    const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8'))
    const deployDoc = await readFile(path.resolve('docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(path.resolve('docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:yudao:release:tasks:export']).toBe(
      'node scripts/export-xicheng-yudao-release-blocker-tasks.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:yudao:release:tasks:export')
    expect(statusDoc).toContain('npm run xunjing:yudao:release:tasks:export')
  })
})
