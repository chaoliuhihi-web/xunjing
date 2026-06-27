import { existsSync, statSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'

const productionPoiTarget = 80
const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])
const defaultMaxEvidenceAgeHours = 24
const allowedClockSkewMs = 5 * 60 * 1000
const expectedXichengRegionCode = 'beijing-xicheng'
const expectedXichengPackageCode = 'XICHENG-MAP-001'

const requiredManifestEvidenceChecks = [
  'manifest-shape',
  'manifest-production-flags',
  'manifest-review-batch',
  'poi-count',
  'poi-identity',
  'poi-coordinates',
  'poi-triggers',
  'poi-source-license',
  'poi-field-evidence',
  'poi-content',
  'poi-audit'
]

const requiredSeedEvidenceChecks = [
  'sql-file',
  'seed-shape',
  'seed-preconditions',
  'poi-count',
  'poi-approval',
  'production-metrics',
  'review-batch-metrics',
  'field-evidence',
  'source-license-evidence',
  'source-documents'
]

const requiredProductionEnvKeys = [
  'SPRING_PROFILES_ACTIVE',
  'SPRING_AI_VECTORSTORE_TYPE',
  'SPRING_AI_MODEL_EMBEDDING',
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
  'DASHSCOPE_EMBEDDING_ENABLED',
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

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
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

function isNonLocalEvidenceRef(value) {
  if (!hasValue(value)) {
    return false
  }
  const normalized = String(value).trim()
  if (/^(?:data|file):/i.test(normalized) || /imageBase64/i.test(normalized)) {
    return false
  }
  try {
    const url = new URL(normalized)
    const protocol = url.protocol.toLowerCase()
    if (protocol === 'https:') {
      return !isLoopback(url.hostname)
    }
    if (['oss:', 'cos:', 's3:'].includes(protocol)) {
      return hasValue(url.hostname) && hasValue(url.pathname.replaceAll('/', ''))
    }
  } catch {
    return false
  }
  return false
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

function checkVectorEmbeddingRuntime(env, stage) {
  const blockers = []
  const vectorStoreType = String(env.SPRING_AI_VECTORSTORE_TYPE || '').trim().toLowerCase()
  const embeddingModel = String(env.SPRING_AI_MODEL_EMBEDDING || '').trim().toLowerCase()
  const dashscopeEmbeddingEnabled = String(env.DASHSCOPE_EMBEDDING_ENABLED || '').trim().toLowerCase()

  if (vectorStoreType !== 'qdrant') {
    blockers.push(`SPRING_AI_VECTORSTORE_TYPE must be qdrant for ${stage}`)
  }
  if (!embeddingModel || embeddingModel === 'none') {
    blockers.push(`SPRING_AI_MODEL_EMBEDDING must enable a real embedding provider for ${stage}`)
  }
  if (dashscopeEmbeddingEnabled !== 'true') {
    blockers.push(`DASHSCOPE_EMBEDDING_ENABLED must be true for ${stage} embeddings`)
  }

  return check(
    'vector-embedding-runtime',
    blockers.length === 0,
    blockers.length === 0
      ? 'Qdrant vector store and embedding runtime are enabled'
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

function resolveBaselineSqlPath(rootDir, yudaoBaselineSqlPath) {
  if (!hasValue(yudaoBaselineSqlPath)) {
    return path.join(rootDir, 'backend/yudao/sql/mysql/ruoyi-vue-pro.sql')
  }
  return path.isAbsolute(yudaoBaselineSqlPath)
    ? path.resolve(yudaoBaselineSqlPath)
    : path.resolve(rootDir, yudaoBaselineSqlPath)
}

function resolveYudaoServerJarPath(rootDir, yudaoServerJarPath) {
  if (!hasValue(yudaoServerJarPath)) {
    return path.join(rootDir, 'backend/yudao/yudao-server/target/yudao-server.jar')
  }
  return path.isAbsolute(yudaoServerJarPath)
    ? path.resolve(yudaoServerJarPath)
    : path.resolve(rootDir, yudaoServerJarPath)
}

async function checkFullYudaoBaseline(rootDir, yudaoBaselineSqlPath) {
  const baselinePath = resolveBaselineSqlPath(rootDir, yudaoBaselineSqlPath)
  const blockers = []
  const summary = {
    yudaoBaselineSqlFile: baselinePath
  }
  if (!isRegularNonEmptySql(baselinePath)) {
    blockers.push(`complete Yudao baseline SQL is missing or not a regular SQL file: ${baselinePath}`)
  } else {
    const sql = await readTextIfExists(baselinePath)
    summary.yudaoBaselineSqlSha256 = sha256(sql)
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
  return {
    ...check(
      'full-yudao-baseline',
      blockers.length === 0,
      blockers.length === 0
        ? `Complete Yudao baseline SQL is present: ${baselinePath}`
        : blockers.join('; '),
      blockers
    ),
    summary
  }
}

async function checkYudaoServerArtifact(rootDir, yudaoServerJarPath) {
  const jarPath = resolveYudaoServerJarPath(rootDir, yudaoServerJarPath)
  const blockers = []
  const summary = {
    yudaoServerJarFile: jarPath
  }
  if (!existsSync(jarPath)) {
    blockers.push(`Yudao server jar is missing or empty: ${jarPath}`)
  } else {
    const stat = statSync(jarPath)
    if (!stat.isFile() || stat.size <= 0) {
      blockers.push(`Yudao server jar is missing or empty: ${jarPath}`)
    } else if (!jarPath.endsWith('.jar')) {
      blockers.push(`Yudao server artifact must be a .jar file: ${jarPath}`)
    } else {
      const bytes = await readFile(jarPath)
      if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
        blockers.push(`Yudao server artifact must be a jar/zip binary: ${jarPath}`)
      } else {
        summary.yudaoServerJarSizeBytes = stat.size
        summary.yudaoServerJarSha256 = sha256(bytes)
      }
    }
  }
  return {
    ...check(
      'yudao-server-artifact',
      blockers.length === 0,
      blockers.length === 0
        ? `Deployable Yudao server jar is present: ${jarPath}`
        : blockers.join('; '),
      blockers
    ),
    summary
  }
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

function checkEvidenceChecks(evidence, requiredChecks, label) {
  const blockers = []
  const checks = Array.isArray(evidence?.checks) ? evidence.checks : []
  const byName = new Map(checks.map((item) => [item.name, item]))
  requiredChecks.forEach((name) => {
    const item = byName.get(name)
    if (!item) {
      blockers.push(`${label} evidence must include ${name}`)
    } else if (item.ok !== true) {
      blockers.push(`${label} evidence check ${name} must be ok`)
    }
  })
  return blockers
}

function checkReviewBatchSummary(summary, label) {
  const blockers = []
  if (!/^xicheng-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(summary.reviewBatchCode || ''))) {
    blockers.push(`${label} evidence reviewBatchCode is required`)
  }
  if (!isNonLocalEvidenceRef(summary.reviewBatchEvidencePackageRef)) {
    blockers.push(`${label} evidence reviewBatchEvidencePackageRef must be a non-local evidence package reference`)
  }
  return blockers
}

function parseMaxEvidenceAgeHours(value) {
  if (value === undefined || value === null || value === '') {
    return defaultMaxEvidenceAgeHours
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('max evidence age hours must be a positive number')
  }
  return parsed
}

function checkEvidenceTimestamp(evidence, label, { now, maxEvidenceAgeMs }) {
  const timestamp = evidence?.checkedAt
  const parsed = typeof timestamp === 'string' ? Date.parse(timestamp) : Number.NaN
  if (Number.isNaN(parsed)) {
    return [`${label} evidence checkedAt must be a valid timestamp`]
  }
  const nowMs = now.getTime()
  if (parsed - nowMs > allowedClockSkewMs) {
    return [`${label} evidence checkedAt must not be in the future`]
  }
  if (nowMs - parsed > maxEvidenceAgeMs) {
    return [`${label} evidence checkedAt must be within the last ${maxEvidenceAgeMs / 60 / 60 / 1000} hours`]
  }
  return []
}

async function checkEvidenceSourceHash(rootDir, evidence, label, fileField, hashField) {
  const blockers = []
  const summary = evidenceSummary(evidence)
  const sourcePath = summary[fileField]
  const expectedSha256 = summary[hashField]

  if (!hasValue(sourcePath)) {
    blockers.push(`${label} evidence ${fileField} is required`)
    return blockers
  }
  if (!/^[a-f0-9]{64}$/.test(String(expectedSha256 || ''))) {
    blockers.push(`${label} evidence ${hashField} must be a sha256 hex digest`)
    return blockers
  }

  const resolvedRoot = path.resolve(rootDir)
  const resolvedSource = path.isAbsolute(sourcePath)
    ? path.resolve(sourcePath)
    : path.resolve(resolvedRoot, sourcePath)
  const relativePath = path.relative(resolvedRoot, resolvedSource)
  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    blockers.push(`${label} evidence ${fileField} must be under release root`)
    return blockers
  }

  try {
    const sourceText = await readFile(resolvedSource, 'utf8')
    if (sha256(sourceText) !== expectedSha256) {
      blockers.push(`${label} evidence ${hashField} must match ${fileField} content`)
    }
  } catch (error) {
    blockers.push(`${label} evidence ${fileField} cannot be read: ${error.message}`)
  }
  return blockers
}

async function validateManifestEvidence(ref, rootDir, freshnessOptions) {
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
  blockers.push(...checkEvidenceTimestamp(evidence, 'manifest', freshnessOptions))
  blockers.push(...await checkEvidenceSourceHash(rootDir, evidence, 'manifest', 'manifestFile', 'manifestSha256'))
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
  blockers.push(...checkReviewBatchSummary(summary, 'manifest'))
  blockers.push(...await checkEvidenceSourceHash(rootDir, evidence, 'manifest source workbook', 'sourceWorkbookFile', 'sourceWorkbookSha256'))
  blockers.push(...checkEvidenceChecks(evidence, requiredManifestEvidenceChecks, 'manifest'))
  if (!hasNoEvidenceBlockers(evidence)) {
    blockers.push(`manifest evidence contains blockers: ${evidence.blockers.join('; ')}`)
  }
  return blockers
}

async function validateSeedEvidence(ref, rootDir, freshnessOptions) {
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
  blockers.push(...checkEvidenceTimestamp(evidence, 'seed', freshnessOptions))
  blockers.push(...await checkEvidenceSourceHash(rootDir, evidence, 'seed', 'sqlFile', 'sqlSha256'))
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
  if (summary.regionCode !== expectedXichengRegionCode) {
    blockers.push('seed evidence regionCode must be beijing-xicheng')
  }
  if (summary.packageCode !== expectedXichengPackageCode) {
    blockers.push('seed evidence packageCode must be XICHENG-MAP-001')
  }
  blockers.push(...checkReviewBatchSummary(summary, 'seed'))
  blockers.push(...checkEvidenceChecks(evidence, requiredSeedEvidenceChecks, 'seed'))
  if (!hasNoEvidenceBlockers(evidence)) {
    blockers.push(`seed evidence contains blockers: ${evidence.blockers.join('; ')}`)
  }
  return blockers
}

async function checkXichengProductionPoiEvidence({
  rootDir,
  poiManifestEvidencePath,
  poiSeedEvidencePath,
  freshnessOptions
}) {
  const [manifestEvidence, seedEvidence] = await Promise.all([
    loadEvidenceInput(rootDir, poiManifestEvidencePath),
    loadEvidenceInput(rootDir, poiSeedEvidencePath)
  ])
  const [manifestBlockers, seedBlockers] = await Promise.all([
    validateManifestEvidence(manifestEvidence, rootDir, freshnessOptions),
    validateSeedEvidence(seedEvidence, rootDir, freshnessOptions)
  ])
  const blockers = [...manifestBlockers, ...seedBlockers]
  const details = []
  if (manifestEvidence.path) {
    details.push(`manifest=${manifestEvidence.path}`)
  }
  if (seedEvidence.path) {
    details.push(`seed=${seedEvidence.path}`)
  }

  return {
    ...check(
      'xicheng-production-poi-evidence',
      blockers.length === 0,
      blockers.length === 0
        ? `Xicheng production POI manifest and seed evidence are ready: ${details.join(', ')}`
        : blockers.join('; '),
      blockers
    ),
    summary: {
      manifestEvidenceFile: manifestEvidence.path,
      seedEvidenceFile: seedEvidence.path,
      poiManifestFile: evidenceSummary(manifestEvidence.data).manifestFile,
      poiManifestSha256: evidenceSummary(manifestEvidence.data).manifestSha256,
      sourceWorkbookFile: evidenceSummary(manifestEvidence.data).sourceWorkbookFile,
      sourceWorkbookSha256: evidenceSummary(manifestEvidence.data).sourceWorkbookSha256,
      poiSeedSqlFile: evidenceSummary(seedEvidence.data).sqlFile,
      poiSeedSqlSha256: evidenceSummary(seedEvidence.data).sqlSha256,
      productionPoiSeedSqlFile: evidenceSummary(seedEvidence.data).sqlFile
    }
  }
}

function extractXichengPoiRows(seed) {
  return seed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("(@map_package_id, 'xicheng-"))
}

function resolveXichengSeedSqlPath(rootDir, seedSqlPath) {
  if (!hasValue(seedSqlPath)) {
    return path.join(rootDir, 'backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql')
  }
  return path.isAbsolute(seedSqlPath)
    ? path.resolve(seedSqlPath)
    : path.resolve(rootDir, seedSqlPath)
}

async function readXichengSeed(rootDir, seedSqlPath) {
  const seedPath = resolveXichengSeedSqlPath(rootDir, seedSqlPath)
  return {
    seedPath,
    seed: await readTextIfExists(seedPath)
  }
}

function xichengSeedCheck(name, blockers, seedPath, readyDetail) {
  return {
    ...check(
      name,
      blockers.length === 0,
      blockers.length === 0 ? readyDetail : blockers.join('; '),
      blockers
    ),
    summary: {
      xichengPoiSeedSqlFile: seedPath
    }
  }
}

async function checkXichengProductionPoi(rootDir, seedSqlPath) {
  const { seedPath, seed } = await readXichengSeed(rootDir, seedSqlPath)
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
  return xichengSeedCheck(
    'xicheng-production-poi',
    blockers,
    seedPath,
    `Xicheng POI seed is production-ready: ${seedPath} (${rows.length}/${productionPoiTarget})`
  )
}

async function checkXichengSourceLicense(rootDir, seedSqlPath) {
  const { seedPath, seed } = await readXichengSeed(rootDir, seedSqlPath)
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

  return xichengSeedCheck(
    'xicheng-source-license',
    blockers,
    seedPath,
    `Every Xicheng POI row in ${seedPath} is fully approved and has POI-level source generation`
  )
}

export async function verifyXichengYudaoReleaseReadiness({
  env = process.env,
  rootDir = process.cwd(),
  stage = 'production',
  yudaoBaselineSqlPath,
  yudaoServerJarPath,
  poiManifestEvidencePath,
  poiSeedEvidencePath,
  maxEvidenceAgeHours = defaultMaxEvidenceAgeHours,
  now = new Date()
} = {}) {
  const normalizedStage = String(stage || 'production').toLowerCase()
  if (!['production', 'staging'].includes(normalizedStage)) {
    throw new Error('stage must be production or staging')
  }

  const freshnessOptions = {
    now,
    maxEvidenceAgeMs: maxEvidenceAgeHours * 60 * 60 * 1000
  }
  const productionPoiEvidenceCheck = await checkXichengProductionPoiEvidence({
    rootDir,
    poiManifestEvidencePath,
    poiSeedEvidencePath,
    freshnessOptions
  })
  const productionPoiSeedSqlPath = productionPoiEvidenceCheck.ok
    ? productionPoiEvidenceCheck.summary?.productionPoiSeedSqlFile
    : undefined

  const checks = [
    checkRuntimeEnv(env, normalizedStage),
    checkVectorEmbeddingRuntime(env, normalizedStage),
    checkHttpsAppApiDomain(env),
    checkRealWechatApp(env),
    checkRealAiProvider(env),
    checkVisionOcrService(env),
    checkObjectStorage(env),
    await checkFullYudaoBaseline(rootDir, yudaoBaselineSqlPath || env.YUDAO_BASELINE_SQL),
    await checkYudaoServerArtifact(rootDir, yudaoServerJarPath || env.YUDAO_SERVER_JAR),
    productionPoiEvidenceCheck,
    await checkXichengProductionPoi(rootDir, productionPoiSeedSqlPath),
    await checkXichengSourceLicense(rootDir, productionPoiSeedSqlPath)
  ]
  const blockers = checks.flatMap((item) => item.blockers || [])
  const ok = checks.every((item) => item.ok)

  return {
    ok,
    status: ok
      ? (normalizedStage === 'production' ? 'PRODUCTION_READY_CANDIDATE' : 'PREPROD_READY_CANDIDATE')
      : 'NOT_READY',
    stage: normalizedStage,
    maxEvidenceAgeHours,
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
  const baselineSummary = result.checks.find((item) => item.name === 'full-yudao-baseline')?.summary || {}
  const serverArtifactSummary = result.checks.find((item) => item.name === 'yudao-server-artifact')?.summary || {}
  const productionPoiEvidenceSummary = result.checks.find((item) => item.name === 'xicheng-production-poi-evidence')?.summary || {}
  return {
    artifactType: 'xicheng-yudao-release-readiness',
    summary: {
      stage: result.stage,
      status: result.status,
      totalChecks: result.checks.length,
      passedChecks: result.checks.filter((item) => item.ok).length,
      failedChecks: result.checks.filter((item) => !item.ok).length,
      blockerCount: result.blockers.length,
      ...baselineSummary,
      ...serverArtifactSummary,
      ...productionPoiEvidenceSummary
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
    yudaoBaselineSqlPath: readArgValue(args, '--yudao-baseline-sql') || env.YUDAO_BASELINE_SQL,
    yudaoServerJarPath: readArgValue(args, '--yudao-server-jar') || env.YUDAO_SERVER_JAR,
    poiManifestEvidencePath: readArgValue(args, '--poi-manifest-evidence') ||
      process.env.XICHENG_POI_MANIFEST_EVIDENCE,
    poiSeedEvidencePath: readArgValue(args, '--poi-seed-evidence') ||
      process.env.XICHENG_POI_SEED_EVIDENCE,
    maxEvidenceAgeHours: parseMaxEvidenceAgeHours(
      readArgValue(args, '--max-evidence-age-hours') || process.env.XICHENG_MAX_EVIDENCE_AGE_HOURS
    )
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
