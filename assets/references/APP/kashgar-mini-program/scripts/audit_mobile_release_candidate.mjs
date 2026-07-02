import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { loadReleaseEnvFile } from './release_env_loader.mjs'
import { normalizeReleaseHttpsUrl } from './release_url_guard.mjs'

loadReleaseEnvFile()

const defaultPreprodEvidencePath = '../../../../qa/xicheng-app-readiness-evidence.json'
const defaultNativeEvidencePath = '../../../../qa/xicheng-native-device-evidence.json'

const args = process.argv.slice(2)
const readArg = (name, fallback = '') => {
  const index = args.indexOf(name)
  if (index !== -1 && args[index + 1]) return args[index + 1]
  return fallback
}
const hasFlag = (name) => args.includes(name)

const run = (command, commandArgs, options = {}) => spawnSync(command, commandArgs, {
  cwd: options.cwd || process.cwd(),
  env: options.env || process.env,
  encoding: 'utf8'
})

const readGit = (gitArgs, fallback = '') => {
  const result = run('git', gitArgs)
  return result.status === 0 ? result.stdout.trim() : fallback
}

const repoRoot = readGit(['rev-parse', '--show-toplevel'], process.cwd())
const currentHead = readGit(['rev-parse', 'HEAD'])
const currentBranch = readGit(['rev-parse', '--abbrev-ref', 'HEAD'], 'HEAD')

const resolveInputPath = (inputPath) => {
  if (!String(inputPath || '').trim()) return ''
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath)
}

const resolveRepoInputPath = (inputPath) => {
  if (!String(inputPath || '').trim()) return ''
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(repoRoot, inputPath)
}

const normalizePathForComparison = (inputPath) => {
  if (!String(inputPath || '').trim()) return ''
  if (!fs.existsSync(inputPath)) return path.resolve(inputPath)
  return fs.realpathSync(inputPath)
}

const normalizeUrl = (value) => String(value || '').trim().replace(/\/+$/, '')
const mobileReleaseArtifactExtensions = new Set(['.apk', '.aab', '.ipa'])
const expectedXichengRegionCode = 'beijing-xicheng'
const expectedXichengPackageCode = 'XICHENG-MAP-001'
const requiredPreprodChecks = [
  'live-xicheng-ai-chat-sourced',
  'live-xicheng-ai-chat-blocked',
  'live-xicheng-trigger-baitasi',
  'live-xicheng-trigger-gongwangfu',
  'live-xicheng-trigger-planetarium',
  'live-xicheng-scan-resolve'
]
const maxEvidenceAgeHours = Number(process.env.XUNJING_EVIDENCE_MAX_AGE_HOURS || 72)
const maxFutureSkewMs = 5 * 60 * 1000

const evidenceFreshness = (label, value) => {
  const parsedTime = Date.parse(String(value || ''))
  if (!Number.isFinite(parsedTime)) {
    return { ok: false, code: 'invalid-timestamp', detail: `${label} must be a valid ISO timestamp` }
  }
  const now = Date.now()
  if (parsedTime - now > maxFutureSkewMs) {
    return { ok: false, code: 'future-timestamp', detail: `${label} must not be in the future` }
  }
  const ageHours = (now - parsedTime) / 1000 / 60 / 60
  if (ageHours > maxEvidenceAgeHours) {
    return { ok: false, code: 'stale', detail: `${label} is stale; evidence must be fresh within ${maxEvidenceAgeHours} hours` }
  }
  return { ok: true, code: 'fresh', detail: 'fresh' }
}

const releaseHttpsUrl = (label, value) => {
  try {
    return { ok: true, normalized: normalizeReleaseHttpsUrl(label, value), detail: 'pass' }
  } catch (error) {
    return { ok: false, normalized: normalizeUrl(value), detail: error.message }
  }
}

const describeNativeReleaseArtifactPath = (artifactPath) => {
  if (!artifactPath || !fs.existsSync(artifactPath)) {
    return {
      exists: false,
      ok: false,
      isFile: false,
      extension: '',
      invalidReason: ''
    }
  }
  const stat = fs.statSync(artifactPath)
  const extension = path.extname(artifactPath).toLowerCase()
  const isFile = stat.isFile()
  const ok = isFile && mobileReleaseArtifactExtensions.has(extension)
  const invalidReason = ok
    ? ''
    : (isFile
        ? `expected APK/AAB/IPA, got ${extension || 'file without extension'}`
        : 'expected signed mobile install package file, got app resource directory or non-file path')
  return {
    exists: true,
    ok,
    isFile,
    extension,
    invalidReason
  }
}

const readJsonIfPresent = (inputPath) => {
  const resolvedPath = resolveInputPath(inputPath)
  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    return { path: resolvedPath, exists: false, json: null, error: '' }
  }
  try {
    return {
      path: resolvedPath,
      exists: true,
      json: JSON.parse(fs.readFileSync(resolvedPath, 'utf8')),
      error: ''
    }
  } catch (error) {
    return { path: resolvedPath, exists: true, json: null, error: error.message }
  }
}

const summarizeCommandFailure = (result) => {
  const output = String(result.stderr || result.stdout || '').trim()
  if (!output) return 'command failed'
  try {
    const parsed = JSON.parse(output)
    if (Array.isArray(parsed.blockers) && parsed.blockers.length > 0) {
      return parsed.blockers.join('; ')
    }
  } catch {
    // Fall through to the first line for non-JSON command output.
  }
  return output.split('\n')[0] || 'command failed'
}

const addBlocker = (blockers, code, message, nextAction) => {
  if (blockers.some((blocker) => blocker.code === code)) return
  blockers.push({ code, message, nextAction })
}

const summaryValueMatches = (actual, expected) => typeof expected === 'boolean'
  ? actual === expected
  : String(actual || '').trim() === String(expected)

const addSummaryEqualsError = (errors, summary, field, expected, label) => {
  if (!summaryValueMatches(summary?.[field], expected)) {
    errors.push(`${label} summary.${field} must be ${expected}`)
  }
}

const addSummaryPositiveNumberError = (errors, summary, field, label) => {
  if (Number(summary?.[field] || 0) <= 0) {
    errors.push(`${label} summary.${field} must be a positive number`)
  }
}

const addSummaryContainsError = (errors, summary, field, expectedFragment, label) => {
  if (!String(summary?.[field] || '').includes(expectedFragment)) {
    errors.push(`${label} summary.${field} must include ${expectedFragment}`)
  }
}

const collectPreprodSummaryErrors = ({ preprodCheckByName, preprodTenantId }) => {
  const errors = []
  const sourcedLabel = 'live-xicheng-ai-chat-sourced'
  const sourcedSummary = preprodCheckByName.get(sourcedLabel)?.summary || {}
  addSummaryEqualsError(errors, sourcedSummary, 'endpoint', '/app-api/xunjing/ai/chat', sourcedLabel)
  addSummaryEqualsError(errors, sourcedSummary, 'tenantId', preprodTenantId, sourcedLabel)
  addSummaryEqualsError(errors, sourcedSummary, 'regionCode', expectedXichengRegionCode, sourcedLabel)
  addSummaryEqualsError(errors, sourcedSummary, 'packageCode', expectedXichengPackageCode, sourcedLabel)
  addSummaryEqualsError(errors, sourcedSummary, 'sceneCode', 'xicheng-ai-guide', sourcedLabel)
  addSummaryEqualsError(errors, sourcedSummary, 'poiCode', 'xicheng-baitasi', sourcedLabel)
  addSummaryEqualsError(errors, sourcedSummary, 'poiName', '妙应寺白塔', sourcedLabel)
  addSummaryEqualsError(errors, sourcedSummary, 'contextEcho', true, sourcedLabel)
  addSummaryEqualsError(errors, sourcedSummary, 'safetyStatus', 'PASSED', sourcedLabel)
  addSummaryPositiveNumberError(errors, sourcedSummary, 'sourceCount', sourcedLabel)
  addSummaryPositiveNumberError(errors, sourcedSummary, 'logId', sourcedLabel)

  const blockedLabel = 'live-xicheng-ai-chat-blocked'
  const blockedSummary = preprodCheckByName.get(blockedLabel)?.summary || {}
  addSummaryEqualsError(errors, blockedSummary, 'endpoint', '/app-api/xunjing/ai/chat', blockedLabel)
  addSummaryEqualsError(errors, blockedSummary, 'tenantId', preprodTenantId, blockedLabel)
  addSummaryEqualsError(errors, blockedSummary, 'regionCode', expectedXichengRegionCode, blockedLabel)
  addSummaryEqualsError(errors, blockedSummary, 'packageCode', expectedXichengPackageCode, blockedLabel)
  addSummaryEqualsError(errors, blockedSummary, 'sceneCode', 'xicheng-ai-guide', blockedLabel)
  addSummaryEqualsError(errors, blockedSummary, 'poiCode', 'xicheng-source-guard-negative', blockedLabel)
  addSummaryEqualsError(errors, blockedSummary, 'poiName', '来源门禁测试点位', blockedLabel)
  addSummaryEqualsError(errors, blockedSummary, 'contextEcho', true, blockedLabel)
  addSummaryEqualsError(errors, blockedSummary, 'safetyStatus', 'BLOCKED', blockedLabel)
  if (Number(blockedSummary.sourceCount || 0) !== 0) {
    errors.push(`${blockedLabel} summary.sourceCount must be 0`)
  }
  addSummaryPositiveNumberError(errors, blockedSummary, 'logId', blockedLabel)

  const scanResolveLabel = 'live-xicheng-scan-resolve'
  const scanResolveSummary = preprodCheckByName.get(scanResolveLabel)?.summary || {}
  addSummaryEqualsError(errors, scanResolveSummary, 'tenantId', preprodTenantId, scanResolveLabel)
  addSummaryEqualsError(errors, scanResolveSummary, 'packageCode', expectedXichengPackageCode, scanResolveLabel)
  if (!String(scanResolveSummary.targetPath || '').includes('/pages/map/detail')) {
    errors.push(`${scanResolveLabel} summary.targetPath must include /pages/map/detail`)
  }

  for (const [triggerLabel, poiCode] of [
    ['live-xicheng-trigger-baitasi', 'xicheng-baitasi'],
    ['live-xicheng-trigger-gongwangfu', 'xicheng-gongwangfu'],
    ['live-xicheng-trigger-planetarium', 'xicheng-planetarium']
  ]) {
    const triggerSummary = preprodCheckByName.get(triggerLabel)?.summary || {}
    addSummaryEqualsError(errors, triggerSummary, 'endpoint', '/app-api/xunjing/triggers/resolve', triggerLabel)
    addSummaryEqualsError(errors, triggerSummary, 'tenantId', preprodTenantId, triggerLabel)
    addSummaryEqualsError(errors, triggerSummary, 'packageCode', expectedXichengPackageCode, triggerLabel)
    addSummaryEqualsError(errors, triggerSummary, 'regionCode', expectedXichengRegionCode, triggerLabel)
    addSummaryEqualsError(errors, triggerSummary, 'poiCode', poiCode, triggerLabel)
    addSummaryEqualsError(errors, triggerSummary, 'requiresUserConfirm', false, triggerLabel)
    addSummaryContainsError(errors, triggerSummary, 'targetPath', `poiCode=${poiCode}`, triggerLabel)
    addSummaryContainsError(errors, triggerSummary, 'targetPath', `packageCode=${expectedXichengPackageCode}`, triggerLabel)
    if (!Number.isFinite(Number(triggerSummary.confidence)) || Number(triggerSummary.confidence) < 0.85) {
      errors.push(`${triggerLabel} summary.confidence must be at least 0.85`)
    }
    addSummaryPositiveNumberError(errors, triggerSummary, 'sourceCount', triggerLabel)
  }

  return errors
}

const remoteParity = (remoteRef) => {
  const result = run('git', ['rev-list', '--left-right', '--count', `HEAD...${remoteRef}`])
  if (result.status !== 0) {
    return { remoteRef, ok: false, detail: summarizeCommandFailure(result) }
  }
  const [ahead, behind] = result.stdout.trim().split(/\s+/).map((value) => Number(value))
  return {
    remoteRef,
    ok: ahead === 0 && behind === 0,
    ahead,
    behind
  }
}

const runNodeGate = (scriptName, gateArgs, env = process.env) => {
  const scriptPath = path.resolve(process.cwd(), 'scripts', scriptName)
  const result = run(process.execPath, [scriptPath, ...gateArgs], { env })
  return {
    ok: result.status === 0,
    exitCode: result.status,
    detail: result.status === 0 ? 'pass' : summarizeCommandFailure(result),
    stdout: result.stdout,
    stderr: result.stderr
  }
}

const preprodEvidenceArg = readArg('--preprod-evidence', process.env.XUNJING_PREPROD_EVIDENCE_FILE || defaultPreprodEvidencePath)
const nativeEvidenceArg = readArg('--native-evidence', process.env.XUNJING_NATIVE_DEVICE_EVIDENCE_FILE || defaultNativeEvidencePath)
const releaseArtifactArg = readArg('--release-artifact', process.env.XUNJING_RELEASE_ARTIFACT || '')

const blockers = []
const warnings = []
const gates = {}
const skipRemoteParity = hasFlag('--skip-remote-parity') || process.env.XUNJING_SKIP_REMOTE_PARITY === '1'
const requestedTestBypass = process.env.XUNJING_RELEASE_AUDIT_ALLOW_TEST_BYPASS === '1'
const testMode = process.env.XUNJING_RELEASE_AUDIT_TEST_MODE === '1'
const allowTestBypass = requestedTestBypass && testMode
const unsafeTestBypassWithoutTestMode = requestedTestBypass && !testMode
const remoteParitySkippedWithoutBypass = skipRemoteParity && !allowTestBypass
const gitStatusPorcelain = readGit(['status', '--porcelain', '--untracked-files=all'])
const dirtyEntries = gitStatusPorcelain ? gitStatusPorcelain.split('\n').filter(Boolean) : []
const worktreeClean = dirtyEntries.length === 0
const worktreeDirtyWithoutBypass = !worktreeClean && !allowTestBypass
const remoteRefs = String(process.env.XUNJING_RELEASE_AUDIT_REMOTE_REFS || 'github/main,origin/main')
  .split(',')
  .map((remoteRef) => remoteRef.trim())
  .filter(Boolean)
const remoteParityResults = remoteRefs.map((remoteRef) => remoteParity(remoteRef))

gates.git = {
  ok: Boolean(currentHead) &&
    !remoteParitySkippedWithoutBypass &&
    !worktreeDirtyWithoutBypass &&
    (skipRemoteParity || remoteParityResults.every((remote) => remote.ok)),
  branch: currentBranch,
  commit: currentHead,
  worktreeClean,
  dirtyEntryCount: dirtyEntries.length,
  dirtyEntries: dirtyEntries.slice(0, 20),
  skipRemoteParity,
  testBypassRequested: requestedTestBypass,
  testMode,
  testBypass: allowTestBypass,
  remotes: remoteParityResults
}
if (unsafeTestBypassWithoutTestMode) {
  addBlocker(
    blockers,
    'release-audit-test-bypass-without-test-mode',
    'Release audit test bypass was requested without explicit test mode, so it cannot affect a release candidate',
    'Unset XUNJING_RELEASE_AUDIT_ALLOW_TEST_BYPASS and run npm run audit:release:candidate normally for release'
  )
}
if (worktreeDirtyWithoutBypass) {
  addBlocker(
    blockers,
    'git-worktree-dirty',
    'Git worktree has uncommitted changes, so the release candidate cannot be traced to the audited commit',
    'Commit, stash, or remove uncommitted changes and generated evidence before running npm run audit:release:candidate'
  )
}
if (remoteParitySkippedWithoutBypass) {
  addBlocker(
    blockers,
    'git-remote-parity-skipped',
    'Remote parity was skipped, so the release candidate cannot prove GitHub/Gitee consistency',
    'Run npm run audit:release:candidate without --skip-remote-parity or XUNJING_SKIP_REMOTE_PARITY before release'
  )
}
for (const remote of gates.git.remotes) {
  if (!skipRemoteParity && !remote.ok) {
    addBlocker(
      blockers,
      `git-remote-not-in-sync-${remote.remoteRef.replace(/[^a-z0-9]+/gi, '-')}`,
      `${remote.remoteRef} is not at the current release candidate commit`,
      `git fetch --all --prune && git rev-list --left-right --count HEAD...${remote.remoteRef}`
    )
  }
}

const preprodEvidence = readJsonIfPresent(preprodEvidenceArg)
gates.preprodEvidence = {
  ok: false,
  path: preprodEvidence.path,
  exists: preprodEvidence.exists
}
if (!preprodEvidence.exists) {
  addBlocker(
    blockers,
    'preprod-evidence-missing',
    `APP readiness evidence not found: ${preprodEvidence.path}`,
    'Run XUNJING_RELEASE_ENV_FILE=/secure/path/preprod.env npm run verify:yudao:preprod'
  )
} else if (preprodEvidence.error) {
  addBlocker(
    blockers,
    'preprod-evidence-invalid-json',
    `APP readiness evidence JSON is invalid: ${preprodEvidence.error}`,
    'Regenerate qa/xicheng-app-readiness-evidence.json from the preprod readiness command'
  )
} else {
  const summary = preprodEvidence.json?.summary || {}
  const preprodBaseOk = preprodEvidence.json?.artifactType === 'xunjing-platform-readiness' && preprodEvidence.json?.ok === true
  const preprodScopeOk = String(summary.xichengRegionCode || '').trim() === expectedXichengRegionCode &&
    String(summary.xichengPackageCode || '').trim() === expectedXichengPackageCode
  const preprodFreshness = evidenceFreshness('APP readiness evidence checkedAt', preprodEvidence.json?.checkedAt)
  const preprodBaseUrl = releaseHttpsUrl('APP readiness evidence summary.baseUrl', summary.baseUrl)
  const preprodTenantId = String(summary.tenantId || '').trim()
  const preprodTenantOk = /^[1-9]\d*$/.test(preprodTenantId)
  const preprodIncludesXichengChecks = summary.includeXichengAppCheck === true &&
    summary.includeXichengTriggerCheck === true
  const preprodCheckCountsOk = Number(summary.failedChecks) === 0 &&
    Number(summary.passedChecks) >= Number(summary.totalChecks || 0)
  const preprodChecks = Array.isArray(preprodEvidence.json?.checks) ? preprodEvidence.json.checks : []
  const preprodCheckByName = new Map(preprodChecks.map((check) => [check?.name, check]))
  const missingRequiredPreprodChecks = requiredPreprodChecks.filter((checkName) => {
    const check = preprodCheckByName.get(checkName)
    return !check || check.ok !== true
  })
  const invalidRequiredPreprodSummaryErrors = missingRequiredPreprodChecks.length > 0
    ? []
    : collectPreprodSummaryErrors({ preprodCheckByName, preprodTenantId })
  gates.preprodEvidence = {
    ...gates.preprodEvidence,
    ok: preprodBaseOk &&
      preprodScopeOk &&
      preprodFreshness.ok &&
      preprodBaseUrl.ok &&
      preprodTenantOk &&
      preprodIncludesXichengChecks &&
      preprodCheckCountsOk &&
      missingRequiredPreprodChecks.length === 0 &&
      invalidRequiredPreprodSummaryErrors.length === 0,
    checkedAt: preprodEvidence.json?.checkedAt || '',
    freshness: preprodFreshness,
    baseUrl: preprodBaseUrl.normalized,
    baseUrlValidation: preprodBaseUrl,
    tenantId: preprodTenantId,
    tenantValidation: {
      ok: preprodTenantOk,
      detail: preprodTenantOk ? 'pass' : 'APP readiness evidence summary.tenantId must be a positive integer tenant id'
    },
    xichengRegionCode: String(summary.xichengRegionCode || ''),
    xichengPackageCode: String(summary.xichengPackageCode || ''),
    includeXichengAppCheck: summary.includeXichengAppCheck === true,
    includeXichengTriggerCheck: summary.includeXichengTriggerCheck === true,
    checkCounts: {
      ok: preprodCheckCountsOk,
      totalChecks: Number(summary.totalChecks || 0),
      passedChecks: Number(summary.passedChecks || 0),
      failedChecks: Number(summary.failedChecks || 0)
    },
    missingRequiredChecks: missingRequiredPreprodChecks,
    invalidRequiredCheckSummaries: invalidRequiredPreprodSummaryErrors
  }
  if (!preprodBaseOk) {
    addBlocker(
      blockers,
      'preprod-evidence-not-passing',
      'APP readiness evidence is present but is not a passing xunjing-platform-readiness artifact',
      'Regenerate preprod readiness evidence after the HTTPS Yudao APP API passes all Xicheng checks'
    )
  }
  if (!preprodScopeOk) {
    addBlocker(
      blockers,
      'preprod-evidence-xicheng-scope-mismatch',
      `APP readiness evidence must be scoped to ${expectedXichengRegionCode} / ${expectedXichengPackageCode}`,
      'Regenerate qa/xicheng-app-readiness-evidence.json with --include-xicheng-app-check and --include-xicheng-trigger-check against the Xicheng package'
    )
  }
  if (!preprodFreshness.ok) {
    addBlocker(
      blockers,
      preprodFreshness.code === 'stale' ? 'preprod-evidence-stale' : 'preprod-evidence-invalid-checked-at',
      preprodFreshness.detail,
      'Regenerate qa/xicheng-app-readiness-evidence.json from the non-local HTTPS preprod readiness command within the freshness window'
    )
  }
  if (!preprodBaseUrl.ok) {
    addBlocker(
      blockers,
      'preprod-evidence-invalid-base-url',
      preprodBaseUrl.detail,
      'Regenerate qa/xicheng-app-readiness-evidence.json from a non-local HTTPS Yudao APP API gateway'
    )
  }
  if (!preprodTenantOk) {
    addBlocker(
      blockers,
      'preprod-evidence-invalid-tenant-id',
      'APP readiness evidence summary.tenantId must be a positive integer tenant id',
      'Regenerate qa/xicheng-app-readiness-evidence.json with the release tenant id from XUNJING_TENANT_ID'
    )
  }
  if (!preprodIncludesXichengChecks) {
    addBlocker(
      blockers,
      'preprod-evidence-xicheng-checks-not-included',
      'APP readiness evidence must include Xicheng APP and trigger checks',
      'Regenerate qa/xicheng-app-readiness-evidence.json with --include-xicheng-app-check and --include-xicheng-trigger-check'
    )
  }
  if (!preprodCheckCountsOk) {
    addBlocker(
      blockers,
      'preprod-evidence-check-counts-not-passing',
      'APP readiness evidence must have 0 failedChecks and all checks passing',
      'Rerun the preprod readiness check and fix every failed Xicheng APP/API check before release'
    )
  }
  if (missingRequiredPreprodChecks.length > 0) {
    addBlocker(
      blockers,
      'preprod-evidence-missing-required-check',
      `APP readiness evidence missing required passing check(s): ${missingRequiredPreprodChecks.join(', ')}`,
      'Regenerate preprod readiness evidence with sourced AI, BLOCKED AI, trigger, and scan resolve checks passing'
    )
  }
  if (invalidRequiredPreprodSummaryErrors.length > 0) {
    addBlocker(
      blockers,
      'preprod-evidence-invalid-xicheng-live-summary',
      `APP readiness evidence has invalid Xicheng live check summary fields: ${invalidRequiredPreprodSummaryErrors.join('; ')}`,
      'Regenerate preprod readiness evidence and confirm sourced AI, BLOCKED AI, trigger, and scan resolve checks carry tenant, route context, POI attribution, sourceCount, targetPath, confidence, and logId'
    )
  }
}

const nativeEvidence = readJsonIfPresent(nativeEvidenceArg)
gates.nativeEvidence = {
  ok: false,
  path: nativeEvidence.path,
  exists: nativeEvidence.exists
}
if (!nativeEvidence.exists) {
  addBlocker(
    blockers,
    'native-evidence-missing',
    `Native device evidence not found: ${nativeEvidence.path}`,
    'Run XUNJING_RELEASE_ENV_FILE=/secure/path/preprod.env XUNJING_RELEASE_ARTIFACT=/path/to/signed.apk npm run prepare:native:evidence, then complete real-device scenarios and run npm run verify:native:evidence'
  )
} else if (nativeEvidence.error) {
  addBlocker(
    blockers,
    'native-evidence-invalid-json',
    `Native device evidence JSON is invalid: ${nativeEvidence.error}`,
    'Regenerate or repair qa/xicheng-native-device-evidence.json'
  )
} else {
  const nativeGate = runNodeGate('verify_native_device_evidence.mjs', [nativeEvidence.path])
  gates.nativeEvidence = {
    ...gates.nativeEvidence,
    ok: nativeGate.ok,
    detail: nativeGate.detail,
    commit: nativeEvidence.json?.commit || '',
    appApiBaseUrl: normalizeUrl(nativeEvidence.json?.appApiBaseUrl),
    tenantId: String(nativeEvidence.json?.tenantId || ''),
    releaseTargets: nativeEvidence.json?.releaseTargets || [],
    artifact: nativeEvidence.json?.build?.artifact || ''
  }
  if (!nativeGate.ok) {
    addBlocker(
      blockers,
      'native-evidence-not-passing',
      `Native device evidence gate failed: ${nativeGate.detail}`,
      'Complete every physical-device scenario with non-empty qa/ screenshot or recording evidence, then rerun npm run verify:native:evidence'
    )
  }
}

const explicitReleaseArtifactPath = resolveInputPath(releaseArtifactArg)
const nativeEvidenceArtifactPath = resolveRepoInputPath(nativeEvidence.json?.build?.artifact || '')
const releaseArtifactPath = explicitReleaseArtifactPath || nativeEvidenceArtifactPath
const nativeReleaseArtifactDescription = describeNativeReleaseArtifactPath(releaseArtifactPath)
gates.nativeReleaseArtifact = {
  ok: nativeReleaseArtifactDescription.ok,
  path: releaseArtifactPath,
  nativeEvidenceArtifact: nativeEvidenceArtifactPath,
  explicitReleaseArtifact: explicitReleaseArtifactPath,
  exists: nativeReleaseArtifactDescription.exists,
  isFile: nativeReleaseArtifactDescription.isFile,
  extension: nativeReleaseArtifactDescription.extension,
  invalidReason: nativeReleaseArtifactDescription.invalidReason
}
if (
  explicitReleaseArtifactPath &&
  nativeEvidence.exists &&
  !nativeEvidence.error &&
  nativeEvidenceArtifactPath &&
  normalizePathForComparison(explicitReleaseArtifactPath) !== normalizePathForComparison(nativeEvidenceArtifactPath)
) {
  addBlocker(
    blockers,
    'release-artifact-native-evidence-mismatch',
    'Explicit release artifact must match native evidence build.artifact for the same release candidate',
    'Use the same signed APK/AAB/IPA path in --release-artifact or XUNJING_RELEASE_ARTIFACT and qa/xicheng-native-device-evidence.json build.artifact; regenerate native evidence if the package changed'
  )
}
if (!gates.nativeReleaseArtifact.exists) {
  addBlocker(
    blockers,
    'native-release-artifact-missing',
    `Native release artifact not found: ${releaseArtifactPath || '(not configured)'}`,
    'Run XUNJING_RELEASE_ENV_FILE=/secure/path/preprod.env npm run pack:native:cloud:dry-run, then XUNJING_RELEASE_ENV_FILE=/secure/path/preprod.env XUNJING_NATIVE_PACK_CONFIRM=cloud-pack npm run pack:native:cloud; set XUNJING_RELEASE_ARTIFACT to the signed APK/AAB or IPA before preparing native evidence'
  )
}
if (gates.nativeReleaseArtifact.exists && !gates.nativeReleaseArtifact.ok) {
  addBlocker(
    blockers,
    'native-release-artifact-invalid',
    `Native release artifact must be a signed mobile install package file (APK/AAB/IPA), not an app resource directory or unsupported file: ${releaseArtifactPath}`,
    'Set XUNJING_RELEASE_ARTIFACT to the signed APK/AAB/IPA produced by HBuilderX cloud packaging before preparing native evidence'
  )
}

gates.nativePackageReadiness = {
  ok: false,
  skipped: gates.nativeReleaseArtifact.ok,
  detail: gates.nativeReleaseArtifact.ok
    ? 'skipped because a native release artifact is already configured'
    : ''
}
if (!gates.nativeReleaseArtifact.ok) {
  const readinessGate = runNodeGate('verify_native_package_readiness.mjs', [])
  gates.nativePackageReadiness = {
    ...gates.nativePackageReadiness,
    ok: readinessGate.ok,
    detail: readinessGate.detail
  }
  if (!readinessGate.ok) {
    addBlocker(
      blockers,
      'native-package-readiness-not-passing',
      `Native package readiness gate failed: ${readinessGate.detail}`,
      'Set XUNJING_RELEASE_ENV_FILE with release targets, API gateway, tenant id, and Android/iOS signing env, then run npm run verify:native:package:ready'
    )
  }
}

const needsReleasePrerequisites = !gates.preprodEvidence.ok ||
  !gates.nativeEvidence.ok ||
  !gates.nativeReleaseArtifact.ok
gates.releasePrerequisites = {
  ok: !needsReleasePrerequisites,
  skipped: !needsReleasePrerequisites,
  detail: needsReleasePrerequisites
    ? ''
    : 'skipped because preprod evidence, native evidence and native release artifact are already present'
}
if (needsReleasePrerequisites) {
  const prereqGate = runNodeGate('diagnose_mobile_release_prerequisites.mjs', [])
  let prereqJson = null
  try {
    prereqJson = JSON.parse(prereqGate.stdout)
  } catch {
    // Keep prereqJson empty; detail below will carry the command failure summary.
  }

  gates.releasePrerequisites = {
    ok: prereqGate.ok,
    skipped: false,
    detail: prereqGate.ok
      ? 'pass'
      : (Array.isArray(prereqJson?.blockers) && prereqJson.blockers.length > 0
          ? prereqJson.blockers.join('; ')
          : prereqGate.detail),
    checks: prereqJson?.checks || null
  }

  if (!prereqGate.ok) {
    const prereqBlockers = Array.isArray(prereqJson?.blockers) && prereqJson.blockers.length > 0
      ? prereqJson.blockers
      : ['diagnostic-failed']
    for (const prereqBlocker of prereqBlockers) {
      addBlocker(
        blockers,
        `release-prerequisite-${String(prereqBlocker).replace(/[^a-z0-9]+/gi, '-')}`,
        `Release prerequisite diagnostic failed: ${prereqBlocker}`,
        'Run XUNJING_RELEASE_ENV_FILE=/secure/path/preprod.env npm run doctor:release:prereqs, then resolve every reported blocker'
      )
    }
  }
}

const expectedApiBaseUrl = normalizeUrl(process.env.XUNJING_APP_API_BASE_URL || gates.preprodEvidence.baseUrl)
const expectedTenantId = String(process.env.XUNJING_TENANT_ID || gates.preprodEvidence.tenantId || '').trim()
gates.releaseArtifactScan = {
  ok: false,
  artifact: releaseArtifactPath,
  expectedApiBaseUrl,
  expectedTenantId
}
if (gates.nativeReleaseArtifact.ok) {
  if (!expectedApiBaseUrl || !expectedTenantId) {
    addBlocker(
      blockers,
      'release-artifact-env-missing',
      'Release artifact scan requires XUNJING_APP_API_BASE_URL and XUNJING_TENANT_ID or matching preprod evidence',
      'Run with XUNJING_RELEASE_ENV_FILE=/secure/path/preprod.env or explicit XUNJING_APP_API_BASE_URL and XUNJING_TENANT_ID'
    )
  } else {
    const artifactGate = runNodeGate('verify_release_build_artifact.mjs', [releaseArtifactPath], {
      ...process.env,
      XUNJING_APP_API_BASE_URL: expectedApiBaseUrl,
      XUNJING_TENANT_ID: expectedTenantId
    })
    gates.releaseArtifactScan = {
      ...gates.releaseArtifactScan,
      ok: artifactGate.ok,
      detail: artifactGate.detail
    }
    if (!artifactGate.ok) {
      addBlocker(
        blockers,
        'release-artifact-scan-failed',
        `Release artifact scan failed: ${artifactGate.detail}`,
        'Rebuild the signed mobile package with the same XUNJING_APP_API_BASE_URL and XUNJING_TENANT_ID used for preprod evidence'
      )
    }
  }
}

gates.launchEvidence = {
  ok: false,
  preprodEvidence: preprodEvidence.path,
  nativeEvidence: nativeEvidence.path
}
if (preprodEvidence.exists && !preprodEvidence.error && nativeEvidence.exists && !nativeEvidence.error) {
  const launchGate = runNodeGate('verify_mobile_launch_evidence_bundle.mjs', [
    '--preprod-evidence',
    preprodEvidence.path,
    '--native-evidence',
    nativeEvidence.path
  ])
  gates.launchEvidence = {
    ...gates.launchEvidence,
    ok: launchGate.ok,
    detail: launchGate.detail
  }
  if (!launchGate.ok) {
    addBlocker(
      blockers,
      'launch-evidence-bundle-not-passing',
      `Launch evidence bundle gate failed: ${launchGate.detail}`,
      'Make preprod evidence, native evidence, commit, tenantId, base URL, and release artifact all describe the same candidate, then run npm run verify:launch:evidence'
    )
  }
}

const appResourceBuildPath = path.resolve(process.cwd(), 'dist/build/app-release')
gates.appResourceBuild = {
  ok: fs.existsSync(appResourceBuildPath),
  path: appResourceBuildPath,
  note: 'uni build -p app resource output; this is not a signed mobile install package'
}
if (!gates.appResourceBuild.ok) {
  warnings.push({
    code: 'app-resource-build-missing',
    message: 'dist/build/app-release is missing; run npm run build:app:release before native packaging'
  })
}

const nextActions = [...new Set(blockers.map((blocker) => blocker.nextAction))]
if (nextActions.length === 0) {
  nextActions.push('Run the final store/channel-specific signing and distribution checklist outside this repository gate')
}

const status = blockers.length === 0 ? 'GO' : 'NO_GO'
const report = {
  artifactType: 'xicheng-mobile-release-candidate-audit',
  checkedAt: new Date().toISOString(),
  status,
  branch: currentBranch,
  commit: currentHead,
  blockers,
  warnings,
  gates,
  nextActions
}

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`, () => {
  process.exit(status === 'GO' ? 0 : 1)
})
