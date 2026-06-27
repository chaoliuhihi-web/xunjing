import http from 'node:http'
import { once } from 'node:events'
import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, test } from 'vitest'
import { loadEnvFile, verifyXunjingPlatformReadiness } from './verify-xunjing-platform-readiness.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const servers = []
const tempDirs = []
const staticReadinessFixtureFiles = [
  'backend/yudao/pom.xml',
  'backend/yudao/yudao-module-xunjing/pom.xml',
  'backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xunjing/console/index.ts',
  'backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xunjing/console/index.vue',
  'backend/yudao/sql/mysql/yudao-ai-module.sql',
  'backend/yudao/sql/mysql/xunjing-module.sql',
  'backend/yudao/sql/mysql/xunjing-seed-kashgar-p0.sql',
  'backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql',
  'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingMultimodalTriggerEngine.java',
  'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/dal/dataobject/poi/XunjingPoiDO.java',
  'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/dal/mysql/poi/XunjingPoiMapper.java',
  'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java',
  'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/enums/XunjingEnums.java',
  'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java',
  'backend/yudao/yudao-module-xunjing/src/test/resources/sql/create_tables.sql',
  'ops/xunjing-platform.compose.yml',
  'ops/xunjing-platform.env.example'
]

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

function assertXichengTriggerPayload(payload, expectedPoiCode) {
  expect(payload.packageCode).toBe('XICHENG-MAP-001')
  expect(payload.regionCode).toBe('beijing-xicheng')
  expect(payload.userTraceId).toBe(`platform-readiness-${expectedPoiCode}`)
  expect(payload.location).toBeTruthy()
  if (expectedPoiCode === 'xicheng-baitasi') {
    expect(payload.ocrText).toContain('妙应寺白塔')
    expect(payload.location.latitude).toBe(39.9231)
    return
  }
  if (expectedPoiCode === 'xicheng-gongwangfu') {
    expect(payload.ocrText).toContain('恭王府')
    expect(payload.location.longitude).toBe(116.38677)
    return
  }
  expect(payload.ocrText).toContain('北京天文馆')
  expect(payload.imageLabels).toContain('planetarium')
}

function checkByName(result, name) {
  return result.checks.find((check) => check.name === name)
}

async function readJsonBody(req) {
  let body = ''
  req.on('data', (chunk) => {
    body += chunk
  })
  await once(req, 'end')
  return JSON.parse(body)
}

async function startPlatformFixture(options = {}) {
  const includeXichengAiResponseContext = options.includeXichengAiResponseContext !== false
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
          mediaAssets: [{ id: 3101, title: '图影中华喀什古城图片' }],
          sources: [{ title: '喀什古城权威资料' }]
        }
      }))
      return
    }

    if (req.url === '/app-api/xunjing/resource/package?packageCode=XICHENG-MAP-001') {
      if (!requireTenant()) return
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        code: 0,
        data: {
          packageCode: 'XICHENG-MAP-001',
          title: '西城 AI 旅伴真实试运营地图',
          mediaAssets: [{ id: 4101, title: '妙应寺白塔试运营图片' }],
          sources: [{ title: '妙应寺白塔权威资料' }]
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

    if (req.url === '/app-api/xunjing/scan/resolve' && req.method === 'POST') {
      if (!requireTenant()) return
      const payload = await readJsonBody(req)
      if (payload.sceneCode === 'QR-XICHENG-MAP-001') {
        expect(payload.userTraceId).toBe('platform-readiness-xicheng-scan-check')
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          code: 0,
          data: {
            packageCode: 'XICHENG-MAP-001',
            sceneCode: 'QR-XICHENG-MAP-001',
            title: '西城 AI 旅伴真实试运营地图',
            resourceType: 'MAP',
            targetPath: '/pages/map/detail?packageCode=XICHENG-MAP-001&sceneCode=QR-XICHENG-MAP-001'
          }
        }))
        return
      }
      if (payload.sceneCode !== 'QR-KASHGAR-MAP-001') {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ code: 400, msg: 'invalid scene code' }))
        return
      }
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        code: 0,
        data: {
          packageCode: 'KASHGAR-MAP-001',
          sceneCode: 'QR-KASHGAR-MAP-001',
          title: '喀什古城研学地图',
          resourceType: 'MAP',
          targetPath: '/pages/map/detail?packageCode=KASHGAR-MAP-001&sceneCode=QR-KASHGAR-MAP-001'
        }
      }))
      return
    }

    if (req.url === '/app-api/xunjing/triggers/resolve' && req.method === 'POST') {
      if (!requireTenant()) return
      const payload = await readJsonBody(req)
      const expectedPoiCode = payload.ocrText?.includes('妙应寺白塔')
        ? 'xicheng-baitasi'
        : payload.ocrText?.includes('恭王府')
          ? 'xicheng-gongwangfu'
          : 'xicheng-planetarium'
      assertXichengTriggerPayload(payload, expectedPoiCode)
      const poiName = {
        'xicheng-baitasi': '妙应寺白塔',
        'xicheng-gongwangfu': '恭王府',
        'xicheng-planetarium': '北京天文馆'
      }[expectedPoiCode]
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        code: 0,
        data: {
          packageCode: 'XICHENG-MAP-001',
          regionCode: 'beijing-xicheng',
          poiCode: expectedPoiCode,
          poiName,
          confidence: 0.92,
          requiresUserConfirm: false,
          targetPath: `/pages/ai-guide/detail?regionCode=beijing-xicheng&poiCode=${expectedPoiCode}&packageCode=XICHENG-MAP-001`,
          suggestedQuestions: [`给我讲讲${poiName}。`],
          sources: [{ title: poiName, sourceType: 'OFFICIAL_PUBLIC' }]
        }
      }))
      return
    }

    if (req.url === '/app-api/xunjing/resource/events' && req.method === 'POST') {
      if (!requireTenant()) return
      const payload = await readJsonBody(req)
      if (payload.eventType === 'ERROR_FEEDBACK') {
        expect(payload.packageCode).toBe('XICHENG-MAP-001')
        expect(payload.sceneCode).toBe('xicheng-ai-guide')
        expect(payload.sourceChannel).toBe('platform-readiness')
        expect(payload.userTraceId).toBe('platform-readiness-xicheng-error-feedback')
        const clientPayload = JSON.parse(payload.payloadJson)
        expect(clientPayload.category).toBe('ocr_no_match')
        expect(clientPayload.message).toContain('无法识别')
        expect(clientPayload.severity).toBe('WARN')
      }
      if (payload.eventType === 'MEDIA_USE') {
        const clientPayload = JSON.parse(payload.payloadJson)
        if (clientPayload.mediaId !== 3101 || clientPayload.usageType !== 'READINESS_CHECK') {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ code: 400, msg: 'invalid media usage payload' }))
          return
        }
      }
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        code: 0,
        data: 2001
      }))
      return
    }

    if (req.url === '/app-api/xunjing/ai/chat' && req.method === 'POST') {
      if (!requireTenant()) return
      const payload = await readJsonBody(req)
      if (payload.packageCode === 'XICHENG-MAP-001' && payload.poiCode === 'xicheng-baitasi') {
        expect(payload.regionCode).toBe('beijing-xicheng')
        expect(payload.poiName).toBe('妙应寺白塔')
        expect(payload.sceneCode).toBe('xicheng-ai-guide')
        const context = includeXichengAiResponseContext
          ? {
              packageCode: 'XICHENG-MAP-001',
              sceneCode: 'xicheng-ai-guide',
              regionCode: 'beijing-xicheng',
              poiCode: 'xicheng-baitasi',
              poiName: '妙应寺白塔'
            }
          : {}
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          code: 0,
          data: {
            ...context,
            answer: '根据已审核资料《妙应寺白塔权威讲解稿》：妙应寺白塔是西城重要历史文化地标。',
            sources: [{ title: '妙应寺白塔权威讲解稿', sourceUrl: 'https://www.bjxch.gov.cn/example/baitasi' }],
            safetyStatus: 'PASSED',
            logId: 2101
          }
        }))
        return
      }
      if (payload.packageCode === 'XICHENG-MAP-001' && payload.poiCode === 'xicheng-source-guard-negative') {
        expect(payload.regionCode).toBe('beijing-xicheng')
        const context = includeXichengAiResponseContext
          ? {
              packageCode: 'XICHENG-MAP-001',
              sceneCode: 'xicheng-ai-guide',
              regionCode: 'beijing-xicheng',
              poiCode: 'xicheng-source-guard-negative',
              poiName: '来源门禁测试点位'
            }
          : {}
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          code: 0,
          data: {
            ...context,
            answer: '没有找到已审核且可公开引用的资料来源，不能直接回答这个问题。',
            sources: [],
            safetyStatus: 'BLOCKED',
            logId: 2102
          }
        }))
        return
      }
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

    if ([
      '/app-api/xunjing/reading/ask',
      '/app-api/xunjing/map/explain',
      '/app-api/xunjing/globe/explain'
    ].includes(req.url) && req.method === 'POST') {
      if (!requireTenant()) return
      req.resume()
      await once(req, 'end')
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        code: 0,
        data: {
          answer: '基于后台资料，P0 场景可以给出权威讲解。',
          sources: [{ title: '图秀中华新疆首站权威资料' }],
          safetyStatus: 'PASSED',
          logId: 1002
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

async function createStaticReadinessFixture() {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'xunjing-static-readiness-'))
  tempDirs.push(fixtureRoot)
  await Promise.all(staticReadinessFixtureFiles.map(async (relativePath) => {
    const source = path.join(rootDir, relativePath)
    const target = path.join(fixtureRoot, relativePath)
    await mkdir(path.dirname(target), { recursive: true })
    await cp(source, target, { recursive: true })
  }))
  return fixtureRoot
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
    expect(result.artifactType).toBe('xunjing-platform-readiness')
    expect(result.summary).toMatchObject({
      baseUrl,
      tenantId: '1',
      staticOnly: false,
      includeAiCheck: true,
      includeWriteCheck: true
    })
    expect(result.checks.map((check) => check.name)).toEqual([
      'static-files',
      'sql-schema',
      'seed-data',
      'xicheng-seed-data',
      'xicheng-poi-seed-quality',
      'xicheng-trigger-backend',
      'xicheng-ai-source-guard-backend',
      'xicheng-app-event-backend',
      'admin-ui-contract',
      'environment',
      'live-admin',
      'live-resource-package',
      'live-scan-resolve',
      'live-public-report',
      'live-resource-event',
      'live-media-usage',
      'live-ai-chat',
      'live-reading-ask',
      'live-map-explain',
      'live-globe-explain'
    ])
  })

  test('static mode checks repository assets without requiring local secrets', async () => {
    const result = await verifyXunjingPlatformReadiness({
      env: {},
      staticOnly: true
    })

    expect(result.ok).toBe(true)
    expect(result.artifactType).toBe('xunjing-platform-readiness')
    expect(result.checks.map((check) => check.name)).toEqual([
      'static-files',
      'sql-schema',
      'seed-data',
      'xicheng-seed-data',
      'xicheng-poi-seed-quality',
      'xicheng-trigger-backend',
      'xicheng-ai-source-guard-backend',
      'xicheng-app-event-backend',
      'admin-ui-contract'
    ])
  })

  test.each([
    ['interaction event table', 'xunjing_interaction_event'],
    ['media usage log table', 'xunjing_media_usage_log']
  ])('static SQL gate rejects missing %s', async (label, tableName) => {
    const fixtureRoot = await createStaticReadinessFixture()
    const sqlPath = path.join(fixtureRoot, 'backend/yudao/sql/mysql/xunjing-module.sql')
    const sql = await readFile(sqlPath, 'utf8')
    await writeFile(sqlPath, sql.replaceAll(tableName, `missing_${label.replaceAll(' ', '_')}`))

    await expect(verifyXunjingPlatformReadiness({
      env: {},
      staticOnly: true,
      rootDir: fixtureRoot
    })).rejects.toThrow(tableName)
  })

  test.each([
    ['interaction event type column', '`event_type`', 'event_type'],
    ['interaction source channel column', '`source_channel`', 'source_channel'],
    ['media usage type column', '`usage_type`', 'usage_type'],
    ['AI source JSON column', '`source_json`', 'source_json'],
    ['AI safety status column', '`safety_status`', 'safety_status']
  ])('static SQL gate rejects missing %s', async (label, columnSnippet, errorSnippet) => {
    const fixtureRoot = await createStaticReadinessFixture()
    const sqlPath = path.join(fixtureRoot, 'backend/yudao/sql/mysql/xunjing-module.sql')
    const sql = await readFile(sqlPath, 'utf8')
    await writeFile(sqlPath, sql.replaceAll(columnSnippet, '`missing_column`'))

    await expect(verifyXunjingPlatformReadiness({
      env: {},
      staticOnly: true,
      rootDir: fixtureRoot
    })).rejects.toThrow(errorSnippet)
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
      'xicheng-seed-data',
      'xicheng-poi-seed-quality',
      'xicheng-trigger-backend',
      'xicheng-ai-source-guard-backend',
      'xicheng-app-event-backend',
      'admin-ui-contract',
      'environment',
      'live-resource-package',
      'live-scan-resolve',
      'live-public-report',
      'live-resource-event',
      'live-media-usage'
    ])
  })

  test('runs live Xicheng trigger smoke checks when requested', async () => {
    const baseUrl = await startPlatformFixture()

    const result = await verifyXunjingPlatformReadiness({
      env: stagingEnv(),
      baseUrl,
      skipAdminCheck: true,
      includeXichengTriggerCheck: true
    })

    expect(result.ok).toBe(true)
    expect(result.summary).toMatchObject({
      xichengRegionCode: 'beijing-xicheng',
      xichengPackageCode: 'XICHENG-MAP-001'
    })
    expect(checkByName(result, 'live-xicheng-trigger-baitasi')?.summary).toMatchObject({
      endpoint: '/app-api/xunjing/triggers/resolve',
      tenantId: '1',
      packageCode: 'XICHENG-MAP-001',
      regionCode: 'beijing-xicheng',
      poiCode: 'xicheng-baitasi',
      poiName: '妙应寺白塔',
      requiresUserConfirm: false,
      sourceCount: 1,
      targetPath: '/pages/ai-guide/detail?regionCode=beijing-xicheng&poiCode=xicheng-baitasi&packageCode=XICHENG-MAP-001'
    })
    expect(checkByName(result, 'live-xicheng-trigger-baitasi')?.summary.confidence).toBeGreaterThanOrEqual(0.85)
    expect(checkByName(result, 'live-xicheng-trigger-gongwangfu')?.summary).toMatchObject({
      endpoint: '/app-api/xunjing/triggers/resolve',
      tenantId: '1',
      packageCode: 'XICHENG-MAP-001',
      poiCode: 'xicheng-gongwangfu',
      poiName: '恭王府',
      sourceCount: 1,
      targetPath: '/pages/ai-guide/detail?regionCode=beijing-xicheng&poiCode=xicheng-gongwangfu&packageCode=XICHENG-MAP-001'
    })
    expect(checkByName(result, 'live-xicheng-trigger-planetarium')?.summary).toMatchObject({
      endpoint: '/app-api/xunjing/triggers/resolve',
      tenantId: '1',
      packageCode: 'XICHENG-MAP-001',
      poiCode: 'xicheng-planetarium',
      poiName: '北京天文馆',
      sourceCount: 1,
      targetPath: '/pages/ai-guide/detail?regionCode=beijing-xicheng&poiCode=xicheng-planetarium&packageCode=XICHENG-MAP-001'
    })
  })

  test('runs live Xicheng scan and AI source guard checks when requested', async () => {
    const baseUrl = await startPlatformFixture()

    const result = await verifyXunjingPlatformReadiness({
      env: stagingEnv(),
      baseUrl,
      skipAdminCheck: true,
      includeXichengAppCheck: true
    })

    expect(result.ok).toBe(true)
    expect(result.summary).toMatchObject({
      xichengRegionCode: 'beijing-xicheng',
      xichengPackageCode: 'XICHENG-MAP-001'
    })
    expect(checkByName(result, 'live-xicheng-scan-resolve')?.summary).toMatchObject({
      endpoint: '/app-api/xunjing/scan/resolve',
      tenantId: '1',
      packageCode: 'XICHENG-MAP-001',
      sceneCode: 'QR-XICHENG-MAP-001'
    })
    expect(checkByName(result, 'live-xicheng-error-feedback')?.summary).toMatchObject({
      endpoint: '/app-api/xunjing/resource/events',
      tenantId: '1',
      packageCode: 'XICHENG-MAP-001',
      eventType: 'ERROR_FEEDBACK',
      eventId: 2001
    })
    expect(checkByName(result, 'live-xicheng-ai-chat-sourced')?.summary).toMatchObject({
      endpoint: '/app-api/xunjing/ai/chat',
      tenantId: '1',
      packageCode: 'XICHENG-MAP-001',
      sceneCode: 'xicheng-ai-guide',
      regionCode: 'beijing-xicheng',
      poiCode: 'xicheng-baitasi',
      poiName: '妙应寺白塔',
      contextEcho: true,
      safetyStatus: 'PASSED',
      sourceCount: 1,
      logId: 2101
    })
    expect(checkByName(result, 'live-xicheng-ai-chat-blocked')?.summary).toMatchObject({
      endpoint: '/app-api/xunjing/ai/chat',
      tenantId: '1',
      packageCode: 'XICHENG-MAP-001',
      sceneCode: 'xicheng-ai-guide',
      regionCode: 'beijing-xicheng',
      poiCode: 'xicheng-source-guard-negative',
      poiName: '来源门禁测试点位',
      contextEcho: true,
      safetyStatus: 'BLOCKED',
      sourceCount: 0,
      logId: 2102
    })
  })

  test('rejects live Xicheng AI readiness when chat response omits context echo', async () => {
    const baseUrl = await startPlatformFixture({ includeXichengAiResponseContext: false })

    await expect(verifyXunjingPlatformReadiness({
      env: stagingEnv(),
      baseUrl,
      skipAdminCheck: true,
      includeXichengAppCheck: true
    })).rejects.toThrow('/app-api/xunjing/ai/chat did not echo Xicheng POI context')
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

  test('CLI writes readiness evidence under controlled evidence directories', async () => {
    await mkdir(path.resolve(rootDir, 'tmp'), { recursive: true })
    const evidenceDir = await mkdtemp(path.resolve(rootDir, 'tmp/xunjing-platform-readiness-'))
    tempDirs.push(evidenceDir)
    const evidencePath = path.resolve(evidenceDir, 'xicheng-app-readiness-evidence.json')

    const stdout = execFileSync(process.execPath, [
      'scripts/verify-xunjing-platform-readiness.mjs',
      '--static',
      '--evidence-file',
      evidencePath
    ], {
      cwd: rootDir,
      encoding: 'utf8'
    })

    const printed = JSON.parse(stdout)
    const evidence = JSON.parse(await readFile(evidencePath, 'utf8'))
    expect(printed.artifactType).toBe('xunjing-platform-readiness')
    expect(evidence.artifactType).toBe('xunjing-platform-readiness')
    expect(evidence.ok).toBe(true)
    expect(evidence.summary.staticOnly).toBe(true)
    expect(evidence.checks.map((check) => check.name)).toContain('xicheng-trigger-backend')
  })

  test('CLI refuses readiness evidence files outside qa tmp or workbench', async () => {
    const evidenceDir = await mkdtemp(path.join(os.tmpdir(), 'xunjing-platform-readiness-outside-'))
    tempDirs.push(evidenceDir)
    const evidencePath = path.join(evidenceDir, 'xicheng-app-readiness-evidence.json')

    let error
    try {
      execFileSync(process.execPath, [
        'scripts/verify-xunjing-platform-readiness.mjs',
        '--static',
        '--evidence-file',
        evidencePath
      ], {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: 'pipe'
      })
    } catch (caught) {
      error = caught
    }

    expect(error).toBeTruthy()
    expect(error.status).toBe(1)
    expect(String(error.stderr)).toContain('evidence file must be under qa/, tmp/ or workbench/')
  })
})
