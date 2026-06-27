import { existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'

const productionPoiTarget = 80

const requiredProductionEnvKeys = [
  'SPRING_PROFILES_ACTIVE',
  'XUNJING_TENANT_ID',
  'XUNJING_APP_API_BASE_URL',
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
  'DASHSCOPE_API_KEY',
  'WX_MP_APP_ID',
  'WX_MP_SECRET',
  'WX_MINIAPP_APPID',
  'WX_MINIAPP_SECRET',
  'XUNJING_VISION_API_URL',
  'XUNJING_VISION_API_KEY',
  'XUNJING_VISION_MODEL',
  'INTERNAL_AUTH_TOKEN'
]

function check(name, ok, detail, blockers = []) {
  return { name, ok, detail, blockers }
}

function hasValue(value) {
  return String(value || '').trim().length > 0
}

function isPlaceholder(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) {
    return true
  }
  return [
    'replace-with',
    'placeholder',
    'your-',
    'example.com',
    'test-',
    'local-or-staging',
    'xunjing_local'
  ].some((token) => normalized.includes(token))
}

function isLoopback(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized.includes('127.0.0.1') ||
    normalized.includes('localhost') ||
    normalized.includes('host.docker.internal') ||
    normalized === '::1' ||
    normalized === '0.0.0.0'
}

function isHttpsUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !isLoopback(url.hostname)
  } catch {
    return false
  }
}

function requireRealEnv(env, keys) {
  const missingOrPlaceholder = keys.filter((key) => isPlaceholder(env[key]))
  return missingOrPlaceholder
}

function checkRuntimeEnv(env, stage) {
  const blockers = []
  const missingOrPlaceholder = requireRealEnv(env, requiredProductionEnvKeys)
  if (missingOrPlaceholder.length > 0) {
    blockers.push(`Missing or placeholder production env: ${missingOrPlaceholder.join(', ')}`)
  }

  const profile = String(env.SPRING_PROFILES_ACTIVE || '').trim().toLowerCase()
  const acceptedProfiles = stage === 'production' ? ['production', 'prod'] : ['staging', 'preprod', 'preview']
  if (!acceptedProfiles.includes(profile)) {
    blockers.push(`SPRING_PROFILES_ACTIVE must be ${acceptedProfiles.join(' or ')} for ${stage}`)
  }

  for (const key of ['MYSQL_HOST', 'REDIS_HOST', 'QDRANT_HOST']) {
    if (stage === 'production' && isLoopback(env[key])) {
      blockers.push(`${key} must not point to a local host for production`)
    }
  }

  return check(
    'runtime-env',
    blockers.length === 0,
    blockers.length === 0
      ? `${stage} runtime env is complete and not local-only`
      : blockers.join('; '),
    blockers
  )
}

function checkHttpsAppApiDomain(env) {
  const blockers = []
  if (!isHttpsUrl(env.XUNJING_APP_API_BASE_URL)) {
    blockers.push('XUNJING_APP_API_BASE_URL must be a real HTTPS backend domain')
  }
  return check(
    'https-app-api-domain',
    blockers.length === 0,
    blockers.length === 0
      ? 'APP API base URL is HTTPS and non-local'
      : blockers.join('; '),
    blockers
  )
}

function checkRealWechatApp(env) {
  const keys = ['WX_MP_APP_ID', 'WX_MP_SECRET', 'WX_MINIAPP_APPID', 'WX_MINIAPP_SECRET']
  const blockers = requireRealEnv(env, keys)
  return check(
    'real-wechat-app',
    blockers.length === 0,
    blockers.length === 0
      ? 'WeChat MP and Mini Program credentials are present'
      : `Missing or placeholder WeChat env: ${blockers.join(', ')}`,
    blockers.map((key) => `${key} must be configured with a real value`)
  )
}

function checkRealAiProvider(env) {
  const keys = ['QWEN_API_KEY', 'QWEN_BASE_URL', 'QWEN_MODEL', 'DASHSCOPE_API_KEY']
  const blockers = requireRealEnv(env, keys)
  if (hasValue(env.QWEN_BASE_URL) && !isHttpsUrl(env.QWEN_BASE_URL)) {
    blockers.push('QWEN_BASE_URL')
  }
  return check(
    'real-ai-provider',
    blockers.length === 0,
    blockers.length === 0
      ? 'AI provider env is present for Yudao default model bootstrap'
      : `Missing, placeholder or non-HTTPS AI env: ${blockers.join(', ')}`,
    blockers.map((key) => `${key} must be configured for real AI calls`)
  )
}

function checkVisionOcrService(env) {
  const keys = ['XUNJING_VISION_API_URL', 'XUNJING_VISION_API_KEY', 'XUNJING_VISION_MODEL']
  const blockers = requireRealEnv(env, keys)
  if (hasValue(env.XUNJING_VISION_API_URL) && !isHttpsUrl(env.XUNJING_VISION_API_URL)) {
    blockers.push('XUNJING_VISION_API_URL')
  }
  return check(
    'vision-ocr-service',
    blockers.length === 0,
    blockers.length === 0
      ? 'OCR/vision service endpoint, key and model are configured'
      : `Missing, placeholder or non-HTTPS vision env: ${blockers.join(', ')}`,
    blockers.map((key) => `${key} must be configured for real photo/OCR recognition`)
  )
}

function checkObjectStorage(env) {
  const keys = ['OSS_ENDPOINT', 'OSS_BUCKET', 'OSS_PREFIX', 'OSS_ACCESS_KEY', 'OSS_SECRET_KEY']
  const blockers = requireRealEnv(env, keys)
  if (hasValue(env.OSS_ENDPOINT) && !isHttpsUrl(env.OSS_ENDPOINT)) {
    blockers.push('OSS_ENDPOINT')
  }
  if (String(env.OSS_PREFIX || '').includes('/local/')) {
    blockers.push('OSS_PREFIX')
  }
  return check(
    'object-storage',
    blockers.length === 0,
    blockers.length === 0
      ? 'Object storage upload target is configured for non-local use'
      : `Missing, placeholder or local object storage env: ${blockers.join(', ')}`,
    blockers.map((key) => `${key} must be configured for production uploads`)
  )
}

async function readTextIfExists(filePath) {
  if (!existsSync(filePath)) {
    return ''
  }
  return await readFile(filePath, 'utf8')
}

function isRegularNonEmptySql(filePath) {
  if (!existsSync(filePath)) {
    return false
  }
  const stat = statSync(filePath)
  return stat.isFile() && stat.size > 0
}

async function checkFullYudaoBaseline(rootDir) {
  const baselinePath = path.join(rootDir, 'backend/yudao/sql/mysql/ruoyi-vue-pro.sql')
  const blockers = []
  if (!isRegularNonEmptySql(baselinePath)) {
    blockers.push('complete Yudao baseline ruoyi-vue-pro.sql is missing or not a regular SQL file')
  } else {
    const sql = await readTextIfExists(baselinePath)
    for (const snippet of [
      'system_users',
      'system_tenant',
      'system_menu',
      'system_oauth2_client',
      'infra_api_access_log'
    ]) {
      if (!sql.includes(snippet)) {
        blockers.push(`complete Yudao baseline is missing ${snippet}`)
      }
    }
  }
  return check(
    'full-yudao-baseline',
    blockers.length === 0,
    blockers.length === 0
      ? 'Complete Yudao baseline SQL is present'
      : blockers.join('; '),
    blockers
  )
}

function extractXichengPoiRows(seed) {
  return seed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("(@map_package_id, 'xicheng-"))
}

async function checkXichengProductionPoi(rootDir) {
  const seedPath = path.join(rootDir, 'backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql')
  const seed = await readTextIfExists(seedPath)
  const rows = extractXichengPoiRows(seed)
  const blockers = []
  if (rows.length < productionPoiTarget) {
    blockers.push(`80 reviewed Xicheng POIs required; found ${rows.length}/${productionPoiTarget}`)
  }
  if (!seed.includes('"targetP0PoiCount":80')) {
    blockers.push('xicheng seed must declare targetP0PoiCount=80')
  }
  if (!seed.includes('"productionReady":true')) {
    blockers.push('xicheng seed must declare productionReady=true before production')
  }
  return check(
    'xicheng-production-poi',
    blockers.length === 0,
    blockers.length === 0
      ? `Xicheng POI seed has ${rows.length}/${productionPoiTarget} production-ready POIs`
      : blockers.join('; '),
    blockers
  )
}

async function checkXichengSourceLicense(rootDir) {
  const seedPath = path.join(rootDir, 'backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql')
  const seed = await readTextIfExists(seedPath)
  const rows = extractXichengPoiRows(seed)
  const blockers = []

  if (seed.includes('REVIEW_REQUIRED')) {
    blockers.push('Xicheng seed still contains REVIEW_REQUIRED license or geo status')
  }
  const unapprovedRows = rows.filter((row) => !row.includes("'APPROVED', 'APPROVED', 'APPROVED', 'PUBLISHED'"))
  if (unapprovedRows.length > 0) {
    blockers.push(`${unapprovedRows.length} Xicheng POI rows are not fully approved for review/geo/license/status`)
  }
  if (!seed.includes('POI production source') && !seed.includes('POI 级已审核来源')) {
    blockers.push('Xicheng seed must create POI-level approved source documents')
  }

  return check(
    'xicheng-source-license',
    blockers.length === 0,
    blockers.length === 0
      ? 'Every Xicheng POI row is fully approved and has POI-level source generation'
      : blockers.join('; '),
    blockers
  )
}

export async function verifyXichengYudaoReleaseReadiness({
  env = process.env,
  rootDir = process.cwd(),
  stage = 'production'
} = {}) {
  const normalizedStage = String(stage || 'production').toLowerCase()
  if (!['production', 'staging'].includes(normalizedStage)) {
    throw new Error('stage must be production or staging')
  }

  const checks = [
    checkRuntimeEnv(env, normalizedStage),
    checkHttpsAppApiDomain(env),
    checkRealWechatApp(env),
    checkRealAiProvider(env),
    checkVisionOcrService(env),
    checkObjectStorage(env),
    await checkFullYudaoBaseline(rootDir),
    await checkXichengProductionPoi(rootDir),
    await checkXichengSourceLicense(rootDir)
  ]
  const blockers = checks.flatMap((item) => item.blockers || [])
  const ok = checks.every((item) => item.ok)

  return {
    ok,
    status: ok
      ? (normalizedStage === 'production' ? 'PRODUCTION_READY_CANDIDATE' : 'PREPROD_READY_CANDIDATE')
      : 'NOT_READY',
    stage: normalizedStage,
    checkedAt: new Date().toISOString(),
    checks,
    blockers
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
  const result = await verifyXichengYudaoReleaseReadiness({
    env,
    rootDir: readArgValue(args, '--root') || process.cwd(),
    stage: readArgValue(args, '--stage') || process.env.XUNJING_RELEASE_STAGE || 'production'
  })
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) {
    process.exit(1)
  }
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
