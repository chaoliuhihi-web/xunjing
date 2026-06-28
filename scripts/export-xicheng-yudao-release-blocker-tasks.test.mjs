import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []

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
        failedChecks: 3,
        blockerCount: 4
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
          name: 'xicheng-production-poi-evidence',
          ok: false,
          blockers: [
            'POI workbook evidence is required before production release'
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
        failedCheckCount: 3,
        taskCount: 5,
        ownerLaneCounts: {
          'platform-ops': 3,
          'app-ops': 1,
          'poi-data': 1
        }
      }
    })

    const csv = await readFile(outputFile, 'utf8')
    expect(csv).toContain('checkName,blockerIndex,blocker,ownerLane,taskStatus,sourceEvidenceFile')
    expect(csv).toContain(`runtime-env,1,XUNJING_APP_API_BASE_URL must be configured for production,platform-ops,TODO,${releaseEvidencePath}`)
    expect(csv).toContain(`runtime-env,2,MYSQL_PASSWORD must be configured for production,platform-ops,TODO,${releaseEvidencePath}`)
    expect(csv).toContain(`runtime-env,3,MYSQL_HOST must not point to a local host for production,platform-ops,TODO,${releaseEvidencePath}`)
    expect(csv).toContain(`real-wechat-app,1,WX_MINIAPP_APPID must be configured with a real value,app-ops,TODO,${releaseEvidencePath}`)
    expect(csv).toContain(`xicheng-production-poi-evidence,1,POI workbook evidence is required before production release,poi-data,TODO,${releaseEvidencePath}`)
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
      'checkName,blockerIndex,blocker,ownerLane,taskStatus,sourceEvidenceFile\n'
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
