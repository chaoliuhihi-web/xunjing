import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const repoRoot = spawnSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: root,
  encoding: 'utf8'
}).stdout.trim()
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const scriptPath = path.join(root, 'scripts', 'audit_mobile_release_candidate.mjs')
const releaseChecklist = fs.readFileSync(path.join(root, 'docs', 'xicheng-app-release-checklist.md'), 'utf8')
const preprodRunbook = fs.readFileSync(path.join(root, 'docs', 'xicheng-app-preprod-evidence-runbook.md'), 'utf8')
const currentCommit = spawnSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8'
}).stdout.trim()

const requiredScenarioIds = [
  'install-release-build',
  'home-loads-xicheng',
  'camera-photo-recognition',
  'ocr-text-recognition',
  'gps-recognition-permission',
  'text-recognition-baitasi',
  'scan-entry-map-detail',
  'scan-result-sources',
  'xiaojing-sourced-answer',
  'xiaojing-blocked-answer',
  'recording-start-stop',
  'travelogue-draft-generated'
]
const requiredScenarioAssertions = {
  'scan-result-sources': {
    sourcesVisible: true,
    minSourceCount: 1
  },
  'xiaojing-sourced-answer': {
    safetyStatus: 'PASSED',
    sourcesVisible: true,
    minSourceCount: 1
  },
  'xiaojing-blocked-answer': {
    safetyStatus: 'BLOCKED',
    sourcesVisible: false,
    sourceCount: 0,
    blockedMessage: '无已审核来源，不能回答',
    noLocalFabrication: true
  }
}

const freshTimestamp = new Date().toISOString()

assert.ok(
  fs.existsSync(scriptPath),
  'APP should provide scripts/audit_mobile_release_candidate.mjs for one-command mobile release candidate triage'
)

assert.ok(
  (packageJson.scripts?.['audit:release:candidate'] || '').includes('node scripts/audit_mobile_release_candidate.mjs'),
  'APP package should expose npm run audit:release:candidate'
)

for (const required of [
  'npm run audit:release:candidate',
  'NO_GO',
  'GO',
  'qa/xicheng-app-readiness-evidence.json',
  'qa/xicheng-native-device-evidence.json',
  'verify:launch:evidence',
  '预发证据',
  '真机证据'
]) {
  assert.ok(releaseChecklist.includes(required), `Release checklist should mention release candidate audit item ${required}`)
  assert.ok(preprodRunbook.includes(required), `Preprod runbook should mention release candidate audit item ${required}`)
}

const makeZipArtifact = (files, fileName = 'xicheng-release.apk') => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-audit-artifact-'))
  const sourceDir = path.join(tempDir, 'source')
  fs.mkdirSync(sourceDir)
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(sourceDir, relativePath)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, content)
  }
  const archivePath = path.join(tempDir, fileName)
  const result = spawnSync('zip', ['-qr', archivePath, '.'], {
    cwd: sourceDir,
    encoding: 'utf8'
  })
  assert.equal(result.status, 0, `test fixture release artifact should be created: ${result.stderr || result.stdout}`)
  return archivePath
}

const makeArtifactDir = (files) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-audit-resource-dir-'))
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(tempDir, relativePath)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, content)
  }
  return tempDir
}

const describeArtifact = (artifactPath) => {
  const artifactBytes = fs.readFileSync(artifactPath)
  return {
    artifact: artifactPath,
    artifactSha256: crypto.createHash('sha256').update(artifactBytes).digest('hex'),
    artifactSizeBytes: artifactBytes.length
  }
}

const makePreprodEvidence = (overrides = {}) => {
  const { summary: summaryOverrides = {}, ...topLevelOverrides } = overrides
  return {
    artifactType: 'xunjing-platform-readiness',
    ok: true,
    checkedAt: freshTimestamp,
    summary: {
      baseUrl: 'https://api.xingheai.net',
      tenantId: '1',
      xichengRegionCode: 'beijing-xicheng',
      xichengPackageCode: 'XICHENG-MAP-001',
      includeXichengAppCheck: true,
      includeXichengTriggerCheck: true,
      totalChecks: 20,
      passedChecks: 20,
      failedChecks: 0,
      ...summaryOverrides
    },
  checks: [
    {
      name: 'live-xicheng-ai-chat-sourced',
      ok: true,
      summary: {
        endpoint: '/app-api/xunjing/ai/chat',
        tenantId: '1',
        packageCode: 'XICHENG-MAP-001',
        sceneCode: 'xicheng-ai-guide',
        regionCode: 'beijing-xicheng',
        poiCode: 'xicheng-baitasi',
        poiName: '妙应寺白塔',
        contextEcho: true,
        safetyStatus: 'PASSED',
        sourceCount: 1,
        logId: 120
      }
    },
    {
      name: 'live-xicheng-ai-chat-blocked',
      ok: true,
      summary: {
        endpoint: '/app-api/xunjing/ai/chat',
        tenantId: '1',
        packageCode: 'XICHENG-MAP-001',
        sceneCode: 'xicheng-ai-guide',
        regionCode: 'beijing-xicheng',
        poiCode: 'xicheng-source-guard-negative',
        poiName: '来源门禁测试点位',
        contextEcho: true,
        safetyStatus: 'BLOCKED',
        sourceCount: 0,
        logId: 121
      }
    },
    {
      name: 'live-xicheng-trigger-baitasi',
      ok: true,
      summary: {
        endpoint: '/app-api/xunjing/triggers/resolve',
        tenantId: '1',
        packageCode: 'XICHENG-MAP-001',
        regionCode: 'beijing-xicheng',
        poiCode: 'xicheng-baitasi',
        poiName: '妙应寺白塔',
        confidence: 0.95,
        requiresUserConfirm: false,
        sourceCount: 1,
        targetPath: '/pages/map/detail?packageCode=XICHENG-MAP-001&poiCode=xicheng-baitasi'
      }
    },
    {
      name: 'live-xicheng-trigger-gongwangfu',
      ok: true,
      summary: {
        endpoint: '/app-api/xunjing/triggers/resolve',
        tenantId: '1',
        packageCode: 'XICHENG-MAP-001',
        regionCode: 'beijing-xicheng',
        poiCode: 'xicheng-gongwangfu',
        poiName: '恭王府',
        confidence: 0.94,
        requiresUserConfirm: false,
        sourceCount: 1,
        targetPath: '/pages/map/detail?packageCode=XICHENG-MAP-001&poiCode=xicheng-gongwangfu'
      }
    },
    {
      name: 'live-xicheng-trigger-planetarium',
      ok: true,
      summary: {
        endpoint: '/app-api/xunjing/triggers/resolve',
        tenantId: '1',
        packageCode: 'XICHENG-MAP-001',
        regionCode: 'beijing-xicheng',
        poiCode: 'xicheng-planetarium',
        poiName: '北京天文馆',
        confidence: 0.93,
        requiresUserConfirm: false,
        sourceCount: 1,
        targetPath: '/pages/map/detail?packageCode=XICHENG-MAP-001&poiCode=xicheng-planetarium'
      }
    },
    {
      name: 'live-xicheng-scan-resolve',
      ok: true,
      summary: {
        tenantId: '1',
        packageCode: 'XICHENG-MAP-001',
        targetPath: '/pages/map/detail?packageCode=XICHENG-MAP-001&sceneCode=QR-XICHENG-MAP-001'
      }
    }
    ],
    ...topLevelOverrides
  }
}

const makeNativeEvidence = ({ artifact, artifactSha256, artifactSizeBytes, evidenceDir }) => ({
  artifactType: 'xicheng-native-device-evidence',
  createdAt: freshTimestamp,
  branch: 'feature/xicheng-p0',
  commit: currentCommit,
  appApiBaseUrl: 'https://api.xingheai.net',
  tenantId: '1',
  releaseTargets: ['android'],
  build: {
    mode: 'release',
    artifact,
    artifactSha256,
    artifactSizeBytes,
    command: 'npm run build:app:release'
  },
  devices: [
    {
      platform: 'android',
      model: 'Pixel 8',
      osVersion: 'Android 15',
      appVersion: '1.0.0',
      installer: 'release test channel'
    }
  ],
  scenarios: requiredScenarioIds.map((id) => ({
    id,
    platform: 'android',
    status: 'PASS',
    evidenceRef: path.relative(repoRoot, path.join(evidenceDir, `${id}.jpg`)),
    ...(requiredScenarioAssertions[id] ? { assertions: requiredScenarioAssertions[id] } : {}),
    notes: id === 'scan-entry-map-detail'
      ? 'Scanned QR-XICHENG-MAP-001 on physical device and landed on /pages/map/detail?packageCode=XICHENG-MAP-001'
      : `${id} verified on physical device`
  }))
})

const runAudit = (args = [], env = {}) => spawnSync(process.execPath, [scriptPath, ...args], {
  cwd: root,
  env: { ...process.env, ...env },
  encoding: 'utf8'
})

const parseAuditJson = (result) => {
  assert.ok(result.stdout.trim(), `audit should print JSON output: ${result.stderr}`)
  return JSON.parse(result.stdout)
}

const missingTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-audit-missing-'))
const missingResult = runAudit([
  '--preprod-evidence',
  path.join(missingTempDir, 'missing-preprod.json'),
  '--native-evidence',
  path.join(missingTempDir, 'missing-native.json'),
  '--release-artifact',
  path.join(missingTempDir, 'missing-release.apk')
])
assert.notEqual(missingResult.status, 0, 'release candidate audit should return a failing exit code when launch evidence is missing')
const missingAudit = parseAuditJson(missingResult)
assert.equal(missingAudit.status, 'NO_GO')
assert.ok(
  missingAudit.blockers.some((blocker) => blocker.code === 'preprod-evidence-missing'),
  'release candidate audit should name the missing preprod evidence blocker'
)
assert.ok(
  missingAudit.blockers.some((blocker) => blocker.code === 'native-evidence-missing'),
  'release candidate audit should name the missing native device evidence blocker'
)
assert.ok(
  missingAudit.blockers.some((blocker) => blocker.code === 'native-release-artifact-missing'),
  'release candidate audit should name the missing native release artifact blocker'
)
const missingRefResult = runAudit([
  '--preprod-evidence',
  path.join(missingTempDir, 'missing-preprod.json'),
  '--native-evidence',
  path.join(missingTempDir, 'missing-native.json'),
  '--release-artifact',
  path.join(missingTempDir, 'missing-release.apk')
], {
  XUNJING_RELEASE_AUDIT_REMOTE_REFS: 'HEAD,refs/heads/xicheng-release-audit-missing-ref'
})
assert.notEqual(missingRefResult.status, 0, 'release candidate audit should fail when any configured remote ref is not in sync')
const missingRefAudit = parseAuditJson(missingRefResult)
assert.equal(
  missingRefAudit.gates.git.ok,
  false,
  'release candidate audit git gate should be false when any configured remote ref is missing or out of sync'
)
assert.ok(
  missingRefAudit.gates.git.remotes.some((remote) => remote.ok === false),
  'release candidate audit should retain per-remote failure details'
)
assert.ok(
  missingRefAudit.blockers.some((blocker) => blocker.code.startsWith('git-remote-not-in-sync-')),
  'release candidate audit should include a git remote blocker when any configured remote ref is missing or out of sync'
)
assert.ok(
  missingAudit.blockers.some((blocker) => blocker.code === 'native-package-readiness-not-passing'),
  'release candidate audit should surface native package readiness blockers before a signed package exists'
)
assert.ok(
  missingAudit.nextActions.some((action) => action.includes('verify:yudao:preprod')),
  'release candidate audit should tell operators how to collect preprod evidence'
)
assert.ok(
  missingAudit.nextActions.some((action) => action.includes('pack:native:cloud:dry-run')),
  'release candidate audit should point operators to the HBuilderX cloud pack dry-run before signed packaging'
)
assert.ok(
  missingAudit.nextActions.some((action) => action.includes('XUNJING_NATIVE_PACK_CONFIRM=cloud-pack')),
  'release candidate audit should require explicit confirmation before executing HBuilderX cloud pack'
)

const wrongPreprodScopePath = path.join(missingTempDir, 'wrong-preprod-scope.json')
fs.writeFileSync(wrongPreprodScopePath, `${JSON.stringify(makePreprodEvidence({
  summary: { xichengPackageCode: 'KASHGAR-MAP-001' }
}), null, 2)}\n`)
const wrongPreprodScopeResult = runAudit([
  '--preprod-evidence',
  wrongPreprodScopePath,
  '--native-evidence',
  path.join(missingTempDir, 'missing-native.json'),
  '--release-artifact',
  path.join(missingTempDir, 'missing-release.apk')
])
assert.notEqual(
  wrongPreprodScopeResult.status,
  0,
  'release candidate audit should reject preprod evidence collected for a different Xicheng package'
)
const wrongPreprodScopeAudit = parseAuditJson(wrongPreprodScopeResult)
assert.equal(
  wrongPreprodScopeAudit.gates.preprodEvidence.ok,
  false,
  'release candidate audit preprod gate should fail when the evidence package scope is not XICHENG-MAP-001'
)
assert.ok(
  wrongPreprodScopeAudit.blockers.some((blocker) => blocker.code === 'preprod-evidence-xicheng-scope-mismatch'),
  'release candidate audit should name the Xicheng region/package scope mismatch'
)

const stalePreprodPath = path.join(missingTempDir, 'stale-preprod.json')
fs.writeFileSync(stalePreprodPath, `${JSON.stringify(makePreprodEvidence({
  checkedAt: '2000-01-01T00:00:00.000Z'
}), null, 2)}\n`)
const stalePreprodResult = runAudit([
  '--preprod-evidence',
  stalePreprodPath,
  '--native-evidence',
  path.join(missingTempDir, 'missing-native.json'),
  '--release-artifact',
  path.join(missingTempDir, 'missing-release.apk')
])
assert.notEqual(
  stalePreprodResult.status,
  0,
  'release candidate audit should reject stale preprod evidence even before native evidence exists'
)
const stalePreprodAudit = parseAuditJson(stalePreprodResult)
assert.equal(
  stalePreprodAudit.gates.preprodEvidence.ok,
  false,
  'release candidate audit preprod gate should fail when checkedAt is outside the freshness window'
)
assert.ok(
  stalePreprodAudit.blockers.some((blocker) => blocker.code === 'preprod-evidence-stale'),
  'release candidate audit should name stale preprod evidence as a launch blocker'
)
assert.match(
  `${stalePreprodResult.stderr}\n${stalePreprodResult.stdout}`,
  /checkedAt|stale|fresh|72|过期|新鲜度/i,
  'release candidate audit should explain preprod evidence freshness rejection'
)

const localPreprodPath = path.join(missingTempDir, 'local-preprod.json')
fs.writeFileSync(localPreprodPath, `${JSON.stringify(makePreprodEvidence({
  summary: { baseUrl: 'http://127.0.0.1:48082' }
}), null, 2)}\n`)
const localPreprodResult = runAudit([
  '--preprod-evidence',
  localPreprodPath,
  '--native-evidence',
  path.join(missingTempDir, 'missing-native.json'),
  '--release-artifact',
  path.join(missingTempDir, 'missing-release.apk')
])
assert.notEqual(
  localPreprodResult.status,
  0,
  'release candidate audit should reject local HTTP preprod evidence even before native evidence exists'
)
const localPreprodAudit = parseAuditJson(localPreprodResult)
assert.equal(
  localPreprodAudit.gates.preprodEvidence.ok,
  false,
  'release candidate audit preprod gate should fail when baseUrl is local or non-HTTPS'
)
assert.ok(
  localPreprodAudit.blockers.some((blocker) => blocker.code === 'preprod-evidence-invalid-base-url'),
  'release candidate audit should name local or non-HTTPS preprod baseUrl as a launch blocker'
)
assert.match(
  `${localPreprodResult.stderr}\n${localPreprodResult.stdout}`,
  /baseUrl|non-local HTTPS|localhost|127\.0\.0\.1|非本地 HTTPS/i,
  'release candidate audit should explain preprod baseUrl release URL validation'
)

const invalidTenantPreprodPath = path.join(missingTempDir, 'invalid-tenant-preprod.json')
fs.writeFileSync(invalidTenantPreprodPath, `${JSON.stringify(makePreprodEvidence({
  summary: { tenantId: 'tenant-prod' }
}), null, 2)}\n`)
const invalidTenantPreprodResult = runAudit([
  '--preprod-evidence',
  invalidTenantPreprodPath,
  '--native-evidence',
  path.join(missingTempDir, 'missing-native.json'),
  '--release-artifact',
  path.join(missingTempDir, 'missing-release.apk')
])
assert.notEqual(
  invalidTenantPreprodResult.status,
  0,
  'release candidate audit should reject preprod evidence with a non-numeric tenant before native evidence exists'
)
const invalidTenantPreprodAudit = parseAuditJson(invalidTenantPreprodResult)
assert.equal(
  invalidTenantPreprodAudit.gates.preprodEvidence.ok,
  false,
  'release candidate audit preprod gate should fail when summary.tenantId is not a positive integer'
)
assert.ok(
  invalidTenantPreprodAudit.blockers.some((blocker) => blocker.code === 'preprod-evidence-invalid-tenant-id'),
  'release candidate audit should name invalid preprod tenant ids as a launch blocker'
)
assert.match(
  `${invalidTenantPreprodResult.stderr}\n${invalidTenantPreprodResult.stdout}`,
  /tenantId|tenant.*positive integer|正整数/i,
  'release candidate audit should explain preprod tenant id validation'
)

const missingBlockedPreprodPath = path.join(missingTempDir, 'missing-blocked-preprod.json')
const missingBlockedPreprodEvidence = makePreprodEvidence()
fs.writeFileSync(missingBlockedPreprodPath, `${JSON.stringify({
  ...missingBlockedPreprodEvidence,
  checks: missingBlockedPreprodEvidence.checks.filter((check) => check.name !== 'live-xicheng-ai-chat-blocked')
}, null, 2)}\n`)
const missingBlockedPreprodResult = runAudit([
  '--preprod-evidence',
  missingBlockedPreprodPath,
  '--native-evidence',
  path.join(missingTempDir, 'missing-native.json'),
  '--release-artifact',
  path.join(missingTempDir, 'missing-release.apk')
])
assert.notEqual(
  missingBlockedPreprodResult.status,
  0,
  'release candidate audit should reject preprod evidence without the BLOCKED-source guard check before native evidence exists'
)
const missingBlockedPreprodAudit = parseAuditJson(missingBlockedPreprodResult)
assert.equal(
  missingBlockedPreprodAudit.gates.preprodEvidence.ok,
  false,
  'release candidate audit preprod gate should fail when required Xicheng readiness checks are missing'
)
assert.ok(
  missingBlockedPreprodAudit.blockers.some((blocker) => blocker.code === 'preprod-evidence-missing-required-check'),
  'release candidate audit should name missing required preprod checks as launch blockers'
)
assert.match(
  `${missingBlockedPreprodResult.stderr}\n${missingBlockedPreprodResult.stdout}`,
  /live-xicheng-ai-chat-blocked|BLOCKED|required check/i,
  'release candidate audit should explain the missing BLOCKED-source guard check'
)

const malformedAiContextPreprodPath = path.join(missingTempDir, 'malformed-ai-context-preprod.json')
fs.writeFileSync(malformedAiContextPreprodPath, `${JSON.stringify({
  ...makePreprodEvidence(),
  checks: makePreprodEvidence().checks.map((check) => (
    check.name === 'live-xicheng-ai-chat-sourced'
      ? {
          ...check,
          summary: {
            safetyStatus: 'PASSED',
            sourceCount: 1
          }
        }
      : check
  ))
}, null, 2)}\n`)
const malformedAiContextPreprodResult = runAudit([
  '--preprod-evidence',
  malformedAiContextPreprodPath,
  '--native-evidence',
  path.join(missingTempDir, 'missing-native.json'),
  '--release-artifact',
  path.join(missingTempDir, 'missing-release.apk')
])
assert.notEqual(
  malformedAiContextPreprodResult.status,
  0,
  'release candidate audit should reject preprod AI chat evidence without route context echo, POI attribution, and log id'
)
const malformedAiContextPreprodAudit = parseAuditJson(malformedAiContextPreprodResult)
assert.equal(
  malformedAiContextPreprodAudit.gates.preprodEvidence.ok,
  false,
  'release candidate audit preprod gate should fail when sourced AI chat evidence lacks required route context'
)
assert.ok(
  malformedAiContextPreprodAudit.blockers.some((blocker) => blocker.code === 'preprod-evidence-invalid-xicheng-live-summary'),
  'release candidate audit should name invalid sourced AI chat summary fields as launch blockers'
)
assert.match(
  `${malformedAiContextPreprodResult.stderr}\n${malformedAiContextPreprodResult.stdout}`,
  /contextEcho|poiCode|poiName|logId|\/app-api\/xunjing\/ai\/chat/i,
  'release candidate audit should explain the required sourced AI chat evidence fields'
)

const malformedTriggerPreprodPath = path.join(missingTempDir, 'malformed-trigger-preprod.json')
fs.writeFileSync(malformedTriggerPreprodPath, `${JSON.stringify({
  ...makePreprodEvidence(),
  checks: makePreprodEvidence().checks.map((check) => (
    check.name === 'live-xicheng-trigger-baitasi'
      ? {
          ...check,
          summary: {
            poiCode: 'xicheng-baitasi',
            sourceCount: 1
          }
        }
      : check
  ))
}, null, 2)}\n`)
const malformedTriggerPreprodResult = runAudit([
  '--preprod-evidence',
  malformedTriggerPreprodPath,
  '--native-evidence',
  path.join(missingTempDir, 'missing-native.json'),
  '--release-artifact',
  path.join(missingTempDir, 'missing-release.apk')
])
assert.notEqual(
  malformedTriggerPreprodResult.status,
  0,
  'release candidate audit should reject trigger smoke evidence without endpoint, tenant, confidence, and targetPath details'
)
const malformedTriggerPreprodAudit = parseAuditJson(malformedTriggerPreprodResult)
assert.equal(
  malformedTriggerPreprodAudit.gates.preprodEvidence.ok,
  false,
  'release candidate audit preprod gate should fail when trigger evidence lacks required target context'
)
assert.ok(
  malformedTriggerPreprodAudit.blockers.some((blocker) => blocker.code === 'preprod-evidence-invalid-xicheng-live-summary'),
  'release candidate audit should name invalid trigger summary fields as launch blockers'
)
assert.match(
  `${malformedTriggerPreprodResult.stderr}\n${malformedTriggerPreprodResult.stdout}`,
  /live-xicheng-trigger-baitasi|targetPath|confidence|\/app-api\/xunjing\/triggers\/resolve/i,
  'release candidate audit should explain the required trigger smoke evidence fields'
)

const keystorePath = path.join(missingTempDir, 'xicheng-release.keystore')
const keytoolResult = spawnSync('keytool', [
  '-genkeypair',
  '-alias',
  'xicheng-release',
  '-keystore',
  keystorePath,
  '-storepass',
  'secret',
  '-keypass',
  'secret',
  '-storetype',
  'PKCS12',
  '-keyalg',
  'RSA',
  '-keysize',
  '2048',
  '-validity',
  '3650',
  '-dname',
  'CN=Xicheng Release, OU=Xinghe, O=Xinghe, L=Beijing, ST=Beijing, C=CN',
  '-noprompt'
], {
  cwd: missingTempDir,
  encoding: 'utf8'
})
assert.equal(
  keytoolResult.status,
  0,
  `test fixture should create a valid Android keystore with keytool: ${keytoolResult.stderr || keytoolResult.stdout}`
)
const releaseEnvFilePath = path.join(missingTempDir, 'xicheng-release.env')
const loggedInCliPath = path.join(missingTempDir, 'hbuilderx-logged-in-cli')
const loggedOutCliPath = path.join(missingTempDir, 'hbuilderx-logged-out-cli')
fs.writeFileSync(loggedInCliPath, [
  '#!/bin/sh',
  'if [ "$1" = "user" ] && [ "$2" = "info" ]; then',
  '  printf "%s\\n" "username: release@example.com" "0:user info:OK"',
  '  exit 0',
  'fi',
  'exit 0'
].join('\n'))
fs.chmodSync(loggedInCliPath, 0o755)
fs.writeFileSync(loggedOutCliPath, [
  '#!/bin/sh',
  'if [ "$1" = "user" ] && [ "$2" = "info" ]; then',
  '  printf "%s\\n" "" "0:user info:OK"',
  '  exit 0',
  'fi',
  'exit 0'
].join('\n'))
fs.chmodSync(loggedOutCliPath, 0o755)
fs.writeFileSync(releaseEnvFilePath, [
  'XUNJING_APP_API_BASE_URL=https://api.xingheai.net',
  'XUNJING_TENANT_ID=1',
  'XUNJING_RELEASE_TARGETS=android',
  'XUNJING_ANDROID_PACKAGE_NAME=com.xinghe.xunjing',
  `XUNJING_ANDROID_KEYSTORE=${keystorePath}`,
  'XUNJING_ANDROID_KEY_ALIAS=xicheng-release',
  'XUNJING_ANDROID_KEYSTORE_PASSWORD=secret',
  'XUNJING_ANDROID_KEY_PASSWORD=secret',
  'XUNJING_SKIP_NATIVE_TOOL_CHECK=1'
].join('\n'))
const missingWithReleaseEnvResult = runAudit([
  '--preprod-evidence',
  path.join(missingTempDir, 'missing-preprod.json'),
  '--native-evidence',
  path.join(missingTempDir, 'missing-native.json'),
  '--release-artifact',
  path.join(missingTempDir, 'missing-release.apk'),
  '--skip-remote-parity'
], {
  XUNJING_RELEASE_ENV_FILE: releaseEnvFilePath,
  XUNJING_APP_API_BASE_URL: '',
  XUNJING_TENANT_ID: '',
  XUNJING_RELEASE_TARGETS: '',
  XUNJING_ANDROID_PACKAGE_NAME: '',
  XUNJING_ANDROID_KEYSTORE: '',
  XUNJING_ANDROID_KEY_ALIAS: '',
  XUNJING_ANDROID_KEYSTORE_PASSWORD: '',
  XUNJING_ANDROID_KEY_PASSWORD: '',
  XUNJING_SKIP_NATIVE_TOOL_CHECK: '',
  XUNJING_RELEASE_PREREQ_SKIP_NETWORK: '1',
  HBUILDERX_CLI: loggedInCliPath
})
assert.notEqual(
  missingWithReleaseEnvResult.status,
  0,
  'release candidate audit should still fail when evidence and artifact are missing'
)
const missingWithReleaseEnvAudit = parseAuditJson(missingWithReleaseEnvResult)
assert.equal(missingWithReleaseEnvAudit.gates.nativePackageReadiness.ok, true)
assert.equal(missingWithReleaseEnvAudit.gates.nativePackageReadiness.detail, 'pass')
assert.ok(
  !missingWithReleaseEnvAudit.blockers.some((blocker) => blocker.code === 'native-package-readiness-not-passing'),
  'release candidate audit should not report native package readiness when XUNJING_RELEASE_ENV_FILE has complete signing config'
)
assert.equal(missingWithReleaseEnvAudit.gates.releasePrerequisites.ok, true)
assert.equal(missingWithReleaseEnvAudit.gates.releasePrerequisites.detail, 'pass')

const appResourceArtifactDir = makeArtifactDir({
  'index.html': '<!doctype html><script src="./assets/index.js"></script>',
  'assets/index.js': 'const apiBase="https://api.xingheai.net";const tenantId="1";'
})
const appResourceArtifactResult = runAudit([
  '--preprod-evidence',
  path.join(missingTempDir, 'missing-preprod.json'),
  '--native-evidence',
  path.join(missingTempDir, 'missing-native.json'),
  '--release-artifact',
  appResourceArtifactDir,
  '--skip-remote-parity'
], {
  XUNJING_RELEASE_ENV_FILE: releaseEnvFilePath,
  XUNJING_APP_API_BASE_URL: '',
  XUNJING_TENANT_ID: '',
  XUNJING_RELEASE_TARGETS: '',
  XUNJING_ANDROID_PACKAGE_NAME: '',
  XUNJING_ANDROID_KEYSTORE: '',
  XUNJING_ANDROID_KEY_ALIAS: '',
  XUNJING_ANDROID_KEYSTORE_PASSWORD: '',
  XUNJING_ANDROID_KEY_PASSWORD: '',
  XUNJING_SKIP_NATIVE_TOOL_CHECK: '',
  XUNJING_RELEASE_PREREQ_SKIP_NETWORK: '1',
  HBUILDERX_CLI: loggedInCliPath
})
assert.notEqual(
  appResourceArtifactResult.status,
  0,
  'release candidate audit should reject app resource directories as native release artifacts'
)
const appResourceArtifactAudit = parseAuditJson(appResourceArtifactResult)
assert.equal(appResourceArtifactAudit.gates.nativeReleaseArtifact.exists, true)
assert.equal(appResourceArtifactAudit.gates.nativeReleaseArtifact.ok, false)
assert.equal(
  appResourceArtifactAudit.gates.nativePackageReadiness.skipped,
  false,
  'release candidate audit should not skip native package readiness when only an app resource directory was provided'
)
assert.ok(
  appResourceArtifactAudit.blockers.some((blocker) => blocker.code === 'native-release-artifact-invalid'),
  'release candidate audit should name app resource directories as invalid native release artifacts'
)
assert.match(
  `${appResourceArtifactResult.stderr}\n${appResourceArtifactResult.stdout}`,
  /APK|AAB|IPA|signed|install package|resource directory|安装包/i,
  'release candidate audit should explain that native release artifacts must be signed mobile packages, not resource directories'
)

const prereqFailureResult = runAudit([
  '--preprod-evidence',
  path.join(missingTempDir, 'missing-preprod.json'),
  '--native-evidence',
  path.join(missingTempDir, 'missing-native.json'),
  '--release-artifact',
  path.join(missingTempDir, 'missing-release.apk'),
  '--skip-remote-parity'
], {
  XUNJING_RELEASE_ENV_FILE: releaseEnvFilePath,
  XUNJING_APP_API_BASE_URL: '',
  XUNJING_TENANT_ID: '',
  XUNJING_RELEASE_TARGETS: '',
  XUNJING_ANDROID_PACKAGE_NAME: '',
  XUNJING_ANDROID_KEYSTORE: '',
  XUNJING_ANDROID_KEY_ALIAS: '',
  XUNJING_ANDROID_KEYSTORE_PASSWORD: '',
  XUNJING_ANDROID_KEY_PASSWORD: '',
  XUNJING_SKIP_NATIVE_TOOL_CHECK: '',
  XUNJING_RELEASE_PREREQ_SKIP_NETWORK: '1',
  HBUILDERX_CLI: loggedOutCliPath
})
assert.notEqual(prereqFailureResult.status, 0, 'release candidate audit should fail when prereq doctor finds HBuilderX login missing')
const prereqFailureAudit = parseAuditJson(prereqFailureResult)
assert.equal(prereqFailureAudit.gates.releasePrerequisites.ok, false)
assert.ok(
  prereqFailureAudit.blockers.some((blocker) => blocker.code === 'release-prerequisite-hbuilderx-login-missing'),
  'release candidate audit should surface HBuilderX login prereq blocker'
)
assert.ok(
  prereqFailureAudit.nextActions.some((action) => action.includes('doctor:release:prereqs')),
  'release candidate audit should point operators to the prereq doctor command'
)
assert.equal(
  prereqFailureAudit.nextActions.length,
  new Set(prereqFailureAudit.nextActions).size,
  'release candidate audit should not repeat identical nextActions'
)

const readyTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-audit-ready-'))
const scenarioEvidenceDir = fs.mkdtempSync(path.join(repoRoot, 'qa', 'release-candidate-audit-test-'))
process.on('exit', () => {
  fs.rmSync(scenarioEvidenceDir, { recursive: true, force: true })
})
const jpegEvidenceBytes = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
  0x49, 0x46, 0x00, 0x01, 0xff, 0xd9
])
for (const id of requiredScenarioIds) {
  fs.writeFileSync(path.join(scenarioEvidenceDir, `${id}.jpg`), jpegEvidenceBytes)
}
const artifactDescription = describeArtifact(makeZipArtifact({
  'AndroidManifest.xml': '<manifest package="com.xinghe.xunjing"></manifest>',
  'assets/index.js': 'const apiBase="https://api.xingheai.net";const tenantId="1";'
}))
const preprodPath = path.join(readyTempDir, 'preprod.json')
const nativePath = path.join(readyTempDir, 'native.json')
fs.writeFileSync(preprodPath, `${JSON.stringify(makePreprodEvidence(), null, 2)}\n`)
fs.writeFileSync(nativePath, `${JSON.stringify(makeNativeEvidence({
  ...artifactDescription,
  evidenceDir: scenarioEvidenceDir
}), null, 2)}\n`)

const skippedRemoteParityResult = runAudit([
  '--preprod-evidence',
  preprodPath,
  '--native-evidence',
  nativePath,
  '--release-artifact',
  artifactDescription.artifact,
  '--skip-remote-parity'
], {
  XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
  XUNJING_TENANT_ID: '1'
})
assert.notEqual(
  skippedRemoteParityResult.status,
  0,
  'release candidate audit should not allow GO when remote parity is skipped without an explicit test bypass'
)
const skippedRemoteParityAudit = parseAuditJson(skippedRemoteParityResult)
assert.equal(skippedRemoteParityAudit.status, 'NO_GO')
assert.equal(skippedRemoteParityAudit.gates.git.ok, false)
assert.ok(
  skippedRemoteParityAudit.blockers.some((blocker) => blocker.code === 'git-remote-parity-skipped'),
  'release candidate audit should name skipped remote parity as a launch blocker'
)

const unsafeTestBypassResult = runAudit([
  '--preprod-evidence',
  preprodPath,
  '--native-evidence',
  nativePath,
  '--release-artifact',
  artifactDescription.artifact,
  '--skip-remote-parity'
], {
  XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
  XUNJING_TENANT_ID: '1',
  XUNJING_RELEASE_AUDIT_ALLOW_TEST_BYPASS: '1'
})
assert.notEqual(
  unsafeTestBypassResult.status,
  0,
  'release candidate audit should not allow a test bypass unless explicit test mode is also enabled'
)
const unsafeTestBypassAudit = parseAuditJson(unsafeTestBypassResult)
assert.equal(unsafeTestBypassAudit.status, 'NO_GO')
assert.equal(unsafeTestBypassAudit.gates.git.testBypass, false)
assert.ok(
  unsafeTestBypassAudit.blockers.some((blocker) => blocker.code === 'release-audit-test-bypass-without-test-mode'),
  'release candidate audit should name unsafe test bypass configuration as a launch blocker'
)

const readyResult = runAudit([
  '--preprod-evidence',
  preprodPath,
  '--native-evidence',
  nativePath,
  '--release-artifact',
  artifactDescription.artifact,
  '--skip-remote-parity'
], {
  XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
  XUNJING_TENANT_ID: '1',
  XUNJING_RELEASE_AUDIT_ALLOW_TEST_BYPASS: '1',
  XUNJING_RELEASE_AUDIT_TEST_MODE: '1'
})
assert.equal(readyResult.status, 0, `release candidate audit should pass with complete matching evidence: ${readyResult.stderr || readyResult.stdout}`)
const readyAudit = parseAuditJson(readyResult)
assert.equal(readyAudit.status, 'GO')
assert.equal(readyAudit.blockers.length, 0)
assert.equal(readyAudit.gates.launchEvidence.ok, true)
assert.equal(readyAudit.gates.nativeEvidence.ok, true)
assert.equal(readyAudit.gates.releaseArtifactScan.ok, true)
assert.equal(readyAudit.gates.nativePackageReadiness.skipped, true)
assert.equal(readyAudit.gates.releasePrerequisites.skipped, true)

const dirtyWorktreeResult = runAudit([
  '--preprod-evidence',
  preprodPath,
  '--native-evidence',
  nativePath,
  '--release-artifact',
  artifactDescription.artifact
], {
  XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
  XUNJING_TENANT_ID: '1',
  XUNJING_RELEASE_AUDIT_REMOTE_REFS: 'HEAD'
})
assert.notEqual(
  dirtyWorktreeResult.status,
  0,
  'release candidate audit should not allow GO while the git worktree has uncommitted evidence or source changes'
)
const dirtyWorktreeAudit = parseAuditJson(dirtyWorktreeResult)
assert.equal(dirtyWorktreeAudit.status, 'NO_GO')
assert.equal(dirtyWorktreeAudit.gates.git.ok, false)
assert.equal(dirtyWorktreeAudit.gates.git.worktreeClean, false)
assert.ok(
  dirtyWorktreeAudit.blockers.some((blocker) => blocker.code === 'git-worktree-dirty'),
  'release candidate audit should name dirty git worktree as a launch blocker'
)

const mismatchedArtifactDescription = describeArtifact(makeZipArtifact({
  'AndroidManifest.xml': '<manifest package="com.xinghe.xunjing"></manifest>',
  'assets/index.js': 'const apiBase="https://api.xingheai.net";const tenantId="1";const build="different-release-artifact";'
}, 'xicheng-different-release.apk'))
const mismatchedArtifactResult = runAudit([
  '--preprod-evidence',
  preprodPath,
  '--native-evidence',
  nativePath,
  '--release-artifact',
  mismatchedArtifactDescription.artifact,
  '--skip-remote-parity'
], {
  XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
  XUNJING_TENANT_ID: '1'
})
assert.notEqual(
  mismatchedArtifactResult.status,
  0,
  'release candidate audit should reject a CLI release artifact that differs from native evidence build.artifact'
)
const mismatchedArtifactAudit = parseAuditJson(mismatchedArtifactResult)
assert.equal(mismatchedArtifactAudit.status, 'NO_GO')
assert.ok(
  mismatchedArtifactAudit.blockers.some((blocker) => blocker.code === 'release-artifact-native-evidence-mismatch'),
  'release candidate audit should name the native evidence artifact mismatch blocker'
)
assert.match(
  `${mismatchedArtifactResult.stderr}\n${mismatchedArtifactResult.stdout}`,
  /release artifact|build\.artifact|native evidence|same candidate/i,
  'release candidate audit should explain that the scanned artifact must match native evidence build.artifact'
)
