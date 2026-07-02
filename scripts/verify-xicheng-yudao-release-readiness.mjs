import { existsSync, statSync } from 'node:fs'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'

const productionPoiTarget = 80
const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])
const defaultMaxEvidenceAgeHours = 24
const allowedClockSkewMs = 5 * 60 * 1000
const defaultExpectedGitBranch = 'feature/xicheng-p0'
const expectedXichengRegionCode = 'beijing-xicheng'
const expectedXichengPackageCode = 'XICHENG-MAP-001'
const defaultPoiSourceCoverageEvidencePath = 'qa/xicheng-poi-source-coverage-evidence.json'
const defaultPoiSourceReviewApplyEvidencePath = 'qa/xicheng-poi-source-review-apply-evidence.json'
const defaultPoiProductionReviewApplyEvidencePath = 'qa/xicheng-poi-production-review-apply-evidence.json'
const defaultAdminUiDir = 'backend/yudao/yudao-ui/yudao-ui-admin-vue3/dist'

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
  'media-assets',
  'poi-audit'
]

const requiredWorkbookEvidenceChecks = [
  'workbook-file',
  'workbook-shape',
  'poi-count',
  'poi-identity',
  'poi-source-license',
  'poi-field-evidence',
  'poi-content-audit',
  'no-placeholder-cells'
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
  'media-assets',
  'source-documents'
]

const requiredSourceCoverageEvidenceChecks = [
  'source-review-file',
  'source-pages',
  'poi-source-coverage',
  'secret-redaction'
]

const requiredAiBootstrapEvidenceChecks = [
  'ai-api-key-upsert',
  'default-chat-model-upsert',
  'ai-provider-smoke',
  'secret-redaction'
]

const requiredVisionOcrEvidenceChecks = [
  'vision-provider-request',
  'vision-provider-smoke',
  'secret-redaction'
]

const requiredObjectStorageEvidenceChecks = [
  'object-storage-request',
  'object-storage-write',
  'object-storage-read',
  'object-storage-delete',
  'secret-redaction'
]

const requiredEmbeddingEvidenceChecks = [
  'embedding-provider-request',
  'embedding-provider-smoke',
  'secret-redaction'
]

const requiredQdrantEvidenceChecks = [
  'qdrant-request',
  'qdrant-text-collection',
  'secret-redaction'
]

const requiredYudaoServerBuildEvidenceChecks = [
  'maven-package',
  'yudao-server-jar'
]

const requiredYudaoServerSmokeEvidenceChecks = [
  'https-backend-domain',
  'tenant-header',
  'resource-package-endpoint',
  'public-report-endpoint',
  'media-assets',
  'secret-redaction'
]

const requiredRuntimeSeedEvidenceChecks = [
  'resource-package',
  'poi-count',
  'poi-approval',
  'knowledge-documents',
  'map-points',
  'qr-code',
  'local-candidate-report',
  'secret-redaction'
]

const requiredProductionSeedApplyEvidenceChecks = [
  'seed-evidence',
  'mysql-apply',
  'runtime-seed-production-readiness',
  'secret-redaction'
]

const secretEvidenceKeys = [
  'MYSQL_PASSWORD',
  'REDIS_PASSWORD',
  'OSS_SECRET_KEY',
  'QDRANT_API_KEY',
  'QWEN_API_KEY',
  'DASHSCOPE_API_KEY',
  'WX_MP_SECRET',
  'WX_MINIAPP_SECRET',
  'XUNJING_VISION_API_KEY',
  'INTERNAL_AUTH_TOKEN'
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
  'OSS_REGION',
  'OSS_PATH_STYLE',
  'QDRANT_URL',
  'QDRANT_HOST',
  'QDRANT_GRPC_PORT',
  'QDRANT_API_KEY',
  'QDRANT_TEXT_COLLECTION',
  'QWEN_API_KEY',
  'QWEN_BASE_URL',
  'QWEN_MODEL',
  'QWEN_EMBEDDING_MODEL',
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

const runtimeEnvFingerprintMode = 'redacted-runtime-env-v1'

function isSensitiveRuntimeEnvKey(key) {
  return /(PASSWORD|SECRET|TOKEN|API_?KEY|ACCESS_?KEY|APP_ID|APPID)/i.test(String(key || ''))
}

function buildRuntimeEnvSummary(env) {
  const requiredKeys = [...requiredProductionEnvKeys].sort()
  const presentKeys = requiredKeys.filter((key) => hasValue(env[key]))
  const placeholderKeys = requiredKeys.filter((key) => isPlaceholder(env[key]))
  const nonSensitivePairs = requiredKeys
    .filter((key) => !isSensitiveRuntimeEnvKey(key))
    .map((key) => [key, String(env[key] || '')])
  const sensitivePresence = requiredKeys
    .filter((key) => isSensitiveRuntimeEnvKey(key))
    .map((key) => [key, isPlaceholder(env[key]) ? 'missing-or-placeholder' : 'present'])

  return {
    runtimeEnvFingerprintMode,
    runtimeEnvRequiredKeyCount: requiredKeys.length,
    runtimeEnvPresentKeyCount: presentKeys.length,
    runtimeEnvMissingKeyCount: requiredKeys.length - presentKeys.length,
    runtimeEnvPlaceholderKeyCount: placeholderKeys.length,
    runtimeEnvNonSensitiveKeyCount: nonSensitivePairs.length,
    runtimeEnvSensitiveKeyCount: sensitivePresence.length,
    runtimeEnvNonSecretSha256: sha256(JSON.stringify(nonSensitivePairs)),
    runtimeEnvSecretPresenceSha256: sha256(JSON.stringify(sensitivePresence))
  }
}

function check(name, ok, detail, blockers = []) {
  return { name, ok, detail, blockers }
}

function gitOutput(rootDir, args) {
  try {
    return execFileSync('git', ['-C', rootDir, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim()
  } catch {
    return undefined
  }
}

function checkReleaseSourceRevision(rootDir, expectedGitBranch = defaultExpectedGitBranch) {
  const isGitWorkTree = gitOutput(rootDir, ['rev-parse', '--is-inside-work-tree']) === 'true'
  if (!isGitWorkTree) {
    return {
      ...check(
        'release-source-revision',
        true,
        'Git source revision metadata is unavailable for this release root',
        []
      ),
      summary: {
        gitAvailable: false,
        expectedGitBranch
      }
    }
  }

  const gitBranch = gitOutput(rootDir, ['rev-parse', '--abbrev-ref', 'HEAD']) || 'UNKNOWN'
  const gitCommit = gitOutput(rootDir, ['rev-parse', 'HEAD']) || ''
  const gitStatusShort = gitOutput(rootDir, ['status', '--short']) || ''
  const dirtyEntries = gitStatusShort.split(/\r?\n/).filter(Boolean)
  const blockers = []

  if (!/^[a-f0-9]{40}$/i.test(gitCommit)) {
    blockers.push('git commit SHA must be available before release evidence generation')
  }
  if (hasValue(expectedGitBranch) && gitBranch !== expectedGitBranch) {
    blockers.push(`git branch must be ${expectedGitBranch} before release evidence generation`)
  }
  if (dirtyEntries.length > 0) {
    blockers.push('git worktree must be clean before release evidence generation')
  }

  return {
    ...check(
      'release-source-revision',
      blockers.length === 0,
      blockers.length === 0
        ? `Git source revision is clean: ${gitBranch} ${gitCommit}`
        : blockers.join('; '),
      blockers
    ),
    summary: {
      gitAvailable: true,
      gitBranch,
      expectedGitBranch,
      gitCommit,
      gitDirty: dirtyEntries.length > 0,
      gitDirtyFileCount: dirtyEntries.length
    }
  }
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
    normalized.endsWith('.local') ||
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
  if (!isHttpsUrl(env.XUNJING_APP_API_BASE_URL) || isPlaceholder(env.XUNJING_APP_API_BASE_URL)) {
    blockers.push('XUNJING_APP_API_BASE_URL must be a real HTTPS backend domain')
  }
  return {
    ...check(
      'https-app-api-domain',
      blockers.length === 0,
      blockers.length === 0
        ? 'APP API base URL is HTTPS and non-local'
        : blockers.join('; '),
      blockers
    ),
    summary: {
      appApiBaseUrl: String(env.XUNJING_APP_API_BASE_URL || '').trim()
    }
  }
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

function evidenceSecretLeaks(evidence, env) {
  const serialized = JSON.stringify(evidence || {})
  return secretEvidenceKeys.filter((key) => hasValue(env[key]) && serialized.includes(env[key]))
}

async function checkYudaoAiBootstrapEvidence({ rootDir, aiBootstrapEvidencePath, env, freshnessOptions }) {
  const ref = await loadEvidenceInput(rootDir, aiBootstrapEvidencePath)
  const blockers = []
  if (!ref.path) {
    blockers.push('Yudao AI bootstrap evidence is required before production release')
  } else if (ref.error) {
    blockers.push(`Yudao AI bootstrap evidence cannot be read: ${ref.error}`)
  } else {
    const evidence = ref.data || {}
    const summary = evidenceSummary(evidence)
    if (evidence.artifactType !== 'xicheng-yudao-ai-bootstrap') {
      blockers.push('AI bootstrap evidence artifactType must be xicheng-yudao-ai-bootstrap')
    }
    blockers.push(...checkEvidenceTimestamp(evidence, 'AI bootstrap', freshnessOptions))
    if (evidence.ok !== true) {
      blockers.push('AI bootstrap evidence ok must be true')
    }
    if (evidence.status !== 'YUDAO_AI_MODEL_BOOTSTRAPPED') {
      blockers.push('AI bootstrap evidence status must be YUDAO_AI_MODEL_BOOTSTRAPPED')
    }
    if (String(summary.tenantId || '') !== String(env.XUNJING_TENANT_ID || '')) {
      blockers.push('AI bootstrap evidence tenantId must match XUNJING_TENANT_ID')
    }
    if (String(summary.platform || '') !== String(env.YUDAO_AI_PLATFORM || 'TongYi')) {
      blockers.push('AI bootstrap evidence platform must match YUDAO_AI_PLATFORM')
    }
    if (String(summary.model || '') !== String(env.QWEN_MODEL || '')) {
      blockers.push('AI bootstrap evidence model must match QWEN_MODEL')
    }
    blockers.push(...checkEvidenceChecks(evidence, requiredAiBootstrapEvidenceChecks, 'AI bootstrap'))
    const leakedKeys = evidenceSecretLeaks(evidence, env)
    if (leakedKeys.length > 0) {
      blockers.push(`AI bootstrap evidence must not contain secret values: ${leakedKeys.join(', ')}`)
    }
    if (!hasNoEvidenceBlockers(evidence)) {
      blockers.push(`AI bootstrap evidence contains blockers: ${evidence.blockers.join('; ')}`)
    }
  }

  return {
    ...check(
      'yudao-ai-model-bootstrap',
      blockers.length === 0,
      blockers.length === 0
        ? `Yudao AI default model bootstrap evidence is ready: ${ref.path}`
        : blockers.join('; '),
      blockers
    ),
    summary: {
      aiBootstrapEvidenceFile: ref.path,
      aiBootstrapCheckedAt: ref.data?.checkedAt,
      aiBootstrapTenantId: evidenceSummary(ref.data).tenantId,
      aiBootstrapPlatform: evidenceSummary(ref.data).platform,
      aiBootstrapModel: evidenceSummary(ref.data).model,
      aiBootstrapClient: evidenceSummary(ref.data).client,
      aiBootstrapProviderSmokeHost: evidenceSummary(ref.data).providerSmokeHost,
      aiBootstrapProviderSmokeModel: evidenceSummary(ref.data).providerSmokeModel,
      aiBootstrapProviderSmokeCheckedAt: evidenceSummary(ref.data).providerSmokeCheckedAt
    }
  }
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

function resolveChatCompletionsUrl(baseUrl) {
  const trimmed = String(baseUrl || '').trim().replace(/\/+$/, '')
  return trimmed.endsWith('/chat/completions') ? trimmed : `${trimmed}/chat/completions`
}

function visionExpectedEndpoint(env) {
  try {
    return new URL(resolveChatCompletionsUrl(env.XUNJING_VISION_API_URL))
  } catch {
    return undefined
  }
}

async function checkVisionOcrServiceEvidence({ rootDir, visionOcrEvidencePath, env, freshnessOptions }) {
  const envCheck = checkVisionOcrService(env)
  const blockers = [...(envCheck.blockers || [])]
  const expectedEndpoint = visionExpectedEndpoint(env)
  const ref = await loadEvidenceInput(rootDir, visionOcrEvidencePath)

  if (!ref.path) {
    blockers.push('Vision OCR smoke evidence is required before production release')
  } else if (ref.error) {
    blockers.push(`Vision OCR smoke evidence cannot be read: ${ref.error}`)
  } else {
    const evidence = ref.data || {}
    const summary = evidenceSummary(evidence)
    if (evidence.artifactType !== 'xicheng-vision-ocr-smoke') {
      blockers.push('Vision OCR smoke evidence artifactType must be xicheng-vision-ocr-smoke')
    }
    blockers.push(...checkEvidenceTimestamp(evidence, 'Vision OCR smoke', freshnessOptions))
    if (evidence.ok !== true) {
      blockers.push('Vision OCR smoke evidence ok must be true')
    }
    if (evidence.status !== 'XICHENG_VISION_OCR_SMOKE_READY') {
      blockers.push('Vision OCR smoke evidence status must be XICHENG_VISION_OCR_SMOKE_READY')
    }
    if (String(summary.model || '') !== String(env.XUNJING_VISION_MODEL || '')) {
      blockers.push('Vision OCR smoke evidence model must match XUNJING_VISION_MODEL')
    }
    if (expectedEndpoint && String(summary.providerSmokeHost || '') !== expectedEndpoint.host) {
      blockers.push('Vision OCR smoke evidence providerSmokeHost must match XUNJING_VISION_API_URL host')
    }
    if (expectedEndpoint && String(summary.providerSmokeEndpointPath || '') !== expectedEndpoint.pathname) {
      blockers.push('Vision OCR smoke evidence providerSmokeEndpointPath must match XUNJING_VISION_API_URL')
    }
    if (Number(summary.providerSmokeHttpStatus || 0) !== 200) {
      blockers.push('Vision OCR smoke evidence providerSmokeHttpStatus must be 200')
    }
    if (!isNonLocalEvidenceRef(summary.sampleImageRef)) {
      blockers.push('Vision OCR smoke evidence sampleImageRef must be a non-local HTTPS, oss, cos or s3 reference')
    }
    if (!Array.isArray(summary.labels) || !summary.labels.includes('xunjing_vision_smoke')) {
      blockers.push('Vision OCR smoke evidence labels must include xunjing_vision_smoke')
    }
    blockers.push(...checkEvidenceChecks(evidence, requiredVisionOcrEvidenceChecks, 'Vision OCR smoke'))
    const leakedKeys = evidenceSecretLeaks(evidence, env)
    if (leakedKeys.length > 0) {
      blockers.push(`Vision OCR smoke evidence must not contain secret values: ${leakedKeys.join(', ')}`)
    }
    if (!hasNoEvidenceBlockers(evidence)) {
      blockers.push(`Vision OCR smoke evidence contains blockers: ${evidence.blockers.join('; ')}`)
    }
  }

  return {
    ...check(
      'vision-ocr-service',
      blockers.length === 0,
      blockers.length === 0
        ? `OCR/vision service provider smoke evidence is ready: ${ref.path}`
        : blockers.join('; '),
      blockers
    ),
    summary: {
      visionOcrEvidenceFile: ref.path,
      visionOcrCheckedAt: ref.data?.checkedAt,
      visionOcrModel: evidenceSummary(ref.data).model,
      visionOcrProviderSmokeCheckedAt: evidenceSummary(ref.data).providerSmokeCheckedAt,
      visionOcrProviderSmokeHost: evidenceSummary(ref.data).providerSmokeHost,
      visionOcrProviderSmokeEndpointPath: evidenceSummary(ref.data).providerSmokeEndpointPath,
      visionOcrProviderSmokeHttpStatus: evidenceSummary(ref.data).providerSmokeHttpStatus,
      visionOcrSampleImageRef: evidenceSummary(ref.data).sampleImageRef,
      visionOcrLabels: evidenceSummary(ref.data).labels
    }
  }
}

function checkObjectStorage(env) {
  const keys = ['OSS_ENDPOINT', 'OSS_BUCKET', 'OSS_PREFIX', 'OSS_ACCESS_KEY', 'OSS_SECRET_KEY', 'OSS_REGION', 'OSS_PATH_STYLE']
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

function objectStorageExpectedEndpoint(env) {
  try {
    const value = String(env.OSS_ENDPOINT || '').trim()
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
  } catch {
    return undefined
  }
}

function normalizeBooleanEnv(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true
  }
  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false
  }
  return undefined
}

function embeddingExpectedEndpoint(env) {
  try {
    const value = String(env.QWEN_BASE_URL || '').trim().replace(/\/+$/, '')
    const url = new URL(value.endsWith('/embeddings') ? value : `${value}/embeddings`)
    return url
  } catch {
    return undefined
  }
}

async function checkEmbeddingSmokeEvidence({ rootDir, embeddingEvidencePath, env, freshnessOptions }) {
  const blockers = []
  const expectedEndpoint = embeddingExpectedEndpoint(env)
  const expectedModel = String(env.QWEN_EMBEDDING_MODEL || '').trim()
  const ref = await loadEvidenceInput(rootDir, embeddingEvidencePath)

  if (!ref.path) {
    blockers.push('Embedding smoke evidence is required before production release')
  } else if (ref.error) {
    blockers.push(`Embedding smoke evidence cannot be read: ${ref.error}`)
  } else {
    const evidence = ref.data || {}
    const summary = evidenceSummary(evidence)
    if (evidence.artifactType !== 'xicheng-embedding-smoke') {
      blockers.push('Embedding smoke evidence artifactType must be xicheng-embedding-smoke')
    }
    blockers.push(...checkEvidenceTimestamp(evidence, 'Embedding smoke', freshnessOptions))
    if (evidence.ok !== true) {
      blockers.push('Embedding smoke evidence ok must be true')
    }
    if (evidence.status !== 'XICHENG_EMBEDDING_SMOKE_READY') {
      blockers.push('Embedding smoke evidence status must be XICHENG_EMBEDDING_SMOKE_READY')
    }
    if (hasValue(expectedModel) && String(summary.model || '') !== expectedModel) {
      blockers.push('Embedding smoke evidence model must match QWEN_EMBEDDING_MODEL')
    }
    if (expectedEndpoint && String(summary.providerSmokeHost || '') !== expectedEndpoint.host) {
      blockers.push('Embedding smoke evidence providerSmokeHost must match QWEN_BASE_URL host')
    }
    if (expectedEndpoint && String(summary.providerSmokeEndpointPath || '') !== expectedEndpoint.pathname) {
      blockers.push('Embedding smoke evidence providerSmokeEndpointPath must match QWEN_BASE_URL embeddings endpoint')
    }
    if (Number(summary.providerSmokeHttpStatus || 0) !== 200) {
      blockers.push('Embedding smoke evidence providerSmokeHttpStatus must be 200')
    }
    if (Number(summary.vectorDimensions || 0) <= 0) {
      blockers.push('Embedding smoke evidence vectorDimensions must be positive')
    }
    if (Number(summary.finiteValueCount || 0) !== Number(summary.vectorDimensions || 0)) {
      blockers.push('Embedding smoke evidence finiteValueCount must match vectorDimensions')
    }
    blockers.push(...checkEvidenceChecks(evidence, requiredEmbeddingEvidenceChecks, 'Embedding smoke'))
    const leakedKeys = evidenceSecretLeaks(evidence, env)
    if (leakedKeys.length > 0) {
      blockers.push(`Embedding smoke evidence must not contain secret values: ${leakedKeys.join(', ')}`)
    }
    if (!hasNoEvidenceBlockers(evidence)) {
      blockers.push(`Embedding smoke evidence contains blockers: ${evidence.blockers.join('; ')}`)
    }
  }

  return {
    ...check(
      'embedding-provider-smoke',
      blockers.length === 0,
      blockers.length === 0
        ? `Embedding provider smoke evidence is ready: ${ref.path}`
        : blockers.join('; '),
      blockers
    ),
    summary: {
      embeddingEvidenceFile: ref.path,
      embeddingCheckedAt: ref.data?.checkedAt,
      embeddingProviderSmokeCheckedAt: evidenceSummary(ref.data).providerSmokeCheckedAt,
      embeddingProviderSmokeHost: evidenceSummary(ref.data).providerSmokeHost,
      embeddingProviderSmokeEndpointPath: evidenceSummary(ref.data).providerSmokeEndpointPath,
      embeddingProviderSmokeModel: evidenceSummary(ref.data).model,
      embeddingProviderSmokeHttpStatus: evidenceSummary(ref.data).providerSmokeHttpStatus,
      embeddingVectorDimensions: evidenceSummary(ref.data).vectorDimensions,
      embeddingFiniteValueCount: evidenceSummary(ref.data).finiteValueCount
    }
  }
}

function qdrantExpectedEndpoint(env) {
  try {
    const value = String(env.QDRANT_URL || '').trim()
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
  } catch {
    return undefined
  }
}

async function checkQdrantSmokeEvidence({ rootDir, qdrantEvidencePath, env, freshnessOptions }) {
  const blockers = []
  const expectedEndpoint = qdrantExpectedEndpoint(env)
  const expectedTextCollection = String(env.QDRANT_TEXT_COLLECTION || '').trim()
  const expectedImageCollection = String(env.QDRANT_IMAGE_COLLECTION || '').trim()
  const ref = await loadEvidenceInput(rootDir, qdrantEvidencePath)
  const refSummary = evidenceSummary(ref.data)

  if (!ref.path) {
    blockers.push('Qdrant smoke evidence is required before production release')
  } else if (ref.error) {
    blockers.push(`Qdrant smoke evidence cannot be read: ${ref.error}`)
  } else {
    const evidence = ref.data || {}
    const summary = evidenceSummary(evidence)
    if (evidence.artifactType !== 'xicheng-qdrant-smoke') {
      blockers.push('Qdrant smoke evidence artifactType must be xicheng-qdrant-smoke')
    }
    blockers.push(...checkEvidenceTimestamp(evidence, 'Qdrant smoke', freshnessOptions))
    if (evidence.ok !== true) {
      blockers.push('Qdrant smoke evidence ok must be true')
    }
    if (evidence.status !== 'XICHENG_QDRANT_SMOKE_READY') {
      blockers.push('Qdrant smoke evidence status must be XICHENG_QDRANT_SMOKE_READY')
    }
    if (hasValue(expectedTextCollection) && String(summary.textCollection || '') !== expectedTextCollection) {
      blockers.push('Qdrant smoke evidence textCollection must match QDRANT_TEXT_COLLECTION')
    }
    const hasImageCollectionEvidence = hasValue(summary.imageCollection) ||
      Number(summary.imageCollectionHttpStatus || 0) > 0 ||
      hasValue(summary.imageCollectionStatus)
    if (
      hasImageCollectionEvidence &&
      hasValue(expectedImageCollection) &&
      String(summary.imageCollection || '') !== expectedImageCollection
    ) {
      blockers.push('Qdrant smoke evidence imageCollection must match QDRANT_IMAGE_COLLECTION')
    }
    if (expectedEndpoint && String(summary.providerSmokeHost || '') !== expectedEndpoint.host) {
      blockers.push('Qdrant smoke evidence providerSmokeHost must match QDRANT_URL host')
    }
    if (String(summary.providerSmokeEndpointPath || '') !== '/collections') {
      blockers.push('Qdrant smoke evidence providerSmokeEndpointPath must be /collections')
    }
    if (Number(summary.textCollectionHttpStatus || 0) < 200 || Number(summary.textCollectionHttpStatus || 0) >= 300) {
      blockers.push('Qdrant smoke evidence textCollectionHttpStatus must be 2xx')
    }
    if (
      hasImageCollectionEvidence &&
      (Number(summary.imageCollectionHttpStatus || 0) < 200 || Number(summary.imageCollectionHttpStatus || 0) >= 300)
    ) {
      blockers.push('Qdrant smoke evidence imageCollectionHttpStatus must be 2xx')
    }
    if (String(summary.textCollectionStatus || '') !== 'green') {
      blockers.push('Qdrant smoke evidence textCollectionStatus must be green')
    }
    if (hasImageCollectionEvidence && String(summary.imageCollectionStatus || '') !== 'green') {
      blockers.push('Qdrant smoke evidence imageCollectionStatus must be green')
    }
    blockers.push(...checkEvidenceChecks(evidence, requiredQdrantEvidenceChecks, 'Qdrant smoke'))
    const leakedKeys = evidenceSecretLeaks(evidence, env)
    if (leakedKeys.length > 0) {
      blockers.push(`Qdrant smoke evidence must not contain secret values: ${leakedKeys.join(', ')}`)
    }
    if (!hasNoEvidenceBlockers(evidence)) {
      blockers.push(`Qdrant smoke evidence contains blockers: ${evidence.blockers.join('; ')}`)
    }
  }

  const summary = {
    qdrantEvidenceFile: ref.path,
    qdrantCheckedAt: ref.data?.checkedAt,
    qdrantProviderSmokeCheckedAt: refSummary.providerSmokeCheckedAt,
    qdrantProviderSmokeHost: refSummary.providerSmokeHost,
    qdrantProviderSmokeEndpointPath: refSummary.providerSmokeEndpointPath,
    qdrantTextCollection: refSummary.textCollection,
    qdrantTextCollectionHttpStatus: refSummary.textCollectionHttpStatus,
    qdrantTextCollectionStatus: refSummary.textCollectionStatus,
    qdrantTextCollectionPointsCount: refSummary.textCollectionPointsCount
  }
  const hasRefImageCollectionEvidence = hasValue(refSummary.imageCollection) ||
    Number(refSummary.imageCollectionHttpStatus || 0) > 0 ||
    hasValue(refSummary.imageCollectionStatus)
  if (hasRefImageCollectionEvidence) {
    summary.qdrantImageCollection = refSummary.imageCollection
    summary.qdrantImageCollectionHttpStatus = refSummary.imageCollectionHttpStatus
    summary.qdrantImageCollectionStatus = refSummary.imageCollectionStatus
    summary.qdrantImageCollectionPointsCount = refSummary.imageCollectionPointsCount
  }

  return {
    ...check(
      'qdrant-vector-store',
      blockers.length === 0,
      blockers.length === 0
        ? `Qdrant vector collection smoke evidence is ready: ${ref.path}`
        : blockers.join('; '),
      blockers
    ),
    summary
  }
}

async function checkObjectStorageEvidence({ rootDir, objectStorageEvidencePath, env, freshnessOptions }) {
  const envCheck = checkObjectStorage(env)
  const blockers = [...(envCheck.blockers || [])]
  const expectedEndpoint = objectStorageExpectedEndpoint(env)
  const expectedPrefix = String(env.OSS_PREFIX || '').trim()
  const expectedBucket = String(env.OSS_BUCKET || '').trim()
  const expectedRegion = String(env.OSS_REGION || '').trim()
  const expectedPathStyle = normalizeBooleanEnv(env.OSS_PATH_STYLE)
  const ref = await loadEvidenceInput(rootDir, objectStorageEvidencePath)

  if (!ref.path) {
    blockers.push('Object storage smoke evidence is required before production release')
  } else if (ref.error) {
    blockers.push(`Object storage smoke evidence cannot be read: ${ref.error}`)
  } else {
    const evidence = ref.data || {}
    const summary = evidenceSummary(evidence)
    if (evidence.artifactType !== 'xicheng-object-storage-smoke') {
      blockers.push('Object storage smoke evidence artifactType must be xicheng-object-storage-smoke')
    }
    blockers.push(...checkEvidenceTimestamp(evidence, 'Object storage smoke', freshnessOptions))
    if (evidence.ok !== true) {
      blockers.push('Object storage smoke evidence ok must be true')
    }
    if (evidence.status !== 'XICHENG_OBJECT_STORAGE_SMOKE_READY') {
      blockers.push('Object storage smoke evidence status must be XICHENG_OBJECT_STORAGE_SMOKE_READY')
    }
    if (expectedEndpoint && String(summary.endpointHost || '') !== expectedEndpoint.host) {
      blockers.push('Object storage smoke evidence endpointHost must match OSS_ENDPOINT host')
    }
    if (hasValue(expectedBucket) && String(summary.bucket || '') !== expectedBucket) {
      blockers.push('Object storage smoke evidence bucket must match OSS_BUCKET')
    }
    if (hasValue(expectedPrefix) && String(summary.prefix || '') !== expectedPrefix) {
      blockers.push('Object storage smoke evidence prefix must match OSS_PREFIX')
    }
    if (hasValue(expectedRegion) && String(summary.region || '') !== expectedRegion) {
      blockers.push('Object storage smoke evidence region must match OSS_REGION')
    }
    if (expectedPathStyle !== undefined && summary.pathStyle !== expectedPathStyle) {
      blockers.push('Object storage smoke evidence pathStyle must match OSS_PATH_STYLE')
    }
    if (!/^[a-f0-9]{64}$/.test(String(summary.objectKeySha256 || ''))) {
      blockers.push('Object storage smoke evidence objectKeySha256 must be a sha256 hex digest')
    }
    if (Number(summary.putHttpStatus || 0) < 200 || Number(summary.putHttpStatus || 0) >= 300) {
      blockers.push('Object storage smoke evidence putHttpStatus must be 2xx')
    }
    if (Number(summary.getHttpStatus || 0) < 200 || Number(summary.getHttpStatus || 0) >= 300) {
      blockers.push('Object storage smoke evidence getHttpStatus must be 2xx')
    }
    if (![200, 202, 204].includes(Number(summary.deleteHttpStatus || 0))) {
      blockers.push('Object storage smoke evidence deleteHttpStatus must be 200, 202 or 204')
    }
    if (summary.readBackMatches !== true) {
      blockers.push('Object storage smoke evidence readBackMatches must be true')
    }
    if (summary.deleted !== true) {
      blockers.push('Object storage smoke evidence deleted must be true')
    }
    blockers.push(...checkEvidenceChecks(evidence, requiredObjectStorageEvidenceChecks, 'Object storage smoke'))
    const leakedKeys = evidenceSecretLeaks(evidence, env)
    if (leakedKeys.length > 0) {
      blockers.push(`Object storage smoke evidence must not contain secret values: ${leakedKeys.join(', ')}`)
    }
    if (!hasNoEvidenceBlockers(evidence)) {
      blockers.push(`Object storage smoke evidence contains blockers: ${evidence.blockers.join('; ')}`)
    }
  }

  return {
    ...check(
      'object-storage',
      blockers.length === 0,
      blockers.length === 0
        ? `Object storage write/read/delete smoke evidence is ready: ${ref.path}`
        : blockers.join('; '),
      blockers
    ),
    summary: {
      objectStorageEvidenceFile: ref.path,
      objectStorageCheckedAt: ref.data?.checkedAt,
      objectStorageProviderSmokeCheckedAt: evidenceSummary(ref.data).providerSmokeCheckedAt,
      objectStorageProviderSmokeHost: evidenceSummary(ref.data).endpointHost,
      objectStorageRequestHost: evidenceSummary(ref.data).requestHost,
      objectStorageBucket: evidenceSummary(ref.data).bucket,
      objectStoragePrefix: evidenceSummary(ref.data).prefix,
      objectStorageObjectKeySha256: evidenceSummary(ref.data).objectKeySha256,
      objectStorageRegion: evidenceSummary(ref.data).region,
      objectStoragePathStyle: evidenceSummary(ref.data).pathStyle,
      objectStoragePutHttpStatus: evidenceSummary(ref.data).putHttpStatus,
      objectStorageGetHttpStatus: evidenceSummary(ref.data).getHttpStatus,
      objectStorageDeleteHttpStatus: evidenceSummary(ref.data).deleteHttpStatus,
      objectStorageReadBackMatches: evidenceSummary(ref.data).readBackMatches,
      objectStorageDeleted: evidenceSummary(ref.data).deleted
    }
  }
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

function detectBaselineCredentialFindings(sql) {
  const findings = new Set()
  for (const line of sql.split(/\r?\n/)) {
    if (/INSERT INTO `infra_file_config`/i.test(line) &&
      /(?:accessKey|accessSecret|"password")/i.test(line) &&
      !line.includes('<redacted-storage-credential>')) {
      findings.add('infra_file_config')
    }
    if (/INSERT INTO `system_mail_account`/i.test(line) && !line.includes('<redacted-mail-password>')) {
      findings.add('system_mail_account')
    }
    if (/INSERT INTO `system_sms_channel`/i.test(line) && !line.includes('<redacted-sms-credential>')) {
      findings.add('system_sms_channel')
    }
  }
  for (const [name, pattern] of [
    ['aliyun-access-key', /\bLTAI[0-9A-Za-z]{16,}\b/],
    ['dingtalk-secret', /\bSEC[0-9A-Za-z]{32,}\b/],
    ['smtp-auth-code', /\b[A-Z0-9]{16,}\b/]
  ]) {
    if (pattern.test(sql)) {
      findings.add(name)
    }
  }
  return [...findings].sort()
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

function resolveAdminUiDirPath(rootDir, adminUiDirPath) {
  if (!hasValue(adminUiDirPath)) {
    return path.join(rootDir, defaultAdminUiDir)
  }
  return path.isAbsolute(adminUiDirPath)
    ? path.resolve(adminUiDirPath)
    : path.resolve(rootDir, adminUiDirPath)
}

async function countAdminAssets(adminUiDir) {
  const assetsDir = path.join(adminUiDir, 'assets')
  if (!existsSync(assetsDir) || !statSync(assetsDir).isDirectory()) {
    return {
      adminUiAssetFileCount: 0,
      adminUiJsAssetCount: 0,
      adminUiCssAssetCount: 0
    }
  }

  const entries = await readdir(assetsDir, { withFileTypes: true })
  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name)
  return {
    adminUiAssetFileCount: files.length,
    adminUiJsAssetCount: files.filter((name) => name.endsWith('.js')).length,
    adminUiCssAssetCount: files.filter((name) => name.endsWith('.css')).length
  }
}

async function checkAdminUiArtifact(rootDir, adminUiDirPath) {
  const adminUiDir = resolveAdminUiDirPath(rootDir, adminUiDirPath)
  const indexHtmlFile = path.join(adminUiDir, 'index.html')
  const blockers = []
  const summary = {
    adminUiDir,
    adminUiIndexHtmlFile: indexHtmlFile,
    adminUiIndexHtmlSha256: undefined,
    adminUiAssetFileCount: 0,
    adminUiJsAssetCount: 0,
    adminUiCssAssetCount: 0
  }

  if (!existsSync(adminUiDir) || !statSync(adminUiDir).isDirectory()) {
    blockers.push(`admin UI artifact directory is missing: ${adminUiDir}`)
  } else if (!existsSync(indexHtmlFile) || !statSync(indexHtmlFile).isFile()) {
    blockers.push(`admin UI artifact index.html is missing: ${indexHtmlFile}`)
    Object.assign(summary, await countAdminAssets(adminUiDir))
  } else {
    const indexHtml = await readFile(indexHtmlFile, 'utf8')
    Object.assign(summary, await countAdminAssets(adminUiDir))
    summary.adminUiIndexHtmlSha256 = sha256(indexHtml)

    if (/完整\s*Yudao\s*Admin\s*前端构建物尚未部署|运营端入口已接通/.test(indexHtml)) {
      blockers.push('admin UI artifact must be the built Yudao Admin SPA, not the placeholder landing page')
    }
    if (!/id=["']app["']/.test(indexHtml)) {
      blockers.push('admin UI artifact index.html must mount the Vue app with id="app"')
    }
    if (!/(?:type=["']module["'][^>]+src=|src=[^>]+\.js)/.test(indexHtml)) {
      blockers.push('admin UI artifact index.html must reference a built JavaScript bundle')
    }
    if (summary.adminUiJsAssetCount < 1) {
      blockers.push('admin UI artifact must include at least one built JavaScript asset')
    }
  }

  return {
    ...check(
      'xunjing-admin-ui-artifact',
      blockers.length === 0,
      blockers.length === 0
        ? `Xunjing Yudao Admin UI artifact is ready: ${adminUiDir}`
        : blockers.join('; '),
      blockers
    ),
    summary
  }
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
    const credentialFindings = detectBaselineCredentialFindings(sql)
    if (credentialFindings.length > 0) {
      summary.yudaoBaselineCredentialFindings = credentialFindings
      blockers.push(`complete Yudao baseline SQL must not contain raw provider credentials: ${credentialFindings.join(', ')}`)
    }
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

async function checkYudaoServerBuildEvidence({
  rootDir,
  yudaoServerBuildEvidencePath,
  yudaoServerArtifactSummary,
  sourceRevisionSummary,
  freshnessOptions
}) {
  const blockers = []
  const ref = await loadEvidenceInput(rootDir, yudaoServerBuildEvidencePath)
  const artifactJarFile = yudaoServerArtifactSummary?.yudaoServerJarFile
  const artifactJarSha256 = yudaoServerArtifactSummary?.yudaoServerJarSha256
  const artifactJarSizeBytes = Number(yudaoServerArtifactSummary?.yudaoServerJarSizeBytes || 0)

  if (!ref.path) {
    blockers.push('Yudao server build evidence is required before production release')
  } else if (ref.error) {
    blockers.push(`Yudao server build evidence cannot be read: ${ref.error}`)
  } else {
    const evidence = ref.data || {}
    const summary = evidenceSummary(evidence)
    const evidenceJarFile = hasValue(summary.jarFile)
      ? (path.isAbsolute(summary.jarFile) ? path.resolve(summary.jarFile) : path.resolve(rootDir, summary.jarFile))
      : undefined
    if (evidence.artifactType !== 'xicheng-yudao-server-build') {
      blockers.push('Yudao server build evidence artifactType must be xicheng-yudao-server-build')
    }
    blockers.push(...checkEvidenceTimestamp(evidence, 'Yudao server build', freshnessOptions))
    if (evidence.ok !== true) {
      blockers.push('Yudao server build evidence ok must be true')
    }
    if (evidence.status !== 'YUDAO_SERVER_JAR_BUILT') {
      blockers.push('Yudao server build evidence status must be YUDAO_SERVER_JAR_BUILT')
    }
    if (!hasValue(summary.buildMethod)) {
      blockers.push('Yudao server build evidence buildMethod is required')
    }
    if (sourceRevisionSummary?.gitAvailable === true) {
      if (summary.gitAvailable !== true) {
        blockers.push('Yudao server build evidence gitAvailable must be true when release source revision is git-backed')
      }
      if (!/^[a-f0-9]{40}$/i.test(String(summary.gitCommit || ''))) {
        blockers.push('Yudao server build evidence gitCommit must be a 40-character git commit SHA')
      } else if (summary.gitCommit !== sourceRevisionSummary.gitCommit) {
        blockers.push('Yudao server build evidence gitCommit must match release gitCommit')
      }
      if (hasValue(summary.gitBranch) && hasValue(sourceRevisionSummary.gitBranch) && summary.gitBranch !== sourceRevisionSummary.gitBranch) {
        blockers.push('Yudao server build evidence gitBranch must match release gitBranch')
      }
      if (summary.gitDirty !== false) {
        blockers.push('Yudao server build evidence gitDirty must be false')
      }
      if (Number(summary.gitDirtyFileCount || 0) !== 0) {
        blockers.push('Yudao server build evidence gitDirtyFileCount must be 0')
      }
    }
    if (!evidenceJarFile) {
      blockers.push('Yudao server build evidence jarFile is required')
    } else if (artifactJarFile && evidenceJarFile !== path.resolve(artifactJarFile)) {
      blockers.push('Yudao server build evidence jarFile must match the release jar')
    }
    if (!hasValue(summary.jarSha256)) {
      blockers.push('Yudao server build evidence jarSha256 is required')
    } else if (artifactJarSha256 && summary.jarSha256 !== artifactJarSha256) {
      blockers.push('Yudao server build evidence jarSha256 must match the release jar')
    }
    if (Number(summary.jarSizeBytes || 0) <= 0) {
      blockers.push('Yudao server build evidence jarSizeBytes must be positive')
    } else if (artifactJarSizeBytes > 0 && Number(summary.jarSizeBytes) !== artifactJarSizeBytes) {
      blockers.push('Yudao server build evidence jarSizeBytes must match the release jar')
    }
    blockers.push(...checkEvidenceChecks(evidence, requiredYudaoServerBuildEvidenceChecks, 'Yudao server build'))
    if (!hasNoEvidenceBlockers(evidence)) {
      blockers.push(`Yudao server build evidence contains blockers: ${evidence.blockers.join('; ')}`)
    }
  }

  const summary = evidenceSummary(ref.data)
  return {
    ...check(
      'yudao-server-build-evidence',
      blockers.length === 0,
      blockers.length === 0
        ? `Yudao server build evidence is ready: ${ref.path}`
        : blockers.join('; '),
      blockers
    ),
    summary: {
      yudaoServerBuildEvidenceFile: ref.path,
      yudaoServerBuildCheckedAt: ref.data?.checkedAt,
      yudaoServerBuildMethod: summary.buildMethod,
      yudaoServerBuildGitAvailable: summary.gitAvailable,
      yudaoServerBuildGitBranch: summary.gitBranch,
      yudaoServerBuildGitCommit: summary.gitCommit,
      yudaoServerBuildGitDirty: summary.gitDirty,
      yudaoServerBuildGitDirtyFileCount: summary.gitDirtyFileCount,
      yudaoServerBuildJarFile: summary.jarFile,
      yudaoServerBuildJarSizeBytes: summary.jarSizeBytes,
      yudaoServerBuildJarSha256: summary.jarSha256,
      yudaoServerBuildTestsIncluded: summary.testsIncluded
    }
  }
}

async function checkYudaoServerSmokeEvidence({
  rootDir,
  env,
  yudaoServerSmokeEvidencePath,
  yudaoServerBuildSummary,
  freshnessOptions
}) {
  const blockers = []
  const ref = await loadEvidenceInput(rootDir, yudaoServerSmokeEvidencePath)
  const expectedBaseUrl = String(env.XUNJING_APP_API_BASE_URL || '').trim().replace(/\/+$/, '')
  const expectedTenantId = String(env.XUNJING_TENANT_ID || '').trim()

  if (!ref.path) {
    blockers.push('Yudao server smoke evidence is required before production release')
  } else if (ref.error) {
    blockers.push(`Yudao server smoke evidence cannot be read: ${ref.error}`)
  } else {
    const evidence = ref.data || {}
    const summary = evidenceSummary(evidence)
    const evidenceBaseUrl = String(summary.baseUrl || '').trim().replace(/\/+$/, '')
    if (evidence.artifactType !== 'xicheng-yudao-server-smoke') {
      blockers.push('Yudao server smoke evidence artifactType must be xicheng-yudao-server-smoke')
    }
    blockers.push(...checkEvidenceTimestamp(evidence, 'Yudao server smoke', freshnessOptions))
    if (evidence.ok !== true) {
      blockers.push('Yudao server smoke evidence ok must be true')
    }
    if (evidence.status !== 'XICHENG_YUDAO_SERVER_SMOKE_READY') {
      blockers.push('Yudao server smoke evidence status must be XICHENG_YUDAO_SERVER_SMOKE_READY')
    }
    if (!hasValue(summary.baseUrl)) {
      blockers.push('Yudao server smoke evidence baseUrl is required')
    } else if (expectedBaseUrl && evidenceBaseUrl !== expectedBaseUrl) {
      blockers.push('Yudao server smoke evidence baseUrl must match XUNJING_APP_API_BASE_URL')
    }
    if (!hasValue(summary.tenantId)) {
      blockers.push('Yudao server smoke evidence tenantId is required')
    } else if (expectedTenantId && String(summary.tenantId) !== expectedTenantId) {
      blockers.push('Yudao server smoke evidence tenantId must match XUNJING_TENANT_ID')
    }
    if (summary.packageCode !== 'XICHENG-MAP-001') {
      blockers.push('Yudao server smoke evidence packageCode must be XICHENG-MAP-001')
    }
    if (summary.packageRegionCode !== 'beijing-xicheng') {
      blockers.push('Yudao server smoke evidence packageRegionCode must be beijing-xicheng')
    }
    if (Number(summary.packageHttpStatus || 0) < 200 || Number(summary.packageHttpStatus || 0) >= 300) {
      blockers.push('Yudao server smoke evidence packageHttpStatus must be 2xx')
    }
    if (Number(summary.publicReportHttpStatus || 0) < 200 || Number(summary.publicReportHttpStatus || 0) >= 300) {
      blockers.push('Yudao server smoke evidence publicReportHttpStatus must be 2xx')
    }
    if (Number(summary.publicReportPackageCount || 0) < 1) {
      blockers.push('Yudao server smoke evidence publicReportPackageCount must be at least 1')
    }
    if (Number(summary.publicReportReviewedKnowledgeCount || 0) < productionPoiTarget) {
      blockers.push(`Yudao server smoke evidence publicReportReviewedKnowledgeCount must be at least ${productionPoiTarget}`)
    }
    if (Number(summary.publicReportReviewedMediaCount || 0) < 8) {
      blockers.push('Yudao server smoke evidence publicReportReviewedMediaCount must be at least 8')
    }
    if (Number(summary.mediaAssetCount || 0) < 8) {
      blockers.push('Yudao server smoke evidence mediaAssetCount must be at least 8')
    }
    if (Number(summary.publicReportMapPointCount || 0) < productionPoiTarget) {
      blockers.push(`Yudao server smoke evidence publicReportMapPointCount must be at least ${productionPoiTarget}`)
    }
    if (hasValue(yudaoServerBuildSummary?.yudaoServerBuildEvidenceFile)) {
      const expectedBuildEvidenceFile = normalizeEvidencePath(rootDir, yudaoServerBuildSummary.yudaoServerBuildEvidenceFile)
      const actualBuildEvidenceFile = hasValue(summary.buildEvidenceFile)
        ? normalizeEvidencePath(rootDir, summary.buildEvidenceFile)
        : ''
      if (!actualBuildEvidenceFile) {
        blockers.push('Yudao server smoke evidence buildEvidenceFile is required')
      } else if (actualBuildEvidenceFile !== expectedBuildEvidenceFile) {
        blockers.push('Yudao server smoke evidence buildEvidenceFile must match Yudao server build evidence file')
      }
    }
    if (hasValue(yudaoServerBuildSummary?.yudaoServerBuildGitCommit)) {
      if (!hasValue(summary.buildGitCommit)) {
        blockers.push('Yudao server smoke evidence buildGitCommit is required')
      } else if (summary.buildGitCommit !== yudaoServerBuildSummary.yudaoServerBuildGitCommit) {
        blockers.push('Yudao server smoke evidence buildGitCommit must match Yudao server build evidence gitCommit')
      }
      if (summary.buildGitDirty !== false) {
        blockers.push('Yudao server smoke evidence buildGitDirty must be false')
      }
    }
    if (hasValue(yudaoServerBuildSummary?.yudaoServerBuildJarSha256)) {
      if (!hasValue(summary.buildJarSha256)) {
        blockers.push('Yudao server smoke evidence buildJarSha256 is required')
      } else if (summary.buildJarSha256 !== yudaoServerBuildSummary.yudaoServerBuildJarSha256) {
        blockers.push('Yudao server smoke evidence buildJarSha256 must match Yudao server build evidence jarSha256')
      }
    }
    blockers.push(...checkEvidenceChecks(evidence, requiredYudaoServerSmokeEvidenceChecks, 'Yudao server smoke'))
    if (!hasNoEvidenceBlockers(evidence)) {
      blockers.push(`Yudao server smoke evidence contains blockers: ${evidence.blockers.join('; ')}`)
    }
  }

  const summary = evidenceSummary(ref.data)
  return {
    ...check(
      'yudao-server-smoke',
      blockers.length === 0,
      blockers.length === 0
        ? `Yudao server smoke evidence is ready: ${ref.path}`
        : blockers.join('; '),
      blockers
    ),
    summary: {
      yudaoServerSmokeEvidenceFile: ref.path,
      yudaoServerSmokeCheckedAt: ref.data?.checkedAt,
      yudaoServerSmokeBaseUrl: summary.baseUrl,
      yudaoServerSmokeHost: summary.providerSmokeHost,
      yudaoServerSmokeTenantId: summary.tenantId,
      yudaoServerSmokePackageCode: summary.packageCode,
      yudaoServerSmokePackageHttpStatus: summary.packageHttpStatus,
      yudaoServerSmokePackageStatus: summary.packageStatus,
      yudaoServerSmokePackageRegionCode: summary.packageRegionCode,
      yudaoServerSmokePublicReportHttpStatus: summary.publicReportHttpStatus,
      yudaoServerSmokePublicReportPackageCount: summary.publicReportPackageCount,
      yudaoServerSmokePublicReportReviewedKnowledgeCount: summary.publicReportReviewedKnowledgeCount,
      yudaoServerSmokePublicReportReviewedMediaCount: summary.publicReportReviewedMediaCount,
      yudaoServerSmokePublicReportMapPointCount: summary.publicReportMapPointCount,
      yudaoServerSmokeMediaAssetCount: summary.mediaAssetCount,
      yudaoServerSmokeBuildEvidenceFile: summary.buildEvidenceFile,
      yudaoServerSmokeBuildGitCommit: summary.buildGitCommit,
      yudaoServerSmokeBuildGitDirty: summary.buildGitDirty,
      yudaoServerSmokeBuildJarSha256: summary.buildJarSha256
    }
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

async function validateWorkbookEvidence(ref, rootDir, freshnessOptions) {
  const blockers = []
  if (!ref.path) {
    return ['POI workbook evidence is required before production release']
  }
  if (ref.error) {
    return [`POI workbook evidence cannot be read: ${ref.error}`]
  }
  const evidence = ref.data || {}
  const summary = evidenceSummary(evidence)
  if (evidence.artifactType !== 'xicheng-poi-review-workbook-readiness') {
    blockers.push('workbook evidence artifactType must be xicheng-poi-review-workbook-readiness')
  }
  blockers.push(...checkEvidenceTimestamp(evidence, 'workbook', freshnessOptions))
  blockers.push(...await checkEvidenceSourceHash(rootDir, evidence, 'workbook', 'workbookFile', 'workbookSha256'))
  if (evidence.ok !== true) {
    blockers.push('workbook evidence ok must be true')
  }
  if (evidence.status !== 'XICHENG_POI_REVIEW_WORKBOOK_READY') {
    blockers.push('workbook evidence status must be XICHENG_POI_REVIEW_WORKBOOK_READY')
  }
  const workbookRows = Number(summary.workbookRows)
  const minPoiCount = Number(summary.minPoiCount)
  const categoryCount = Number(summary.categoryCount)
  const placeholderCount = Number(summary.placeholderCount)
  const readyPoiCount = Number(summary.workbookReadyPoiCount)
  const pendingPoiCount = Number(summary.workbookPendingPoiCount)
  const pendingPoiTasks = summary.pendingPoiTasks
  if (
    !Number.isFinite(workbookRows) ||
    workbookRows < productionPoiTarget ||
    !Number.isFinite(minPoiCount) ||
    minPoiCount < productionPoiTarget
  ) {
    blockers.push(`workbook evidence must prove at least ${productionPoiTarget} reviewed POI rows`)
  }
  if (!Number.isFinite(categoryCount) || categoryCount < 8) {
    blockers.push('workbook evidence must prove at least 8 POI categories')
  }
  if (!Number.isFinite(placeholderCount) || placeholderCount !== 0) {
    blockers.push('workbook evidence placeholderCount must be 0')
  }
  if (!Number.isFinite(readyPoiCount) || readyPoiCount < productionPoiTarget) {
    blockers.push(`workbook evidence must prove ${productionPoiTarget} ready POI rows`)
  }
  if (
    !Number.isFinite(pendingPoiCount) ||
    pendingPoiCount !== 0 ||
    !Array.isArray(summary.pendingPoiCodes) ||
    summary.pendingPoiCodes.length !== 0
  ) {
    blockers.push('workbook evidence must prove there are no pending POI rows')
  }
  if (!Array.isArray(pendingPoiTasks) || pendingPoiTasks.length !== 0) {
    blockers.push('workbook evidence must prove there are no pending POI tasks')
  }
  blockers.push(...checkEvidenceChecks(evidence, requiredWorkbookEvidenceChecks, 'workbook'))
  if (!hasNoEvidenceBlockers(evidence)) {
    blockers.push(`workbook evidence contains blockers: ${evidence.blockers.join('; ')}`)
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

function validateSourceCoveragePageSummaries(summary, blockers) {
  const sourcePages = Array.isArray(summary.sourcePages) ? summary.sourcePages : []
  if (sourcePages.length === 0) {
    blockers.push('source coverage evidence must include sourcePages')
    return
  }
  sourcePages.forEach((page) => {
    const label = page?.sourceUrl || 'source page'
    if (page?.ok !== true) {
      blockers.push(`${label} source coverage page must be ok`)
    }
    if (Number(page?.sourceTextLength) <= 0) {
      blockers.push(`${label} sourceTextLength must be positive`)
    }
    if (!/^[a-f0-9]{64}$/.test(String(page?.sourceTextSha256 || ''))) {
      blockers.push(`${label} sourceTextSha256 must be a sha256 hex digest`)
    }
    if (hasValue(page?.text) || hasValue(page?.body) || hasValue(page?.html)) {
      blockers.push(`${label} source coverage evidence must not store full source page text`)
    }
  })
}

function validateSourceCoverageGroups(summary, blockers) {
  const groups = Array.isArray(summary.sourceGroups) ? summary.sourceGroups : []
  if (groups.length === 0) {
    blockers.push('source coverage evidence must include sourceGroups')
    return
  }
  groups.forEach((group) => {
    const label = group?.sourceUrl || 'source group'
    if (Number(group?.poiCount) <= 0) {
      blockers.push(`${label} source coverage group poiCount must be positive`)
    }
    if (Number(group?.uncoveredPoiCount) !== 0) {
      blockers.push(`${label} source coverage group uncoveredPoiCount must be 0`)
    }
    if (Array.isArray(group?.uncoveredPoiCodes) && group.uncoveredPoiCodes.length > 0) {
      blockers.push(`${label} source coverage group uncoveredPoiCodes must be empty`)
    }
  })
}

function validateSourceCoverageEvidence(ref, freshnessOptions, implicitDefault = false) {
  const blockers = []
  if (!ref.path || (implicitDefault && ref.error)) {
    return ['POI source coverage evidence is required before production release']
  }
  if (ref.error) {
    return [`POI source coverage evidence cannot be read: ${ref.error}`]
  }
  const evidence = ref.data || {}
  const summary = evidenceSummary(evidence)
  if (evidence.artifactType !== 'xicheng-poi-source-coverage') {
    blockers.push('source coverage evidence artifactType must be xicheng-poi-source-coverage')
  }
  blockers.push(...checkEvidenceTimestamp(evidence, 'source coverage', freshnessOptions))
  if (evidence.ok !== true) {
    blockers.push('source coverage evidence ok must be true')
  }
  if (evidence.status !== 'SOURCE_COVERAGE_READY') {
    blockers.push('source coverage evidence status must be SOURCE_COVERAGE_READY')
  }
  if (Number(summary.poiCount) < productionPoiTarget) {
    blockers.push(`source coverage evidence must prove at least ${productionPoiTarget} POIs`)
  }
  if (Number(summary.coveredPoiCount) < productionPoiTarget) {
    blockers.push(`source coverage evidence coveredPoiCount must be at least ${productionPoiTarget}`)
  }
  if (Number(summary.uncoveredPoiCount) !== 0) {
    blockers.push('source coverage evidence uncoveredPoiCount must be 0')
  }
  if (!Array.isArray(summary.uncoveredPoiCodes) || summary.uncoveredPoiCodes.length !== 0) {
    blockers.push('source coverage evidence uncoveredPoiCodes must be empty')
  }
  validateSourceCoveragePageSummaries(summary, blockers)
  validateSourceCoverageGroups(summary, blockers)
  blockers.push(...checkEvidenceChecks(evidence, requiredSourceCoverageEvidenceChecks, 'source coverage'))
  if (!hasNoEvidenceBlockers(evidence)) {
    blockers.push(`source coverage evidence contains blockers: ${evidence.blockers.join('; ')}`)
  }
  return blockers
}

async function validateSourceReviewApplyEvidence(ref, {
  rootDir,
  freshnessOptions,
  sourceCoverageEvidence,
  implicitDefault = false
}) {
  const blockers = []
  if (!ref.path || (implicitDefault && ref.error)) {
    return ['POI source review apply evidence is required before production release']
  }
  if (ref.error) {
    return [`POI source review apply evidence cannot be read: ${ref.error}`]
  }
  const evidence = ref.data || {}
  const summary = evidenceSummary(evidence)
  if (evidence.artifactType !== 'xicheng-poi-source-review-apply') {
    blockers.push('source review apply evidence artifactType must be xicheng-poi-source-review-apply')
  }
  blockers.push(...checkEvidenceTimestamp(evidence, 'source review apply', freshnessOptions))
  blockers.push(...await checkEvidenceSourceHash(rootDir, evidence, 'source review apply', 'outputFile', 'outputSha256'))
  if (evidence.ok !== true) {
    blockers.push('source review apply evidence ok must be true')
  }
  if (evidence.status !== 'SOURCE_REVIEW_APPLIED') {
    blockers.push('source review apply evidence status must be SOURCE_REVIEW_APPLIED')
  }
  if (Number(summary.appliedPoiCount) < productionPoiTarget) {
    blockers.push(`source review apply evidence appliedPoiCount must be at least ${productionPoiTarget}`)
  }
  if (Number(summary.pendingSourcePoiCount) !== 0) {
    blockers.push('source review apply evidence pendingSourcePoiCount must be 0')
  }
  if (summary.sourceCoverageStatus !== 'SOURCE_COVERAGE_READY') {
    blockers.push('source review apply evidence sourceCoverageStatus must be SOURCE_COVERAGE_READY')
  }
  if (Number(summary.sourceCoverageUncoveredPoiCount) !== 0) {
    blockers.push('source review apply evidence sourceCoverageUncoveredPoiCount must be 0')
  }
  if (
    sourceCoverageEvidence?.path &&
    normalizeEvidencePath(rootDir, summary.sourceCoverageEvidenceFile) !== sourceCoverageEvidence.path
  ) {
    blockers.push('source review apply evidence sourceCoverageEvidenceFile must match --poi-source-coverage-evidence')
  }
  if (!hasNoEvidenceBlockers(evidence)) {
    blockers.push(`source review apply evidence contains blockers: ${evidence.blockers.join('; ')}`)
  }
  return blockers
}

async function validateProductionReviewApplyEvidence(ref, {
  rootDir,
  freshnessOptions,
  workbookEvidence,
  sourceReviewApplyEvidence,
  implicitDefault = false
}) {
  const blockers = []
  if (!ref.path || (implicitDefault && ref.error)) {
    return ['POI production review apply evidence is required before production release']
  }
  if (ref.error) {
    return [`POI production review apply evidence cannot be read: ${ref.error}`]
  }
  const evidence = ref.data || {}
  const summary = evidenceSummary(evidence)
  const workbookSummary = evidenceSummary(workbookEvidence?.data)
  const sourceReviewSummary = evidenceSummary(sourceReviewApplyEvidence?.data)
  if (evidence.artifactType !== 'xicheng-poi-production-review-apply') {
    blockers.push('production review apply evidence artifactType must be xicheng-poi-production-review-apply')
  }
  blockers.push(...checkEvidenceTimestamp(evidence, 'production review apply', freshnessOptions))
  blockers.push(...await checkEvidenceSourceHash(rootDir, evidence, 'production review apply', 'outputFile', 'outputSha256'))
  if (evidence.ok !== true) {
    blockers.push('production review apply evidence ok must be true')
  }
  if (evidence.status !== 'PRODUCTION_REVIEW_APPLIED') {
    blockers.push('production review apply evidence status must be PRODUCTION_REVIEW_APPLIED')
  }
  if (Number(summary.appliedPoiCount) < productionPoiTarget) {
    blockers.push(`production review apply evidence appliedPoiCount must be at least ${productionPoiTarget}`)
  }
  if (Number(summary.pendingProductionReviewPoiCount) !== 0) {
    blockers.push('production review apply evidence pendingProductionReviewPoiCount must be 0')
  }
  if (summary.sourceReviewApplyStatus !== 'SOURCE_REVIEW_APPLIED') {
    blockers.push('production review apply evidence sourceReviewApplyStatus must be SOURCE_REVIEW_APPLIED')
  }
  if (Number(summary.sourceReviewPendingSourcePoiCount) !== 0) {
    blockers.push('production review apply evidence sourceReviewPendingSourcePoiCount must be 0')
  }
  if (summary.sourceCoverageStatus !== 'SOURCE_COVERAGE_READY') {
    blockers.push('production review apply evidence sourceCoverageStatus must be SOURCE_COVERAGE_READY')
  }
  if (Number(summary.sourceCoverageUncoveredPoiCount) !== 0) {
    blockers.push('production review apply evidence sourceCoverageUncoveredPoiCount must be 0')
  }
  if (!hasValue(summary.triggerSmokeApplyEvidenceFile)) {
    blockers.push('production review apply evidence triggerSmokeApplyEvidenceFile is required')
  }
  if (summary.triggerSmokeApplyStatus !== 'TRIGGER_SMOKE_APPLIED') {
    blockers.push('production review apply evidence triggerSmokeApplyStatus must be TRIGGER_SMOKE_APPLIED')
  }
  if (Number(summary.triggerSmokeAppliedPoiCount) < productionPoiTarget) {
    blockers.push(`production review apply evidence triggerSmokeAppliedPoiCount must be at least ${productionPoiTarget}`)
  }
  if (Number(summary.triggerSmokePendingPoiCount) !== 0) {
    blockers.push('production review apply evidence triggerSmokePendingPoiCount must be 0')
  }
  if (
    sourceReviewApplyEvidence?.path &&
    normalizeEvidencePath(rootDir, summary.sourceReviewApplyEvidenceFile) !== sourceReviewApplyEvidence.path
  ) {
    blockers.push('production review apply evidence sourceReviewApplyEvidenceFile must match --poi-source-review-apply-evidence')
  }
  if (
    sourceReviewSummary.outputFile &&
    normalizeEvidencePath(rootDir, summary.workbookFile) !== normalizeEvidencePath(rootDir, sourceReviewSummary.outputFile)
  ) {
    blockers.push('production review apply evidence workbookFile must match source review apply outputFile')
  }
  if (
    workbookSummary.workbookFile &&
    normalizeEvidencePath(rootDir, summary.outputFile) !== normalizeEvidencePath(rootDir, workbookSummary.workbookFile)
  ) {
    blockers.push('production review apply evidence outputFile must match workbook evidence workbookFile')
  }
  if (
    workbookSummary.workbookSha256 &&
    summary.outputSha256 !== workbookSummary.workbookSha256
  ) {
    blockers.push('production review apply evidence outputSha256 must match workbook evidence workbookSha256')
  }
  if (!hasNoEvidenceBlockers(evidence)) {
    blockers.push(`production review apply evidence contains blockers: ${evidence.blockers.join('; ')}`)
  }
  return blockers
}

async function checkXichengRuntimeSeedEvidence({
  rootDir,
  runtimeSeedEvidencePath,
  env,
  freshnessOptions
}) {
  const ref = await loadEvidenceInput(rootDir, runtimeSeedEvidencePath)
  const blockers = []
  if (!ref.path) {
    blockers.push('Yudao runtime production seed evidence is required before production release')
  } else if (ref.error) {
    blockers.push(`Yudao runtime production seed evidence cannot be read: ${ref.error}`)
  } else {
    const evidence = ref.data || {}
    const summary = evidenceSummary(evidence)
    if (evidence.artifactType !== 'xicheng-yudao-runtime-seed') {
      blockers.push('runtime seed evidence artifactType must be xicheng-yudao-runtime-seed')
    }
    blockers.push(...checkEvidenceTimestamp(evidence, 'runtime seed', freshnessOptions))
    if (evidence.ok !== true) {
      blockers.push('runtime seed evidence ok must be true')
    }
    if (evidence.status !== 'YUDAO_XICHENG_PRODUCTION_SEED_READY') {
      blockers.push('runtime seed evidence status must be YUDAO_XICHENG_PRODUCTION_SEED_READY')
    }
    if (summary.readinessMode !== 'production') {
      blockers.push('runtime seed evidence readinessMode must be production')
    }
    if (String(summary.tenantId || '') !== String(env.XUNJING_TENANT_ID || '')) {
      blockers.push('runtime seed evidence tenantId must match XUNJING_TENANT_ID')
    }
    if (String(summary.database || '') !== String(env.MYSQL_DATABASE || '')) {
      blockers.push('runtime seed evidence database must match MYSQL_DATABASE')
    }
    if (summary.regionCode !== expectedXichengRegionCode) {
      blockers.push('runtime seed evidence regionCode must be beijing-xicheng')
    }
    if (summary.packageCode !== expectedXichengPackageCode) {
      blockers.push('runtime seed evidence packageCode must be XICHENG-MAP-001')
    }
    if (summary.localCandidateReady !== true) {
      blockers.push('runtime seed evidence localCandidateReady must be true')
    }
    if (summary.productionReady !== true) {
      blockers.push('runtime seed evidence productionReady must be true')
    }
    if (Number(summary.poiTotal) < productionPoiTarget) {
      blockers.push(`runtime seed evidence must prove at least ${productionPoiTarget} POIs`)
    }
    if (Number(summary.poiApprovedPublished) < productionPoiTarget) {
      blockers.push(`runtime seed evidence must prove at least ${productionPoiTarget} approved and published POIs`)
    }
    if (Number(summary.knowledgeDocuments) < productionPoiTarget + 4) {
      blockers.push('runtime seed evidence must prove at least 84 knowledge documents')
    }
    if (Number(summary.mapPoints) < productionPoiTarget) {
      blockers.push(`runtime seed evidence must prove at least ${productionPoiTarget} map points`)
    }
    if (Number(summary.poiGeoReviewRequired) !== 0) {
      blockers.push('runtime seed evidence poiGeoReviewRequired must be 0')
    }
    if (Number(summary.poiLicenseReviewRequired) !== 0) {
      blockers.push('runtime seed evidence poiLicenseReviewRequired must be 0')
    }
    if (Number(summary.publicReportProductionReady) < 1) {
      blockers.push('runtime seed evidence must include a production-ready public report')
    }
    if (!Array.isArray(summary.productionBlockers) || summary.productionBlockers.length > 0) {
      blockers.push('runtime seed evidence productionBlockers must be empty')
    }
    blockers.push(...checkEvidenceChecks(evidence, requiredRuntimeSeedEvidenceChecks, 'runtime seed'))
    const leakedKeys = evidenceSecretLeaks(evidence, env)
    if (leakedKeys.length > 0) {
      blockers.push(`runtime seed evidence must not contain secret values: ${leakedKeys.join(', ')}`)
    }
    if (!hasNoEvidenceBlockers(evidence)) {
      blockers.push(`runtime seed evidence contains blockers: ${evidence.blockers.join('; ')}`)
    }
  }

  const summary = evidenceSummary(ref.data)
  return {
    ...check(
      'xicheng-runtime-seed-evidence',
      blockers.length === 0,
      blockers.length === 0
        ? `Yudao runtime production seed evidence is ready: ${ref.path}`
        : blockers.join('; '),
      blockers
    ),
    summary: {
      runtimeSeedEvidenceFile: ref.path,
      runtimeSeedCheckedAt: ref.data?.checkedAt,
      runtimeSeedReadinessMode: summary.readinessMode,
      runtimeSeedTenantId: summary.tenantId,
      runtimeSeedDatabase: summary.database,
      runtimeSeedProductionReady: summary.productionReady,
      runtimeSeedLocalCandidateReady: summary.localCandidateReady,
      runtimeSeedPoiTotal: summary.poiTotal,
      runtimeSeedPoiApprovedPublished: summary.poiApprovedPublished,
      runtimeSeedKnowledgeDocuments: summary.knowledgeDocuments,
      runtimeSeedMapPoints: summary.mapPoints,
      runtimeSeedGeoReviewRequired: summary.poiGeoReviewRequired,
      runtimeSeedLicenseReviewRequired: summary.poiLicenseReviewRequired,
      runtimeSeedGeoReviewRequiredPoiCodes: Array.isArray(summary.geoReviewRequiredPoiCodes)
        ? summary.geoReviewRequiredPoiCodes
        : [],
      runtimeSeedLicenseReviewRequiredPoiCodes: Array.isArray(summary.licenseReviewRequiredPoiCodes)
        ? summary.licenseReviewRequiredPoiCodes
        : [],
      runtimeSeedProductionBlockerCount: Array.isArray(summary.productionBlockers)
        ? summary.productionBlockers.length
        : undefined
    }
  }
}

async function checkXichengProductionSeedApplyEvidence({
  rootDir,
  productionSeedApplyEvidencePath,
  poiSeedEvidencePath,
  runtimeSeedEvidencePath,
  env,
  freshnessOptions
}) {
  const ref = await loadEvidenceInput(rootDir, productionSeedApplyEvidencePath)
  const blockers = []
  const expectedSeedEvidenceFile = normalizeEvidencePath(rootDir, poiSeedEvidencePath)
  const expectedRuntimeEvidenceFile = normalizeEvidencePath(rootDir, runtimeSeedEvidencePath)

  if (!ref.path) {
    blockers.push('Yudao production seed apply evidence is required before production release')
  } else if (ref.error) {
    blockers.push(`Yudao production seed apply evidence cannot be read: ${ref.error}`)
  } else {
    const evidence = ref.data || {}
    const summary = evidenceSummary(evidence)
    if (evidence.artifactType !== 'xicheng-yudao-production-seed-apply') {
      blockers.push('production seed apply evidence artifactType must be xicheng-yudao-production-seed-apply')
    }
    blockers.push(...checkEvidenceTimestamp(evidence, 'production seed apply', freshnessOptions))
    if (evidence.ok !== true) {
      blockers.push('production seed apply evidence ok must be true')
    }
    if (evidence.status !== 'YUDAO_XICHENG_PRODUCTION_SEED_APPLIED') {
      blockers.push('production seed apply evidence status must be YUDAO_XICHENG_PRODUCTION_SEED_APPLIED')
    }
    if (String(summary.targetTenantId || '') !== String(env.XUNJING_TENANT_ID || '')) {
      blockers.push('production seed apply evidence targetTenantId must match XUNJING_TENANT_ID')
    }
    if (String(summary.targetDatabase || '') !== String(env.MYSQL_DATABASE || '')) {
      blockers.push('production seed apply evidence targetDatabase must match MYSQL_DATABASE')
    }
    if (summary.regionCode !== expectedXichengRegionCode) {
      blockers.push('production seed apply evidence regionCode must be beijing-xicheng')
    }
    if (summary.packageCode !== expectedXichengPackageCode) {
      blockers.push('production seed apply evidence packageCode must be XICHENG-MAP-001')
    }
    if (
      expectedSeedEvidenceFile &&
      !evidencePathMatchesOrDeploymentPath(rootDir, summary.seedEvidenceFile, expectedSeedEvidenceFile)
    ) {
      blockers.push('production seed apply evidence seedEvidenceFile must match --poi-seed-evidence')
    }
    if (
      expectedRuntimeEvidenceFile &&
      !evidencePathMatchesOrDeploymentPath(rootDir, summary.runtimeEvidenceFile, expectedRuntimeEvidenceFile)
    ) {
      blockers.push('production seed apply evidence runtimeEvidenceFile must match --runtime-seed-evidence')
    }
    if (
      ref.path &&
      !evidencePathMatchesOrDeploymentPath(rootDir, summary.applyEvidenceFile, ref.path)
    ) {
      blockers.push('production seed apply evidence applyEvidenceFile must match the evidence file path')
    }
    if (!/^[a-f0-9]{64}$/.test(String(summary.seedSqlSha256 || ''))) {
      blockers.push('production seed apply evidence seedSqlSha256 must be a sha256 hex digest')
    }
    if (summary.runtimeSeedStatus !== 'YUDAO_XICHENG_PRODUCTION_SEED_READY') {
      blockers.push('production seed apply evidence runtimeSeedStatus must be YUDAO_XICHENG_PRODUCTION_SEED_READY')
    }
    if (summary.runtimeSeedProductionReady !== true) {
      blockers.push('production seed apply evidence runtimeSeedProductionReady must be true')
    }
    if (Number(summary.runtimeSeedPoiTotal) < productionPoiTarget) {
      blockers.push(`production seed apply evidence runtimeSeedPoiTotal must be at least ${productionPoiTarget}`)
    }
    if (Number(summary.runtimeSeedKnowledgeDocuments) < productionPoiTarget + 4) {
      blockers.push('production seed apply evidence runtimeSeedKnowledgeDocuments must be at least 84')
    }
    if (Number(summary.runtimeSeedMapPoints) < productionPoiTarget) {
      blockers.push(`production seed apply evidence runtimeSeedMapPoints must be at least ${productionPoiTarget}`)
    }
    blockers.push(...checkEvidenceChecks(evidence, requiredProductionSeedApplyEvidenceChecks, 'production seed apply'))
    const leakedKeys = evidenceSecretLeaks(evidence, env)
    if (leakedKeys.length > 0) {
      blockers.push(`production seed apply evidence must not contain secret values: ${leakedKeys.join(', ')}`)
    }
    if (!hasNoEvidenceBlockers(evidence)) {
      blockers.push(`production seed apply evidence contains blockers: ${evidence.blockers.join('; ')}`)
    }
  }

  const summary = evidenceSummary(ref.data)
  return {
    ...check(
      'xicheng-production-seed-apply',
      blockers.length === 0,
      blockers.length === 0
        ? `Yudao production seed apply evidence is ready: ${ref.path}`
        : blockers.join('; '),
      blockers
    ),
    summary: {
      productionSeedApplyEvidenceFile: ref.path,
      productionSeedApplyCheckedAt: ref.data?.checkedAt,
      productionSeedApplySeedSqlFile: summary.seedSqlFile,
      productionSeedApplySeedSqlSha256: summary.seedSqlSha256,
      productionSeedApplySeedEvidenceFile: summary.seedEvidenceFile,
      productionSeedApplyRuntimeEvidenceFile: summary.runtimeEvidenceFile,
      productionSeedApplyTargetTenantId: summary.targetTenantId,
      productionSeedApplyTargetDatabase: summary.targetDatabase,
      productionSeedApplyPackageCode: summary.packageCode,
      productionSeedApplyRegionCode: summary.regionCode,
      productionSeedApplyRuntimeSeedStatus: summary.runtimeSeedStatus,
      productionSeedApplyRuntimeSeedProductionReady: summary.runtimeSeedProductionReady,
      productionSeedApplyRuntimeSeedPoiTotal: summary.runtimeSeedPoiTotal,
      productionSeedApplyRuntimeSeedKnowledgeDocuments: summary.runtimeSeedKnowledgeDocuments,
      productionSeedApplyRuntimeSeedMapPoints: summary.runtimeSeedMapPoints
    }
  }
}

function normalizeEvidencePath(rootDir, filePath) {
  if (!hasValue(filePath)) {
    return undefined
  }
  const resolvedRoot = path.resolve(rootDir)
  return path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(resolvedRoot, filePath)
}

function isDeploymentServerEvidencePath(filePath) {
  if (!hasValue(filePath) || !path.isAbsolute(filePath)) {
    return false
  }
  const resolvedPath = path.resolve(filePath)
  return resolvedPath === '/opt/xinghe-xunjing' || resolvedPath.startsWith('/opt/xinghe-xunjing/')
}

function evidencePathMatchesOrDeploymentPath(rootDir, actualPath, expectedPath) {
  const normalizedExpectedPath = normalizeEvidencePath(rootDir, expectedPath)
  const normalizedActualPath = normalizeEvidencePath(rootDir, actualPath)
  if (!normalizedExpectedPath || !normalizedActualPath) {
    return false
  }
  if (normalizedActualPath === normalizedExpectedPath) {
    return true
  }
  return isDeploymentServerEvidencePath(actualPath) &&
    path.basename(normalizedActualPath) === path.basename(normalizedExpectedPath)
}

function validatePoiEvidenceConsistency(rootDir, manifestEvidence, workbookEvidence, seedEvidence) {
  const blockers = []
  const manifestSummary = evidenceSummary(manifestEvidence)
  const workbookSummary = evidenceSummary(workbookEvidence)
  const seedSummary = evidenceSummary(seedEvidence)
  if (
    manifestSummary.sourceWorkbookFile &&
    workbookSummary.workbookFile &&
    normalizeEvidencePath(rootDir, manifestSummary.sourceWorkbookFile) !==
      normalizeEvidencePath(rootDir, workbookSummary.workbookFile)
  ) {
    blockers.push('workbook and manifest sourceWorkbookFile must match')
  }
  if (
    manifestSummary.sourceWorkbookSha256 &&
    workbookSummary.workbookSha256 &&
    manifestSummary.sourceWorkbookSha256 !== workbookSummary.workbookSha256
  ) {
    blockers.push('workbook and manifest sourceWorkbookSha256 must match')
  }
  if (
    manifestSummary.regionCode &&
    seedSummary.regionCode &&
    manifestSummary.regionCode !== seedSummary.regionCode
  ) {
    blockers.push('manifest and seed evidence regionCode must match')
  }
  if (
    manifestSummary.packageCode &&
    seedSummary.packageCode &&
    manifestSummary.packageCode !== seedSummary.packageCode
  ) {
    blockers.push('manifest and seed evidence packageCode must match')
  }
  if (
    manifestSummary.reviewBatchCode &&
    seedSummary.reviewBatchCode &&
    manifestSummary.reviewBatchCode !== seedSummary.reviewBatchCode
  ) {
    blockers.push('manifest and seed evidence reviewBatchCode must match')
  }
  if (
    manifestSummary.reviewBatchEvidencePackageRef &&
    seedSummary.reviewBatchEvidencePackageRef &&
    manifestSummary.reviewBatchEvidencePackageRef !== seedSummary.reviewBatchEvidencePackageRef
  ) {
    blockers.push('manifest and seed evidence reviewBatchEvidencePackageRef must match')
  }
  return blockers
}

async function checkXichengProductionPoiEvidence({
  rootDir,
  poiManifestEvidencePath,
  poiWorkbookEvidencePath,
  poiSourceCoverageEvidencePath,
  poiSourceReviewApplyEvidencePath,
  poiProductionReviewApplyEvidencePath,
  poiSeedEvidencePath,
  freshnessOptions
}) {
  const implicitSourceCoverageEvidence = !hasValue(poiSourceCoverageEvidencePath)
  const implicitSourceReviewApplyEvidence = !hasValue(poiSourceReviewApplyEvidencePath)
  const implicitProductionReviewApplyEvidence = !hasValue(poiProductionReviewApplyEvidencePath)
  const sourceCoverageEvidencePath = poiSourceCoverageEvidencePath || defaultPoiSourceCoverageEvidencePath
  const sourceReviewApplyEvidencePath = poiSourceReviewApplyEvidencePath || defaultPoiSourceReviewApplyEvidencePath
  const productionReviewApplyEvidencePath = poiProductionReviewApplyEvidencePath ||
    defaultPoiProductionReviewApplyEvidencePath
  const [
    manifestEvidence,
    workbookEvidence,
    sourceCoverageEvidence,
    sourceReviewApplyEvidence,
    productionReviewApplyEvidence,
    seedEvidence
  ] = await Promise.all([
    loadEvidenceInput(rootDir, poiManifestEvidencePath),
    loadEvidenceInput(rootDir, poiWorkbookEvidencePath),
    loadEvidenceInput(rootDir, sourceCoverageEvidencePath),
    loadEvidenceInput(rootDir, sourceReviewApplyEvidencePath),
    loadEvidenceInput(rootDir, productionReviewApplyEvidencePath),
    loadEvidenceInput(rootDir, poiSeedEvidencePath)
  ])
  const [manifestBlockers, workbookBlockers, seedBlockers] = await Promise.all([
    validateManifestEvidence(manifestEvidence, rootDir, freshnessOptions),
    validateWorkbookEvidence(workbookEvidence, rootDir, freshnessOptions),
    validateSeedEvidence(seedEvidence, rootDir, freshnessOptions)
  ])
  const sourceCoverageBlockers = validateSourceCoverageEvidence(
    sourceCoverageEvidence,
    freshnessOptions,
    implicitSourceCoverageEvidence
  )
  const sourceReviewApplyBlockers = await validateSourceReviewApplyEvidence(sourceReviewApplyEvidence, {
    rootDir,
    freshnessOptions,
    sourceCoverageEvidence,
    implicitDefault: implicitSourceReviewApplyEvidence
  })
  const productionReviewApplyBlockers = await validateProductionReviewApplyEvidence(productionReviewApplyEvidence, {
    rootDir,
    freshnessOptions,
    workbookEvidence,
    sourceReviewApplyEvidence,
    implicitDefault: implicitProductionReviewApplyEvidence
  })
  const blockers = [
    ...manifestBlockers,
    ...workbookBlockers,
    ...sourceCoverageBlockers,
    ...sourceReviewApplyBlockers,
    ...productionReviewApplyBlockers,
    ...seedBlockers,
    ...validatePoiEvidenceConsistency(rootDir, manifestEvidence.data, workbookEvidence.data, seedEvidence.data)
  ]
  const details = []
  if (manifestEvidence.path) {
    details.push(`manifest=${manifestEvidence.path}`)
  }
  if (workbookEvidence.path) {
    details.push(`workbook=${workbookEvidence.path}`)
  }
  if (seedEvidence.path) {
    details.push(`seed=${seedEvidence.path}`)
  }
  if (sourceCoverageEvidence.path && !sourceCoverageEvidence.error) {
    details.push(`sourceCoverage=${sourceCoverageEvidence.path}`)
  }
  if (sourceReviewApplyEvidence.path && !sourceReviewApplyEvidence.error) {
    details.push(`sourceReviewApply=${sourceReviewApplyEvidence.path}`)
  }
  if (productionReviewApplyEvidence.path && !productionReviewApplyEvidence.error) {
    details.push(`productionReviewApply=${productionReviewApplyEvidence.path}`)
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
      workbookEvidenceFile: workbookEvidence.path,
      sourceCoverageEvidenceFile: sourceCoverageEvidence.path,
      sourceCoverageStatus: sourceCoverageEvidence.data?.status,
      sourceCoverageSourceGroupCount: evidenceSummary(sourceCoverageEvidence.data).sourceGroupCount,
      sourceCoveragePoiCount: evidenceSummary(sourceCoverageEvidence.data).poiCount,
      sourceCoverageCoveredPoiCount: evidenceSummary(sourceCoverageEvidence.data).coveredPoiCount,
      sourceCoverageUncoveredPoiCount: evidenceSummary(sourceCoverageEvidence.data).uncoveredPoiCount,
      sourceCoverageUncoveredPoiCodes: evidenceSummary(sourceCoverageEvidence.data).uncoveredPoiCodes,
      sourceReviewApplyEvidenceFile: sourceReviewApplyEvidence.path,
      sourceReviewApplyStatus: sourceReviewApplyEvidence.data?.status,
      sourceReviewAppliedPoiCount: evidenceSummary(sourceReviewApplyEvidence.data).appliedPoiCount,
      sourceReviewPendingSourcePoiCount: evidenceSummary(sourceReviewApplyEvidence.data).pendingSourcePoiCount,
      sourceReviewPendingSourcePoiCodes: evidenceSummary(sourceReviewApplyEvidence.data).pendingSourcePoiCodes,
      productionReviewApplyEvidenceFile: productionReviewApplyEvidence.path,
      productionReviewApplyStatus: productionReviewApplyEvidence.data?.status,
      productionReviewAppliedPoiCount: evidenceSummary(productionReviewApplyEvidence.data).appliedPoiCount,
      productionReviewPendingPoiCount: evidenceSummary(productionReviewApplyEvidence.data).pendingProductionReviewPoiCount,
      productionReviewPendingPoiCodes: evidenceSummary(productionReviewApplyEvidence.data).pendingProductionReviewPoiCodes,
      productionReviewTriggerSmokeApplyEvidenceFile: evidenceSummary(productionReviewApplyEvidence.data).triggerSmokeApplyEvidenceFile,
      productionReviewTriggerSmokeApplyStatus: evidenceSummary(productionReviewApplyEvidence.data).triggerSmokeApplyStatus,
      productionReviewTriggerSmokeAppliedPoiCount: evidenceSummary(productionReviewApplyEvidence.data).triggerSmokeAppliedPoiCount,
      productionReviewTriggerSmokePendingPoiCount: evidenceSummary(productionReviewApplyEvidence.data).triggerSmokePendingPoiCount,
      seedEvidenceFile: seedEvidence.path,
      poiManifestFile: evidenceSummary(manifestEvidence.data).manifestFile,
      poiManifestSha256: evidenceSummary(manifestEvidence.data).manifestSha256,
      sourceWorkbookFile: evidenceSummary(manifestEvidence.data).sourceWorkbookFile,
      sourceWorkbookSha256: evidenceSummary(manifestEvidence.data).sourceWorkbookSha256,
      workbookReadyPoiCount: evidenceSummary(workbookEvidence.data).workbookReadyPoiCount,
      workbookPendingPoiCount: evidenceSummary(workbookEvidence.data).workbookPendingPoiCount,
      pendingPoiCodes: evidenceSummary(workbookEvidence.data).pendingPoiCodes,
      pendingPoiTasks: evidenceSummary(workbookEvidence.data).pendingPoiTasks,
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
  if (
    !seed.includes('POI production source') &&
    !seed.includes('POI 级已审核来源') &&
    !seed.includes('POI 级生产来源')
  ) {
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
  adminUiDirPath,
  yudaoServerBuildEvidencePath,
  yudaoServerSmokeEvidencePath,
  aiBootstrapEvidencePath,
  embeddingEvidencePath,
  qdrantEvidencePath,
  visionOcrEvidencePath,
  objectStorageEvidencePath,
  runtimeSeedEvidencePath,
  productionSeedApplyEvidencePath,
  poiManifestEvidencePath,
  poiWorkbookEvidencePath,
  poiSourceCoverageEvidencePath,
  poiSourceReviewApplyEvidencePath,
  poiProductionReviewApplyEvidencePath,
  poiSeedEvidencePath,
  expectedGitBranch = defaultExpectedGitBranch,
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
    poiWorkbookEvidencePath,
    poiSourceCoverageEvidencePath,
    poiSourceReviewApplyEvidencePath,
    poiProductionReviewApplyEvidencePath,
    poiSeedEvidencePath,
    freshnessOptions
  })
  const productionPoiSeedSqlPath = productionPoiEvidenceCheck.ok
    ? productionPoiEvidenceCheck.summary?.productionPoiSeedSqlFile
    : undefined
  const yudaoServerArtifactCheck = await checkYudaoServerArtifact(
    rootDir,
    yudaoServerJarPath || env.YUDAO_SERVER_JAR
  )
  const sourceRevisionCheck = checkReleaseSourceRevision(rootDir, expectedGitBranch)
  const yudaoServerBuildEvidenceCheck = await checkYudaoServerBuildEvidence({
    rootDir,
    yudaoServerBuildEvidencePath: yudaoServerBuildEvidencePath || env.YUDAO_SERVER_BUILD_EVIDENCE,
    yudaoServerArtifactSummary: yudaoServerArtifactCheck.summary,
    sourceRevisionSummary: sourceRevisionCheck.summary,
    freshnessOptions
  })

  const checks = [
    sourceRevisionCheck,
    checkRuntimeEnv(env, normalizedStage),
    checkVectorEmbeddingRuntime(env, normalizedStage),
    await checkEmbeddingSmokeEvidence({
      rootDir,
      embeddingEvidencePath: embeddingEvidencePath || env.XICHENG_EMBEDDING_EVIDENCE,
      env,
      freshnessOptions
    }),
    checkHttpsAppApiDomain(env),
    checkRealWechatApp(env),
    checkRealAiProvider(env),
    await checkYudaoAiBootstrapEvidence({
      rootDir,
      aiBootstrapEvidencePath,
      env,
      freshnessOptions
    }),
    await checkQdrantSmokeEvidence({
      rootDir,
      qdrantEvidencePath,
      env,
      freshnessOptions
    }),
    await checkVisionOcrServiceEvidence({
      rootDir,
      visionOcrEvidencePath,
      env,
      freshnessOptions
    }),
    await checkObjectStorageEvidence({
      rootDir,
      objectStorageEvidencePath,
      env,
      freshnessOptions
    }),
    await checkFullYudaoBaseline(rootDir, yudaoBaselineSqlPath || env.YUDAO_BASELINE_SQL),
    yudaoServerArtifactCheck,
    yudaoServerBuildEvidenceCheck,
    await checkYudaoServerSmokeEvidence({
      rootDir,
      env,
      yudaoServerSmokeEvidencePath: yudaoServerSmokeEvidencePath || env.YUDAO_SERVER_SMOKE_EVIDENCE,
      yudaoServerBuildSummary: yudaoServerBuildEvidenceCheck.summary,
      freshnessOptions
    }),
    await checkAdminUiArtifact(rootDir, adminUiDirPath || env.XUNJING_ADMIN_UI_DIR),
    productionPoiEvidenceCheck,
    await checkXichengRuntimeSeedEvidence({
      rootDir,
      runtimeSeedEvidencePath,
      env,
      freshnessOptions
    }),
    await checkXichengProductionSeedApplyEvidence({
      rootDir,
      productionSeedApplyEvidencePath,
      poiSeedEvidencePath,
      runtimeSeedEvidencePath,
      env,
      freshnessOptions
    }),
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
    runtimeEnvSummary: buildRuntimeEnvSummary(env),
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
  const sourceRevisionSummary = result.checks.find((item) => item.name === 'release-source-revision')?.summary || {}
  const appApiDomainSummary = result.checks.find((item) => item.name === 'https-app-api-domain')?.summary || {}
  const embeddingSummary = result.checks.find((item) => item.name === 'embedding-provider-smoke')?.summary || {}
  const aiBootstrapSummary = result.checks.find((item) => item.name === 'yudao-ai-model-bootstrap')?.summary || {}
  const qdrantSummary = result.checks.find((item) => item.name === 'qdrant-vector-store')?.summary || {}
  const visionOcrSummary = result.checks.find((item) => item.name === 'vision-ocr-service')?.summary || {}
  const objectStorageSummary = result.checks.find((item) => item.name === 'object-storage')?.summary || {}
  const baselineSummary = result.checks.find((item) => item.name === 'full-yudao-baseline')?.summary || {}
  const serverArtifactSummary = result.checks.find((item) => item.name === 'yudao-server-artifact')?.summary || {}
  const serverBuildSummary = result.checks.find((item) => item.name === 'yudao-server-build-evidence')?.summary || {}
  const serverSmokeSummary = result.checks.find((item) => item.name === 'yudao-server-smoke')?.summary || {}
  const adminUiSummary = result.checks.find((item) => item.name === 'xunjing-admin-ui-artifact')?.summary || {}
  const productionPoiEvidenceSummary = result.checks.find((item) => item.name === 'xicheng-production-poi-evidence')?.summary || {}
  const runtimeSeedSummary = result.checks.find((item) => item.name === 'xicheng-runtime-seed-evidence')?.summary || {}
  const productionSeedApplySummary = result.checks.find((item) => item.name === 'xicheng-production-seed-apply')?.summary || {}
  return {
    artifactType: 'xicheng-yudao-release-readiness',
    summary: {
      stage: result.stage,
      status: result.status,
      totalChecks: result.checks.length,
      passedChecks: result.checks.filter((item) => item.ok).length,
      failedChecks: result.checks.filter((item) => !item.ok).length,
      blockerCount: result.blockers.length,
      ...sourceRevisionSummary,
      ...appApiDomainSummary,
      ...embeddingSummary,
      ...aiBootstrapSummary,
      ...qdrantSummary,
      ...visionOcrSummary,
      ...objectStorageSummary,
      ...baselineSummary,
      ...serverArtifactSummary,
      ...serverBuildSummary,
      ...serverSmokeSummary,
      ...adminUiSummary,
      ...productionPoiEvidenceSummary,
      ...runtimeSeedSummary,
      ...productionSeedApplySummary,
      ...result.runtimeEnvSummary
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
    adminUiDirPath: readArgValue(args, '--admin-ui-dir') ||
      env.XUNJING_ADMIN_UI_DIR,
    yudaoServerBuildEvidencePath: readArgValue(args, '--yudao-server-build-evidence') ||
      readArgValue(args, '--server-build-evidence') ||
      env.YUDAO_SERVER_BUILD_EVIDENCE,
    yudaoServerSmokeEvidencePath: readArgValue(args, '--yudao-server-smoke-evidence') ||
      readArgValue(args, '--server-smoke-evidence') ||
      env.YUDAO_SERVER_SMOKE_EVIDENCE,
    aiBootstrapEvidencePath: readArgValue(args, '--ai-bootstrap-evidence') ||
      env.YUDAO_AI_BOOTSTRAP_EVIDENCE,
    embeddingEvidencePath: readArgValue(args, '--embedding-evidence') ||
      env.XICHENG_EMBEDDING_EVIDENCE,
    qdrantEvidencePath: readArgValue(args, '--qdrant-evidence') ||
      env.XICHENG_QDRANT_EVIDENCE,
    visionOcrEvidencePath: readArgValue(args, '--vision-ocr-evidence') ||
      env.XICHENG_VISION_OCR_EVIDENCE,
    objectStorageEvidencePath: readArgValue(args, '--object-storage-evidence') ||
      env.XICHENG_OBJECT_STORAGE_EVIDENCE,
    runtimeSeedEvidencePath: readArgValue(args, '--runtime-seed-evidence') ||
      env.XICHENG_RUNTIME_SEED_EVIDENCE,
    productionSeedApplyEvidencePath: readArgValue(args, '--production-seed-apply-evidence') ||
      readArgValue(args, '--seed-apply-evidence') ||
      env.XICHENG_PRODUCTION_SEED_APPLY_EVIDENCE,
    poiManifestEvidencePath: readArgValue(args, '--poi-manifest-evidence') ||
      process.env.XICHENG_POI_MANIFEST_EVIDENCE,
    poiWorkbookEvidencePath: readArgValue(args, '--poi-workbook-evidence') ||
      process.env.XICHENG_POI_WORKBOOK_EVIDENCE,
    poiSourceCoverageEvidencePath: readArgValue(args, '--poi-source-coverage-evidence') ||
      process.env.XICHENG_POI_SOURCE_COVERAGE_EVIDENCE,
    poiSourceReviewApplyEvidencePath: readArgValue(args, '--poi-source-review-apply-evidence') ||
      process.env.XICHENG_POI_SOURCE_REVIEW_APPLY_EVIDENCE,
    poiProductionReviewApplyEvidencePath: readArgValue(args, '--poi-production-review-apply-evidence') ||
      process.env.XICHENG_POI_PRODUCTION_REVIEW_APPLY_EVIDENCE,
    poiSeedEvidencePath: readArgValue(args, '--poi-seed-evidence') ||
      process.env.XICHENG_POI_SEED_EVIDENCE,
    expectedGitBranch: readArgValue(args, '--expected-branch') ||
      process.env.XICHENG_RELEASE_EXPECTED_BRANCH ||
      defaultExpectedGitBranch,
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
