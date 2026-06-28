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

const requiredReleaseChecks = [
  'release-source-revision',
  'runtime-env',
  'vector-embedding-runtime',
  'https-app-api-domain',
  'real-wechat-app',
  'real-ai-provider',
  'yudao-ai-model-bootstrap',
  'vision-ocr-service',
  'object-storage',
  'full-yudao-baseline',
  'yudao-server-artifact',
  'xicheng-production-poi-evidence',
  'xicheng-runtime-seed-evidence',
  'xicheng-production-seed-apply',
  'xicheng-production-poi',
  'xicheng-source-license'
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
  'source-documents'
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
    normalized === 'host.docker.internal'
}

function isNonLocalHttpsUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !isLoopbackHostname(url.hostname)
  } catch {
    return false
  }
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

async function checkReleaseEvidence(ref, stage, freshnessOptions) {
  const blockers = []
  if (ref.error) {
    blockers.push(ref.error)
    return check('release-gate-evidence', blockers)
  }
  const evidence = ref.data || {}
  const summary = summaryOf(evidence)
  const expectedStatus = stage === 'production'
    ? 'PRODUCTION_READY_CANDIDATE'
    : 'PREPROD_READY_CANDIDATE'

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
  blockers.push(...checkReleaseProductionSeedApplySummary(evidence))
  blockers.push(...await checkReleaseBaselineHash(evidence))
  blockers.push(...await checkReleaseServerArtifactHash(evidence))
  blockers.push(...checkEvidenceChecks(evidence, requiredReleaseChecks, 'release'))
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

function checkEvidenceConsistency({ rootDir, releaseRef, manifestRef, workbookRef, seedRef, appRef }) {
  const blockers = []
  const releaseSummary = summaryOf(releaseRef.data)
  const manifestSummary = summaryOf(manifestRef.data)
  const workbookSummary = summaryOf(workbookRef.data)
  const seedSummary = summaryOf(seedRef.data)
  const appSummary = summaryOf(appRef.data)
  const appBaseUrl = appSummary.baseUrl || appRef.data?.baseUrl
  const releaseManifestEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.manifestEvidenceFile)
  const releaseWorkbookEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.workbookEvidenceFile)
  const releaseSeedEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.seedEvidenceFile)

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
  poiManifestEvidencePath,
  poiWorkbookEvidencePath,
  poiSeedEvidencePath,
  appReadinessEvidencePath,
  maxEvidenceAgeHours = defaultMaxEvidenceAgeHours,
  now = new Date()
} = {}) {
  const normalizedStage = String(stage || 'production').toLowerCase()
  if (!['production', 'staging'].includes(normalizedStage)) {
    throw new Error('stage must be production or staging')
  }
  const evidenceRefs = await Promise.all([
    loadJsonFile(rootDir, releaseEvidencePath, 'release'),
    loadJsonFile(rootDir, poiManifestEvidencePath, 'manifest'),
    loadJsonFile(rootDir, poiWorkbookEvidencePath, 'workbook'),
    loadJsonFile(rootDir, poiSeedEvidencePath, 'seed'),
    loadJsonFile(rootDir, appReadinessEvidencePath, 'app readiness')
  ])
  const [releaseRef, manifestRef, workbookRef, seedRef, appRef] = evidenceRefs
  const freshnessOptions = {
    now,
    maxEvidenceAgeMs: maxEvidenceAgeHours * 60 * 60 * 1000
  }
  const checks = [
    await checkReleaseEvidence(releaseRef, normalizedStage, freshnessOptions),
    checkPackageSourceRevision(rootDir, releaseRef),
    await checkManifestEvidence(manifestRef, rootDir, freshnessOptions),
    await checkWorkbookEvidence(workbookRef, rootDir, freshnessOptions),
    await checkSeedEvidence(seedRef, rootDir, freshnessOptions),
    checkAppReadinessEvidence(appRef, normalizedStage, freshnessOptions),
    checkEvidenceConsistency({ rootDir, releaseRef, manifestRef, workbookRef, seedRef, appRef }),
    checkSecretSafety(evidenceRefs)
  ]
  const blockers = checks.flatMap((item) => item.blockers)
  const ok = checks.every((item) => item.ok)
  const packageSourceRevisionSummary = checks.find((item) => item.name === 'package-source-revision')?.summary || {}

  return {
    artifactType,
    ok,
    status: ok ? readyStatus : 'NOT_READY',
    checkedAt: new Date().toISOString(),
    summary: {
      stage: normalizedStage,
      releaseStatus: releaseRef.data?.status,
      poiManifestStatus: manifestRef.data?.status,
      poiWorkbookStatus: workbookRef.data?.status,
      poiSeedStatus: seedRef.data?.status,
      appReadinessCheckCount: countOkChecks(appRef.data),
      xichengRegionCode: summaryOf(manifestRef.data).regionCode,
      xichengPackageCode: summaryOf(manifestRef.data).packageCode,
      reviewBatchCode: summaryOf(manifestRef.data).reviewBatchCode,
      releaseEvidenceFile: releaseRef.path,
      poiManifestEvidenceFile: manifestRef.path,
      poiWorkbookEvidenceFile: workbookRef.path,
      poiSeedEvidenceFile: seedRef.path,
      appReadinessEvidenceFile: appRef.path,
      sourceWorkbookFile: summaryOf(manifestRef.data).sourceWorkbookFile,
      sourceWorkbookSha256: summaryOf(manifestRef.data).sourceWorkbookSha256,
      workbookReadyPoiCount: summaryOf(workbookRef.data).workbookReadyPoiCount,
      workbookPendingPoiCount: summaryOf(workbookRef.data).workbookPendingPoiCount,
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
      poiManifest: manifestRef.path,
      poiWorkbook: workbookRef.path,
      poiSeed: seedRef.path,
      appReadiness: appRef.path
    },
    evidenceFileSha256: {
      release: releaseRef.sha256,
      poiManifest: manifestRef.sha256,
      poiWorkbook: workbookRef.sha256,
      poiSeed: seedRef.sha256,
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
    poiManifestEvidencePath: readArgValue(args, '--poi-manifest-evidence') ||
      process.env.XICHENG_POI_MANIFEST_EVIDENCE,
    poiWorkbookEvidencePath: readArgValue(args, '--poi-workbook-evidence') ||
      process.env.XICHENG_POI_WORKBOOK_EVIDENCE,
    poiSeedEvidencePath: readArgValue(args, '--poi-seed-evidence') ||
      process.env.XICHENG_POI_SEED_EVIDENCE,
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
