import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import {
  buildObjectStorageSmokeEvidence,
  buildS3SignedRequest,
  checkObjectStorageProviderSmoke,
  resolveEvidenceFile,
  resolveObjectStorageRegion,
  validateObjectStorageEnv
} from './verify-xicheng-object-storage-smoke.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const env = {
  OSS_ENDPOINT: 'https://oss-cn-beijing.aliyuncs.com',
  OSS_BUCKET: 'xinghe-xunjing-prod',
  OSS_PREFIX: 'xinghe-xunjing/production/',
  OSS_ACCESS_KEY: 'prod-oss-access-key',
  OSS_SECRET_KEY: 'prod-oss-secret-key'
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

describe('Xicheng object storage smoke verifier', () => {
  test('builds a signed S3-compatible path-style request without leaking secrets', () => {
    const request = buildS3SignedRequest({
      env: { ...env, OSS_REGION: 'cn-north-1', OSS_PATH_STYLE: 'true' },
      method: 'PUT',
      objectKey: 'xinghe-xunjing/production/release-smoke/xicheng-storage.txt',
      body: 'xicheng object storage smoke',
      amzDate: '20260628T080000Z'
    })

    expect(request.url).toBe(
      'https://oss-cn-beijing.aliyuncs.com/xinghe-xunjing-prod/xinghe-xunjing/production/release-smoke/xicheng-storage.txt'
    )
    expect(request.options.method).toBe('PUT')
    expect(request.options.headers['x-amz-content-sha256']).toBe(sha256('xicheng object storage smoke'))
    expect(request.options.headers.Authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=/)
    expect(request.options.headers.Authorization).toContain(
      'Credential=prod-oss-access-key/20260628/cn-north-1/s3/aws4_request'
    )
    expect(request.options.headers.Authorization).not.toContain(env.OSS_SECRET_KEY)
  })

  test('calls object storage with PUT GET DELETE and records secret-safe metadata', async () => {
    const calls = []
    const smoke = await checkObjectStorageProviderSmoke({
      env,
      objectKey: 'xinghe-xunjing/production/release-smoke/xicheng-storage.txt',
      body: 'xicheng object storage smoke',
      checkedAt: '2026-06-28T08:00:00.000Z',
      amzDate: '20260628T080000Z',
      nowMs: (() => {
        let now = 1000
        return () => {
          now += 25
          return now
        }
      })(),
      fetchImpl: async (url, options) => {
        calls.push({ url, options })
        if (options.method === 'PUT') {
          return { ok: true, status: 200, text: async () => '' }
        }
        if (options.method === 'GET') {
          return { ok: true, status: 200, text: async () => 'xicheng object storage smoke' }
        }
        if (options.method === 'DELETE') {
          return { ok: true, status: 204, text: async () => '' }
        }
        throw new Error(`unexpected method ${options.method}`)
      }
    })

    expect(calls.map((call) => call.options.method)).toEqual(['PUT', 'GET', 'DELETE'])
    expect(smoke).toMatchObject({
      checkedAt: '2026-06-28T08:00:00.000Z',
      endpointHost: 'oss-cn-beijing.aliyuncs.com',
      requestHost: 'oss-cn-beijing.aliyuncs.com',
      bucket: 'xinghe-xunjing-prod',
      prefix: 'xinghe-xunjing/production/',
      objectKey: 'xinghe-xunjing/production/release-smoke/xicheng-storage.txt',
      region: 'cn-beijing',
      pathStyle: true,
      putHttpStatus: 200,
      getHttpStatus: 200,
      deleteHttpStatus: 204,
      readBackMatches: true,
      deleted: true,
      latencyMs: expect.any(Number)
    })
  })

  test('builds release-gate evidence that proves write read delete and redacts secrets', () => {
    const evidence = buildObjectStorageSmokeEvidence({
      env,
      providerSmoke: {
        checkedAt: '2026-06-28T08:00:00.000Z',
        endpointHost: 'oss-cn-beijing.aliyuncs.com',
        requestHost: 'oss-cn-beijing.aliyuncs.com',
        bucket: 'xinghe-xunjing-prod',
        prefix: 'xinghe-xunjing/production/',
        objectKey: 'xinghe-xunjing/production/release-smoke/xicheng-storage.txt',
        objectKeySha256: sha256('xinghe-xunjing/production/release-smoke/xicheng-storage.txt'),
        region: 'cn-beijing',
        pathStyle: true,
        putHttpStatus: 200,
        getHttpStatus: 200,
        deleteHttpStatus: 204,
        readBackMatches: true,
        deleted: true,
        contentSha256: sha256('xicheng object storage smoke'),
        latencyMs: 75
      },
      checkedAt: '2026-06-28T08:00:00.000Z'
    })

    expect(evidence).toMatchObject({
      artifactType: 'xicheng-object-storage-smoke',
      ok: true,
      status: 'XICHENG_OBJECT_STORAGE_SMOKE_READY',
      summary: {
        endpointHost: 'oss-cn-beijing.aliyuncs.com',
        requestHost: 'oss-cn-beijing.aliyuncs.com',
        bucket: 'xinghe-xunjing-prod',
        prefix: 'xinghe-xunjing/production/',
        objectKeySha256: sha256('xinghe-xunjing/production/release-smoke/xicheng-storage.txt'),
        putHttpStatus: 200,
        getHttpStatus: 200,
        deleteHttpStatus: 204,
        readBackMatches: true,
        deleted: true
      },
      checks: [
        { name: 'object-storage-request', ok: true, blockers: [] },
        { name: 'object-storage-write', ok: true, blockers: [] },
        { name: 'object-storage-read', ok: true, blockers: [] },
        { name: 'object-storage-delete', ok: true, blockers: [] },
        { name: 'secret-redaction', ok: true, blockers: [] }
      ],
      blockers: []
    })
    expect(JSON.stringify(evidence)).not.toContain(env.OSS_ACCESS_KEY)
    expect(JSON.stringify(evidence)).not.toContain(env.OSS_SECRET_KEY)
  })

  test('rejects placeholders and local endpoints unless explicitly allowed for local smoke', () => {
    expect(resolveObjectStorageRegion('https://oss-cn-beijing.aliyuncs.com')).toBe('cn-beijing')
    expect(resolveObjectStorageRegion('http://127.0.0.1:39000')).toBe('us-east-1')
    expect(() => validateObjectStorageEnv({ ...env, OSS_SECRET_KEY: 'replace-with-real-secret' })).toThrow(
      'OSS_SECRET_KEY must be configured with a real value'
    )
    expect(() => validateObjectStorageEnv({ ...env, OSS_ENDPOINT: 'http://127.0.0.1:39000' })).toThrow(
      'OSS_ENDPOINT must be a non-local HTTPS URL'
    )
    expect(() => validateObjectStorageEnv(
      { ...env, OSS_ENDPOINT: 'http://127.0.0.1:39000', OSS_PREFIX: 'xinghe-xunjing/local/' },
      { allowLocal: true }
    )).not.toThrow()
  })

  test('keeps evidence under qa tmp or workbench and exposes npm script/docs', async () => {
    expect(resolveEvidenceFile(rootDir, 'qa/xicheng-object-storage-smoke-evidence.json')).toBe(
      resolve(rootDir, 'qa/xicheng-object-storage-smoke-evidence.json')
    )
    expect(() => resolveEvidenceFile(rootDir, 'ops/storage-evidence.json')).toThrow(
      'evidence file must be under qa/, tmp/ or workbench/'
    )

    const packageJson = JSON.parse(await readFile(resolve(rootDir, 'package.json'), 'utf8'))
    const deployDoc = await readFile(resolve(rootDir, 'docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')
    const statusDoc = await readFile(resolve(rootDir, 'docs/04_AI交接任务书/西城P0后台上线状态.md'), 'utf8')

    expect(packageJson.scripts['xunjing:storage:smoke']).toBe(
      'node scripts/verify-xicheng-object-storage-smoke.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:storage:smoke')
    expect(statusDoc).toContain('npm run xunjing:storage:smoke')
  })
})
