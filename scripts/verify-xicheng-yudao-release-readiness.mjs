import { existsSync, statSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'

const productionPoiTarget = 80
const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])

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

async function loadEvidenceInput(rootDir, evidencePath) {
  if (!evidencePath) {
    return { path: undefined, data: undefined, error: undefined }
  }
  const resolvedRoot = path.resolve(rootDir)
  const resolvedPath = path.isAbsolute(evidencePath)
    ? path.resolve(evidencePath)
    : path.resolve(resolvedRoot, evidencePath)
  try {
    return {
      path: resolvedPath,
      data: JSON.parse(await readFile(resolvedPath, 'utf8')),
      error: undefined
    }
  } catch (error) {
    return {
      path: resolvedPath,
      data: undefined,
      error: error.message
    }
  }
}

function hasNoEvidenceBlockers(evidence) {
  return !Array.isArray(evidence?.blockers) || evidence.blockers.length === 0
}

function evidenceSummary(evidence) {
  return evidence && typeof evidence.summary === 'object' && evidence.summary !== null
    ? evidence.summary
    : {}
}

function validateManifestEvidence(ref) {
  const blockers = []
  if (!ref.path) {
    return ['POI manifest evidence is required before production release']
  }
  if (ref.error) {
    return [`POI manifest evidence cannot be read: ${ref.error}`]
  }
  const evidence = ref.data || {}
  const summary = evidenceSummary(evidence)
  if (evidence.artifactType !== 'xicheng-poi-production-manifest-readiness') {
    blockers.push('manifest evidence artifactType must be xicheng-poi-production-manifest-readiness')
  }
  if (evidence.ok !== true) {
    blockers.push('manifest evidence ok must be true')
  }
  if (evidence.status !== 'PRODUCTION_POI_MANIFEST_READY') {
    blockers.push('manifest evidence status must be PRODUCTION_POI_MANIFEST_READY')
  }
  if (summary.regionCode !== 'beijing-xicheng') {
    blockers.push('manifest evidence regionCode must be beijing-xicheng')
  }
  if (summary.packageCode !== 'XICHENG-MAP-001') {
    blockers.push('manifest evidence packageCode must be XICHENG-MAP-001')
  }
  if (Number(summary.totalPoiCount) < productionPoiTarget) {
    blockers.push(`manifest evidence must prove at least ${productionPoiTarget} production POIs`)
  }
  if (Number(summary.targetPoiCount) < productionPoiTarget) {
    blockers.push(`manifest evidence targetPoiCount must be at least ${productionPoiTarget}`)
  }
  if (summary.productionReady !== true) {
    blockers.push('manifest evidence productionReady must be true')
  }
  if (!hasNoEvidenceBlockers(evidence)) {
    blockers.push(`manifest evidence contains blockers: ${evidence.blockers.join('; ')}`)
  }
  return blockers
}

function validateSeedEvidence(ref) {
  const blockers = []
  if (!ref.path) {
    return ['POI seed SQL evidence is required before production release']
  }
  if (ref.error) {
    return [`POI seed SQL evidence cannot be read: ${ref.error}`]
  }
  const evidence = ref.data || {}
  const summary = evidenceSummary(evidence)
  const poiCount = Number(summary.poiCount ?? summary.poiSeedCount)
  const targetCount = Number(summary.targetP0PoiCount ?? summary.minPoiCount)
  if (evidence.artifactType !== 'xicheng-poi-production-seed-readiness') {
    blockers.push('seed evidence artifactType must be xicheng-poi-production-seed-readiness')
  }
  if (evidence.ok !== true) {
    blockers.push('seed evidence ok must be true')
  }
  if (evidence.status !== 'PRODUCTION_POI_SEED_READY') {
    blockers.push('seed evidence status must be PRODUCTION_POI_SEED_READY')
  }
  if (!Number.isFinite(poiCount) || poiCount < productionPoiTarget) {
    blockers.push(`seed evidence must prove at least ${productionPoiTarget} production POIs`)
  }
  if (!Number.isFinite(targetCount) || targetCount < productionPoiTarget) {
    blockers.push(`seed evidence targetP0PoiCount must be at least ${productionPoiTarget}`)
  }
  if (summary.productionReady !== true) {
    blockers.push('seed evidence productionReady must be true')
  }
  if (!hasNoEvidenceBlockers(evidence)) {
    blockers.push(`seed evidence contains blockers: ${evidence.blockers.join('; ')}`)
  }
  return blockers
}

async function checkXichengProductionPoiEvidence({
  rootDir,
  poiManifestEvidencePath,
  poiSeedEvidencePath
}) {
  const [manifestEvidence, seedEvidence] = await Promise.all([
    loadEvidenceInput(rootDir, poiManifestEvidencePath),
    loadEvidenceInput(rootDir, poiSeedEvidencePath)
  ])
  const blockers = [
    ...validateManifestEvidence(manifestEvidence),
    ...validateSeedEvidence(seedEvidence)
  ]
  const details = []
  if (manifestEvidence.path) {
    details.push(`manifest=${manifestEvidence.path}`)
  }
  if (seedEvidence.path) {
    details.push(`seed=${seedEvidence.path}`)
  }

  return check(
    'xicheng-production-poi-evidence',
    blockers.length === 0,
    blockers.length === 0
      ? `Xicheng production POI manifest and seed evidence are ready: ${details.join(', ')}`
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
  stage = 'production',
  poiManifestEvidencePath,
  poiSeedEvidencePath
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
    await checkXichengProductionPoiEvidence({
      rootDir,
      poiManifestEvidencePath,
      poiSeedEvidencePath
    }),
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

function resolveEvidenceFile(rootDir, evidenceFile) {
  if (!evidenceFile) {
    return undefined
  }
  const resolvedRoot = path.resolve(rootDir)
  const resolvedFile = path.isAbsolute(evidenceFile)
    ? path.resolve(evidenceFile)
    : path.resolve(resolvedRoot, evidenceFile)
  const relativePath = path.relative(resolvedRoot, resolvedFile)
  const [topLevelDir] = relativePath.split(path.sep)
  if (
    !relativePath ||
    relativePath.startsWith('..') ||
    path.isAbsolute(relativePath) ||
    !allowedEvidenceDirs.has(topLevelDir)
  ) {
    throw new Error('evidence file must be under qa/, tmp/ or workbench/')
  }
  return resolvedFile
}

function buildReleaseEvidence(result) {
  return {
    artifactType: 'xicheng-yudao-release-readiness',
    summary: {
      stage: result.stage,
      status: result.status,
      totalChecks: result.checks.length,
      passedChecks: result.checks.filter((item) => item.ok).length,
      failedChecks: result.checks.filter((item) => !item.ok).length,
      blockerCount: result.blockers.length
    },
    ...result
  }
}

async function writeReleaseEvidence({ rootDir, evidenceFile, result }) {
  const resolvedFile = resolveEvidenceFile(rootDir, evidenceFile)
  if (!resolvedFile) {
    return
  }
  await mkdir(path.dirname(resolvedFile), { recursive: true })
  await writeFile(resolvedFile, `${JSON.stringify(buildReleaseEvidence(result), null, 2)}\n`)
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
  const rootDir = path.resolve(readArgValue(args, '--root') || process.cwd())
  const envFile = readArgValue(args, '--env-file') || process.env.XUNJING_ENV_FILE
  const env = envFile
    ? { ...process.env, ...await loadEnvFile(envFile) }
    : process.env
  const result = await verifyXichengYudaoReleaseReadiness({
    env,
    rootDir,
    stage: readArgValue(args, '--stage') || process.env.XUNJING_RELEASE_STAGE || 'production',
    poiManifestEvidencePath: readArgValue(args, '--poi-manifest-evidence') ||
      process.env.XICHENG_POI_MANIFEST_EVIDENCE,
    poiSeedEvidencePath: readArgValue(args, '--poi-seed-evidence') ||
      process.env.XICHENG_POI_SEED_EVIDENCE
  })
  await writeReleaseEvidence({
    rootDir,
    evidenceFile: readArgValue(args, '--evidence-file') || readArgValue(args, '--output'),
    result
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
