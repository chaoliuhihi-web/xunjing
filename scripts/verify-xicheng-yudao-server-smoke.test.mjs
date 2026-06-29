import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, test } from 'vitest'

import {
  buildYudaoServerSmokeEvidence,
  checkYudaoServerHttpSmoke,
  loadYudaoServerSmokeEnv,
  resolveEvidenceFile,
  validateYudaoServerSmokeEnv
} from './verify-xicheng-yudao-server-smoke.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tempDirs = []

const env = {
  XUNJING_APP_API_BASE_URL: 'https://xunjing-api.xingheai.net',
  XUNJING_TENANT_ID: '1001'
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('Xicheng Yudao server HTTP smoke verifier', () => {
  test('calls package and public report endpoints with tenant header', async () => {
    const calls = []
    const smoke = await checkYudaoServerHttpSmoke({
      env,
      checkedAt: '2026-06-29T08:00:00.000Z',
      nowMs: (() => {
        let now = 1000
        return () => {
          now += 25
          return now
        }
      })(),
      fetchImpl: async (url, options) => {
        calls.push({ url, options })
        expect(options.headers['tenant-id']).toBe('1001')
        if (url.endsWith('/app-api/xunjing/resource/package?packageCode=XICHENG-MAP-001')) {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({
              code: 0,
              data: {
                packageCode: 'XICHENG-MAP-001',
                regionCode: 'beijing-xicheng',
                status: 'PUBLISHED'
              }
            })
          }
        }
        if (url.endsWith('/app-api/xunjing/public-report/summary?packageCode=XICHENG-MAP-001')) {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({
              code: 0,
              data: {
                packageCount: 1,
                reviewedKnowledgeCount: 84,
                mapPointCount: 80
              }
            })
          }
        }
        throw new Error(`unexpected url ${url}`)
      }
    })

    expect(calls).toHaveLength(2)
    expect(smoke).toMatchObject({
      checkedAt: '2026-06-29T08:00:00.000Z',
      baseUrl: 'https://xunjing-api.xingheai.net',
      providerSmokeHost: 'xunjing-api.xingheai.net',
      tenantId: '1001',
      packageCode: 'XICHENG-MAP-001',
      packageHttpStatus: 200,
      packageStatus: 'PUBLISHED',
      packageRegionCode: 'beijing-xicheng',
      publicReportHttpStatus: 200,
      publicReportPackageCount: 1,
      publicReportReviewedKnowledgeCount: 84,
      publicReportMapPointCount: 80,
      latencyMs: expect.any(Number)
    })
  })

  test('builds release-gate evidence without leaking secrets', () => {
    const evidence = buildYudaoServerSmokeEvidence({
      env: {
        ...env,
        INTERNAL_AUTH_TOKEN: 'prod-internal-auth-token'
      },
      providerSmoke: {
        checkedAt: '2026-06-29T08:00:00.000Z',
        baseUrl: 'https://xunjing-api.xingheai.net',
        providerSmokeHost: 'xunjing-api.xingheai.net',
        tenantId: '1001',
        packageCode: 'XICHENG-MAP-001',
        packageHttpStatus: 200,
        packageStatus: 'PUBLISHED',
        packageRegionCode: 'beijing-xicheng',
        publicReportHttpStatus: 200,
        publicReportPackageCount: 1,
        publicReportReviewedKnowledgeCount: 84,
        publicReportMapPointCount: 80,
        latencyMs: 50
      },
      checkedAt: '2026-06-29T08:00:00.000Z'
    })

    expect(evidence).toMatchObject({
      artifactType: 'xicheng-yudao-server-smoke',
      ok: true,
      status: 'XICHENG_YUDAO_SERVER_SMOKE_READY',
      summary: {
        baseUrl: 'https://xunjing-api.xingheai.net',
        providerSmokeHost: 'xunjing-api.xingheai.net',
        tenantId: '1001',
        packageCode: 'XICHENG-MAP-001',
        packageHttpStatus: 200,
        publicReportHttpStatus: 200,
        publicReportMapPointCount: 80
      },
      checks: [
        { name: 'https-backend-domain', ok: true, blockers: [] },
        { name: 'tenant-header', ok: true, blockers: [] },
        { name: 'resource-package-endpoint', ok: true, blockers: [] },
        { name: 'public-report-endpoint', ok: true, blockers: [] },
        { name: 'secret-redaction', ok: true, blockers: [] }
      ],
      blockers: []
    })
    expect(JSON.stringify(evidence)).not.toContain('prod-internal-auth-token')
  })

  test('rejects local or placeholder backend domains and incomplete smoke results', () => {
    expect(() => validateYudaoServerSmokeEnv({
      ...env,
      XUNJING_APP_API_BASE_URL: 'http://127.0.0.1:48080'
    })).toThrow('XUNJING_APP_API_BASE_URL must be a non-local HTTPS URL')
    expect(() => validateYudaoServerSmokeEnv({
      ...env,
      XUNJING_APP_API_BASE_URL: 'https://your-production-domain/'
    })).toThrow('XUNJING_APP_API_BASE_URL must be configured with a real value')
    expect(() => validateYudaoServerSmokeEnv({
      ...env,
      XUNJING_TENANT_ID: ''
    })).toThrow('XUNJING_TENANT_ID must be configured with a real value')
    expect(() => buildYudaoServerSmokeEvidence({
      env,
      providerSmoke: {
        packageHttpStatus: 200,
        publicReportHttpStatus: 200,
        publicReportMapPointCount: 12
      }
    })).toThrow('Yudao server smoke must prove the Xicheng package and public report endpoints are ready')
  })

  test('loads env file values before applying CLI overrides', async () => {
    const tempDir = await mkdtemp(resolve(os.tmpdir(), 'xicheng-yudao-server-smoke-'))
    tempDirs.push(tempDir)
    const envFile = resolve(tempDir, 'production.env')
    await writeFile(envFile, [
      'XUNJING_APP_API_BASE_URL=https://file-api.xingheai.net',
      'XUNJING_TENANT_ID=1001'
    ].join('\n'))

    await expect(loadYudaoServerSmokeEnv({
      args: ['--env-file', envFile],
      processEnv: {}
    })).resolves.toMatchObject({
      XUNJING_APP_API_BASE_URL: 'https://file-api.xingheai.net',
      XUNJING_TENANT_ID: '1001'
    })

    await expect(loadYudaoServerSmokeEnv({
      args: ['--env-file', envFile, '--base-url', 'https://cli-api.xingheai.net', '--tenant-id', '2002'],
      processEnv: {}
    })).resolves.toMatchObject({
      XUNJING_APP_API_BASE_URL: 'https://cli-api.xingheai.net',
      XUNJING_TENANT_ID: '2002'
    })
  })

  test('keeps evidence under qa tmp or workbench and exposes npm script/docs', async () => {
    expect(resolveEvidenceFile(rootDir, 'qa/xicheng-yudao-server-smoke-evidence.json')).toBe(
      resolve(rootDir, 'qa/xicheng-yudao-server-smoke-evidence.json')
    )
    expect(() => resolveEvidenceFile(rootDir, 'ops/yudao-server-smoke.json')).toThrow(
      'evidence file must be under qa/, tmp/ or workbench/'
    )

    const packageJson = JSON.parse(await readFile(resolve(rootDir, 'package.json'), 'utf8'))
    const deployDoc = await readFile(resolve(rootDir, 'docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(resolve(rootDir, 'docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:yudao:server:smoke']).toBe(
      'node scripts/verify-xicheng-yudao-server-smoke.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:yudao:server:smoke')
    expect(statusDoc).toContain('npm run xunjing:yudao:server:smoke')
  })
})
