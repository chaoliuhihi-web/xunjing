import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import {
  buildQdrantSmokeEvidence,
  checkQdrantProviderSmoke,
  resolveEvidenceFile,
  validateQdrantEnv
} from './verify-xicheng-qdrant-smoke.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const env = {
  QDRANT_URL: 'https://qdrant.xingheai.net',
  QDRANT_API_KEY: 'prod-qdrant-api-key',
  QDRANT_TEXT_COLLECTION: 'xinghe_xunjing_text_production',
  QDRANT_IMAGE_COLLECTION: 'xinghe_xunjing_image_production'
}

describe('Xicheng Qdrant smoke verifier', () => {
  test('rejects placeholders and local endpoints unless explicitly allowed for local smoke', () => {
    expect(() => validateQdrantEnv({
      ...env,
      QDRANT_API_KEY: 'replace-with-qdrant-key'
    })).toThrow('QDRANT_API_KEY must be configured with a real value')

    expect(() => validateQdrantEnv({
      ...env,
      QDRANT_URL: 'http://127.0.0.1:36333'
    })).toThrow('QDRANT_URL must be a non-local HTTPS URL')

    expect(() => validateQdrantEnv({
      ...env,
      QDRANT_URL: 'http://127.0.0.1:36333',
      QDRANT_API_KEY: 'local-qdrant-key'
    }, { allowLocal: true })).not.toThrow()
  })

  test('checks text and image collections through the Qdrant REST API without leaking the API key', async () => {
    const calls = []
    const smoke = await checkQdrantProviderSmoke({
      env,
      checkedAt: '2026-06-29T06:30:00.000Z',
      nowMs: (() => {
        let now = 1000
        return () => {
          now += 25
          return now
        }
      })(),
      fetchImpl: async (url, options) => {
        calls.push({ url, options })
        expect(options.headers['api-key']).toBe(env.QDRANT_API_KEY)
        return {
          ok: true,
          status: 200,
          json: async () => ({
            result: {
              status: 'green',
              points_count: url.includes('image') ? 84 : 128,
              vectors_count: url.includes('image') ? 84 : 128
            }
          })
        }
      }
    })

    expect(calls.map((call) => new URL(call.url).pathname)).toEqual([
      '/collections/xinghe_xunjing_text_production',
      '/collections/xinghe_xunjing_image_production'
    ])
    expect(smoke).toMatchObject({
      checkedAt: '2026-06-29T06:30:00.000Z',
      providerSmokeHost: 'qdrant.xingheai.net',
      textCollection: 'xinghe_xunjing_text_production',
      imageCollection: 'xinghe_xunjing_image_production',
      textCollectionHttpStatus: 200,
      imageCollectionHttpStatus: 200,
      textCollectionStatus: 'green',
      imageCollectionStatus: 'green',
      textCollectionPointsCount: 128,
      imageCollectionPointsCount: 84,
      latencyMs: expect.any(Number)
    })
    expect(JSON.stringify(smoke)).not.toContain(env.QDRANT_API_KEY)
  })

  test('builds release-gate evidence that proves Qdrant collections are reachable and redacts secrets', () => {
    const evidence = buildQdrantSmokeEvidence({
      env,
      providerSmoke: {
        checkedAt: '2026-06-29T06:30:00.000Z',
        providerSmokeHost: 'qdrant.xingheai.net',
        providerSmokeEndpointPath: '/collections',
        textCollection: 'xinghe_xunjing_text_production',
        imageCollection: 'xinghe_xunjing_image_production',
        textCollectionHttpStatus: 200,
        imageCollectionHttpStatus: 200,
        textCollectionStatus: 'green',
        imageCollectionStatus: 'green',
        textCollectionPointsCount: 128,
        imageCollectionPointsCount: 84,
        latencyMs: 50
      },
      checkedAt: '2026-06-29T06:30:00.000Z'
    })

    expect(evidence).toMatchObject({
      artifactType: 'xicheng-qdrant-smoke',
      ok: true,
      status: 'XICHENG_QDRANT_SMOKE_READY',
      summary: {
        providerSmokeHost: 'qdrant.xingheai.net',
        providerSmokeEndpointPath: '/collections',
        textCollection: 'xinghe_xunjing_text_production',
        imageCollection: 'xinghe_xunjing_image_production',
        textCollectionHttpStatus: 200,
        imageCollectionHttpStatus: 200,
        textCollectionStatus: 'green',
        imageCollectionStatus: 'green'
      },
      checks: [
        { name: 'qdrant-request', ok: true, blockers: [] },
        { name: 'qdrant-text-collection', ok: true, blockers: [] },
        { name: 'qdrant-image-collection', ok: true, blockers: [] },
        { name: 'secret-redaction', ok: true, blockers: [] }
      ],
      blockers: []
    })
    expect(JSON.stringify(evidence)).not.toContain(env.QDRANT_API_KEY)
  })

  test('keeps evidence under qa tmp or workbench and exposes npm script/docs', async () => {
    expect(resolveEvidenceFile(rootDir, 'qa/xicheng-qdrant-smoke-evidence.json')).toBe(
      resolve(rootDir, 'qa/xicheng-qdrant-smoke-evidence.json')
    )
    expect(() => resolveEvidenceFile(rootDir, 'ops/qdrant-evidence.json')).toThrow(
      'evidence file must be under qa/, tmp/ or workbench/'
    )

    const packageJson = JSON.parse(await readFile(resolve(rootDir, 'package.json'), 'utf8'))
    const deployDoc = await readFile(resolve(rootDir, 'docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(resolve(rootDir, 'docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:qdrant:smoke']).toBe(
      'node scripts/verify-xicheng-qdrant-smoke.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:qdrant:smoke')
    expect(statusDoc).toContain('npm run xunjing:qdrant:smoke')
  })
})
