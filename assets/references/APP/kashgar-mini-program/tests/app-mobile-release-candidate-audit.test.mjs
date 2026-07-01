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

const describeArtifact = (artifactPath) => {
  const artifactBytes = fs.readFileSync(artifactPath)
  return {
    artifact: artifactPath,
    artifactSha256: crypto.createHash('sha256').update(artifactBytes).digest('hex'),
    artifactSizeBytes: artifactBytes.length
  }
}

const makePreprodEvidence = () => ({
  artifactType: 'xunjing-platform-readiness',
  ok: true,
  checkedAt: freshTimestamp,
  summary: {
    baseUrl: 'https://api.example.com',
    tenantId: '1',
    includeXichengAppCheck: true,
    includeXichengTriggerCheck: true,
    totalChecks: 20,
    passedChecks: 20,
    failedChecks: 0
  },
  checks: [
    { name: 'live-xicheng-ai-chat-sourced', ok: true, summary: { safetyStatus: 'PASSED', sourceCount: 1 } },
    { name: 'live-xicheng-ai-chat-blocked', ok: true, summary: { safetyStatus: 'BLOCKED', sourceCount: 0 } },
    { name: 'live-xicheng-trigger-baitasi', ok: true, summary: { poiCode: 'xicheng-baitasi', sourceCount: 1 } },
    { name: 'live-xicheng-trigger-gongwangfu', ok: true, summary: { poiCode: 'xicheng-gongwangfu', sourceCount: 1 } },
    { name: 'live-xicheng-trigger-planetarium', ok: true, summary: { poiCode: 'xicheng-planetarium', sourceCount: 1 } },
    {
      name: 'live-xicheng-scan-resolve',
      ok: true,
      summary: {
        tenantId: '1',
        packageCode: 'XICHENG-MAP-001',
        targetPath: '/pages/map/detail?packageCode=XICHENG-MAP-001&sceneCode=QR-XICHENG-MAP-001'
      }
    }
  ]
})

const makeNativeEvidence = ({ artifact, artifactSha256, artifactSizeBytes, evidenceDir }) => ({
  artifactType: 'xicheng-native-device-evidence',
  createdAt: freshTimestamp,
  branch: 'feature/xicheng-p0',
  commit: currentCommit,
  appApiBaseUrl: 'https://api.example.com',
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

const keystorePath = path.join(missingTempDir, 'xicheng-release.keystore')
fs.writeFileSync(keystorePath, 'placeholder keystore bytes for release audit readiness\n')
const releaseEnvFilePath = path.join(missingTempDir, 'xicheng-release.env')
fs.writeFileSync(releaseEnvFilePath, [
  'XUNJING_APP_API_BASE_URL=https://api.example.com',
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
  XUNJING_SKIP_NATIVE_TOOL_CHECK: ''
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

const readyTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-audit-ready-'))
const scenarioEvidenceDir = fs.mkdtempSync(path.join(repoRoot, 'qa', 'release-candidate-audit-test-'))
process.on('exit', () => {
  fs.rmSync(scenarioEvidenceDir, { recursive: true, force: true })
})
for (const id of requiredScenarioIds) {
  fs.writeFileSync(path.join(scenarioEvidenceDir, `${id}.jpg`), `${id} physical-device proof\n`)
}
const artifactDescription = describeArtifact(makeZipArtifact({
  'assets/index.js': 'const apiBase="https://api.example.com";const tenantId="1";'
}))
const preprodPath = path.join(readyTempDir, 'preprod.json')
const nativePath = path.join(readyTempDir, 'native.json')
fs.writeFileSync(preprodPath, `${JSON.stringify(makePreprodEvidence(), null, 2)}\n`)
fs.writeFileSync(nativePath, `${JSON.stringify(makeNativeEvidence({
  ...artifactDescription,
  evidenceDir: scenarioEvidenceDir
}), null, 2)}\n`)

const readyResult = runAudit([
  '--preprod-evidence',
  preprodPath,
  '--native-evidence',
  nativePath,
  '--release-artifact',
  artifactDescription.artifact,
  '--skip-remote-parity'
], {
  XUNJING_APP_API_BASE_URL: 'https://api.example.com',
  XUNJING_TENANT_ID: '1'
})
assert.equal(readyResult.status, 0, `release candidate audit should pass with complete matching evidence: ${readyResult.stderr || readyResult.stdout}`)
const readyAudit = parseAuditJson(readyResult)
assert.equal(readyAudit.status, 'GO')
assert.equal(readyAudit.blockers.length, 0)
assert.equal(readyAudit.gates.launchEvidence.ok, true)
assert.equal(readyAudit.gates.nativeEvidence.ok, true)
assert.equal(readyAudit.gates.releaseArtifactScan.ok, true)
assert.equal(readyAudit.gates.nativePackageReadiness.skipped, true)
