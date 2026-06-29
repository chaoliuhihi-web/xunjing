import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import { buildYudaoServer } from './build-yudao-server.mjs'

const tempDirs = []

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-yudao-server-build-'))
  tempDirs.push(rootDir)
  await mkdir(path.join(rootDir, 'backend/yudao/yudao-server/target'), { recursive: true })
  await writeFile(path.join(rootDir, 'backend/yudao/pom.xml'), '<project />\n')
  return rootDir
}

function runGit(rootDir, args) {
  const result = spawnSync('git', args, {
    cwd: rootDir,
    encoding: 'utf8'
  })
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`)
  }
  return result.stdout.trim()
}

function initCleanGitRepo(rootDir) {
  runGit(rootDir, ['init'])
  runGit(rootDir, ['checkout', '-b', 'feature/xicheng-p0'])
  runGit(rootDir, ['config', 'user.name', 'Yudao Build Test'])
  runGit(rootDir, ['config', 'user.email', 'yudao-build@example.com'])
  runGit(rootDir, ['add', '.'])
  runGit(rootDir, ['commit', '-m', 'fixture'])
  return runGit(rootDir, ['rev-parse', 'HEAD'])
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('Yudao server build wrapper', () => {
  test('builds the Yudao server jar and writes secret-safe evidence', async () => {
    const rootDir = await createTempRoot()
    const gitCommit = initCleanGitRepo(rootDir)
    const jarFile = path.join(rootDir, 'backend/yudao/yudao-server/target/yudao-server.jar')
    const jarContent = 'deployable-yudao-jar'
    const spawnCalls = []

    const report = await buildYudaoServer({
      rootDir,
      evidenceFile: 'qa/xicheng-yudao-server-build-evidence.json',
      spawnImpl: (command, args, options) => {
        spawnCalls.push({ command, args, cwd: options.cwd, maxBuffer: options.maxBuffer })
        mkdirSync(path.dirname(jarFile), { recursive: true })
        writeFileSync(jarFile, jarContent)
        return { status: 0, stdout: 'BUILD SUCCESS', stderr: '' }
      },
      checkedAt: '2026-06-28T12:00:00.000Z'
    })

    expect(spawnCalls).toEqual([{
      command: 'mvn',
      args: ['--batch-mode', '--no-transfer-progress', '-pl', 'yudao-server', '-am', '-DskipTests', 'package'],
      cwd: path.join(rootDir, 'backend/yudao'),
      maxBuffer: 128 * 1024 * 1024
    }])
    expect(report).toMatchObject({
      artifactType: 'xicheng-yudao-server-build',
      ok: true,
      status: 'YUDAO_SERVER_JAR_BUILT',
      summary: {
        buildMethod: 'mvn',
        backendDir: path.join(rootDir, 'backend/yudao'),
        gitAvailable: true,
        gitBranch: 'feature/xicheng-p0',
        gitCommit,
        gitDirty: false,
        gitDirtyFileCount: 0,
        jarFile,
        jarSizeBytes: Buffer.byteLength(jarContent),
        jarSha256: sha256(jarContent),
        testsIncluded: false
      }
    })

    const evidence = JSON.parse(await readFile(
      path.join(rootDir, 'qa/xicheng-yudao-server-build-evidence.json'),
      'utf8'
    ))
    expect(evidence.summary.jarSha256).toBe(sha256(jarContent))
    expect(evidence.summary.gitCommit).toBe(gitCommit)
  })

  test('falls back to Docker Maven builder when local Maven is unavailable in auto mode', async () => {
    const rootDir = await createTempRoot()
    const jarFile = path.join(rootDir, 'backend/yudao/yudao-server/target/yudao-server.jar')
    const jarContent = 'docker-built-yudao-jar'
    const spawnCalls = []

    const report = await buildYudaoServer({
      rootDir,
      evidenceFile: 'qa/xicheng-yudao-server-build-evidence.json',
      spawnImpl: (command, args, options) => {
        spawnCalls.push({ command, args, cwd: options.cwd, maxBuffer: options.maxBuffer })
        if (command === 'mvn') {
          return {
            status: null,
            error: Object.assign(new Error('spawnSync mvn ENOENT'), { code: 'ENOENT' }),
            stdout: '',
            stderr: ''
          }
        }
        mkdirSync(path.dirname(jarFile), { recursive: true })
        writeFileSync(jarFile, jarContent)
        return { status: 0, stdout: 'BUILD SUCCESS', stderr: '' }
      },
      checkedAt: '2026-06-28T12:00:00.000Z'
    })

    expect(spawnCalls).toEqual([
      {
        command: 'mvn',
        args: ['--batch-mode', '--no-transfer-progress', '-pl', 'yudao-server', '-am', '-DskipTests', 'package'],
        cwd: path.join(rootDir, 'backend/yudao'),
        maxBuffer: 128 * 1024 * 1024
      },
      {
        command: 'docker',
        args: [
          'run',
          '--rm',
          '-v',
          `${path.join(rootDir, 'backend/yudao')}:/workspace`,
          '-w',
          '/workspace',
          'maven:3.9.9-eclipse-temurin-17',
          'mvn',
          '--batch-mode',
          '--no-transfer-progress',
          '-pl',
          'yudao-server',
          '-am',
          '-DskipTests',
          'package'
        ],
        cwd: rootDir,
        maxBuffer: 128 * 1024 * 1024
      }
    ])
    expect(report).toMatchObject({
      artifactType: 'xicheng-yudao-server-build',
      ok: true,
      status: 'YUDAO_SERVER_JAR_BUILT',
      summary: {
        buildMethod: 'docker',
        dockerCommand: 'docker',
        dockerImage: 'maven:3.9.9-eclipse-temurin-17',
        jarFile,
        jarSizeBytes: Buffer.byteLength(jarContent),
        jarSha256: sha256(jarContent)
      }
    })
  })

  test('fails closed when Maven does not produce a non-empty jar', async () => {
    const rootDir = await createTempRoot()

    await expect(buildYudaoServer({
      rootDir,
      spawnImpl: () => ({ status: 0, stdout: 'BUILD SUCCESS', stderr: '' })
    })).rejects.toThrow('Yudao server jar is missing or empty after build')
  })

  test('reports a clear prerequisite error when Maven is unavailable', async () => {
    const rootDir = await createTempRoot()

    await expect(buildYudaoServer({
      rootDir,
      builder: 'mvn',
      spawnImpl: () => ({
        status: null,
        error: Object.assign(new Error('spawnSync mvn ENOENT'), { code: 'ENOENT' }),
        stdout: '',
        stderr: ''
      })
    })).rejects.toThrow('Maven CLI is required to build Yudao server')
  })

  test('is exposed through npm scripts, blocker tasks and deployment docs', async () => {
    const rootDir = path.resolve('.')
    const packageJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'))
    const taskExportScript = await readFile(path.join(rootDir, 'scripts/export-xicheng-yudao-release-blocker-tasks.mjs'), 'utf8')
    const deployDoc = await readFile(path.join(rootDir, 'docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(path.join(rootDir, 'docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:yudao:server:build']).toBe('node scripts/build-yudao-server.mjs')
    expect(taskExportScript).toContain('npm run xunjing:yudao:server:build')
    expect(deployDoc).toContain('npm run xunjing:yudao:server:build')
    expect(deployDoc).toContain('--builder docker')
    expect(deployDoc).toContain('buildMethod')
    expect(statusDoc).toContain('npm run xunjing:yudao:server:build')
    expect(statusDoc).toContain('--builder docker')
    expect(statusDoc).toContain('buildMethod')
  })
})
