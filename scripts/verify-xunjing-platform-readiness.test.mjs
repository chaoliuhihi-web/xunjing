import http from 'node:http'
import { once } from 'node:events'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { loadEnvFile, verifyXunjingPlatformReadiness } from './verify-xunjing-platform-readiness.mjs'

const servers = []
const tempDirs = []

function stagingEnv(overrides = {}) {
  return {
    SPRING_PROFILES_ACTIVE: 'staging',
    XUNJING_TENANT_ID: '1',
    MYSQL_HOST: '127.0.0.1',
    MYSQL_PORT: '3306',
    MYSQL_DATABASE: 'yudao_xinghe_xunjing',
    MYSQL_USERNAME: 'xunjing',
    MYSQL_PASSWORD: 'secret',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: '6379',
    REDIS_DATABASE: '8',
    REDIS_PASSWORD: 'xunjing_local_redis_password',
    OSS_ENDPOINT: 'https://oss.example.com',
    OSS_BUCKET: 'xinghe-xunjing',
    OSS_PREFIX: 'xinghe-xunjing/staging/',
    OSS_ACCESS_KEY: 'secret',
    OSS_SECRET_KEY: 'secret',
    QDRANT_URL: 'http://127.0.0.1:6333',
    QDRANT_HOST: '127.0.0.1',
    QDRANT_GRPC_PORT: '6334',
    QDRANT_TEXT_COLLECTION: 'xinghe_xunjing_text_staging',
    QDRANT_IMAGE_COLLECTION: 'xinghe_xunjing_image_staging',
    QWEN_API_KEY: 'secret',
    QWEN_BASE_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    QWEN_MODEL: 'qwen-plus',
    INTERNAL_AUTH_TOKEN: 'secret',
    ...overrides
  }
}

async function startPlatformFixture() {
  const server = http.createServer(async (req, res) => {
    const requireTenant = () => {
      if (req.headers['tenant-id'] === '1') {
        return true
      }
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ code: 400, msg: 'tenant-id required' }))
      return false
    }

    if (req.url === '/admin/' || req.url === '/admin') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end('<!doctype html><title>Yudao Admin</title><main>星河寻境工作台</main>')
      return
    }

    if (req.url === '/app-api/xunjing/resource/package?packageCode=KASHGAR-MAP-001') {
      if (!requireTenant()) return
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        code: 0,
        data: {
          packageCode: 'KASHGAR-MAP-001',
          title: '喀什古城研学地图',
          sources: [{ title: '喀什古城权威资料' }]
        }
      }))
      return
    }

    if (req.url === '/app-api/xunjing/public-report/summary?packageCode=KASHGAR-MAP-001') {
      if (!requireTenant()) return
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        code: 0,
        data: {
          packageCode: 'KASHGAR-MAP-001',
          p0Ready: true
        }
      }))
      return
    }

    if (req.url === '/app-api/xunjing/resource/events' && req.method === 'POST') {
      if (!requireTenant()) return
      req.resume()
      await once(req, 'end')
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        code: 0,
        data: 2001
      }))
      return
    }

    if (req.url === '/app-api/xunjing/ai/chat' && req.method === 'POST') {
      if (!requireTenant()) return
      req.resume()
      await once(req, 'end')
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        code: 0,
        data: {
          answer: '基于后台资料，喀什古城适合研学讲解。',
          sources: [{ title: '喀什古城权威资料' }],
          safetyStatus: 'PASSED',
          logId: 1001
        }
      }))
      return
    }

    res.statusCode = 404
    res.end('not found')
  })

  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  servers.push(server)
  const { port } = server.address()
  return `http://127.0.0.1:${port}`
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))))
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('xunjing platform readiness verifier', () => {
  test('checks backend assets, isolated environment and live public platform endpoints', async () => {
    const baseUrl = await startPlatformFixture()

    const result = await verifyXunjingPlatformReadiness({
      env: stagingEnv(),
      baseUrl,
      includeWriteCheck: true,
      includeAiCheck: true
    })

    expect(result.ok).toBe(true)
    expect(result.checks.map((check) => check.name)).toEqual([
      'static-files',
      'sql-schema',
      'seed-data',
      'admin-ui-contract',
      'environment',
      'live-admin',
      'live-resource-package',
      'live-public-report',
      'live-resource-event',
      'live-ai-chat'
    ])
  })

  test('static mode checks repository assets without requiring local secrets', async () => {
    const result = await verifyXunjingPlatformReadiness({
      env: {},
      staticOnly: true
    })

    expect(result.ok).toBe(true)
    expect(result.checks.map((check) => check.name)).toEqual([
      'static-files',
      'sql-schema',
      'seed-data',
      'admin-ui-contract'
    ])
  })

  test('can run API-only live smoke without requiring admin static hosting', async () => {
    const baseUrl = await startPlatformFixture()

    const result = await verifyXunjingPlatformReadiness({
      env: stagingEnv(),
      baseUrl,
      includeWriteCheck: true,
      skipAdminCheck: true
    })

    expect(result.ok).toBe(true)
    expect(result.checks.map((check) => check.name)).toEqual([
      'static-files',
      'sql-schema',
      'seed-data',
      'admin-ui-contract',
      'environment',
      'live-resource-package',
      'live-public-report',
      'live-resource-event'
    ])
  })

  test('rejects environment values that reuse the upstream XingheAI runtime', async () => {
    await expect(verifyXunjingPlatformReadiness({
      env: stagingEnv({
        MYSQL_DATABASE: 'xingheai2026',
        QDRANT_TEXT_COLLECTION: 'xingheai_text_production'
      })
    })).rejects.toThrow('MYSQL_DATABASE')
  })

  test('loads env files without requiring dotenv or exposing values in output', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'xunjing-env-'))
    tempDirs.push(dir)
    const envPath = path.join(dir, 'staging.env')
    await writeFile(envPath, [
      '# deployment secrets stay outside git',
      'MYSQL_DATABASE=yudao_xinghe_xunjing',
      'QWEN_API_KEY="secret value"',
      'EMPTY_VALUE='
    ].join('\n'))

    expect(await loadEnvFile(envPath)).toEqual({
      MYSQL_DATABASE: 'yudao_xinghe_xunjing',
      QWEN_API_KEY: 'secret value',
      EMPTY_VALUE: ''
    })
  })
})
