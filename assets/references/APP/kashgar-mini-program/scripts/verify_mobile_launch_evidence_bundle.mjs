import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { normalizeReleaseHttpsUrl } from './release_url_guard.mjs'

const defaultPreprodEvidencePath = '../../../../qa/xicheng-app-readiness-evidence.json'
const defaultNativeEvidencePath = '../../../../qa/xicheng-native-device-evidence.json'

const requiredPreprodChecks = [
  'live-xicheng-ai-chat-sourced',
  'live-xicheng-ai-chat-blocked',
  'live-xicheng-trigger-baitasi',
  'live-xicheng-trigger-gongwangfu',
  'live-xicheng-trigger-planetarium',
  'live-xicheng-scan-resolve'
]
const expectedXichengRegionCode = 'beijing-xicheng'
const expectedXichengPackageCode = 'XICHENG-MAP-001'

const fail = (message) => {
  console.error(message)
  process.exit(1)
}

const maxEvidenceAgeHours = Number(process.env.XUNJING_EVIDENCE_MAX_AGE_HOURS || 72)
const maxFutureSkewMs = 5 * 60 * 1000

const args = process.argv.slice(2)
const readArg = (name, fallback) => {
  const index = args.indexOf(name)
  if (index !== -1 && args[index + 1]) {
    return args[index + 1]
  }
  return fallback
}

const normalizeComparableUrl = (value) => String(value || '').trim().replace(/\/+$/, '')

const resolveInputPath = (inputPath) => path.resolve(process.cwd(), inputPath)

const assertFreshTimestamp = (label, value) => {
  const parsedTime = Date.parse(String(value || ''))
  if (!Number.isFinite(parsedTime)) {
    fail(`${label} must be a valid ISO timestamp`)
  }
  const now = Date.now()
  if (parsedTime - now > maxFutureSkewMs) {
    fail(`${label} must not be in the future`)
  }
  const ageHours = (now - parsedTime) / 1000 / 60 / 60
  if (ageHours > maxEvidenceAgeHours) {
    fail(`${label} is stale; evidence must be fresh within ${maxEvidenceAgeHours} hours`)
  }
}

const readJsonFile = (label, inputPath) => {
  const resolved = resolveInputPath(inputPath)
  if (!fs.existsSync(resolved)) {
    fail(`${label} file not found: ${resolved}`)
  }
  try {
    return {
      path: resolved,
      json: JSON.parse(fs.readFileSync(resolved, 'utf8'))
    }
  } catch (error) {
    fail(`${label} JSON is invalid: ${error.message}`)
  }
}

const assertNonLocalHttpsUrl = (label, value) => {
  try {
    return normalizeReleaseHttpsUrl(label, value)
  } catch (error) {
    fail(error.message)
  }
}

const currentHead = () => {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })
  if (result.status !== 0) {
    fail(`Unable to read current git HEAD: ${result.stderr || result.stdout}`)
  }
  return result.stdout.trim()
}

const getRepoRoot = () => {
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })
  if (result.status !== 0) {
    fail(`Unable to read git repository root: ${result.stderr || result.stdout}`)
  }
  return result.stdout.trim()
}

const resolveReleaseArtifactPath = (artifactPath) => {
  if (path.isAbsolute(artifactPath)) {
    return artifactPath
  }
  return path.resolve(getRepoRoot(), artifactPath)
}

const verifyNativeEvidenceWithExistingGate = (nativeEvidencePath) => {
  const validatorPath = path.resolve(process.cwd(), 'scripts', 'verify_native_device_evidence.mjs')
  const result = spawnSync(process.execPath, [validatorPath, nativeEvidencePath], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })
  if (result.status !== 0) {
    fail(`Native device evidence failed: ${result.stderr || result.stdout}`)
  }
}

const verifyNativeReleaseArtifactWithExistingGate = (artifactPath, expectedApiBaseUrl, expectedTenantId) => {
  const scannerPath = path.resolve(process.cwd(), 'scripts', 'verify_release_build_artifact.mjs')
  const resolvedArtifactPath = resolveReleaseArtifactPath(artifactPath)
  const result = spawnSync(process.execPath, [scannerPath, resolvedArtifactPath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      XUNJING_APP_API_BASE_URL: expectedApiBaseUrl,
      XUNJING_TENANT_ID: expectedTenantId
    },
    encoding: 'utf8'
  })
  if (result.status !== 0) {
    fail(`Native release artifact build.artifact scan failed: ${result.stderr || result.stdout}`)
  }
  return resolvedArtifactPath
}

const preprodEvidencePath = readArg('--preprod-evidence', process.env.XUNJING_PREPROD_EVIDENCE_FILE || defaultPreprodEvidencePath)
const nativeEvidencePath = readArg('--native-evidence', process.env.XUNJING_NATIVE_DEVICE_EVIDENCE_FILE || defaultNativeEvidencePath)

const preprodEvidence = readJsonFile('APP readiness evidence', preprodEvidencePath)
const nativeEvidence = readJsonFile('Native device evidence', nativeEvidencePath)

if (preprodEvidence.json?.artifactType !== 'xunjing-platform-readiness') {
  fail('APP readiness evidence artifactType must be xunjing-platform-readiness')
}

if (preprodEvidence.json.ok !== true) {
  fail('APP readiness evidence ok must be true')
}

assertFreshTimestamp('APP readiness evidence checkedAt', preprodEvidence.json.checkedAt)

const preprodSummary = preprodEvidence.json.summary || {}
assertNonLocalHttpsUrl('APP readiness evidence summary.baseUrl', preprodSummary.baseUrl)

if (!String(preprodSummary.tenantId || '').trim()) {
  fail('APP readiness evidence summary.tenantId is required')
}

if (!/^[1-9]\d*$/.test(String(preprodSummary.tenantId).trim())) {
  fail('APP readiness evidence summary.tenantId must be a positive integer tenant id')
}

if (preprodSummary.includeXichengAppCheck !== true || preprodSummary.includeXichengTriggerCheck !== true) {
  fail('APP readiness evidence must include Xicheng APP and trigger checks')
}

if (String(preprodSummary.xichengRegionCode || '').trim() !== expectedXichengRegionCode) {
  fail(`APP readiness evidence summary.xichengRegionCode must be ${expectedXichengRegionCode}`)
}

if (String(preprodSummary.xichengPackageCode || '').trim() !== expectedXichengPackageCode) {
  fail(`APP readiness evidence summary.xichengPackageCode must be ${expectedXichengPackageCode}`)
}

if (Number(preprodSummary.failedChecks) !== 0 || Number(preprodSummary.passedChecks) < Number(preprodSummary.totalChecks || 0)) {
  fail('APP readiness evidence must have 0 failedChecks and all checks passing')
}

const preprodChecks = Array.isArray(preprodEvidence.json.checks) ? preprodEvidence.json.checks : []
const preprodCheckByName = new Map(preprodChecks.map((check) => [check?.name, check]))

const assertSummaryEquals = (summary, field, expected, label) => {
  const actual = summary?.[field]
  const matches = typeof expected === 'boolean'
    ? actual === expected
    : String(actual || '').trim() === String(expected)
  if (!matches) {
    fail(`APP readiness evidence ${label} summary.${field} must be ${expected}`)
  }
}

const assertSummaryPositiveNumber = (summary, field, label) => {
  if (Number(summary?.[field] || 0) <= 0) {
    fail(`APP readiness evidence ${label} summary.${field} must be a positive number`)
  }
}

for (const checkName of requiredPreprodChecks) {
  const check = preprodCheckByName.get(checkName)
  if (!check || check.ok !== true) {
    fail(`APP readiness evidence missing required passing check: ${checkName}`)
  }
}

const sourcedCheck = preprodCheckByName.get('live-xicheng-ai-chat-sourced')
const sourcedSummary = sourcedCheck?.summary || {}
assertSummaryEquals(sourcedSummary, 'endpoint', '/app-api/xunjing/ai/chat', 'live-xicheng-ai-chat-sourced')
assertSummaryEquals(sourcedSummary, 'tenantId', preprodSummary.tenantId, 'live-xicheng-ai-chat-sourced')
assertSummaryEquals(sourcedSummary, 'regionCode', expectedXichengRegionCode, 'live-xicheng-ai-chat-sourced')
assertSummaryEquals(sourcedSummary, 'packageCode', expectedXichengPackageCode, 'live-xicheng-ai-chat-sourced')
assertSummaryEquals(sourcedSummary, 'sceneCode', 'xicheng-ai-guide', 'live-xicheng-ai-chat-sourced')
assertSummaryEquals(sourcedSummary, 'poiCode', 'xicheng-baitasi', 'live-xicheng-ai-chat-sourced')
assertSummaryEquals(sourcedSummary, 'poiName', '妙应寺白塔', 'live-xicheng-ai-chat-sourced')
assertSummaryEquals(sourcedSummary, 'contextEcho', true, 'live-xicheng-ai-chat-sourced')
assertSummaryEquals(sourcedSummary, 'safetyStatus', 'PASSED', 'live-xicheng-ai-chat-sourced')
assertSummaryPositiveNumber(sourcedSummary, 'sourceCount', 'live-xicheng-ai-chat-sourced')
assertSummaryPositiveNumber(sourcedSummary, 'logId', 'live-xicheng-ai-chat-sourced')

const blockedCheck = preprodCheckByName.get('live-xicheng-ai-chat-blocked')
const blockedSummary = blockedCheck?.summary || {}
assertSummaryEquals(blockedSummary, 'endpoint', '/app-api/xunjing/ai/chat', 'live-xicheng-ai-chat-blocked')
assertSummaryEquals(blockedSummary, 'tenantId', preprodSummary.tenantId, 'live-xicheng-ai-chat-blocked')
assertSummaryEquals(blockedSummary, 'regionCode', expectedXichengRegionCode, 'live-xicheng-ai-chat-blocked')
assertSummaryEquals(blockedSummary, 'packageCode', expectedXichengPackageCode, 'live-xicheng-ai-chat-blocked')
assertSummaryEquals(blockedSummary, 'sceneCode', 'xicheng-ai-guide', 'live-xicheng-ai-chat-blocked')
assertSummaryEquals(blockedSummary, 'poiCode', 'xicheng-source-guard-negative', 'live-xicheng-ai-chat-blocked')
assertSummaryEquals(blockedSummary, 'poiName', '来源门禁测试点位', 'live-xicheng-ai-chat-blocked')
assertSummaryEquals(blockedSummary, 'contextEcho', true, 'live-xicheng-ai-chat-blocked')
assertSummaryEquals(blockedSummary, 'safetyStatus', 'BLOCKED', 'live-xicheng-ai-chat-blocked')
if (Number(blockedSummary.sourceCount || 0) !== 0) {
  fail('APP readiness evidence live-xicheng-ai-chat-blocked summary.sourceCount must be 0')
}
assertSummaryPositiveNumber(blockedSummary, 'logId', 'live-xicheng-ai-chat-blocked')

const scanResolveCheck = preprodCheckByName.get('live-xicheng-scan-resolve')
const scanResolveSummary = scanResolveCheck?.summary || {}
if (String(scanResolveSummary.tenantId || '').trim() !== String(preprodSummary.tenantId || '').trim()) {
  fail('APP readiness evidence live-xicheng-scan-resolve must use the same tenantId as summary.tenantId')
}

if (String(scanResolveSummary.packageCode || '').trim() !== expectedXichengPackageCode) {
  fail(`APP readiness evidence live-xicheng-scan-resolve must resolve packageCode ${expectedXichengPackageCode}`)
}

if (!String(scanResolveSummary.targetPath || '').includes('/pages/map/detail')) {
  fail('APP readiness evidence live-xicheng-scan-resolve targetPath must include /pages/map/detail')
}

verifyNativeEvidenceWithExistingGate(nativeEvidence.path)

const head = currentHead()
if (nativeEvidence.json.commit !== head) {
  fail('Native device evidence commit must match current git HEAD')
}

if (normalizeComparableUrl(nativeEvidence.json.appApiBaseUrl) !== normalizeComparableUrl(preprodSummary.baseUrl)) {
  fail('Native device evidence appApiBaseUrl must match APP readiness evidence summary.baseUrl')
}

if (String(nativeEvidence.json.tenantId || '').trim() !== String(preprodSummary.tenantId || '').trim()) {
  fail('Native device evidence tenantId must match APP readiness evidence summary.tenantId')
}

const nativeReleaseArtifactPath = verifyNativeReleaseArtifactWithExistingGate(
  nativeEvidence.json?.build?.artifact,
  normalizeComparableUrl(preprodSummary.baseUrl),
  String(preprodSummary.tenantId)
)

console.log(JSON.stringify({
  ok: true,
  branch: nativeEvidence.json.branch,
  commit: nativeEvidence.json.commit,
  appApiBaseUrl: normalizeComparableUrl(nativeEvidence.json.appApiBaseUrl),
  tenantId: String(nativeEvidence.json.tenantId),
  preprodEvidenceFile: preprodEvidence.path,
  nativeEvidenceFile: nativeEvidence.path,
  nativeReleaseArtifact: nativeReleaseArtifactPath,
  requiredPreprodChecks
}, null, 2))
