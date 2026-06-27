import { mkdir, readFile, writeFile } from 'node:fs/promises'
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
  'runtime-env',
  'vector-embedding-runtime',
  'https-app-api-domain',
  'real-wechat-app',
  'real-ai-provider',
  'vision-ocr-service',
  'object-storage',
  'full-yudao-baseline',
  'yudao-server-artifact',
  'xicheng-production-poi-evidence',
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
    return {
      label,
      path: resolvedPath,
      data: JSON.parse(await readFile(resolvedPath, 'utf8')),
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
  blockers.push(...await checkReleaseBaselineHash(evidence))
  blockers.push(...await checkReleaseServerArtifactHash(evidence))
  blockers.push(...checkEvidenceChecks(evidence, requiredReleaseChecks, 'release'))
  if (blockersOf(evidence).length > 0) {
    blockers.push(`release evidence contains blockers: ${blockersOf(evidence).join('; ')}`)
  }
  return check('release-gate-evidence', blockers)
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
  blockers.push(...checkEvidenceChecks(evidence, requiredManifestEvidenceChecks, 'manifest'))
  if (blockersOf(evidence).length > 0) {
    blockers.push(`manifest evidence contains blockers: ${blockersOf(evidence).join('; ')}`)
  }
  return check('poi-manifest-evidence', blockers)
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

function checkEvidenceConsistency({ rootDir, releaseRef, manifestRef, seedRef, appRef }) {
  const blockers = []
  const releaseSummary = summaryOf(releaseRef.data)
  const manifestSummary = summaryOf(manifestRef.data)
  const seedSummary = summaryOf(seedRef.data)
  const appSummary = summaryOf(appRef.data)
  const releaseManifestEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.manifestEvidenceFile)
  const releaseSeedEvidenceFile = normalizeEvidencePath(rootDir, releaseSummary.seedEvidenceFile)

  if (!releaseManifestEvidenceFile) {
    blockers.push('release evidence manifestEvidenceFile is required')
  } else if (manifestRef.path && releaseManifestEvidenceFile !== path.resolve(manifestRef.path)) {
    blockers.push('release and package manifest evidence file must match')
  }
  if (!releaseSeedEvidenceFile) {
    blockers.push('release evidence seedEvidenceFile is required')
  } else if (seedRef.path && releaseSeedEvidenceFile !== path.resolve(seedRef.path)) {
    blockers.push('release and package seed evidence file must match')
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
  return /^sk-[A-Za-z0-9_-]{12,}$/.test(normalized) ||
    /^AKIA[A-Z0-9]{12,}$/.test(normalized) ||
    /(?:password|secret|token|api[-_]?key|access[-_]?key)[-_][A-Za-z0-9_-]{6,}/i.test(normalized) ||
    /[A-Za-z0-9_-]{6,}[-_](?:password|secret|token|api[-_]?key|access[-_]?key)/i.test(normalized) ||
    /(?:prod|production|real|live)[-_][A-Za-z0-9_-]*(?:password|secret|token|key)/i.test(normalized)
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
    loadJsonFile(rootDir, poiSeedEvidencePath, 'seed'),
    loadJsonFile(rootDir, appReadinessEvidencePath, 'app readiness')
  ])
  const [releaseRef, manifestRef, seedRef, appRef] = evidenceRefs
  const freshnessOptions = {
    now,
    maxEvidenceAgeMs: maxEvidenceAgeHours * 60 * 60 * 1000
  }
  const checks = [
    await checkReleaseEvidence(releaseRef, normalizedStage, freshnessOptions),
    await checkManifestEvidence(manifestRef, rootDir, freshnessOptions),
    await checkSeedEvidence(seedRef, rootDir, freshnessOptions),
    checkAppReadinessEvidence(appRef, normalizedStage, freshnessOptions),
    checkEvidenceConsistency({ rootDir, releaseRef, manifestRef, seedRef, appRef }),
    checkSecretSafety(evidenceRefs)
  ]
  const blockers = checks.flatMap((item) => item.blockers)
  const ok = checks.every((item) => item.ok)

  return {
    artifactType,
    ok,
    status: ok ? readyStatus : 'NOT_READY',
    checkedAt: new Date().toISOString(),
    summary: {
      stage: normalizedStage,
      releaseStatus: releaseRef.data?.status,
      poiManifestStatus: manifestRef.data?.status,
      poiSeedStatus: seedRef.data?.status,
      appReadinessCheckCount: countOkChecks(appRef.data),
      xichengRegionCode: summaryOf(manifestRef.data).regionCode,
      xichengPackageCode: summaryOf(manifestRef.data).packageCode,
      reviewBatchCode: summaryOf(manifestRef.data).reviewBatchCode,
      totalChecks: checks.length,
      passedChecks: checks.filter((item) => item.ok).length,
      failedChecks: checks.filter((item) => !item.ok).length,
      blockerCount: blockers.length,
      maxEvidenceAgeHours
    },
    evidenceFiles: {
      release: releaseRef.path,
      poiManifest: manifestRef.path,
      poiSeed: seedRef.path,
      appReadiness: appRef.path
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
