import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import {
  buildEmbeddingSmokeEvidence,
  buildEmbeddingSmokeRequest,
  checkEmbeddingProviderSmoke,
  resolveEmbeddingsUrl,
  resolveEvidenceFile,
  validateEmbeddingEnv
} from './verify-xicheng-embedding-smoke.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const env = {
  QWEN_BASE_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  DASHSCOPE_API_KEY: 'sk-dashscope-embedding-fixture-key',
  SPRING_AI_MODEL_EMBEDDING: 'dashscope',
  QWEN_EMBEDDING_MODEL: 'text-embedding-v3',
  DASHSCOPE_EMBEDDING_ENABLED: 'true'
}

describe('Xicheng embedding provider smoke verifier', () => {
  test('builds an OpenAI-compatible embeddings request without leaking keys', () => {
    const request = buildEmbeddingSmokeRequest({ env, input: 'xicheng embedding smoke' })
    const body = JSON.parse(request.options.body)

    expect(request.url).toBe('https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings')
    expect(request.options.method).toBe('POST')
    expect(request.options.headers.Authorization).toBe(`Bearer ${env.DASHSCOPE_API_KEY}`)
    expect(body.model).toBe('text-embedding-v3')
    expect(body.input).toEqual(['xicheng embedding smoke'])
    expect(request.url).not.toContain(env.DASHSCOPE_API_KEY)
    expect(request.options.body).not.toContain(env.DASHSCOPE_API_KEY)
  })

  test('calls the configured provider and records secret-safe embedding metadata', async () => {
    const smoke = await checkEmbeddingProviderSmoke({
      env,
      input: 'xicheng embedding smoke',
      checkedAt: '2026-06-29T07:30:00.000Z',
      nowMs: (() => {
        let now = 1000
        return () => {
          now += 33
          return now
        }
      })(),
      fetchImpl: async (url, options) => {
        expect(url).toBe('https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings')
        expect(options.headers.Authorization).toBe(`Bearer ${env.DASHSCOPE_API_KEY}`)
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            data: [
              {
                embedding: [0.11, -0.22, 0.33, 0.44]
              }
            ]
          })
        }
      }
    })

    expect(smoke).toMatchObject({
      checkedAt: '2026-06-29T07:30:00.000Z',
      providerSmokeHost: 'dashscope.aliyuncs.com',
      providerSmokeEndpointPath: '/compatible-mode/v1/embeddings',
      model: 'text-embedding-v3',
      httpStatus: 200,
      vectorDimensions: 4,
      finiteValueCount: 4,
      latencyMs: expect.any(Number)
    })
    expect(JSON.stringify(smoke)).not.toContain(env.DASHSCOPE_API_KEY)
  })

  test('builds release-gate evidence that proves real embedding generation and redacts secrets', () => {
    const evidence = buildEmbeddingSmokeEvidence({
      env,
      providerSmoke: {
        checkedAt: '2026-06-29T07:30:00.000Z',
        providerSmokeHost: 'dashscope.aliyuncs.com',
        providerSmokeEndpointPath: '/compatible-mode/v1/embeddings',
        model: 'text-embedding-v3',
        httpStatus: 200,
        vectorDimensions: 4,
        finiteValueCount: 4,
        latencyMs: 66
      },
      checkedAt: '2026-06-29T07:30:00.000Z'
    })

    expect(evidence).toMatchObject({
      artifactType: 'xicheng-embedding-smoke',
      ok: true,
      status: 'XICHENG_EMBEDDING_SMOKE_READY',
      summary: {
        providerSmokeHost: 'dashscope.aliyuncs.com',
        providerSmokeEndpointPath: '/compatible-mode/v1/embeddings',
        model: 'text-embedding-v3',
        providerSmokeHttpStatus: 200,
        vectorDimensions: 4,
        finiteValueCount: 4
      },
      checks: [
        { name: 'embedding-provider-request', ok: true, blockers: [] },
        { name: 'embedding-provider-smoke', ok: true, blockers: [] },
        { name: 'secret-redaction', ok: true, blockers: [] }
      ],
      blockers: []
    })
    expect(JSON.stringify(evidence)).not.toContain(env.DASHSCOPE_API_KEY)
  })

  test('rejects placeholder env local endpoints and missing vectors', () => {
    expect(() => validateEmbeddingEnv({
      ...env,
      DASHSCOPE_API_KEY: 'replace-with-real-key'
    })).toThrow('DASHSCOPE_API_KEY must be configured with a real value')
    expect(() => validateEmbeddingEnv({
      ...env,
      QWEN_BASE_URL: 'http://127.0.0.1:48080/compatible-mode/v1'
    })).toThrow('QWEN_BASE_URL must be a non-local HTTPS URL')
    expect(() => validateEmbeddingEnv({
      ...env,
      DASHSCOPE_EMBEDDING_ENABLED: 'false'
    })).toThrow('DASHSCOPE_EMBEDDING_ENABLED must be true for embedding smoke')
    expect(() => buildEmbeddingSmokeEvidence({
      env,
      providerSmoke: {
        httpStatus: 200,
        vectorDimensions: 0,
        finiteValueCount: 0
      }
    })).toThrow('Embedding provider smoke must return a non-empty numeric vector')
  })

  test('keeps evidence under qa tmp or workbench and exposes npm script/docs', async () => {
    expect(resolveEmbeddingsUrl('https://dashscope.aliyuncs.com/compatible-mode/v1')).toBe(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings'
    )
    expect(resolveEvidenceFile(rootDir, 'qa/xicheng-embedding-smoke-evidence.json')).toBe(
      resolve(rootDir, 'qa/xicheng-embedding-smoke-evidence.json')
    )
    expect(() => resolveEvidenceFile(rootDir, 'ops/embedding-evidence.json')).toThrow(
      'evidence file must be under qa/, tmp/ or workbench/'
    )

    const packageJson = JSON.parse(await readFile(resolve(rootDir, 'package.json'), 'utf8'))
    const deployDoc = await readFile(resolve(rootDir, 'docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(resolve(rootDir, 'docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:embedding:smoke']).toBe(
      'node scripts/verify-xicheng-embedding-smoke.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:embedding:smoke')
    expect(statusDoc).toContain('npm run xunjing:embedding:smoke')
  })
})
