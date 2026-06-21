import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const execFileAsync = promisify(execFile)
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function git(args) {
  const { stdout } = await execFileAsync('git', args, { cwd: rootDir })
  return stdout.trim()
}

describe('Yudao runtime secret policy', () => {
  test('keeps profile-specific runtime YAML with local secrets out of git', async () => {
    const sensitiveProfiles = [
      'backend/yudao/yudao-server/src/main/resources/application-local.yaml',
      'backend/yudao/yudao-server/src/main/resources/application-dev.yaml',
      'backend/yudao/yudao-server/src/main/resources/application-prod.yaml'
    ]

    for (const profile of sensitiveProfiles) {
      await expect(git(['check-ignore', profile])).resolves.toBe(profile)
    }
  })

  test('documents profile-specific YAML as local-only secret-bearing files', async () => {
    const deployDoc = await readFile(resolve(rootDir, 'docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')

    expect(deployDoc).toContain('application-local.yaml')
    expect(deployDoc).toContain('application-dev.yaml')
    expect(deployDoc).toContain('不得提交到 Git')
  })
})
