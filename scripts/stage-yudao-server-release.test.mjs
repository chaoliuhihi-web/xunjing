import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import { stageYudaoServerRelease } from './stage-yudao-server-release.mjs'

const tempDirs = []

async function makeRoot() {
  const rootDir = await fsMkdtemp()
  tempDirs.push(rootDir)
  await mkdir(path.join(rootDir, 'backend/yudao/yudao-server/target'), { recursive: true })
  await mkdir(path.join(rootDir, 'backend/yudao/sql/mysql'), { recursive: true })
  await mkdir(path.join(rootDir, 'ops/mysql-init'), { recursive: true })
  await mkdir(path.join(rootDir, 'qa'), { recursive: true })
  await writeFile(path.join(rootDir, 'backend/yudao/yudao-server/target/yudao-server.jar'), 'jar')
  await writeFile(path.join(rootDir, 'backend/yudao/sql/mysql/xunjing-module.sql'), 'select 1;\n')
  await writeFile(path.join(rootDir, 'ops/mysql-init/xunjing-init.sh'), '#!/bin/sh\n')
  await writeFile(path.join(rootDir, 'qa/xicheng-yudao-server-build-evidence.json'), '{"ok":true}\n')
  return rootDir
}

async function fsMkdtemp() {
  const { mkdtemp } = await import('node:fs/promises')
  return mkdtemp(path.join(os.tmpdir(), 'xicheng-yudao-stage-'))
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('Yudao server release staging', () => {
  test('creates the server compose release layout without placing jar at release root', async () => {
    const rootDir = await makeRoot()
    const outputDir = path.join(rootDir, 'workbench/staged-yudao-release')

    const report = await stageYudaoServerRelease({
      rootDir,
      outputDir,
      releaseId: '20260702-080000-test'
    })

    expect(report).toMatchObject({
      artifactType: 'xicheng-yudao-server-release-stage',
      ok: true,
      status: 'YUDAO_SERVER_RELEASE_STAGED',
      summary: {
        releaseId: '20260702-080000-test',
        outputDir,
        jarFile: path.join(outputDir, 'app/yudao-server.jar'),
        buildEvidenceFile: path.join(outputDir, 'xicheng-yudao-server-build-evidence.json'),
        mysqlInitDir: path.join(outputDir, 'ops/mysql-init'),
        sqlDir: path.join(outputDir, 'sql/mysql')
      }
    })
    await expect(stat(path.join(outputDir, 'app/yudao-server.jar'))).resolves.toMatchObject({ size: 3 })
    await expect(stat(path.join(outputDir, 'yudao-server.jar'))).rejects.toThrow()
    expect(await readFile(path.join(outputDir, 'sql/mysql/xunjing-module.sql'), 'utf8')).toBe('select 1;\n')
    expect(await readFile(path.join(outputDir, 'ops/mysql-init/xunjing-init.sh'), 'utf8')).toBe('#!/bin/sh\n')
  })

  test('fails closed when the deployable jar is missing', async () => {
    const rootDir = await makeRoot()
    await rm(path.join(rootDir, 'backend/yudao/yudao-server/target/yudao-server.jar'))

    await expect(stageYudaoServerRelease({
      rootDir,
      outputDir: path.join(rootDir, 'workbench/staged-yudao-release')
    })).rejects.toThrow('Yudao server jar is missing or empty')
  })

  test('fails closed when SQL or MySQL init release inputs are missing', async () => {
    const rootDir = await makeRoot()
    await rm(path.join(rootDir, 'ops/mysql-init'), { recursive: true, force: true })

    await expect(stageYudaoServerRelease({
      rootDir,
      outputDir: path.join(rootDir, 'workbench/staged-yudao-release')
    })).rejects.toThrow('ops/mysql-init directory is missing')
  })

  test('is exposed through npm scripts and deployment docs', async () => {
    const rootDir = path.resolve('.')
    const packageJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'))
    const deployDoc = await readFile(path.join(rootDir, 'docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(path.join(rootDir, 'docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:yudao:server:stage']).toBe('node scripts/stage-yudao-server-release.mjs')
    expect(deployDoc).toContain('npm run xunjing:yudao:server:stage')
    expect(deployDoc).toContain('app/yudao-server.jar')
    expect(deployDoc).toContain('ops/mysql-init')
    expect(statusDoc).toContain('npm run xunjing:yudao:server:stage')
    expect(statusDoc).toContain('YUDAO_SERVER_RELEASE_STAGED')
  })
})
