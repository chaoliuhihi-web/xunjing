import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function readText(path) {
  return await readFile(resolve(rootDir, path), 'utf8')
}

describe('AI Shijing P0 backend loop verifier', () => {
  test('exposes one backend-only verification command for the core loop objective', async () => {
    const packageJson = JSON.parse(await readText('package.json'))
    const verifier = await readText('scripts/verify-ai-shijing-p0-backend-loop.mjs')

    expect(packageJson.scripts['xunjing:ai-shijing:p0:verify'])
      .toBe('node scripts/verify-ai-shijing-p0-backend-loop.mjs')
    expect(verifier).toContain('artifactType: \'ai-shijing-p0-backend-loop\'')
    expect(verifier).toContain('verifyBackendLoop')
    expect(verifier).toContain('requirementId: \'vision-ocr-status\'')
    expect(verifier).toContain('requirementId: \'scene-engine-context\'')
    expect(verifier).toContain('requirementId: \'continuous-memory\'')
    expect(verifier).toContain('requirementId: \'agent-decision-queue\'')
    expect(verifier).toContain('requirementId: \'knowledge-graph\'')
    expect(verifier).toContain('requirementId: \'service-handoff-tasks\'')
    expect(verifier).toContain('requirementId: \'no-ui-scope\'')
    expect(verifier).toContain('requirementId: \'no-fake-production-evidence\'')
  })

  test('exposes one backend-only gate command without replacing production preflight', async () => {
    const packageJson = JSON.parse(await readText('package.json'))
    const gate = await readText('scripts/run-ai-shijing-p0-backend-gate.mjs')

    expect(packageJson.scripts['xunjing:ai-shijing:p0:gate'])
      .toBe('node scripts/run-ai-shijing-p0-backend-gate.mjs')
    expect(gate).toContain('artifactType: \'ai-shijing-p0-backend-gate\'')
    expect(gate).toContain('npm run xunjing:ai-shijing:p0:verify')
    expect(gate).toContain('scripts/ai-shijing-p0-backend-loop.test.mjs')
    expect(gate).toContain('scripts/xunjing-app-api-contract.test.mjs')
    expect(gate).toContain('scripts/xicheng-backend-launch-readiness.test.mjs')
    expect(gate).toContain('scripts/verify-xunjing-platform-readiness.test.mjs')
    expect(gate).toContain('npm run xunjing:platform:verify:static')
    expect(gate).toContain('doesNotReplaceProductionPreflight: true')
    expect(gate).toContain('npm run xunjing:yudao:release:preflight')
    expect(gate).toContain('javaRuntimeAvailable')
    expect(gate).toContain('mavenAvailable')
    expect(gate).toContain('keytoolAvailable')
    expect(gate).toContain('javaVerificationPolicy')
  })
})
