import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const requiredEnvKeys = [
  'SPRING_PROFILES_ACTIVE',
  'XUNJING_TENANT_ID',
  'MYSQL_HOST',
  'MYSQL_PORT',
  'MYSQL_DATABASE',
  'MYSQL_USERNAME',
  'MYSQL_PASSWORD',
  'REDIS_HOST',
  'REDIS_PORT',
  'REDIS_DATABASE',
  'REDIS_PASSWORD',
  'OSS_ENDPOINT',
  'OSS_BUCKET',
  'OSS_PREFIX',
  'OSS_ACCESS_KEY',
  'OSS_SECRET_KEY',
  'QDRANT_URL',
  'QDRANT_HOST',
  'QDRANT_GRPC_PORT',
  'QDRANT_TEXT_COLLECTION',
  'QDRANT_IMAGE_COLLECTION',
  'QWEN_API_KEY',
  'QWEN_BASE_URL',
  'QWEN_MODEL',
  'INTERNAL_AUTH_TOKEN'
]

function pass(name, detail) {
  return { name, ok: true, detail }
}

function requireValue(env, key) {
  if (!env[key]) {
    throw new Error(`${key} is required for Xinghe Xunjing platform readiness`)
  }
}

function rejectUpstreamReuse(env) {
  const guardedValues = [
    ['MYSQL_DATABASE', env.MYSQL_DATABASE],
    ['QDRANT_TEXT_COLLECTION', env.QDRANT_TEXT_COLLECTION],
    ['QDRANT_IMAGE_COLLECTION', env.QDRANT_IMAGE_COLLECTION],
    ['OSS_BUCKET', env.OSS_BUCKET],
    ['OSS_PREFIX', env.OSS_PREFIX]
  ]

  for (const [key, value] of guardedValues) {
    if (String(value || '').toLowerCase().includes('xingheai')) {
      throw new Error(`${key} must not reuse the upstream XingheAI runtime`)
    }
  }
}

async function readText(rootDir, relativePath) {
  return await readFile(path.join(rootDir, relativePath), 'utf8')
}

function assertFiles(rootDir, files, label) {
  for (const file of files) {
    if (!existsSync(path.join(rootDir, file))) {
      throw new Error(`Missing ${label}: ${file}`)
    }
  }
}

function assertContains(text, snippet, label) {
  if (!text.includes(snippet)) {
    throw new Error(`${label} missing ${snippet}`)
  }
}

async function checkStaticFiles(rootDir) {
  assertFiles(rootDir, [
    'backend/yudao/pom.xml',
    'backend/yudao/yudao-module-xunjing/pom.xml',
    'backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xunjing/console/index.ts',
    'backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xunjing/console/index.vue',
    'backend/yudao/sql/mysql/yudao-ai-module.sql',
    'ops/xunjing-platform.compose.yml',
    'ops/xunjing-platform.env.example'
  ], 'platform file')
  return pass('static-files', 'Yudao backend module and admin console files exist')
}

async function checkSqlSchema(rootDir) {
  const sql = await readText(rootDir, 'backend/yudao/sql/mysql/xunjing-module.sql')
  const aiSql = await readText(rootDir, 'backend/yudao/sql/mysql/yudao-ai-module.sql')
  for (const snippet of [
    'xunjing_resource_package',
    'xunjing_knowledge_document',
    'xunjing_media_asset',
    'xunjing_ai_generation_log',
    'xunjing:readiness:query'
  ]) {
    assertContains(sql, snippet, 'xunjing-module.sql')
  }
  for (const snippet of ['ai_api_key', 'ai_model', 'ai_knowledge', 'ai_knowledge_segment']) {
    assertContains(aiSql, snippet, 'yudao-ai-module.sql')
  }
  return pass('sql-schema', 'Xunjing MySQL schema includes P0 operating tables and permissions')
}

async function checkSeedData(rootDir) {
  const seed = await readText(rootDir, 'backend/yudao/sql/mysql/xunjing-seed-kashgar-p0.sql')
  for (const snippet of [
    'KASHGAR-BOOK-001',
    'KASHGAR-MAP-001',
    'KASHGAR-GLOBE-001',
    'QR-KASHGAR-BOOK-001',
    '喀什古城研学地图',
    'QR-KASHGAR-MAP-001',
    'QR-KASHGAR-GLOBE-001',
    '"p0Ready":true',
    '"quotaRuleCount":5'
  ]) {
    assertContains(seed, snippet, 'xunjing-seed-kashgar-p0.sql')
  }
  return pass('seed-data', 'Kashgar P0 seed data is present')
}

async function checkAdminUiContract(rootDir) {
  const api = await readText(
    rootDir,
    'backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xunjing/console/index.ts'
  )
  const view = await readText(
    rootDir,
    'backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xunjing/console/index.vue'
  )
  for (const snippet of ['getReadiness', 'getDashboard', 'getAiGenerationLogPage']) {
    assertContains(api, snippet, 'xunjing console API')
  }
  for (const snippet of ['XunjingConsole', '资料导入审核', '图影中华素材']) {
    assertContains(view, snippet, 'xunjing console view')
  }
  return pass('admin-ui-contract', 'Yudao admin console route and API contract are present')
}

function checkEnvironment(env) {
  for (const key of requiredEnvKeys) {
    requireValue(env, key)
  }
  rejectUpstreamReuse(env)
  return pass('environment', 'staging environment is isolated and complete')
}

async function fetchJson(url, options = {}, fetchImpl = fetch) {
  const response = await fetchImpl(url, options)
  const body = await response.text()
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`)
  }
  return JSON.parse(body)
}

function tenantHeaders(tenantId, extraHeaders = {}) {
  return {
    ...extraHeaders,
    'tenant-id': String(tenantId)
  }
}

async function checkLiveAdmin(baseUrl, fetchImpl) {
  const response = await fetchImpl(new URL('/admin/', baseUrl))
  const body = await response.text()
  if (!response.ok || !body.includes('星河寻境')) {
    throw new Error('/admin/ does not expose the Xinghe Xunjing admin console')
  }
  return pass('live-admin', 'admin console is reachable')
}

async function checkLiveResourcePackage(baseUrl, fetchImpl, tenantId) {
  await fetchLiveResourcePackageData(baseUrl, fetchImpl, tenantId)
  return pass('live-resource-package', 'Kashgar resource package endpoint is reachable')
}

async function fetchLiveResourcePackageData(baseUrl, fetchImpl, tenantId) {
  const json = await fetchJson(
    new URL('/app-api/xunjing/resource/package?packageCode=KASHGAR-MAP-001', baseUrl),
    { headers: tenantHeaders(tenantId) },
    fetchImpl
  )
  if (json.code !== 0 || json.data?.packageCode !== 'KASHGAR-MAP-001') {
    throw new Error('resource package endpoint did not return KASHGAR-MAP-001')
  }
  return json.data
}

async function checkLivePublicReport(baseUrl, fetchImpl, tenantId) {
  const json = await fetchJson(
    new URL('/app-api/xunjing/public-report/summary?packageCode=KASHGAR-MAP-001', baseUrl),
    { headers: tenantHeaders(tenantId) },
    fetchImpl
  )
  if (json.code !== 0 || json.data?.p0Ready !== true) {
    throw new Error('public report endpoint is not P0 ready')
  }
  return pass('live-public-report', 'public report summary is P0 ready')
}

async function checkLiveResourceEvent(baseUrl, fetchImpl, tenantId) {
  const json = await fetchJson(
    new URL('/app-api/xunjing/resource/events', baseUrl),
    {
      method: 'POST',
      headers: tenantHeaders(tenantId, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        packageCode: 'KASHGAR-MAP-001',
        sceneCode: 'QR-KASHGAR-MAP-001',
        eventType: 'VIEW',
        sourceChannel: 'platform-readiness',
        userTraceId: 'platform-readiness-check',
        payloadJson: JSON.stringify({ check: 'resource-event' })
      })
    },
    fetchImpl
  )
  if (json.code !== 0 || !json.data) {
    throw new Error('resource event endpoint did not create an event')
  }
  return pass('live-resource-event', 'resource event endpoint accepts packageCode or sceneCode attribution')
}

async function checkLiveMediaUsage(baseUrl, fetchImpl, tenantId) {
  const resourcePackage = await fetchLiveResourcePackageData(baseUrl, fetchImpl, tenantId)
  const mediaId = resourcePackage.mediaAssets?.[0]?.id
  if (!mediaId) {
    throw new Error('resource package endpoint did not return a public media asset for MEDIA_USE check')
  }
  const json = await fetchJson(
    new URL('/app-api/xunjing/resource/events', baseUrl),
    {
      method: 'POST',
      headers: tenantHeaders(tenantId, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        packageCode: 'KASHGAR-MAP-001',
        sceneCode: 'QR-KASHGAR-MAP-001',
        eventType: 'MEDIA_USE',
        sourceChannel: 'platform-readiness',
        userTraceId: 'platform-readiness-media-check',
        payloadJson: JSON.stringify({
          mediaId,
          usageType: 'READINESS_CHECK',
          placement: 'platform-readiness'
        })
      })
    },
    fetchImpl
  )
  if (json.code !== 0 || !json.data) {
    throw new Error('resource media usage event did not create a usage log')
  }
  return pass('live-media-usage', 'MEDIA_USE event accepts a public media asset and records usage')
}

async function checkLiveAiChat(baseUrl, fetchImpl, tenantId) {
  return await checkLiveSourcedQuestion(baseUrl, fetchImpl, tenantId, {
    path: '/app-api/xunjing/ai/chat',
    packageCode: 'KASHGAR-MAP-001',
    question: '喀什古城适合如何研学讲解？',
    name: 'live-ai-chat',
    detail: 'AI chat endpoint returns a safe sourced answer'
  })
}

async function checkLiveReadingAsk(baseUrl, fetchImpl, tenantId) {
  return await checkLiveSourcedQuestion(baseUrl, fetchImpl, tenantId, {
    path: '/app-api/xunjing/reading/ask',
    packageCode: 'KASHGAR-BOOK-001',
    qrSceneCode: 'QR-KASHGAR-BOOK-001',
    sceneCode: 'reading-ask',
    question: '这本喀什古城少年读本适合怎样伴读？',
    name: 'live-reading-ask',
    detail: 'reading companion endpoint returns a safe sourced answer'
  })
}

async function checkLiveMapExplain(baseUrl, fetchImpl, tenantId) {
  return await checkLiveSourcedQuestion(baseUrl, fetchImpl, tenantId, {
    path: '/app-api/xunjing/map/explain',
    packageCode: 'KASHGAR-MAP-001',
    qrSceneCode: 'QR-KASHGAR-MAP-001',
    sceneCode: 'map-explain',
    question: '请用研学地图讲解喀什古城入口。',
    name: 'live-map-explain',
    detail: 'map explanation endpoint returns a safe sourced answer'
  })
}

async function checkLiveGlobeExplain(baseUrl, fetchImpl, tenantId) {
  return await checkLiveSourcedQuestion(baseUrl, fetchImpl, tenantId, {
    path: '/app-api/xunjing/globe/explain',
    packageCode: 'KASHGAR-GLOBE-001',
    qrSceneCode: 'QR-KASHGAR-GLOBE-001',
    sceneCode: 'globe-explain',
    question: '请用地球仪节点解释喀什的丝路位置。',
    name: 'live-globe-explain',
    detail: 'globe explanation endpoint returns a safe sourced answer'
  })
}

async function checkLiveSourcedQuestion(baseUrl, fetchImpl, tenantId, {
  path: requestPath,
  packageCode,
  qrSceneCode,
  sceneCode,
  question,
  name,
  detail
}) {
  const json = await fetchJson(
    new URL(requestPath, baseUrl),
    {
      method: 'POST',
      headers: tenantHeaders(tenantId, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        packageCode,
        qrSceneCode,
        sceneCode,
        question
      })
    },
    fetchImpl
  )
  const passedSafetyStatuses = new Set(['PASS', 'PASSED'])
  if (json.code !== 0 || !json.data?.answer || !passedSafetyStatuses.has(json.data?.safetyStatus)) {
    throw new Error(`${requestPath} did not return a safe sourced answer`)
  }
  if (!Array.isArray(json.data.sources) || json.data.sources.length === 0) {
    throw new Error(`${requestPath} did not return sources`)
  }
  return pass(name, detail)
}

export async function loadEnvFile(envPath) {
  const text = await readFile(envPath, 'utf8')
  const env = {}

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const equalIndex = line.indexOf('=')
    if (equalIndex === -1) {
      continue
    }

    const key = line.slice(0, equalIndex).trim()
    let value = line.slice(equalIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }

  return env
}

export async function verifyXunjingPlatformReadiness({
  env = process.env,
  baseUrl,
  includeAiCheck = false,
  includeWriteCheck = false,
  skipAdminCheck = false,
  staticOnly = false,
  tenantId,
  rootDir = process.cwd(),
  fetchImpl = fetch
} = {}) {
  const checks = []

  checks.push(await checkStaticFiles(rootDir))
  checks.push(await checkSqlSchema(rootDir))
  checks.push(await checkSeedData(rootDir))
  checks.push(await checkAdminUiContract(rootDir))
  if (!staticOnly) {
    checks.push(checkEnvironment(env))
  }

  if (baseUrl && !staticOnly) {
    const liveTenantId = tenantId || env.XUNJING_TENANT_ID || '1'
    if (!skipAdminCheck) {
      checks.push(await checkLiveAdmin(baseUrl, fetchImpl))
    }
    checks.push(await checkLiveResourcePackage(baseUrl, fetchImpl, liveTenantId))
    checks.push(await checkLivePublicReport(baseUrl, fetchImpl, liveTenantId))
    if (includeWriteCheck) {
      checks.push(await checkLiveResourceEvent(baseUrl, fetchImpl, liveTenantId))
      checks.push(await checkLiveMediaUsage(baseUrl, fetchImpl, liveTenantId))
    }
    if (includeAiCheck) {
      checks.push(await checkLiveAiChat(baseUrl, fetchImpl, liveTenantId))
      checks.push(await checkLiveReadingAsk(baseUrl, fetchImpl, liveTenantId))
      checks.push(await checkLiveMapExplain(baseUrl, fetchImpl, liveTenantId))
      checks.push(await checkLiveGlobeExplain(baseUrl, fetchImpl, liveTenantId))
    }
  }

  return {
    ok: checks.every((check) => check.ok),
    checkedAt: new Date().toISOString(),
    checks
  }
}

function readArgValue(args, name) {
  const equalPrefix = `${name}=`
  const equalArg = args.find((arg) => arg.startsWith(equalPrefix))
  if (equalArg) {
    return equalArg.slice(equalPrefix.length)
  }
  const index = args.indexOf(name)
  if (index >= 0) {
    return args[index + 1]
  }
  return undefined
}

async function runCli() {
  const args = process.argv.slice(2)
  const envFile = readArgValue(args, '--env-file') || process.env.XUNJING_ENV_FILE
  const env = envFile
    ? { ...process.env, ...await loadEnvFile(envFile) }
    : process.env
  const staticOnly = args.includes('--static') || process.env.XUNJING_STATIC_ONLY === '1'
  const result = await verifyXunjingPlatformReadiness({
    env,
    baseUrl: readArgValue(args, '--base-url') || process.env.XUNJING_BASE_URL || undefined,
    includeAiCheck: args.includes('--include-ai-check') || process.env.XUNJING_INCLUDE_AI_CHECK === '1',
    includeWriteCheck: args.includes('--include-write-check') || process.env.XUNJING_INCLUDE_WRITE_CHECK === '1',
    skipAdminCheck: args.includes('--skip-admin-check') || process.env.XUNJING_SKIP_ADMIN_CHECK === '1',
    staticOnly,
    tenantId: readArgValue(args, '--tenant-id') || env.XUNJING_TENANT_ID || undefined,
    rootDir: readArgValue(args, '--root') || process.cwd()
  })
  console.log(JSON.stringify(result, null, 2))
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
