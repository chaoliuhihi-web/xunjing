import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-release-evidence-package'
const readyStatus = 'XICHENG_RELEASE_EVIDENCE_PACKAGE_READY'
const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])
const productionPoiTarget = 80
const defaultMaxEvidenceAgeHours = 24
const allowedClockSkewMs = 5 * 60 * 1000
const allowedStages = ['production', 'staging', 'api-trial']
const stageReadyStatus = {
  production: 'PRODUCTION_READY_CANDIDATE',
  staging: 'PREPROD_READY_CANDIDATE',
  'api-trial': 'API_TRIAL_READY_CANDIDATE'
}

const requiredReleaseChecks = [
  'release-source-revision',
  'runtime-env',
  'vector-embedding-runtime',
  'embedding-provider-smoke',
  'https-app-api-domain',
  'real-wechat-app',
  'real-ai-provider',
  'yudao-ai-model-bootstrap',
  'qdrant-vector-store',
  'vision-ocr-service',
  'object-storage',
  'full-yudao-baseline',
  'yudao-server-artifact',
  'yudao-server-build-evidence',
  'yudao-server-smoke',
  'xicheng-production-poi-evidence',
  'xicheng-runtime-seed-evidence',
  'xicheng-production-seed-apply',
  'xicheng-production-poi',
  'xicheng-source-license'
]

function requiredReleaseChecksForStage(stage) {
  if (stage === 'api-trial') {
    return requiredReleaseChecks.filter((name) => name !== 'real-wechat-app')
  }
  return requiredReleaseChecks
}

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

const requiredAppReadinessChecks = [
  'live-xicheng-scan-resolve',
  'live-xicheng-error-feedback',
  'live-xicheng-ai-chat-sourced',
  'live-xicheng-ai-chat-blocked',
  'live-xicheng-trigger-baitasi',
  'live-xicheng-trigger-gongwangfu',
  'live-xicheng-trigger-planetarium'
]

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

const expectedXichengRegionCode = 'beijing-xicheng'
const expectedXichengPackageCode = 'XICHENG-MAP-001'

function check(name, blockers) {
  return {
    name,
    ok: blockers.length === 0,
    detail: blockers.length === 0 ? `${name} passed` : blockers.join('; '),
    blockers
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
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

async function loadJsonFile(rootDir, filePath, label) {
  if (!filePath) {
    return { label, path: undefined, data: undefined, error: `${label} evidence is required` }
  }
  const resolvedRoot = path.resolve(rootDir)
  const resolvedPath = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(resolvedRoot, filePath)
  try {
    const text = await readFile(resolvedPath, 'utf8')
    return {
      label,
      path: resolvedPath,
      data: JSON.parse(text),
      sha256: sha256(text),
      error: undefined
    }
  } catch (error) {
    return {
      label,
      path: resolvedPath,
      data: undefined,
      error: `${label} evidence cannot be read: ${error.message}`
    }
  }
}

function summaryOf(evidence) {
  return evidence && typeof evidence.summary === 'object' && evidence.summary !== null
    ? evidence.summary
    : {}
}

function blockersOf(evidence) {
  return Array.isArray(evidence?.blockers) ? evidence.blockers : []
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

function isLoopbackHostname(hostname) {
  const normalized = String(hostname || '').trim().toLowerCase()
  return normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '0.0.0.0' ||
    normalized === 'host.docker.internal' ||
    normalized.endsWith('.local')
}

function isNonLocalHttpsUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !isLoopbackHostname(url.hostname)
  } catch {
    return false
  }
}

function isPlaceholderUrl(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) {
    return true
  }
  return [
    'replace-with',
    'placeholder',
    'your-',
    'example.com',
    'local-or-staging',
    'xunjing_local'
  ].some((token) => normalized.includes(token))
}

function normalizedBaseUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') {
      return undefined
    }
    const pathname = url.pathname.replace(/\/+$/, '')
    return `${url.origin}${pathname}`
  } catch {
    return undefined
  }
}

function hasText(value) {
  return String(value || '').trim().length > 0
}

function isNonLocalEvidenceRef(value) {
  if (!hasText(value)) {
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
      return !isLoopbackHostname(url.hostname)
    }
    if (['oss:', 'cos:', 's3:'].includes(protocol)) {
      return hasText(url.hostname) && hasText(url.pathname.replaceAll('/', ''))
    }
  } catch {
    return false
  }
  return false
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

function checkSummaryEquals(summary, field, expected, label, blockers) {
  if (summary?.[field] !== expected) {
    blockers.push(`${label} summary.${field} must be ${expected}`)
  }
}

function checkSummaryPositiveNumber(summary, field, label, blockers) {
  if (!Number.isFinite(Number(summary?.[field])) || Number(summary[field]) <= 0) {
    blockers.push(`${label} summary.${field} is required`)
  }
}

function checkSummaryContains(summary, field, expectedSnippet, label, blockers) {
  if (!String(summary?.[field] || '').includes(expectedSnippet)) {
    blockers.push(`${label} summary.${field} must include ${expectedSnippet}`)
  }
}

function checkAppReadinessCheckSummaries(evidence, expectedTenantId) {
  const blockers = []
  const checks = Array.isArray(evidence?.checks) ? evidence.checks : []
  const byName = new Map(checks.map((item) => [item.name, item]))
  const summaryOfCheck = (name) => {
    const summary = byName.get(name)?.summary
    if (!summary || typeof summary !== 'object') {
      blockers.push(`app readiness evidence check ${name} summary is required`)
      return {}
    }
    return summary
  }

  const scanSummary = summaryOfCheck('live-xicheng-scan-resolve')
  checkSummaryEquals(scanSummary, 'endpoint', '/app-api/xunjing/scan/resolve', 'app readiness evidence check live-xicheng-scan-resolve', blockers)
  if (hasText(expectedTenantId)) {
    checkSummaryEquals(scanSummary, 'tenantId', expectedTenantId, 'app readiness evidence check live-xicheng-scan-resolve', blockers)
  }
  checkSummaryEquals(scanSummary, 'packageCode', expectedXichengPackageCode, 'app readiness evidence check live-xicheng-scan-resolve', blockers)
  checkSummaryEquals(scanSummary, 'sceneCode', 'QR-XICHENG-MAP-001', 'app readiness evidence check live-xicheng-scan-resolve', blockers)

  const errorSummary = summaryOfCheck('live-xicheng-error-feedback')
  checkSummaryEquals(errorSummary, 'endpoint', '/app-api/xunjing/resource/events', 'app readiness evidence check live-xicheng-error-feedback', blockers)
  if (hasText(expectedTenantId)) {
    checkSummaryEquals(errorSummary, 'tenantId', expectedTenantId, 'app readiness evidence check live-xicheng-error-feedback', blockers)
  }
  checkSummaryEquals(errorSummary, 'packageCode', expectedXichengPackageCode, 'app readiness evidence check live-xicheng-error-feedback', blockers)
  checkSummaryEquals(errorSummary, 'eventType', 'ERROR_FEEDBACK', 'app readiness evidence check live-xicheng-error-feedback', blockers)
  checkSummaryPositiveNumber(errorSummary, 'eventId', 'app readiness evidence check live-xicheng-error-feedback', blockers)

  const sourcedSummary = summaryOfCheck('live-xicheng-ai-chat-sourced')
  checkSummaryEquals(sourcedSummary, 'endpoint', '/app-api/xunjing/ai/chat', 'app readiness evidence check live-xicheng-ai-chat-sourced', blockers)
  if (hasText(expectedTenantId)) {
    checkSummaryEquals(sourcedSummary, 'tenantId', expectedTenantId, 'app readiness evidence check live-xicheng-ai-chat-sourced', blockers)
  }
  checkSummaryEquals(sourcedSummary, 'regionCode', expectedXichengRegionCode, 'app readiness evidence check live-xicheng-ai-chat-sourced', blockers)
  checkSummaryEquals(sourcedSummary, 'packageCode', expectedXichengPackageCode, 'app readiness evidence check live-xicheng-ai-chat-sourced', blockers)
  checkSummaryEquals(sourcedSummary, 'sceneCode', 'xicheng-ai-guide', 'app readiness evidence check live-xicheng-ai-chat-sourced', blockers)
  checkSummaryEquals(sourcedSummary, 'poiCode', 'xicheng-baitasi', 'app readiness evidence check live-xicheng-ai-chat-sourced', blockers)
  checkSummaryEquals(sourcedSummary, 'poiName', '妙应寺白塔', 'app readiness evidence check live-xicheng-ai-chat-sourced', blockers)
  checkSummaryEquals(sourcedSummary, 'contextEcho', true, 'app readiness evidence check live-xicheng-ai-chat-sourced', blockers)
  if (!['PASS', 'PASSED'].includes(String(sourcedSummary.safetyStatus || ''))) {
    blockers.push('app readiness evidence check live-xicheng-ai-chat-sourced summary.safetyStatus must be PASSED')
  }
  checkSummaryPositiveNumber(sourcedSummary, 'sourceCount', 'app readiness evidence check live-xicheng-ai-chat-sourced', blockers)
  checkSummaryPositiveNumber(sourcedSummary, 'logId', 'app readiness evidence check live-xicheng-ai-chat-sourced', blockers)

  const blockedSummary = summaryOfCheck('live-xicheng-ai-chat-blocked')
  checkSummaryEquals(blockedSummary, 'endpoint', '/app-api/xunjing/ai/chat', 'app readiness evidence check live-xicheng-ai-chat-blocked', blockers)
  if (hasText(expectedTenantId)) {
    checkSummaryEquals(blockedSummary, 'tenantId', expectedTenantId, 'app readiness evidence check live-xicheng-ai-chat-blocked', blockers)
  }
  checkSummaryEquals(blockedSummary, 'regionCode', expectedXichengRegionCode, 'app readiness evidence check live-xicheng-ai-chat-blocked', blockers)
  checkSummaryEquals(blockedSummary, 'packageCode', expectedXichengPackageCode, 'app readiness evidence check live-xicheng-ai-chat-blocked', blockers)
  checkSummaryEquals(blockedSummary, 'sceneCode', 'xicheng-ai-guide', 'app readiness evidence check live-xicheng-ai-chat-blocked', blockers)
  checkSummaryEquals(blockedSummary, 'poiCode', 'xicheng-source-guard-negative', 'app readiness evidence check live-xicheng-ai-chat-blocked', blockers)
  checkSummaryEquals(blockedSummary, 'poiName', '来源门禁测试点位', 'app readiness evidence check live-xicheng-ai-chat-blocked', blockers)
  checkSummaryEquals(blockedSummary, 'contextEcho', true, 'app readiness evidence check live-xicheng-ai-chat-blocked', blockers)
  checkSummaryEquals(blockedSummary, 'safetyStatus', 'BLOCKED', 'app readiness evidence check live-xicheng-ai-chat-blocked', blockers)
  if (Number(blockedSummary.sourceCount) !== 0) {
    blockers.push('app readiness evidence check live-xicheng-ai-chat-blocked summary.sourceCount must be 0')
  }
  checkSummaryPositiveNumber(blockedSummary, 'logId', 'app readiness evidence check live-xicheng-ai-chat-blocked', blockers)

  for (const [name, poiCode] of [
    ['live-xicheng-trigger-baitasi', 'xicheng-baitasi'],
    ['live-xicheng-trigger-gongwangfu', 'xicheng-gongwangfu'],
    ['live-xicheng-trigger-planetarium', 'xicheng-planetarium']
  ]) {
    const triggerSummary = summaryOfCheck(name)
    checkSummaryEquals(triggerSummary, 'endpoint', '/app-api/xunjing/triggers/resolve', `app readiness evidence check ${name}`, blockers)
    if (hasText(expectedTenantId)) {
      checkSummaryEquals(triggerSummary, 'tenantId', expectedTenantId, `app readiness evidence check ${name}`, blockers)
    }
    checkSummaryEquals(triggerSummary, 'packageCode', expectedXichengPackageCode, `app readiness evidence check ${name}`, blockers)
    checkSummaryEquals(triggerSummary, 'regionCode', expectedXichengRegionCode, `app readiness evidence check ${name}`, blockers)
    checkSummaryEquals(triggerSummary, 'poiCode', poiCode, `app readiness evidence check ${name}`, blockers)
    checkSummaryContains(triggerSummary, 'targetPath', `poiCode=${poiCode}`, `app readiness evidence check ${name}`, blockers)
    checkSummaryContains(triggerSummary, 'targetPath', `packageCode=${expectedXichengPackageCode}`, `app readiness evidence check ${name}`, blockers)
    if (!Number.isFinite(Number(triggerSummary.confidence)) || Number(triggerSummary.confidence) < 0.85) {
      blockers.push(`app readiness evidence check ${name} summary.confidence must be at least 0.85`)
    }
    checkSummaryPositiveNumber(triggerSummary, 'sourceCount', `app readiness evidence check ${name}`, blockers)
  }

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

async function checkEvidenceSourceHash(rootDir, evidence, label, fileField, hashField) {
  const blockers = []
  const summary = summaryOf(evidence)
  const sourcePath = summary[fileField]
  const expectedSha256 = summary[hashField]

  if (!sourcePath || String(sourcePath).trim().length === 0) {
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

async function checkReleaseBaselineHash(evidence) {
  const blockers = []
  const summary = summaryOf(evidence)
  const sourcePath = summary.yudaoBaselineSqlFile
  const expectedSha256 = summary.yudaoBaselineSqlSha256

  if (!/^[a-f0-9]{64}$/.test(String(expectedSha256 || ''))) {
    blockers.push('release evidence yudaoBaselineSqlSha256 must be a sha256 hex digest')
  }
  if (!sourcePath || String(sourcePath).trim().length === 0) {
    blockers.push('release evidence yudaoBaselineSqlFile is required')
  }
  if (blockers.length > 0) {
    return blockers
  }

  const resolvedSource = path.isAbsolute(sourcePath)
    ? path.resolve(sourcePath)
    : path.resolve(process.cwd(), sourcePath)
  try {
    const sourceText = await readFile(resolvedSource, 'utf8')
    if (sha256(sourceText) !== expectedSha256) {
      blockers.push('release evidence yudaoBaselineSqlSha256 must match yudaoBaselineSqlFile content')
    }
  } catch (error) {
    blockers.push(`release evidence yudaoBaselineSqlFile cannot be read: ${error.message}`)
  }
  return blockers
}

async function checkReleaseServerArtifactHash(evidence) {
  const blockers = []
  const summary = summaryOf(evidence)
  const sourcePath = summary.yudaoServerJarFile
  const expectedSha256 = summary.yudaoServerJarSha256
  const expectedSize = Number(summary.yudaoServerJarSizeBytes)

  if (!/^[a-f0-9]{64}$/.test(String(expectedSha256 || ''))) {
    blockers.push('release evidence yudaoServerJarSha256 must be a sha256 hex digest')
  }
  if (!sourcePath || String(sourcePath).trim().length === 0) {
    blockers.push('release evidence yudaoServerJarFile is required')
  }
  if (!Number.isFinite(expectedSize) || expectedSize <= 0) {
    blockers.push('release evidence yudaoServerJarSizeBytes must be a positive number')
  }
  if (blockers.length > 0) {
    return blockers
  }

  const resolvedSource = path.isAbsolute(sourcePath)
    ? path.resolve(sourcePath)
    : path.resolve(process.cwd(), sourcePath)
  try {
    const sourceBytes = await readFile(resolvedSource)
    if (sha256(sourceBytes) !== expectedSha256) {
      blockers.push('release evidence yudaoServerJarSha256 must match yudaoServerJarFile content')
    }
    if (sourceBytes.length !== expectedSize) {
      blockers.push('release evidence yudaoServerJarSizeBytes must match yudaoServerJarFile size')
    }
  } catch (error) {
    blockers.push(`release evidence yudaoServerJarFile cannot be read: ${error.message}`)
  }
  return blockers
}

function checkReleaseServerBuildSummary(evidence) {
  const blockers = []
  const summary = summaryOf(evidence)

  if (!hasText(summary.yudaoServerBuildEvidenceFile)) {
    blockers.push('release evidence yudaoServerBuildEvidenceFile is required')
  }
  if (!hasText(summary.yudaoServerBuildMethod)) {
    blockers.push('release evidence yudaoServerBuildMethod is required')
  }
  if (summary.gitAvailable === true) {
    if (summary.yudaoServerBuildGitAvailable !== true) {
      blockers.push('release evidence yudaoServerBuildGitAvailable must be true when release source revision is git-backed')
    }
    if (!/^[a-f0-9]{40}$/i.test(String(summary.yudaoServerBuildGitCommit || ''))) {
      blockers.push('release evidence yudaoServerBuildGitCommit must be a 40-character git commit SHA')
    } else if (summary.yudaoServerBuildGitCommit !== summary.gitCommit) {
      blockers.push('release evidence yudaoServerBuildGitCommit must match summary.gitCommit')
    }
    if (hasText(summary.yudaoServerBuildGitBranch) && hasText(summary.gitBranch) && summary.yudaoServerBuildGitBranch !== summary.gitBranch) {
      blockers.push('release evidence yudaoServerBuildGitBranch must match summary.gitBranch')
    }
    if (summary.yudaoServerBuildGitDirty !== false) {
      blockers.push('release evidence yudaoServerBuildGitDirty must be false')
    }
    if (Number(summary.yudaoServerBuildGitDirtyFileCount || 0) !== 0) {
      blockers.push('release evidence yudaoServerBuildGitDirtyFileCount must be 0')
    }
  }
  if (!hasText(summary.yudaoServerBuildJarFile)) {
    blockers.push('release evidence yudaoServerBuildJarFile is required')
  } else if (hasText(summary.yudaoServerJarFile) && path.resolve(summary.yudaoServerBuildJarFile) !== path.resolve(summary.yudaoServerJarFile)) {
    blockers.push('release evidence yudaoServerBuildJarFile must match yudaoServerJarFile')
  }
  if (summary.yudaoServerBuildJarSha256 !== summary.yudaoServerJarSha256) {
    blockers.push('release evidence yudaoServerBuildJarSha256 must match yudaoServerJarSha256')
  }
  if (Number(summary.yudaoServerBuildJarSizeBytes || 0) !== Number(summary.yudaoServerJarSizeBytes || 0)) {
    blockers.push('release evidence yudaoServerBuildJarSizeBytes must match yudaoServerJarSizeBytes')
  }
  return blockers
}

function normalizeUrlForCompare(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function checkReleaseYudaoServerSmokeSummary(evidence, rootDir) {
  const blockers = []
  const summary = summaryOf(evidence)

  if (!hasText(summary.yudaoServerSmokeEvidenceFile)) {
    blockers.push('release evidence yudaoServerSmokeEvidenceFile is required')
  }
  if (!isNonLocalHttpsUrl(summary.yudaoServerSmokeBaseUrl)) {
    blockers.push('release evidence yudaoServerSmokeBaseUrl must be a non-local HTTPS URL')
  }
  if (normalizeUrlForCompare(summary.yudaoServerSmokeBaseUrl) !== normalizeUrlForCompare(summary.appApiBaseUrl)) {
    blockers.push('release evidence yudaoServerSmokeBaseUrl must match appApiBaseUrl')
  }
  if (!hasText(summary.yudaoServerSmokeTenantId)) {
    blockers.push('release evidence yudaoServerSmokeTenantId is required')
  }
  if (summary.yudaoServerSmokePackageCode !== 'XICHENG-MAP-001') {
    blockers.push('release evidence yudaoServerSmokePackageCode must be XICHENG-MAP-001')
  }
  if (Number(summary.yudaoServerSmokePackageHttpStatus || 0) < 200 || Number(summary.yudaoServerSmokePackageHttpStatus || 0) >= 300) {
    blockers.push('release evidence yudaoServerSmokePackageHttpStatus must be 2xx')
  }
  if (Number(summary.yudaoServerSmokePublicReportHttpStatus || 0) < 200 || Number(summary.yudaoServerSmokePublicReportHttpStatus || 0) >= 300) {
    blockers.push('release evidence yudaoServerSmokePublicReportHttpStatus must be 2xx')
  }
  const publicReportPackageCount = Number(summary.yudaoServerSmokePublicReportPackageCount)
  const publicReportReviewedKnowledgeCount = Number(summary.yudaoServerSmokePublicReportReviewedKnowledgeCount)
  const publicReportReviewedMediaCount = Number(summary.yudaoServerSmokePublicReportReviewedMediaCount)
  const publicReportMapPointCount = Number(summary.yudaoServerSmokePublicReportMapPointCount)
  const mediaAssetCount = Number(summary.yudaoServerSmokeMediaAssetCount)
  if (!Number.isFinite(publicReportPackageCount) || publicReportPackageCount < 1) {
    blockers.push('release evidence yudaoServerSmokePublicReportPackageCount must be at least 1')
  }
  if (!Number.isFinite(publicReportReviewedKnowledgeCount) || publicReportReviewedKnowledgeCount < productionPoiTarget) {
    blockers.push(`release evidence yudaoServerSmokePublicReportReviewedKnowledgeCount must be at least ${productionPoiTarget}`)
  }
  if (!Number.isFinite(publicReportReviewedMediaCount) || publicReportReviewedMediaCount < 8) {
    blockers.push('release evidence yudaoServerSmokePublicReportReviewedMediaCount must be at least 8')
  }
  if (!Number.isFinite(publicReportMapPointCount) || publicReportMapPointCount < productionPoiTarget) {
    blockers.push(`release evidence yudaoServerSmokePublicReportMapPointCount must be at least ${productionPoiTarget}`)
  }
  if (!Number.isFinite(mediaAssetCount) || mediaAssetCount < 8) {
    blockers.push('release evidence yudaoServerSmokeMediaAssetCount must be at least 8')
  }
  if (hasText(summary.yudaoServerBuildEvidenceFile)) {
    if (!hasText(summary.yudaoServerSmokeBuildEvidenceFile)) {
      blockers.push('release evidence yudaoServerSmokeBuildEvidenceFile is required')
    } else if (
      normalizeEvidencePath(rootDir, summary.yudaoServerSmokeBuildEvidenceFile) !==
        normalizeEvidencePath(rootDir, summary.yudaoServerBuildEvidenceFile)
    ) {
      blockers.push('release evidence yudaoServerSmokeBuildEvidenceFile must match yudaoServerBuildEvidenceFile')
    }
  }
  if (hasText(summary.yudaoServerBuildGitCommit)) {
    if (!/^[a-f0-9]{40}$/i.test(String(summary.yudaoServerSmokeBuildGitCommit || ''))) {
      blockers.push('release evidence yudaoServerSmokeBuildGitCommit must be a 40-character git commit SHA')
    } else if (summary.yudaoServerSmokeBuildGitCommit !== summary.yudaoServerBuildGitCommit) {
      blockers.push('release evidence yudaoServerSmokeBuildGitCommit must match yudaoServerBuildGitCommit')
    }
    if (summary.yudaoServerSmokeBuildGitDirty !== false) {
      blockers.push('release evidence yudaoServerSmokeBuildGitDirty must be false')
    }
  }
  if (hasText(summary.yudaoServerBuildJarSha256)) {
    if (summary.yudaoServerSmokeBuildJarSha256 !== summary.yudaoServerBuildJarSha256) {
      blockers.push('release evidence yudaoServerSmokeBuildJarSha256 must match yudaoServerBuildJarSha256')
    }
  }
  return blockers
}

async function checkYudaoServerBuildEvidence(ref, releaseRef, rootDir, freshnessOptions) {
  const blockers = []
  const releaseSummary = summaryOf(releaseRef.data)
  if (ref.error) {
    blockers.push(ref.error)
    return check('yudao-server-build-evidence', blockers)
  }

  const evidence = ref.data || {}
  const summary = summaryOf(evidence)
  const evidenceJarFile = normalizeEvidencePath(rootDir, summary.jarFile)
  const releaseBuildEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.yudaoServerBuildEvidenceFile)
  const releaseServerJarFile = normalizeEvidencePath(rootDir, releaseSummary.yudaoServerJarFile)
  const releaseBuildJarFile = normalizeEvidencePath(rootDir, releaseSummary.yudaoServerBuildJarFile)
  const expectedSha256 = releaseSummary.yudaoServerJarSha256
  const expectedSize = Number(releaseSummary.yudaoServerJarSizeBytes)

  if (releaseBuildEvidenceFile && ref.path !== releaseBuildEvidenceFile) {
    blockers.push('Yudao server build evidence file must match release evidence summary')
  }
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
  if (!hasText(summary.buildMethod)) {
    blockers.push('Yudao server build evidence buildMethod is required')
  }
  if (releaseSummary.gitAvailable === true) {
    if (summary.gitAvailable !== true) {
      blockers.push('Yudao server build evidence gitAvailable must be true when release source revision is git-backed')
    }
    if (!/^[a-f0-9]{40}$/i.test(String(summary.gitCommit || ''))) {
      blockers.push('Yudao server build evidence gitCommit must be a 40-character git commit SHA')
    } else if (summary.gitCommit !== releaseSummary.gitCommit) {
      blockers.push('Yudao server build evidence gitCommit must match release evidence summary.gitCommit')
    } else if (hasText(releaseSummary.yudaoServerBuildGitCommit) && summary.gitCommit !== releaseSummary.yudaoServerBuildGitCommit) {
      blockers.push('Yudao server build evidence gitCommit must match release evidence yudaoServerBuildGitCommit')
    }
    if (hasText(summary.gitBranch) && hasText(releaseSummary.gitBranch) && summary.gitBranch !== releaseSummary.gitBranch) {
      blockers.push('Yudao server build evidence gitBranch must match release evidence summary.gitBranch')
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
  } else {
    if (releaseServerJarFile && evidenceJarFile !== releaseServerJarFile) {
      blockers.push('Yudao server build evidence jarFile must match release jar')
    }
    if (releaseBuildJarFile && evidenceJarFile !== releaseBuildJarFile) {
      blockers.push('Yudao server build evidence jarFile must match release build summary jar')
    }
  }
  if (!/^[a-f0-9]{64}$/i.test(String(summary.jarSha256 || ''))) {
    blockers.push('Yudao server build evidence jarSha256 must be a sha256 hex digest')
  } else if (summary.jarSha256 !== expectedSha256 || summary.jarSha256 !== releaseSummary.yudaoServerBuildJarSha256) {
    blockers.push('Yudao server build evidence jarSha256 must match release jar')
  }
  if (!Number.isFinite(Number(summary.jarSizeBytes)) || Number(summary.jarSizeBytes) <= 0) {
    blockers.push('Yudao server build evidence jarSizeBytes must be positive')
  } else if (Number(summary.jarSizeBytes) !== expectedSize || Number(summary.jarSizeBytes) !== Number(releaseSummary.yudaoServerBuildJarSizeBytes)) {
    blockers.push('Yudao server build evidence jarSizeBytes must match release jar')
  }
  if (evidenceJarFile && /^[a-f0-9]{64}$/i.test(String(summary.jarSha256 || '')) && Number(summary.jarSizeBytes) > 0) {
    try {
      const jarBytes = await readFile(evidenceJarFile)
      if (sha256(jarBytes) !== summary.jarSha256) {
        blockers.push('Yudao server build evidence jarSha256 must match jarFile content')
      }
      if (jarBytes.length !== Number(summary.jarSizeBytes)) {
        blockers.push('Yudao server build evidence jarSizeBytes must match jarFile size')
      }
    } catch (error) {
      blockers.push(`Yudao server build evidence jarFile cannot be read: ${error.message}`)
    }
  }
  blockers.push(...checkEvidenceChecks(evidence, requiredYudaoServerBuildEvidenceChecks, 'Yudao server build'))
  if (blockersOf(evidence).length > 0) {
    blockers.push(`Yudao server build evidence contains blockers: ${blockersOf(evidence).join('; ')}`)
  }
  return check('yudao-server-build-evidence', blockers)
}

function isHttp2xx(value) {
  const status = Number(value)
  return Number.isFinite(status) && status >= 200 && status < 300
}

function checkYudaoServerSmokeEvidence(ref, releaseRef, rootDir, freshnessOptions) {
  const blockers = []
  const releaseSummary = summaryOf(releaseRef.data)
  if (ref.error) {
    blockers.push(ref.error)
    return check('yudao-server-smoke-evidence', blockers)
  }

  const evidence = ref.data || {}
  const summary = summaryOf(evidence)
  const releaseSmokeEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.yudaoServerSmokeEvidenceFile)
  const releaseBuildEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.yudaoServerBuildEvidenceFile)
  const smokeBuildEvidenceFile = normalizeEvidencePath(rootDir, summary.buildEvidenceFile)
  const smokeBaseUrl = normalizedBaseUrl(summary.baseUrl)
  const releaseSmokeBaseUrl = normalizedBaseUrl(releaseSummary.yudaoServerSmokeBaseUrl)
  const releaseAppBaseUrl = normalizedBaseUrl(releaseSummary.appApiBaseUrl)

  if (releaseSmokeEvidenceFile && ref.path !== releaseSmokeEvidenceFile) {
    blockers.push('Yudao server smoke evidence file must match release evidence summary')
  }
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
  if (!isNonLocalHttpsUrl(summary.baseUrl)) {
    blockers.push('Yudao server smoke evidence baseUrl must be a non-local HTTPS URL')
  } else {
    if (releaseSmokeBaseUrl && smokeBaseUrl !== releaseSmokeBaseUrl) {
      blockers.push('Yudao server smoke evidence baseUrl must match release evidence summary')
    }
    if (releaseAppBaseUrl && smokeBaseUrl !== releaseAppBaseUrl) {
      blockers.push('Yudao server smoke evidence baseUrl must match release appApiBaseUrl')
    }
  }
  if (!hasText(summary.providerSmokeHost) || isLoopbackHostname(summary.providerSmokeHost)) {
    blockers.push('Yudao server smoke evidence providerSmokeHost must be non-local')
  }
  if (releaseBuildEvidenceFile) {
    if (!smokeBuildEvidenceFile) {
      blockers.push('Yudao server smoke evidence buildEvidenceFile is required')
    } else if (smokeBuildEvidenceFile !== releaseBuildEvidenceFile) {
      blockers.push('Yudao server smoke evidence buildEvidenceFile must match release evidence yudaoServerBuildEvidenceFile')
    }
  }
  if (hasText(releaseSummary.yudaoServerBuildGitCommit)) {
    if (!/^[a-f0-9]{40}$/i.test(String(summary.buildGitCommit || ''))) {
      blockers.push('Yudao server smoke evidence buildGitCommit must be a 40-character git commit SHA')
    } else if (summary.buildGitCommit !== releaseSummary.yudaoServerBuildGitCommit) {
      blockers.push('Yudao server smoke evidence buildGitCommit must match release evidence yudaoServerBuildGitCommit')
    }
    if (summary.buildGitDirty !== false) {
      blockers.push('Yudao server smoke evidence buildGitDirty must be false')
    }
  }
  if (hasText(releaseSummary.yudaoServerBuildJarSha256) && summary.buildJarSha256 !== releaseSummary.yudaoServerBuildJarSha256) {
    blockers.push('Yudao server smoke evidence buildJarSha256 must match release evidence yudaoServerBuildJarSha256')
  }
  if (!hasText(summary.tenantId)) {
    blockers.push('Yudao server smoke evidence tenantId is required')
  } else if (
    hasText(releaseSummary.yudaoServerSmokeTenantId) &&
    String(summary.tenantId) !== String(releaseSummary.yudaoServerSmokeTenantId)
  ) {
    blockers.push('Yudao server smoke evidence tenantId must match release evidence summary')
  }
  if (summary.packageCode !== expectedXichengPackageCode) {
    blockers.push('Yudao server smoke evidence packageCode must be XICHENG-MAP-001')
  } else if (
    hasText(releaseSummary.yudaoServerSmokePackageCode) &&
    summary.packageCode !== releaseSummary.yudaoServerSmokePackageCode
  ) {
    blockers.push('Yudao server smoke evidence packageCode must match release evidence summary')
  }
  if (summary.packageRegionCode !== expectedXichengRegionCode) {
    blockers.push('Yudao server smoke evidence packageRegionCode must be beijing-xicheng')
  }
  if (summary.packageStatus !== 'PUBLISHED') {
    blockers.push('Yudao server smoke evidence packageStatus must be PUBLISHED')
  }
  if (!isHttp2xx(summary.packageHttpStatus)) {
    blockers.push('Yudao server smoke evidence packageHttpStatus must be 2xx')
  } else if (
    Number.isFinite(Number(releaseSummary.yudaoServerSmokePackageHttpStatus)) &&
    Number(summary.packageHttpStatus) !== Number(releaseSummary.yudaoServerSmokePackageHttpStatus)
  ) {
    blockers.push('Yudao server smoke evidence packageHttpStatus must match release evidence summary')
  }
  if (!isHttp2xx(summary.publicReportHttpStatus)) {
    blockers.push('Yudao server smoke evidence publicReportHttpStatus must be 2xx')
  } else if (
    Number.isFinite(Number(releaseSummary.yudaoServerSmokePublicReportHttpStatus)) &&
    Number(summary.publicReportHttpStatus) !== Number(releaseSummary.yudaoServerSmokePublicReportHttpStatus)
  ) {
    blockers.push('Yudao server smoke evidence publicReportHttpStatus must match release evidence summary')
  }

  const publicReportPackageCount = Number(summary.publicReportPackageCount)
  const publicReportReviewedKnowledgeCount = Number(summary.publicReportReviewedKnowledgeCount)
  const publicReportReviewedMediaCount = Number(summary.publicReportReviewedMediaCount)
  const publicReportMapPointCount = Number(summary.publicReportMapPointCount)
  const mediaAssetCount = Number(summary.mediaAssetCount)
  if (!Number.isFinite(publicReportPackageCount) || publicReportPackageCount < 1) {
    blockers.push('Yudao server smoke evidence publicReportPackageCount must be at least 1')
  } else if (
    Number.isFinite(Number(releaseSummary.yudaoServerSmokePublicReportPackageCount)) &&
    publicReportPackageCount !== Number(releaseSummary.yudaoServerSmokePublicReportPackageCount)
  ) {
    blockers.push('Yudao server smoke evidence publicReportPackageCount must match release evidence summary')
  }
  if (!Number.isFinite(publicReportReviewedKnowledgeCount) || publicReportReviewedKnowledgeCount < productionPoiTarget) {
    blockers.push(`Yudao server smoke evidence publicReportReviewedKnowledgeCount must be at least ${productionPoiTarget}`)
  } else if (
    Number.isFinite(Number(releaseSummary.yudaoServerSmokePublicReportReviewedKnowledgeCount)) &&
    publicReportReviewedKnowledgeCount !== Number(releaseSummary.yudaoServerSmokePublicReportReviewedKnowledgeCount)
  ) {
    blockers.push('Yudao server smoke evidence publicReportReviewedKnowledgeCount must match release evidence summary')
  }
  if (!Number.isFinite(publicReportReviewedMediaCount) || publicReportReviewedMediaCount < 8) {
    blockers.push('Yudao server smoke evidence publicReportReviewedMediaCount must be at least 8')
  } else if (
    Number.isFinite(Number(releaseSummary.yudaoServerSmokePublicReportReviewedMediaCount)) &&
    publicReportReviewedMediaCount !== Number(releaseSummary.yudaoServerSmokePublicReportReviewedMediaCount)
  ) {
    blockers.push('Yudao server smoke evidence publicReportReviewedMediaCount must match release evidence summary')
  }
  if (!Number.isFinite(publicReportMapPointCount) || publicReportMapPointCount < productionPoiTarget) {
    blockers.push(`Yudao server smoke evidence publicReportMapPointCount must be at least ${productionPoiTarget}`)
  } else if (
    Number.isFinite(Number(releaseSummary.yudaoServerSmokePublicReportMapPointCount)) &&
    publicReportMapPointCount !== Number(releaseSummary.yudaoServerSmokePublicReportMapPointCount)
  ) {
    blockers.push('Yudao server smoke evidence publicReportMapPointCount must match release evidence summary')
  }
  if (!Number.isFinite(mediaAssetCount) || mediaAssetCount < 8) {
    blockers.push('Yudao server smoke evidence mediaAssetCount must be at least 8')
  } else if (
    Number.isFinite(Number(releaseSummary.yudaoServerSmokeMediaAssetCount)) &&
    mediaAssetCount !== Number(releaseSummary.yudaoServerSmokeMediaAssetCount)
  ) {
    blockers.push('Yudao server smoke evidence mediaAssetCount must match release evidence summary')
  }

  blockers.push(...checkEvidenceChecks(evidence, requiredYudaoServerSmokeEvidenceChecks, 'Yudao server smoke'))
  if (blockersOf(evidence).length > 0) {
    blockers.push(`Yudao server smoke evidence contains blockers: ${blockersOf(evidence).join('; ')}`)
  }
  return check('yudao-server-smoke-evidence', blockers)
}

function checkRuntimeSeedEvidence(ref, releaseRef, rootDir, freshnessOptions) {
  const blockers = []
  const releaseSummary = summaryOf(releaseRef.data)
  if (ref.error) {
    blockers.push(ref.error)
    return check('runtime-seed-evidence', blockers)
  }

  const evidence = ref.data || {}
  const summary = summaryOf(evidence)
  const releaseRuntimeSeedEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.runtimeSeedEvidenceFile)

  if (releaseRuntimeSeedEvidenceFile && ref.path !== releaseRuntimeSeedEvidenceFile) {
    blockers.push('runtime seed evidence file must match release evidence summary')
  }
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
  } else if (
    hasText(releaseSummary.runtimeSeedReadinessMode) &&
    summary.readinessMode !== releaseSummary.runtimeSeedReadinessMode
  ) {
    blockers.push('runtime seed evidence readinessMode must match release evidence summary')
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
  } else if (
    typeof releaseSummary.runtimeSeedProductionReady === 'boolean' &&
    summary.productionReady !== releaseSummary.runtimeSeedProductionReady
  ) {
    blockers.push('runtime seed evidence productionReady must match release evidence summary')
  }
  if (Number(summary.poiTotal) < productionPoiTarget) {
    blockers.push(`runtime seed evidence must prove at least ${productionPoiTarget} POIs`)
  } else if (
    Number.isFinite(Number(releaseSummary.runtimeSeedPoiTotal)) &&
    Number(summary.poiTotal) !== Number(releaseSummary.runtimeSeedPoiTotal)
  ) {
    blockers.push('runtime seed evidence poiTotal must match release evidence summary')
  }
  if (Number(summary.poiApprovedPublished) < productionPoiTarget) {
    blockers.push(`runtime seed evidence must prove at least ${productionPoiTarget} approved and published POIs`)
  } else if (
    Number.isFinite(Number(releaseSummary.runtimeSeedPoiApprovedPublished)) &&
    Number(summary.poiApprovedPublished) !== Number(releaseSummary.runtimeSeedPoiApprovedPublished)
  ) {
    blockers.push('runtime seed evidence poiApprovedPublished must match release evidence summary')
  }
  if (Number(summary.knowledgeDocuments) < productionPoiTarget + 4) {
    blockers.push('runtime seed evidence must prove at least 84 knowledge documents')
  } else if (
    Number.isFinite(Number(releaseSummary.runtimeSeedKnowledgeDocuments)) &&
    Number(summary.knowledgeDocuments) !== Number(releaseSummary.runtimeSeedKnowledgeDocuments)
  ) {
    blockers.push('runtime seed evidence knowledgeDocuments must match release evidence summary')
  }
  if (Number(summary.mapPoints) < productionPoiTarget) {
    blockers.push(`runtime seed evidence must prove at least ${productionPoiTarget} map points`)
  } else if (
    Number.isFinite(Number(releaseSummary.runtimeSeedMapPoints)) &&
    Number(summary.mapPoints) !== Number(releaseSummary.runtimeSeedMapPoints)
  ) {
    blockers.push('runtime seed evidence mapPoints must match release evidence summary')
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
  if (blockersOf(evidence).length > 0) {
    blockers.push(`runtime seed evidence contains blockers: ${blockersOf(evidence).join('; ')}`)
  }
  return check('runtime-seed-evidence', blockers)
}

function checkProductionSeedApplyEvidence(ref, releaseRef, seedRef, runtimeSeedRef, rootDir, freshnessOptions) {
  const blockers = []
  const releaseSummary = summaryOf(releaseRef.data)
  if (ref.error) {
    blockers.push(ref.error)
    return check('production-seed-apply-evidence', blockers)
  }

  const evidence = ref.data || {}
  const summary = summaryOf(evidence)
  const seedSummary = summaryOf(seedRef.data)
  const runtimeSeedSummary = summaryOf(runtimeSeedRef.data)
  const releaseProductionSeedApplyEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.productionSeedApplyEvidenceFile)
  const releaseProductionSeedApplyRuntimeEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.productionSeedApplyRuntimeEvidenceFile)
  const releaseProductionSeedApplySeedEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.productionSeedApplySeedEvidenceFile)

  if (releaseProductionSeedApplyEvidenceFile && ref.path !== releaseProductionSeedApplyEvidenceFile) {
    blockers.push('production seed apply evidence file must match release evidence summary')
  }
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
  if (summary.regionCode !== expectedXichengRegionCode) {
    blockers.push('production seed apply evidence regionCode must be beijing-xicheng')
  }
  if (summary.packageCode !== expectedXichengPackageCode) {
    blockers.push('production seed apply evidence packageCode must be XICHENG-MAP-001')
  }
  if (seedRef.path && normalizeEvidencePath(rootDir, summary.seedEvidenceFile) !== seedRef.path) {
    blockers.push('production seed apply evidence seedEvidenceFile must match seed evidence')
  }
  if (
    releaseProductionSeedApplySeedEvidenceFile &&
    normalizeEvidencePath(rootDir, summary.seedEvidenceFile) !== releaseProductionSeedApplySeedEvidenceFile
  ) {
    blockers.push('production seed apply evidence seedEvidenceFile must match release evidence summary')
  }
  if (runtimeSeedRef.path && normalizeEvidencePath(rootDir, summary.runtimeEvidenceFile) !== runtimeSeedRef.path) {
    blockers.push('production seed apply evidence runtimeEvidenceFile must match runtime seed evidence')
  }
  if (
    releaseProductionSeedApplyRuntimeEvidenceFile &&
    normalizeEvidencePath(rootDir, summary.runtimeEvidenceFile) !== releaseProductionSeedApplyRuntimeEvidenceFile
  ) {
    blockers.push('production seed apply evidence runtimeEvidenceFile must match release evidence summary')
  }
  if (ref.path && normalizeEvidencePath(rootDir, summary.applyEvidenceFile) !== ref.path) {
    blockers.push('production seed apply evidence applyEvidenceFile must match the evidence file path')
  }
  if (hasText(seedSummary.sqlFile) && normalizeEvidencePath(rootDir, summary.seedSqlFile) !== normalizeEvidencePath(rootDir, seedSummary.sqlFile)) {
    blockers.push('production seed apply evidence seedSqlFile must match seed evidence sqlFile')
  }
  if (!/^[a-f0-9]{64}$/i.test(String(summary.seedSqlSha256 || ''))) {
    blockers.push('production seed apply evidence seedSqlSha256 must be a sha256 hex digest')
  } else {
    if (hasText(seedSummary.sqlSha256) && summary.seedSqlSha256 !== seedSummary.sqlSha256) {
      blockers.push('production seed apply evidence seedSqlSha256 must match seed evidence sqlSha256')
    }
    if (
      hasText(releaseSummary.productionSeedApplySeedSqlSha256) &&
      summary.seedSqlSha256 !== releaseSummary.productionSeedApplySeedSqlSha256
    ) {
      blockers.push('production seed apply evidence seedSqlSha256 must match release evidence summary')
    }
  }
  if (summary.runtimeSeedStatus !== 'YUDAO_XICHENG_PRODUCTION_SEED_READY') {
    blockers.push('production seed apply evidence runtimeSeedStatus must be YUDAO_XICHENG_PRODUCTION_SEED_READY')
  } else if (runtimeSeedRef.data?.status && summary.runtimeSeedStatus !== runtimeSeedRef.data.status) {
    blockers.push('production seed apply evidence runtimeSeedStatus must match runtime seed evidence')
  }
  if (summary.runtimeSeedProductionReady !== true) {
    blockers.push('production seed apply evidence runtimeSeedProductionReady must be true')
  } else if (
    typeof runtimeSeedSummary.productionReady === 'boolean' &&
    summary.runtimeSeedProductionReady !== runtimeSeedSummary.productionReady
  ) {
    blockers.push('production seed apply evidence runtimeSeedProductionReady must match runtime seed evidence')
  }
  if (Number(summary.runtimeSeedPoiTotal) < productionPoiTarget) {
    blockers.push(`production seed apply evidence runtimeSeedPoiTotal must be at least ${productionPoiTarget}`)
  } else if (
    Number.isFinite(Number(runtimeSeedSummary.poiTotal)) &&
    Number(summary.runtimeSeedPoiTotal) !== Number(runtimeSeedSummary.poiTotal)
  ) {
    blockers.push('production seed apply evidence runtimeSeedPoiTotal must match runtime seed evidence')
  }
  if (Number(summary.runtimeSeedKnowledgeDocuments) < productionPoiTarget + 4) {
    blockers.push('production seed apply evidence runtimeSeedKnowledgeDocuments must be at least 84')
  } else if (
    Number.isFinite(Number(runtimeSeedSummary.knowledgeDocuments)) &&
    Number(summary.runtimeSeedKnowledgeDocuments) !== Number(runtimeSeedSummary.knowledgeDocuments)
  ) {
    blockers.push('production seed apply evidence runtimeSeedKnowledgeDocuments must match runtime seed evidence')
  }
  if (Number(summary.runtimeSeedMapPoints) < productionPoiTarget) {
    blockers.push(`production seed apply evidence runtimeSeedMapPoints must be at least ${productionPoiTarget}`)
  } else if (
    Number.isFinite(Number(runtimeSeedSummary.mapPoints)) &&
    Number(summary.runtimeSeedMapPoints) !== Number(runtimeSeedSummary.mapPoints)
  ) {
    blockers.push('production seed apply evidence runtimeSeedMapPoints must match runtime seed evidence')
  }
  blockers.push(...checkEvidenceChecks(evidence, requiredProductionSeedApplyEvidenceChecks, 'production seed apply'))
  if (blockersOf(evidence).length > 0) {
    blockers.push(`production seed apply evidence contains blockers: ${blockersOf(evidence).join('; ')}`)
  }
  return check('production-seed-apply-evidence', blockers)
}

function checkReleaseSourceRevisionSummary(evidence) {
  const blockers = []
  const summary = summaryOf(evidence)
  if (summary.gitAvailable !== true) {
    blockers.push('release evidence summary.gitAvailable must be true')
  }
  if (!String(summary.gitBranch || '').trim()) {
    blockers.push('release evidence summary.gitBranch is required')
  }
  if (!/^[a-f0-9]{40}$/i.test(String(summary.gitCommit || ''))) {
    blockers.push('release evidence summary.gitCommit must be a 40-character git commit SHA')
  }
  if (summary.gitDirty !== false) {
    blockers.push('release evidence summary.gitDirty must be false')
  }
  if (Number(summary.gitDirtyFileCount) !== 0) {
    blockers.push('release evidence summary.gitDirtyFileCount must be 0')
  }
  return blockers
}

function checkReleaseRuntimeEnvFingerprintSummary(evidence) {
  const blockers = []
  const summary = summaryOf(evidence)
  if (summary.runtimeEnvFingerprintMode !== 'redacted-runtime-env-v1') {
    blockers.push('release evidence runtimeEnvFingerprintMode must be redacted-runtime-env-v1')
  }
  if (!Number.isFinite(Number(summary.runtimeEnvRequiredKeyCount)) || Number(summary.runtimeEnvRequiredKeyCount) <= 0) {
    blockers.push('release evidence runtimeEnvRequiredKeyCount must be a positive number')
  }
  if (!Number.isFinite(Number(summary.runtimeEnvPresentKeyCount)) || Number(summary.runtimeEnvPresentKeyCount) <= 0) {
    blockers.push('release evidence runtimeEnvPresentKeyCount must be a positive number')
  }
  if (!/^[a-f0-9]{64}$/i.test(String(summary.runtimeEnvNonSecretSha256 || ''))) {
    blockers.push('release evidence runtimeEnvNonSecretSha256 must be a sha256 hex digest')
  }
  if (!/^[a-f0-9]{64}$/i.test(String(summary.runtimeEnvSecretPresenceSha256 || ''))) {
    blockers.push('release evidence runtimeEnvSecretPresenceSha256 must be a sha256 hex digest')
  }
  return blockers
}

function checkNonLocalHostSummary(summary, field, label, blockers) {
  const value = String(summary?.[field] || '').trim()
  if (!value) {
    blockers.push(`${label} ${field} is required`)
    return
  }
  if (isLoopbackHostname(value)) {
    blockers.push(`${label} ${field} must be non-local`)
  }
}

function checkReleaseProviderSmokeSummary(evidence) {
  const blockers = []
  const summary = summaryOf(evidence)

  for (const field of ['aiBootstrapEvidenceFile', 'aiBootstrapModel']) {
    if (!hasText(summary[field])) {
      blockers.push(`release evidence ${field} is required`)
    }
  }
  checkNonLocalHostSummary(summary, 'aiBootstrapProviderSmokeHost', 'release evidence', blockers)

  for (const field of ['qdrantEvidenceFile', 'qdrantTextCollection']) {
    if (!hasText(summary[field])) {
      blockers.push(`release evidence ${field} is required`)
    }
  }
  const hasQdrantImageSummary = hasText(summary.qdrantImageCollection) ||
    Number(summary.qdrantImageCollectionHttpStatus || 0) > 0 ||
    hasText(summary.qdrantImageCollectionStatus)
  checkNonLocalHostSummary(summary, 'qdrantProviderSmokeHost', 'release evidence', blockers)
  if (String(summary.qdrantProviderSmokeEndpointPath || '') !== '/collections') {
    blockers.push('release evidence qdrantProviderSmokeEndpointPath must be /collections')
  }
  if (Number(summary.qdrantTextCollectionHttpStatus || 0) < 200 || Number(summary.qdrantTextCollectionHttpStatus || 0) >= 300) {
    blockers.push('release evidence qdrantTextCollectionHttpStatus must be 2xx')
  }
  if (
    hasQdrantImageSummary &&
    (Number(summary.qdrantImageCollectionHttpStatus || 0) < 200 || Number(summary.qdrantImageCollectionHttpStatus || 0) >= 300)
  ) {
    blockers.push('release evidence qdrantImageCollectionHttpStatus must be 2xx')
  }
  if (String(summary.qdrantTextCollectionStatus || '') !== 'green') {
    blockers.push('release evidence qdrantTextCollectionStatus must be green')
  }
  if (hasQdrantImageSummary && String(summary.qdrantImageCollectionStatus || '') !== 'green') {
    blockers.push('release evidence qdrantImageCollectionStatus must be green')
  }

  for (const field of ['embeddingEvidenceFile', 'embeddingProviderSmokeModel']) {
    if (!hasText(summary[field])) {
      blockers.push(`release evidence ${field} is required`)
    }
  }
  checkNonLocalHostSummary(summary, 'embeddingProviderSmokeHost', 'release evidence', blockers)
  if (!String(summary.embeddingProviderSmokeEndpointPath || '').endsWith('/embeddings')) {
    blockers.push('release evidence embeddingProviderSmokeEndpointPath must end with /embeddings')
  }
  if (Number(summary.embeddingProviderSmokeHttpStatus || 0) !== 200) {
    blockers.push('release evidence embeddingProviderSmokeHttpStatus must be 200')
  }
  const embeddingVectorDimensions = Number(summary.embeddingVectorDimensions || 0)
  const embeddingFiniteValueCount = Number(summary.embeddingFiniteValueCount || 0)
  if (!Number.isFinite(embeddingVectorDimensions) || embeddingVectorDimensions <= 0) {
    blockers.push('release evidence embeddingVectorDimensions must be greater than 0')
  }
  if (embeddingFiniteValueCount !== embeddingVectorDimensions) {
    blockers.push('release evidence embeddingFiniteValueCount must equal embeddingVectorDimensions')
  }

  for (const field of ['visionOcrEvidenceFile', 'visionOcrModel']) {
    if (!hasText(summary[field])) {
      blockers.push(`release evidence ${field} is required`)
    }
  }
  checkNonLocalHostSummary(summary, 'visionOcrProviderSmokeHost', 'release evidence', blockers)

  for (const field of ['objectStorageEvidenceFile', 'objectStorageBucket']) {
    if (!hasText(summary[field])) {
      blockers.push(`release evidence ${field} is required`)
    }
  }
  checkNonLocalHostSummary(summary, 'objectStorageProviderSmokeHost', 'release evidence', blockers)
  if (Number(summary.objectStoragePutHttpStatus || 0) < 200 || Number(summary.objectStoragePutHttpStatus || 0) >= 300) {
    blockers.push('release evidence objectStoragePutHttpStatus must be 2xx')
  }
  if (Number(summary.objectStorageGetHttpStatus || 0) < 200 || Number(summary.objectStorageGetHttpStatus || 0) >= 300) {
    blockers.push('release evidence objectStorageGetHttpStatus must be 2xx')
  }
  if (![200, 202, 204].includes(Number(summary.objectStorageDeleteHttpStatus || 0))) {
    blockers.push('release evidence objectStorageDeleteHttpStatus must be 200, 202 or 204')
  }
  if (summary.objectStorageReadBackMatches !== true) {
    blockers.push('release evidence objectStorageReadBackMatches must be true')
  }
  if (summary.objectStorageDeleted !== true) {
    blockers.push('release evidence objectStorageDeleted must be true')
  }
  return blockers
}

function checkReleaseRuntimeSeedSummary(evidence) {
  const blockers = []
  const summary = summaryOf(evidence)
  if (!hasText(summary.runtimeSeedEvidenceFile)) {
    blockers.push('release evidence runtimeSeedEvidenceFile is required')
  }
  if (summary.runtimeSeedReadinessMode !== 'production') {
    blockers.push('release evidence runtimeSeedReadinessMode must be production')
  }
  if (summary.runtimeSeedProductionReady !== true) {
    blockers.push('release evidence runtimeSeedProductionReady must be true')
  }
  if (summary.runtimeSeedLocalCandidateReady !== true) {
    blockers.push('release evidence runtimeSeedLocalCandidateReady must be true')
  }
  if (Number(summary.runtimeSeedPoiTotal) < productionPoiTarget) {
    blockers.push(`release evidence runtimeSeedPoiTotal must be at least ${productionPoiTarget}`)
  }
  if (Number(summary.runtimeSeedPoiApprovedPublished) < productionPoiTarget) {
    blockers.push(`release evidence runtimeSeedPoiApprovedPublished must be at least ${productionPoiTarget}`)
  }
  if (Number(summary.runtimeSeedKnowledgeDocuments) < productionPoiTarget + 4) {
    blockers.push('release evidence runtimeSeedKnowledgeDocuments must be at least 84')
  }
  if (Number(summary.runtimeSeedMapPoints) < productionPoiTarget) {
    blockers.push(`release evidence runtimeSeedMapPoints must be at least ${productionPoiTarget}`)
  }
  if (Number(summary.runtimeSeedGeoReviewRequired) !== 0) {
    blockers.push('release evidence runtimeSeedGeoReviewRequired must be 0')
  }
  if (Number(summary.runtimeSeedLicenseReviewRequired) !== 0) {
    blockers.push('release evidence runtimeSeedLicenseReviewRequired must be 0')
  }
  if (Number(summary.runtimeSeedProductionBlockerCount) !== 0) {
    blockers.push('release evidence runtimeSeedProductionBlockerCount must be 0')
  }
  return blockers
}

function checkReleaseSourceCoverageSummary(evidence) {
  const blockers = []
  const summary = summaryOf(evidence)
  if (!hasText(summary.sourceCoverageEvidenceFile)) {
    blockers.push('release evidence sourceCoverageEvidenceFile is required')
  }
  if (summary.sourceCoverageStatus !== 'SOURCE_COVERAGE_READY') {
    blockers.push('release evidence sourceCoverageStatus must be SOURCE_COVERAGE_READY')
  }
  if (Number(summary.sourceCoverageSourceGroupCount) <= 0) {
    blockers.push('release evidence sourceCoverageSourceGroupCount must be positive')
  }
  if (Number(summary.sourceCoveragePoiCount) < productionPoiTarget) {
    blockers.push(`release evidence sourceCoveragePoiCount must be at least ${productionPoiTarget}`)
  }
  if (Number(summary.sourceCoverageCoveredPoiCount) < productionPoiTarget) {
    blockers.push(`release evidence sourceCoverageCoveredPoiCount must be at least ${productionPoiTarget}`)
  }
  if (Number(summary.sourceCoverageUncoveredPoiCount) !== 0) {
    blockers.push('release evidence sourceCoverageUncoveredPoiCount must be 0')
  }
  if (!Array.isArray(summary.sourceCoverageUncoveredPoiCodes) || summary.sourceCoverageUncoveredPoiCodes.length !== 0) {
    blockers.push('release evidence sourceCoverageUncoveredPoiCodes must be empty')
  }
  return blockers
}

function checkReleaseReviewApplySummary(evidence) {
  const blockers = []
  const summary = summaryOf(evidence)
  if (!hasText(summary.sourceReviewApplyEvidenceFile)) {
    blockers.push('release evidence sourceReviewApplyEvidenceFile is required')
  }
  if (summary.sourceReviewApplyStatus !== 'SOURCE_REVIEW_APPLIED') {
    blockers.push('release evidence sourceReviewApplyStatus must be SOURCE_REVIEW_APPLIED')
  }
  if (Number(summary.sourceReviewAppliedPoiCount) < productionPoiTarget) {
    blockers.push(`release evidence sourceReviewAppliedPoiCount must be at least ${productionPoiTarget}`)
  }
  if (Number(summary.sourceReviewPendingSourcePoiCount) !== 0) {
    blockers.push('release evidence sourceReviewPendingSourcePoiCount must be 0')
  }
  if (!hasText(summary.productionReviewApplyEvidenceFile)) {
    blockers.push('release evidence productionReviewApplyEvidenceFile is required')
  }
  if (summary.productionReviewApplyStatus !== 'PRODUCTION_REVIEW_APPLIED') {
    blockers.push('release evidence productionReviewApplyStatus must be PRODUCTION_REVIEW_APPLIED')
  }
  if (Number(summary.productionReviewAppliedPoiCount) < productionPoiTarget) {
    blockers.push(`release evidence productionReviewAppliedPoiCount must be at least ${productionPoiTarget}`)
  }
  if (Number(summary.productionReviewPendingPoiCount) !== 0) {
    blockers.push('release evidence productionReviewPendingPoiCount must be 0')
  }
  if (!hasText(summary.productionReviewTriggerSmokeApplyEvidenceFile)) {
    blockers.push('release evidence productionReviewTriggerSmokeApplyEvidenceFile is required')
  }
  if (summary.productionReviewTriggerSmokeApplyStatus !== 'TRIGGER_SMOKE_APPLIED') {
    blockers.push('release evidence productionReviewTriggerSmokeApplyStatus must be TRIGGER_SMOKE_APPLIED')
  }
  if (Number(summary.productionReviewTriggerSmokeAppliedPoiCount) < productionPoiTarget) {
    blockers.push(`release evidence productionReviewTriggerSmokeAppliedPoiCount must be at least ${productionPoiTarget}`)
  }
  if (Number(summary.productionReviewTriggerSmokePendingPoiCount) !== 0) {
    blockers.push('release evidence productionReviewTriggerSmokePendingPoiCount must be 0')
  }
  return blockers
}

function checkReleaseProductionSeedApplySummary(evidence) {
  const blockers = []
  const summary = summaryOf(evidence)
  if (!hasText(summary.productionSeedApplyEvidenceFile)) {
    blockers.push('release evidence productionSeedApplyEvidenceFile is required')
  }
  if (!hasText(summary.productionSeedApplySeedEvidenceFile)) {
    blockers.push('release evidence productionSeedApplySeedEvidenceFile is required')
  }
  if (!hasText(summary.productionSeedApplyRuntimeEvidenceFile)) {
    blockers.push('release evidence productionSeedApplyRuntimeEvidenceFile is required')
  }
  if (
    hasText(summary.runtimeSeedEvidenceFile) &&
    hasText(summary.productionSeedApplyRuntimeEvidenceFile) &&
    normalizeEvidencePath(process.cwd(), summary.productionSeedApplyRuntimeEvidenceFile) !==
      normalizeEvidencePath(process.cwd(), summary.runtimeSeedEvidenceFile)
  ) {
    blockers.push('release evidence productionSeedApplyRuntimeEvidenceFile must match runtimeSeedEvidenceFile')
  }
  if (
    hasText(summary.seedEvidenceFile) &&
    hasText(summary.productionSeedApplySeedEvidenceFile) &&
    normalizeEvidencePath(process.cwd(), summary.productionSeedApplySeedEvidenceFile) !==
      normalizeEvidencePath(process.cwd(), summary.seedEvidenceFile)
  ) {
    blockers.push('release evidence productionSeedApplySeedEvidenceFile must match seedEvidenceFile')
  }
  if (!/^[a-f0-9]{64}$/i.test(String(summary.productionSeedApplySeedSqlSha256 || ''))) {
    blockers.push('release evidence productionSeedApplySeedSqlSha256 must be a sha256 hex digest')
  }
  if (summary.productionSeedApplyRuntimeSeedStatus !== 'YUDAO_XICHENG_PRODUCTION_SEED_READY') {
    blockers.push('release evidence productionSeedApplyRuntimeSeedStatus must be YUDAO_XICHENG_PRODUCTION_SEED_READY')
  }
  if (summary.productionSeedApplyRuntimeSeedProductionReady !== true) {
    blockers.push('release evidence productionSeedApplyRuntimeSeedProductionReady must be true')
  }
  if (Number(summary.productionSeedApplyRuntimeSeedPoiTotal) < productionPoiTarget) {
    blockers.push(`release evidence productionSeedApplyRuntimeSeedPoiTotal must be at least ${productionPoiTarget}`)
  }
  if (Number(summary.productionSeedApplyRuntimeSeedKnowledgeDocuments) < productionPoiTarget + 4) {
    blockers.push('release evidence productionSeedApplyRuntimeSeedKnowledgeDocuments must be at least 84')
  }
  if (Number(summary.productionSeedApplyRuntimeSeedMapPoints) < productionPoiTarget) {
    blockers.push(`release evidence productionSeedApplyRuntimeSeedMapPoints must be at least ${productionPoiTarget}`)
  }
  return blockers
}

async function checkReleaseEvidence(ref, stage, freshnessOptions, rootDir) {
  const blockers = []
  if (ref.error) {
    blockers.push(ref.error)
    return check('release-gate-evidence', blockers)
  }
  const evidence = ref.data || {}
  const summary = summaryOf(evidence)
  const expectedStatus = stageReadyStatus[stage] || stageReadyStatus.production

  if (evidence.artifactType !== 'xicheng-yudao-release-readiness') {
    blockers.push('release evidence artifactType must be xicheng-yudao-release-readiness')
  }
  blockers.push(...checkEvidenceTimestamp(evidence, 'release', freshnessOptions))
  if (evidence.ok !== true) {
    blockers.push('release evidence ok must be true')
  }
  if (evidence.status !== expectedStatus) {
    blockers.push(`release evidence status must be ${expectedStatus}`)
  }
  if (evidence.stage !== stage || summary.stage !== stage) {
    blockers.push(`release evidence stage must be ${stage}`)
  }
  if (Number(summary.failedChecks) !== 0 || Number(summary.blockerCount) !== 0) {
    blockers.push('release evidence summary must have zero failed checks and zero blockers')
  }
  if (!isNonLocalHttpsUrl(summary.appApiBaseUrl)) {
    blockers.push('release evidence appApiBaseUrl must be a non-local HTTPS URL')
  }
  blockers.push(...checkReleaseSourceRevisionSummary(evidence))
  blockers.push(...checkReleaseRuntimeEnvFingerprintSummary(evidence))
  blockers.push(...checkReleaseProviderSmokeSummary(evidence))
  blockers.push(...checkReleaseRuntimeSeedSummary(evidence))
  blockers.push(...checkReleaseSourceCoverageSummary(evidence))
  blockers.push(...checkReleaseReviewApplySummary(evidence))
  blockers.push(...checkReleaseProductionSeedApplySummary(evidence))
  blockers.push(...await checkReleaseBaselineHash(evidence))
  blockers.push(...await checkReleaseServerArtifactHash(evidence))
  blockers.push(...checkReleaseServerBuildSummary(evidence))
  blockers.push(...checkReleaseYudaoServerSmokeSummary(evidence, rootDir))
  blockers.push(...checkEvidenceChecks(evidence, requiredReleaseChecksForStage(stage), 'release'))
  if (blockersOf(evidence).length > 0) {
    blockers.push(`release evidence contains blockers: ${blockersOf(evidence).join('; ')}`)
  }
  return check('release-gate-evidence', blockers)
}

function checkPackageSourceRevision(rootDir, releaseRef) {
  const releaseSummary = summaryOf(releaseRef.data)
  const isGitWorkTree = gitOutput(rootDir, ['rev-parse', '--is-inside-work-tree']) === 'true'
  if (!isGitWorkTree) {
    return {
      ...check('package-source-revision', []),
      detail: 'Git source revision metadata is unavailable for this package root',
      summary: {
        packageGitAvailable: false,
        releaseGitCommit: releaseSummary.gitCommit
      }
    }
  }

  const packageGitBranch = gitOutput(rootDir, ['rev-parse', '--abbrev-ref', 'HEAD']) || 'UNKNOWN'
  const packageGitCommit = gitOutput(rootDir, ['rev-parse', 'HEAD']) || ''
  const gitStatusShort = gitOutput(rootDir, ['status', '--short']) || ''
  const dirtyEntries = gitStatusShort.split(/\r?\n/).filter(Boolean)
  const releaseGitCommit = String(releaseSummary.gitCommit || '')
  const blockers = []

  if (!/^[a-f0-9]{40}$/i.test(packageGitCommit)) {
    blockers.push('package git commit SHA must be available before release evidence package generation')
  }
  if (dirtyEntries.length > 0) {
    blockers.push('package git worktree must be clean before release evidence package generation')
  }
  if (
    /^[a-f0-9]{40}$/i.test(packageGitCommit) &&
    /^[a-f0-9]{40}$/i.test(releaseGitCommit) &&
    packageGitCommit !== releaseGitCommit
  ) {
    blockers.push('release evidence summary.gitCommit must match current package checkout commit')
  }

  return {
    ...check('package-source-revision', blockers),
    summary: {
      packageGitAvailable: true,
      packageGitBranch,
      packageGitCommit,
      packageGitDirty: dirtyEntries.length > 0,
      packageGitDirtyFileCount: dirtyEntries.length,
      releaseGitCommit
    }
  }
}

async function checkManifestEvidence(ref, rootDir, freshnessOptions) {
  const blockers = []
  if (ref.error) {
    blockers.push(ref.error)
    return check('poi-manifest-evidence', blockers)
  }
  const evidence = ref.data || {}
  const summary = summaryOf(evidence)
  if (evidence.artifactType !== 'xicheng-poi-production-manifest-readiness') {
    blockers.push('manifest evidence artifactType must be xicheng-poi-production-manifest-readiness')
  }
  blockers.push(...checkEvidenceTimestamp(evidence, 'manifest', freshnessOptions))
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
  if (Number(summary.totalPoiCount) < productionPoiTarget || Number(summary.targetPoiCount) < productionPoiTarget) {
    blockers.push(`manifest evidence must prove at least ${productionPoiTarget} production POIs`)
  }
  if (summary.productionReady !== true) {
    blockers.push('manifest evidence productionReady must be true')
  }
  blockers.push(...checkReviewBatchSummary(summary, 'manifest'))
  blockers.push(...await checkEvidenceSourceHash(rootDir, evidence, 'manifest', 'manifestFile', 'manifestSha256'))
  blockers.push(...await checkEvidenceSourceHash(rootDir, evidence, 'manifest source workbook', 'sourceWorkbookFile', 'sourceWorkbookSha256'))
  blockers.push(...checkEvidenceChecks(evidence, requiredManifestEvidenceChecks, 'manifest'))
  if (blockersOf(evidence).length > 0) {
    blockers.push(`manifest evidence contains blockers: ${blockersOf(evidence).join('; ')}`)
  }
  return check('poi-manifest-evidence', blockers)
}

async function checkWorkbookEvidence(ref, rootDir, freshnessOptions) {
  const blockers = []
  if (ref.error) {
    blockers.push(ref.error)
    return check('poi-workbook-evidence', blockers)
  }
  const evidence = ref.data || {}
  const summary = summaryOf(evidence)
  if (evidence.artifactType !== 'xicheng-poi-review-workbook-readiness') {
    blockers.push('workbook evidence artifactType must be xicheng-poi-review-workbook-readiness')
  }
  blockers.push(...checkEvidenceTimestamp(evidence, 'workbook', freshnessOptions))
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
  blockers.push(...await checkEvidenceSourceHash(rootDir, evidence, 'workbook', 'workbookFile', 'workbookSha256'))
  blockers.push(...checkEvidenceChecks(evidence, requiredWorkbookEvidenceChecks, 'workbook'))
  if (blockersOf(evidence).length > 0) {
    blockers.push(`workbook evidence contains blockers: ${blockersOf(evidence).join('; ')}`)
  }
  return check('poi-workbook-evidence', blockers)
}

async function checkSeedEvidence(ref, rootDir, freshnessOptions) {
  const blockers = []
  if (ref.error) {
    blockers.push(ref.error)
    return check('poi-seed-evidence', blockers)
  }
  const evidence = ref.data || {}
  const summary = summaryOf(evidence)
  const poiCount = Number(summary.poiCount ?? summary.poiSeedCount)
  const targetCount = Number(summary.targetP0PoiCount ?? summary.minPoiCount)
  if (evidence.artifactType !== 'xicheng-poi-production-seed-readiness') {
    blockers.push('seed evidence artifactType must be xicheng-poi-production-seed-readiness')
  }
  blockers.push(...checkEvidenceTimestamp(evidence, 'seed', freshnessOptions))
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
  blockers.push(...await checkEvidenceSourceHash(rootDir, evidence, 'seed', 'sqlFile', 'sqlSha256'))
  blockers.push(...checkEvidenceChecks(evidence, requiredSeedEvidenceChecks, 'seed'))
  if (blockersOf(evidence).length > 0) {
    blockers.push(`seed evidence contains blockers: ${blockersOf(evidence).join('; ')}`)
  }
  return check('poi-seed-evidence', blockers)
}

function checkSourceCoveragePageSummaries(summary, blockers) {
  const sourcePages = Array.isArray(summary.sourcePages) ? summary.sourcePages : []
  if (sourcePages.length === 0) {
    blockers.push('source coverage evidence must include sourcePages')
    return
  }
  sourcePages.forEach((page) => {
    const label = page?.sourceUrl || 'source page'
    if (!hasText(page?.sourceUrl)) {
      blockers.push('source coverage evidence sourcePages must include sourceUrl')
    }
    if (page?.ok !== true) {
      blockers.push(`source coverage evidence source page ${label} must be ok`)
    }
    if (!Number.isFinite(Number(page?.sourceTextLength)) || Number(page.sourceTextLength) <= 0) {
      blockers.push(`source coverage evidence source page ${label} sourceTextLength must be positive`)
    }
    if (!/^[a-f0-9]{64}$/i.test(String(page?.sourceTextSha256 || ''))) {
      blockers.push(`source coverage evidence source page ${label} sourceTextSha256 must be a sha256 hex digest`)
    }
  })
}

function checkSourceCoverageGroupSummaries(summary, blockers) {
  const sourceGroups = Array.isArray(summary.sourceGroups) ? summary.sourceGroups : []
  if (sourceGroups.length === 0) {
    blockers.push('source coverage evidence must include sourceGroups')
    return
  }
  sourceGroups.forEach((group) => {
    const label = group?.sourceTitle || group?.sourceUrl || 'source group'
    if (Number(group?.poiCount) <= 0) {
      blockers.push(`source coverage evidence group ${label} poiCount must be positive`)
    }
    if (Number(group?.uncoveredPoiCount) !== 0) {
      blockers.push(`source coverage evidence group ${label} uncoveredPoiCount must be 0`)
    }
    if (!Array.isArray(group?.uncoveredPoiCodes) || group.uncoveredPoiCodes.length !== 0) {
      blockers.push(`source coverage evidence group ${label} uncoveredPoiCodes must be empty`)
    }
  })
}

function checkSourceCoverageEvidence(ref, freshnessOptions) {
  const blockers = []
  if (ref.error) {
    blockers.push(ref.error)
    return check('poi-source-coverage-evidence', blockers)
  }
  const evidence = ref.data || {}
  const summary = summaryOf(evidence)
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
  if (Number(summary.sourceReviewRows) <= 0) {
    blockers.push('source coverage evidence sourceReviewRows must be positive')
  }
  if (Number(summary.sourceGroupCount) <= 0) {
    blockers.push('source coverage evidence sourceGroupCount must be positive')
  }
  if (Number(summary.poiCount) < productionPoiTarget) {
    blockers.push(`source coverage evidence poiCount must be at least ${productionPoiTarget}`)
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
  checkSourceCoveragePageSummaries(summary, blockers)
  checkSourceCoverageGroupSummaries(summary, blockers)
  blockers.push(...checkEvidenceChecks(evidence, requiredSourceCoverageEvidenceChecks, 'source coverage'))
  if (blockersOf(evidence).length > 0) {
    blockers.push(`source coverage evidence contains blockers: ${blockersOf(evidence).join('; ')}`)
  }
  return check('poi-source-coverage-evidence', blockers)
}

async function checkSourceReviewApplyEvidence(ref, rootDir, freshnessOptions) {
  const blockers = []
  if (ref.error) {
    blockers.push(ref.error)
    return check('poi-source-review-apply-evidence', blockers)
  }
  const evidence = ref.data || {}
  const summary = summaryOf(evidence)
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
  if (blockersOf(evidence).length > 0) {
    blockers.push(`source review apply evidence contains blockers: ${blockersOf(evidence).join('; ')}`)
  }
  return check('poi-source-review-apply-evidence', blockers)
}

async function checkProductionReviewApplyEvidence(ref, rootDir, freshnessOptions) {
  const blockers = []
  if (ref.error) {
    blockers.push(ref.error)
    return check('poi-production-review-apply-evidence', blockers)
  }
  const evidence = ref.data || {}
  const summary = summaryOf(evidence)
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
  if (!hasText(summary.triggerSmokeApplyEvidenceFile)) {
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
  if (blockersOf(evidence).length > 0) {
    blockers.push(`production review apply evidence contains blockers: ${blockersOf(evidence).join('; ')}`)
  }
  return check('poi-production-review-apply-evidence', blockers)
}

function checkAppReadinessEvidence(ref, stage, freshnessOptions) {
  const blockers = []
  if (ref.error) {
    blockers.push(ref.error)
    return check('app-readiness-evidence', blockers)
  }
  const evidence = ref.data || {}
  const summary = summaryOf(evidence)
  const baseUrl = summary.baseUrl || evidence.baseUrl
  const tenantId = String(summary.tenantId || evidence.tenantId || '').trim()
  const xichengRegionCode = summary.xichengRegionCode || evidence.xichengRegionCode
  const xichengPackageCode = summary.xichengPackageCode || evidence.xichengPackageCode
  if (evidence.artifactType !== 'xunjing-platform-readiness') {
    blockers.push('app readiness evidence artifactType must be xunjing-platform-readiness')
  }
  blockers.push(...checkEvidenceTimestamp(evidence, 'app readiness', freshnessOptions))
  if (evidence.ok !== true) {
    blockers.push('app readiness evidence ok must be true')
  }
  if (!tenantId) {
    blockers.push('app readiness evidence tenantId is required')
  }
  if (!isNonLocalHttpsUrl(baseUrl)) {
    blockers.push(`app readiness evidence baseUrl must be a non-local HTTPS URL for ${stage}`)
  } else if (isPlaceholderUrl(baseUrl)) {
    blockers.push(`app readiness evidence baseUrl must be a real non-placeholder HTTPS URL for ${stage}`)
  }
  if (summary.staticOnly !== false) {
    blockers.push('app readiness evidence staticOnly must be false')
  }
  if (summary.includeXichengAppCheck !== true) {
    blockers.push('app readiness evidence includeXichengAppCheck must be true')
  }
  if (summary.includeXichengTriggerCheck !== true) {
    blockers.push('app readiness evidence includeXichengTriggerCheck must be true')
  }
  if (xichengRegionCode !== expectedXichengRegionCode) {
    blockers.push('app readiness evidence xichengRegionCode must be beijing-xicheng')
  }
  if (xichengPackageCode !== expectedXichengPackageCode) {
    blockers.push('app readiness evidence xichengPackageCode must be XICHENG-MAP-001')
  }
  blockers.push(...checkEvidenceChecks(evidence, requiredAppReadinessChecks, 'app readiness'))
  blockers.push(...checkAppReadinessCheckSummaries(evidence, tenantId))
  const failedChecks = Array.isArray(evidence.checks)
    ? evidence.checks.filter((item) => item.ok !== true)
    : []
  if (failedChecks.length > 0) {
    blockers.push(`app readiness evidence has failed checks: ${failedChecks.map((item) => item.name).join(', ')}`)
  }
  return check('app-readiness-evidence', blockers)
}

function normalizeEvidencePath(rootDir, filePath) {
  if (!hasText(filePath)) {
    return undefined
  }
  const resolvedRoot = path.resolve(rootDir)
  return path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(resolvedRoot, filePath)
}

function checkEvidenceConsistency({
  rootDir,
  releaseRef,
  manifestRef,
  workbookRef,
  seedRef,
  sourceCoverageRef,
  sourceReviewApplyRef,
  productionReviewApplyRef,
  appRef
}) {
  const blockers = []
  const releaseSummary = summaryOf(releaseRef.data)
  const manifestSummary = summaryOf(manifestRef.data)
  const workbookSummary = summaryOf(workbookRef.data)
  const seedSummary = summaryOf(seedRef.data)
  const sourceCoverageSummary = summaryOf(sourceCoverageRef.data)
  const sourceReviewApplySummary = summaryOf(sourceReviewApplyRef.data)
  const productionReviewApplySummary = summaryOf(productionReviewApplyRef.data)
  const appSummary = summaryOf(appRef.data)
  const appBaseUrl = appSummary.baseUrl || appRef.data?.baseUrl
  const releaseManifestEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.manifestEvidenceFile)
  const releaseWorkbookEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.workbookEvidenceFile)
  const releaseSeedEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.seedEvidenceFile)
  const releaseSourceCoverageEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.sourceCoverageEvidenceFile)
  const releaseSourceReviewApplyEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.sourceReviewApplyEvidenceFile)
  const releaseProductionReviewApplyEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.productionReviewApplyEvidenceFile)

  if (!releaseManifestEvidenceFile) {
    blockers.push('release evidence manifestEvidenceFile is required')
  } else if (manifestRef.path && releaseManifestEvidenceFile !== path.resolve(manifestRef.path)) {
    blockers.push('release and package manifest evidence file must match')
  }
  if (!releaseWorkbookEvidenceFile) {
    blockers.push('release evidence workbookEvidenceFile is required')
  } else if (workbookRef.path && releaseWorkbookEvidenceFile !== path.resolve(workbookRef.path)) {
    blockers.push('release and package workbook evidence file must match')
  }
  if (!releaseSeedEvidenceFile) {
    blockers.push('release evidence seedEvidenceFile is required')
  } else if (seedRef.path && releaseSeedEvidenceFile !== path.resolve(seedRef.path)) {
    blockers.push('release and package seed evidence file must match')
  }
  if (!releaseSourceCoverageEvidenceFile) {
    blockers.push('release evidence sourceCoverageEvidenceFile is required')
  } else if (sourceCoverageRef.path && releaseSourceCoverageEvidenceFile !== path.resolve(sourceCoverageRef.path)) {
    blockers.push('release and package source coverage evidence file must match')
  }
  if (!releaseSourceReviewApplyEvidenceFile) {
    blockers.push('release evidence sourceReviewApplyEvidenceFile is required')
  } else if (
    sourceReviewApplyRef.path &&
    releaseSourceReviewApplyEvidenceFile !== path.resolve(sourceReviewApplyRef.path)
  ) {
    blockers.push('release and package source review apply evidence file must match')
  }
  if (!releaseProductionReviewApplyEvidenceFile) {
    blockers.push('release evidence productionReviewApplyEvidenceFile is required')
  } else if (
    productionReviewApplyRef.path &&
    releaseProductionReviewApplyEvidenceFile !== path.resolve(productionReviewApplyRef.path)
  ) {
    blockers.push('release and package production review apply evidence file must match')
  }
  if (
    releaseSummary.productionReviewTriggerSmokeApplyEvidenceFile &&
    productionReviewApplySummary.triggerSmokeApplyEvidenceFile &&
    normalizeEvidencePath(rootDir, releaseSummary.productionReviewTriggerSmokeApplyEvidenceFile) !==
      normalizeEvidencePath(rootDir, productionReviewApplySummary.triggerSmokeApplyEvidenceFile)
  ) {
    blockers.push('release and package production review trigger smoke apply evidence file must match')
  }
  for (const [releaseField, packageField] of [
    ['productionReviewTriggerSmokeApplyStatus', 'triggerSmokeApplyStatus'],
    ['productionReviewTriggerSmokeAppliedPoiCount', 'triggerSmokeAppliedPoiCount'],
    ['productionReviewTriggerSmokePendingPoiCount', 'triggerSmokePendingPoiCount']
  ]) {
    const releaseValue = releaseSummary[releaseField]
    const packageValue = productionReviewApplySummary[packageField]
    if (String(releaseValue ?? '') !== String(packageValue ?? '')) {
      blockers.push(`release and package ${releaseField} must match`)
    }
  }

  for (const [releaseField, packageValue] of [
    ['poiManifestFile', manifestSummary.manifestFile],
    ['sourceWorkbookFile', workbookSummary.workbookFile],
    ['poiSeedSqlFile', seedSummary.sqlFile]
  ]) {
    const releaseValue = releaseSummary[releaseField]
    if (!hasText(releaseValue)) {
      blockers.push(`release evidence ${releaseField} is required`)
    } else if (
      packageValue &&
      normalizeEvidencePath(rootDir, releaseValue) !== normalizeEvidencePath(rootDir, packageValue)
    ) {
      blockers.push(`release and package ${releaseField} must match`)
    }
  }

  for (const [releaseField, packageValue] of [
    ['poiManifestSha256', manifestSummary.manifestSha256],
    ['sourceWorkbookSha256', workbookSummary.workbookSha256],
    ['poiSeedSqlSha256', seedSummary.sqlSha256]
  ]) {
    const releaseValue = String(releaseSummary[releaseField] || '')
    if (!/^[a-f0-9]{64}$/i.test(releaseValue)) {
      blockers.push(`release evidence ${releaseField} must be a sha256 hex digest`)
    } else if (packageValue && releaseValue !== String(packageValue)) {
      blockers.push(`release and package ${releaseField} must match`)
    }
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
  if (
    Number.isFinite(Number(sourceCoverageSummary.poiCount)) &&
    Number.isFinite(Number(workbookSummary.workbookRows)) &&
    Number(sourceCoverageSummary.poiCount) !== Number(workbookSummary.workbookRows)
  ) {
    blockers.push('source coverage and workbook evidence POI counts must match')
  }
  if (
    sourceReviewApplySummary.sourceCoverageEvidenceFile &&
    sourceCoverageRef.path &&
    normalizeEvidencePath(rootDir, sourceReviewApplySummary.sourceCoverageEvidenceFile) !== path.resolve(sourceCoverageRef.path)
  ) {
    blockers.push('source review apply and source coverage evidence files must match')
  }
  if (
    productionReviewApplySummary.sourceReviewApplyEvidenceFile &&
    sourceReviewApplyRef.path &&
    normalizeEvidencePath(rootDir, productionReviewApplySummary.sourceReviewApplyEvidenceFile) !== path.resolve(sourceReviewApplyRef.path)
  ) {
    blockers.push('production review apply and source review apply evidence files must match')
  }
  if (
    sourceReviewApplySummary.outputFile &&
    productionReviewApplySummary.workbookFile &&
    normalizeEvidencePath(rootDir, sourceReviewApplySummary.outputFile) !==
      normalizeEvidencePath(rootDir, productionReviewApplySummary.workbookFile)
  ) {
    blockers.push('production review apply workbookFile must match source review apply outputFile')
  }
  if (
    productionReviewApplySummary.outputFile &&
    workbookSummary.workbookFile &&
    normalizeEvidencePath(rootDir, productionReviewApplySummary.outputFile) !==
      normalizeEvidencePath(rootDir, workbookSummary.workbookFile)
  ) {
    blockers.push('production review apply outputFile must match workbook evidence workbookFile')
  }
  if (
    productionReviewApplySummary.outputSha256 &&
    workbookSummary.workbookSha256 &&
    productionReviewApplySummary.outputSha256 !== workbookSummary.workbookSha256
  ) {
    blockers.push('production review apply outputSha256 must match workbook evidence workbookSha256')
  }
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
    appSummary.xichengRegionCode &&
    manifestSummary.regionCode &&
    appSummary.xichengRegionCode !== manifestSummary.regionCode
  ) {
    blockers.push('app readiness and manifest evidence regionCode must match')
  }
  if (
    appSummary.xichengPackageCode &&
    manifestSummary.packageCode &&
    appSummary.xichengPackageCode !== manifestSummary.packageCode
  ) {
    blockers.push('app readiness and manifest evidence packageCode must match')
  }
  if (
    normalizedBaseUrl(releaseSummary.appApiBaseUrl) &&
    normalizedBaseUrl(appBaseUrl) &&
    normalizedBaseUrl(releaseSummary.appApiBaseUrl) !== normalizedBaseUrl(appBaseUrl)
  ) {
    blockers.push('app readiness evidence baseUrl must match release evidence appApiBaseUrl')
  }
  return check('evidence-consistency', blockers)
}

function collectStringValues(value, results = []) {
  if (typeof value === 'string') {
    results.push(value)
    return results
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStringValues(item, results))
    return results
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStringValues(item, results))
  }
  return results
}

function hasRawSecretLikeValue(value) {
  const normalized = String(value || '').trim()
  if (normalized.length < 10) {
    return false
  }
  const tokens = normalized.match(/[A-Za-z0-9_-]{10,}/g) || []
  return tokens.some((token) => {
    if (token === 'secret-redaction') {
      return false
    }
    if (/^[A-Z][A-Z0-9_]*(?:PASSWORD|SECRET|TOKEN|API_?KEY|ACCESS_?KEY)[A-Z0-9_]*$/.test(token)) {
      return false
    }
    return /^sk-[A-Za-z0-9_-]{12,}$/.test(token) ||
      /^AKIA[A-Z0-9]{12,}$/.test(token) ||
      /(?:password|secret|token|api[-_]?key|access[-_]?key)[-_][A-Za-z0-9_-]{6,}/i.test(token) ||
      /[A-Za-z0-9_-]{6,}[-_](?:password|secret|token|api[-_]?key|access[-_]?key)/i.test(token) ||
      /(?:prod|production|real|live)[-_][A-Za-z0-9_-]*(?:password|secret|token|key)/i.test(token)
  })
}

function checkSecretSafety(refs) {
  const blockers = []
  refs.forEach((ref) => {
    if (!ref.data) {
      return
    }
    const hasSecret = collectStringValues(ref.data).some(hasRawSecretLikeValue)
    if (hasSecret) {
      blockers.push(`${ref.label} evidence contains raw secret-like value`)
    }
  })
  return check('secret-safety', blockers)
}

function countOkChecks(evidence) {
  return Array.isArray(evidence?.checks)
    ? evidence.checks.filter((item) => item.ok === true).length
    : 0
}

export async function verifyXichengReleaseEvidencePackage({
  rootDir = process.cwd(),
  stage = 'production',
  releaseEvidencePath,
  yudaoServerBuildEvidencePath,
  yudaoServerSmokeEvidencePath,
  runtimeSeedEvidencePath,
  productionSeedApplyEvidencePath,
  poiManifestEvidencePath,
  poiWorkbookEvidencePath,
  poiSeedEvidencePath,
  poiSourceCoverageEvidencePath,
  poiSourceReviewApplyEvidencePath,
  poiProductionReviewApplyEvidencePath,
  appReadinessEvidencePath,
  maxEvidenceAgeHours = defaultMaxEvidenceAgeHours,
  now = new Date()
} = {}) {
  const normalizedStage = String(stage || 'production').toLowerCase()
  if (!allowedStages.includes(normalizedStage)) {
    throw new Error(`stage must be ${allowedStages.join(', ')}`)
  }
  const releaseRef = await loadJsonFile(rootDir, releaseEvidencePath, 'release')
  const resolvedYudaoServerBuildEvidencePath = yudaoServerBuildEvidencePath ||
    summaryOf(releaseRef.data).yudaoServerBuildEvidenceFile
  const resolvedYudaoServerSmokeEvidencePath = yudaoServerSmokeEvidencePath ||
    summaryOf(releaseRef.data).yudaoServerSmokeEvidenceFile
  const resolvedRuntimeSeedEvidencePath = runtimeSeedEvidencePath ||
    summaryOf(releaseRef.data).runtimeSeedEvidenceFile
  const resolvedProductionSeedApplyEvidencePath = productionSeedApplyEvidencePath ||
    summaryOf(releaseRef.data).productionSeedApplyEvidenceFile
  const evidenceRefs = await Promise.all([
    loadJsonFile(rootDir, resolvedYudaoServerBuildEvidencePath, 'Yudao server build'),
    loadJsonFile(rootDir, resolvedYudaoServerSmokeEvidencePath, 'Yudao server smoke'),
    loadJsonFile(rootDir, resolvedRuntimeSeedEvidencePath, 'runtime seed'),
    loadJsonFile(rootDir, resolvedProductionSeedApplyEvidencePath, 'production seed apply'),
    loadJsonFile(rootDir, poiManifestEvidencePath, 'manifest'),
    loadJsonFile(rootDir, poiWorkbookEvidencePath, 'workbook'),
    loadJsonFile(rootDir, poiSeedEvidencePath, 'seed'),
    loadJsonFile(rootDir, poiSourceCoverageEvidencePath, 'source coverage'),
    loadJsonFile(rootDir, poiSourceReviewApplyEvidencePath, 'source review apply'),
    loadJsonFile(rootDir, poiProductionReviewApplyEvidencePath, 'production review apply'),
    loadJsonFile(rootDir, appReadinessEvidencePath, 'app readiness')
  ])
  const [
    yudaoServerBuildRef,
    yudaoServerSmokeRef,
    runtimeSeedRef,
    productionSeedApplyRef,
    manifestRef,
    workbookRef,
    seedRef,
    sourceCoverageRef,
    sourceReviewApplyRef,
    productionReviewApplyRef,
    appRef
  ] = evidenceRefs
  const freshnessOptions = {
    now,
    maxEvidenceAgeMs: maxEvidenceAgeHours * 60 * 60 * 1000
  }
  const checks = [
    await checkReleaseEvidence(releaseRef, normalizedStage, freshnessOptions, rootDir),
    await checkYudaoServerBuildEvidence(yudaoServerBuildRef, releaseRef, rootDir, freshnessOptions),
    checkYudaoServerSmokeEvidence(yudaoServerSmokeRef, releaseRef, rootDir, freshnessOptions),
    checkRuntimeSeedEvidence(runtimeSeedRef, releaseRef, rootDir, freshnessOptions),
    checkProductionSeedApplyEvidence(productionSeedApplyRef, releaseRef, seedRef, runtimeSeedRef, rootDir, freshnessOptions),
    checkPackageSourceRevision(rootDir, releaseRef),
    await checkManifestEvidence(manifestRef, rootDir, freshnessOptions),
    await checkWorkbookEvidence(workbookRef, rootDir, freshnessOptions),
    await checkSeedEvidence(seedRef, rootDir, freshnessOptions),
    checkSourceCoverageEvidence(sourceCoverageRef, freshnessOptions),
    await checkSourceReviewApplyEvidence(sourceReviewApplyRef, rootDir, freshnessOptions),
    await checkProductionReviewApplyEvidence(productionReviewApplyRef, rootDir, freshnessOptions),
    checkAppReadinessEvidence(appRef, normalizedStage, freshnessOptions),
    checkEvidenceConsistency({
      rootDir,
      releaseRef,
      manifestRef,
      workbookRef,
      seedRef,
      sourceCoverageRef,
      sourceReviewApplyRef,
      productionReviewApplyRef,
      appRef
    }),
    checkSecretSafety([releaseRef, ...evidenceRefs])
  ]
  const blockers = checks.flatMap((item) => item.blockers)
  const ok = checks.every((item) => item.ok)
  const packageSourceRevisionSummary = checks.find((item) => item.name === 'package-source-revision')?.summary || {}
  const yudaoServerSmokeSummary = summaryOf(yudaoServerSmokeRef.data)
  const runtimeSeedSummary = summaryOf(runtimeSeedRef.data)
  const productionSeedApplySummary = summaryOf(productionSeedApplyRef.data)

  return {
    artifactType,
    ok,
    status: ok ? readyStatus : 'NOT_READY',
    checkedAt: new Date().toISOString(),
    summary: {
      stage: normalizedStage,
      releaseStatus: releaseRef.data?.status,
      yudaoServerBuildStatus: yudaoServerBuildRef.data?.status,
      yudaoServerBuildMethod: summaryOf(yudaoServerBuildRef.data).buildMethod,
      yudaoServerBuildGitAvailable: summaryOf(yudaoServerBuildRef.data).gitAvailable,
      yudaoServerBuildGitBranch: summaryOf(yudaoServerBuildRef.data).gitBranch,
      yudaoServerBuildGitCommit: summaryOf(yudaoServerBuildRef.data).gitCommit,
      yudaoServerBuildGitDirty: summaryOf(yudaoServerBuildRef.data).gitDirty,
      yudaoServerBuildGitDirtyFileCount: summaryOf(yudaoServerBuildRef.data).gitDirtyFileCount,
      yudaoServerBuildJarFile: summaryOf(yudaoServerBuildRef.data).jarFile,
      yudaoServerBuildJarSha256: summaryOf(yudaoServerBuildRef.data).jarSha256,
      yudaoServerBuildJarSizeBytes: summaryOf(yudaoServerBuildRef.data).jarSizeBytes,
      yudaoServerSmokeStatus: yudaoServerSmokeRef.data?.status,
      yudaoServerSmokeBaseUrl: yudaoServerSmokeSummary.baseUrl,
      yudaoServerSmokeTenantId: yudaoServerSmokeSummary.tenantId,
      yudaoServerSmokePackageCode: yudaoServerSmokeSummary.packageCode,
      yudaoServerSmokePackageHttpStatus: yudaoServerSmokeSummary.packageHttpStatus,
      yudaoServerSmokePublicReportHttpStatus: yudaoServerSmokeSummary.publicReportHttpStatus,
      yudaoServerSmokePublicReportPackageCount: yudaoServerSmokeSummary.publicReportPackageCount,
      yudaoServerSmokePublicReportReviewedKnowledgeCount: yudaoServerSmokeSummary.publicReportReviewedKnowledgeCount,
      yudaoServerSmokePublicReportReviewedMediaCount: yudaoServerSmokeSummary.publicReportReviewedMediaCount,
      yudaoServerSmokePublicReportMapPointCount: yudaoServerSmokeSummary.publicReportMapPointCount,
      yudaoServerSmokeMediaAssetCount: yudaoServerSmokeSummary.mediaAssetCount,
      yudaoServerSmokeBuildEvidenceFile: yudaoServerSmokeSummary.buildEvidenceFile,
      yudaoServerSmokeBuildGitCommit: yudaoServerSmokeSummary.buildGitCommit,
      yudaoServerSmokeBuildGitDirty: yudaoServerSmokeSummary.buildGitDirty,
      yudaoServerSmokeBuildJarSha256: yudaoServerSmokeSummary.buildJarSha256,
      runtimeSeedStatus: runtimeSeedRef.data?.status,
      runtimeSeedReadinessMode: runtimeSeedSummary.readinessMode,
      runtimeSeedProductionReady: runtimeSeedSummary.productionReady,
      runtimeSeedLocalCandidateReady: runtimeSeedSummary.localCandidateReady,
      runtimeSeedPoiTotal: runtimeSeedSummary.poiTotal,
      runtimeSeedPoiApprovedPublished: runtimeSeedSummary.poiApprovedPublished,
      runtimeSeedKnowledgeDocuments: runtimeSeedSummary.knowledgeDocuments,
      runtimeSeedMapPoints: runtimeSeedSummary.mapPoints,
      runtimeSeedGeoReviewRequired: runtimeSeedSummary.poiGeoReviewRequired,
      runtimeSeedLicenseReviewRequired: runtimeSeedSummary.poiLicenseReviewRequired,
      runtimeSeedProductionBlockerCount: Array.isArray(runtimeSeedSummary.productionBlockers)
        ? runtimeSeedSummary.productionBlockers.length
        : undefined,
      productionSeedApplyStatus: productionSeedApplyRef.data?.status,
      productionSeedApplySeedSqlFile: productionSeedApplySummary.seedSqlFile,
      productionSeedApplySeedSqlSha256: productionSeedApplySummary.seedSqlSha256,
      productionSeedApplySeedEvidenceFile: productionSeedApplySummary.seedEvidenceFile,
      productionSeedApplyRuntimeEvidenceFile: productionSeedApplySummary.runtimeEvidenceFile,
      productionSeedApplyPackageCode: productionSeedApplySummary.packageCode,
      productionSeedApplyRegionCode: productionSeedApplySummary.regionCode,
      productionSeedApplyRuntimeSeedStatus: productionSeedApplySummary.runtimeSeedStatus,
      productionSeedApplyRuntimeSeedProductionReady: productionSeedApplySummary.runtimeSeedProductionReady,
      productionSeedApplyRuntimeSeedPoiTotal: productionSeedApplySummary.runtimeSeedPoiTotal,
      productionSeedApplyRuntimeSeedKnowledgeDocuments: productionSeedApplySummary.runtimeSeedKnowledgeDocuments,
      productionSeedApplyRuntimeSeedMapPoints: productionSeedApplySummary.runtimeSeedMapPoints,
      poiManifestStatus: manifestRef.data?.status,
      poiWorkbookStatus: workbookRef.data?.status,
      poiSeedStatus: seedRef.data?.status,
      poiSourceCoverageStatus: sourceCoverageRef.data?.status,
      poiSourceReviewApplyStatus: sourceReviewApplyRef.data?.status,
      poiProductionReviewApplyStatus: productionReviewApplyRef.data?.status,
      appReadinessCheckCount: countOkChecks(appRef.data),
      xichengRegionCode: summaryOf(manifestRef.data).regionCode,
      xichengPackageCode: summaryOf(manifestRef.data).packageCode,
      reviewBatchCode: summaryOf(manifestRef.data).reviewBatchCode,
      releaseEvidenceFile: releaseRef.path,
      yudaoServerBuildEvidenceFile: yudaoServerBuildRef.path,
      yudaoServerSmokeEvidenceFile: yudaoServerSmokeRef.path,
      runtimeSeedEvidenceFile: runtimeSeedRef.path,
      productionSeedApplyEvidenceFile: productionSeedApplyRef.path,
      poiManifestEvidenceFile: manifestRef.path,
      poiWorkbookEvidenceFile: workbookRef.path,
      poiSeedEvidenceFile: seedRef.path,
      poiSourceCoverageEvidenceFile: sourceCoverageRef.path,
      poiSourceReviewApplyEvidenceFile: sourceReviewApplyRef.path,
      poiProductionReviewApplyEvidenceFile: productionReviewApplyRef.path,
      appReadinessEvidenceFile: appRef.path,
      sourceWorkbookFile: summaryOf(manifestRef.data).sourceWorkbookFile,
      sourceWorkbookSha256: summaryOf(manifestRef.data).sourceWorkbookSha256,
      workbookReadyPoiCount: summaryOf(workbookRef.data).workbookReadyPoiCount,
      workbookPendingPoiCount: summaryOf(workbookRef.data).workbookPendingPoiCount,
      sourceCoverageCoveredPoiCount: summaryOf(sourceCoverageRef.data).coveredPoiCount,
      sourceCoverageUncoveredPoiCount: summaryOf(sourceCoverageRef.data).uncoveredPoiCount,
      sourceCoverageUncoveredPoiCodes: summaryOf(sourceCoverageRef.data).uncoveredPoiCodes,
      sourceReviewAppliedPoiCount: summaryOf(sourceReviewApplyRef.data).appliedPoiCount,
      sourceReviewPendingSourcePoiCount: summaryOf(sourceReviewApplyRef.data).pendingSourcePoiCount,
      productionReviewAppliedPoiCount: summaryOf(productionReviewApplyRef.data).appliedPoiCount,
      productionReviewPendingPoiCount: summaryOf(productionReviewApplyRef.data).pendingProductionReviewPoiCount,
      productionReviewTriggerSmokeApplyEvidenceFile: summaryOf(productionReviewApplyRef.data).triggerSmokeApplyEvidenceFile,
      productionReviewTriggerSmokeApplyStatus: summaryOf(productionReviewApplyRef.data).triggerSmokeApplyStatus,
      productionReviewTriggerSmokeAppliedPoiCount: summaryOf(productionReviewApplyRef.data).triggerSmokeAppliedPoiCount,
      productionReviewTriggerSmokePendingPoiCount: summaryOf(productionReviewApplyRef.data).triggerSmokePendingPoiCount,
      pendingPoiCodes: summaryOf(workbookRef.data).pendingPoiCodes,
      pendingPoiTasks: summaryOf(workbookRef.data).pendingPoiTasks,
      ...packageSourceRevisionSummary,
      totalChecks: checks.length,
      passedChecks: checks.filter((item) => item.ok).length,
      failedChecks: checks.filter((item) => !item.ok).length,
      blockerCount: blockers.length,
      maxEvidenceAgeHours
    },
    evidenceFiles: {
      release: releaseRef.path,
      yudaoServerBuild: yudaoServerBuildRef.path,
      yudaoServerSmoke: yudaoServerSmokeRef.path,
      runtimeSeed: runtimeSeedRef.path,
      productionSeedApply: productionSeedApplyRef.path,
      poiManifest: manifestRef.path,
      poiWorkbook: workbookRef.path,
      poiSeed: seedRef.path,
      poiSourceCoverage: sourceCoverageRef.path,
      poiSourceReviewApply: sourceReviewApplyRef.path,
      poiProductionReviewApply: productionReviewApplyRef.path,
      appReadiness: appRef.path
    },
    evidenceFileSha256: {
      release: releaseRef.sha256,
      yudaoServerBuild: yudaoServerBuildRef.sha256,
      yudaoServerSmoke: yudaoServerSmokeRef.sha256,
      runtimeSeed: runtimeSeedRef.sha256,
      productionSeedApply: productionSeedApplyRef.sha256,
      poiManifest: manifestRef.sha256,
      poiWorkbook: workbookRef.sha256,
      poiSeed: seedRef.sha256,
      poiSourceCoverage: sourceCoverageRef.sha256,
      poiSourceReviewApply: sourceReviewApplyRef.sha256,
      poiProductionReviewApply: productionReviewApplyRef.sha256,
      appReadiness: appRef.sha256
    },
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

async function writeEvidence({ rootDir, evidenceFile, report }) {
  const resolvedFile = resolveEvidenceFile(rootDir, evidenceFile)
  if (!resolvedFile) {
    return
  }
  await mkdir(path.dirname(resolvedFile), { recursive: true })
  await writeFile(resolvedFile, `${JSON.stringify(report, null, 2)}\n`)
}

async function runCli() {
  const args = process.argv.slice(2)
  const rootDir = path.resolve(readArgValue(args, '--root') || process.cwd())
  const report = await verifyXichengReleaseEvidencePackage({
    rootDir,
    stage: readArgValue(args, '--stage') || process.env.XUNJING_RELEASE_STAGE || 'production',
    releaseEvidencePath: readArgValue(args, '--release-evidence') || process.env.XICHENG_RELEASE_EVIDENCE,
    yudaoServerBuildEvidencePath: readArgValue(args, '--yudao-server-build-evidence') ||
      readArgValue(args, '--server-build-evidence') ||
      process.env.YUDAO_SERVER_BUILD_EVIDENCE,
    yudaoServerSmokeEvidencePath: readArgValue(args, '--yudao-server-smoke-evidence') ||
      readArgValue(args, '--server-smoke-evidence') ||
      process.env.YUDAO_SERVER_SMOKE_EVIDENCE,
    runtimeSeedEvidencePath: readArgValue(args, '--runtime-seed-evidence') ||
      process.env.XICHENG_RUNTIME_SEED_EVIDENCE,
    productionSeedApplyEvidencePath: readArgValue(args, '--production-seed-apply-evidence') ||
      readArgValue(args, '--seed-apply-evidence') ||
      process.env.XICHENG_PRODUCTION_SEED_APPLY_EVIDENCE,
    poiManifestEvidencePath: readArgValue(args, '--poi-manifest-evidence') ||
      process.env.XICHENG_POI_MANIFEST_EVIDENCE,
    poiWorkbookEvidencePath: readArgValue(args, '--poi-workbook-evidence') ||
      process.env.XICHENG_POI_WORKBOOK_EVIDENCE,
    poiSeedEvidencePath: readArgValue(args, '--poi-seed-evidence') ||
      process.env.XICHENG_POI_SEED_EVIDENCE,
    poiSourceCoverageEvidencePath: readArgValue(args, '--poi-source-coverage-evidence') ||
      process.env.XICHENG_POI_SOURCE_COVERAGE_EVIDENCE,
    poiSourceReviewApplyEvidencePath: readArgValue(args, '--poi-source-review-apply-evidence') ||
      process.env.XICHENG_POI_SOURCE_REVIEW_APPLY_EVIDENCE,
    poiProductionReviewApplyEvidencePath: readArgValue(args, '--poi-production-review-apply-evidence') ||
      process.env.XICHENG_POI_PRODUCTION_REVIEW_APPLY_EVIDENCE,
    appReadinessEvidencePath: readArgValue(args, '--app-readiness-evidence') ||
      process.env.XICHENG_APP_READINESS_EVIDENCE,
    maxEvidenceAgeHours: parseMaxEvidenceAgeHours(
      readArgValue(args, '--max-evidence-age-hours') || process.env.XICHENG_MAX_EVIDENCE_AGE_HOURS
    )
  })
  await writeEvidence({
    rootDir,
    evidenceFile: readArgValue(args, '--evidence-file') || readArgValue(args, '--output'),
    report
  })
  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) {
    process.exitCode = 1
  }
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
