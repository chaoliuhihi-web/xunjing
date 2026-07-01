import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const scriptPath = path.join(root, 'scripts', 'verify_native_device_evidence.mjs')
const releaseChecklist = fs.readFileSync(path.join(root, 'docs', 'xicheng-app-release-checklist.md'), 'utf8')
const preprodRunbook = fs.readFileSync(path.join(root, 'docs', 'xicheng-app-preprod-evidence-runbook.md'), 'utf8')

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

const artifactTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-release-artifact-'))
const artifactPath = path.join(artifactTempDir, 'xicheng-release.apk')
const artifactBytes = Buffer.from('signed release apk placeholder for validator tests\n', 'utf8')
fs.writeFileSync(artifactPath, artifactBytes)
const artifactSha256 = crypto.createHash('sha256').update(artifactBytes).digest('hex')
const iosArtifactPath = path.join(artifactTempDir, 'xicheng-release.ipa')
const iosArtifactBytes = Buffer.from('signed release ipa placeholder for validator tests\n', 'utf8')
fs.writeFileSync(iosArtifactPath, iosArtifactBytes)
const iosArtifactSha256 = crypto.createHash('sha256').update(iosArtifactBytes).digest('hex')
const nonMobileArtifactPath = path.join(artifactTempDir, 'xicheng-release.txt')
const nonMobileArtifactBytes = Buffer.from('not a mobile install package\n', 'utf8')
fs.writeFileSync(nonMobileArtifactPath, nonMobileArtifactBytes)
const nonMobileArtifactSha256 = crypto.createHash('sha256').update(nonMobileArtifactBytes).digest('hex')
const freshTimestamp = new Date().toISOString()
const repoRoot = spawnSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: root,
  encoding: 'utf8'
}).stdout.trim()
const qaEvidenceDir = fs.mkdtempSync(path.join(repoRoot, 'qa', 'native-evidence-test-'))
const outsideQaEvidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-native-scenario-evidence-'))
process.on('exit', () => {
  fs.rmSync(qaEvidenceDir, { recursive: true, force: true })
})

assert.ok(
  fs.existsSync(scriptPath),
  'APP should provide scripts/verify_native_device_evidence.mjs for real-device launch evidence validation'
)

assert.ok(
  (packageJson.scripts?.['verify:native:evidence'] || '').includes('node scripts/verify_native_device_evidence.mjs'),
  'APP package should expose npm run verify:native:evidence'
)

assert.ok(
  (packageJson.scripts?.['verify:native:evidence'] || '').includes('qa/xicheng-native-device-evidence.json'),
  'native evidence script should default to the root QA evidence file'
)

for (const required of [
  'npm run verify:native:evidence',
  'qa/xicheng-native-device-evidence.json',
  '真机',
  'camera-photo-recognition',
  'gps-recognition-permission',
  'scan-entry-map-detail',
  '/pages/map/detail',
  'XICHENG-MAP-001',
  'xiaojing-blocked-answer',
  'travelogue-draft-generated',
  'release 包',
  'artifactSha256',
  'artifactSizeBytes',
  'evidenceRef',
  '截图',
  '录屏',
  'qa/',
  'createdAt',
  '72 小时'
]) {
  assert.ok(releaseChecklist.includes(required), `Release checklist should mention native evidence item ${required}`)
  assert.ok(preprodRunbook.includes(required), `Preprod runbook should mention native evidence item ${required}`)
}

const baseEvidence = {
  artifactType: 'xicheng-native-device-evidence',
  createdAt: freshTimestamp,
  branch: 'feature/xicheng-p0',
  commit: 'dd3b7083',
  appApiBaseUrl: 'https://preprod.xingheai.net',
  tenantId: '1',
  releaseTargets: ['android'],
  build: {
    mode: 'release',
    artifact: artifactPath,
    artifactSha256,
    artifactSizeBytes: artifactBytes.length,
    command: 'npm run build:app:release'
  },
  devices: [
    {
      platform: 'android',
      model: 'Pixel 8',
      osVersion: 'Android 15',
      appVersion: '1.0.0',
      installer: 'HBuilderX custom base'
    }
  ],
  scenarios: requiredScenarioIds.map((id) => ({
    id,
    platform: 'android',
    status: 'PASS',
    evidenceRef: path.relative(repoRoot, path.join(qaEvidenceDir, `${id}.jpg`)),
    notes: id === 'scan-entry-map-detail'
      ? 'Scanned QR-XICHENG-MAP-001 on physical device and landed on /pages/map/detail?packageCode=XICHENG-MAP-001'
      : `${id} verified on physical device`
  }))
}

for (const scenario of baseEvidence.scenarios) {
  fs.writeFileSync(
    path.resolve(repoRoot, scenario.evidenceRef),
    `${scenario.id} physical-device screenshot or recording placeholder\n`
  )
}

const runValidator = (payload) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-native-evidence-'))
  const evidencePath = path.join(tempDir, 'evidence.json')
  fs.writeFileSync(evidencePath, JSON.stringify(payload, null, 2))
  return spawnSync(process.execPath, [scriptPath, evidencePath], {
    cwd: root,
    encoding: 'utf8'
  })
}

assert.equal(
  runValidator(baseEvidence).status,
  0,
  'native evidence validator should accept complete physical-device evidence'
)

const missingBlockedScenario = {
  ...baseEvidence,
  scenarios: baseEvidence.scenarios.filter((scenario) => scenario.id !== 'xiaojing-blocked-answer')
}
const missingBlockedResult = runValidator(missingBlockedScenario)
assert.notEqual(missingBlockedResult.status, 0, 'native evidence validator should reject missing BLOCKED answer proof')
assert.match(
  `${missingBlockedResult.stderr}\n${missingBlockedResult.stdout}`,
  /xiaojing-blocked-answer/,
  'native evidence validator should name the missing BLOCKED answer proof'
)

const missingScanEntryScenario = {
  ...baseEvidence,
  scenarios: baseEvidence.scenarios.filter((scenario) => scenario.id !== 'scan-entry-map-detail')
}
const missingScanEntryResult = runValidator(missingScanEntryScenario)
assert.notEqual(missingScanEntryResult.status, 0, 'native evidence validator should reject missing scan entry proof')
assert.match(
  `${missingScanEntryResult.stderr}\n${missingScanEntryResult.stdout}`,
  /scan-entry-map-detail/,
  'native evidence validator should name the missing scan entry proof'
)

const wrongScanEntryNotesResult = runValidator({
  ...baseEvidence,
  scenarios: baseEvidence.scenarios.map((scenario) => (
    scenario.id === 'scan-entry-map-detail'
      ? { ...scenario, notes: 'Scanned entry but did not record the map detail target' }
      : scenario
  ))
})
assert.notEqual(
  wrongScanEntryNotesResult.status,
  0,
  'native evidence validator should reject scan entry proof without the expected map detail target'
)
assert.match(
  `${wrongScanEntryNotesResult.stderr}\n${wrongScanEntryNotesResult.stdout}`,
  /scan-entry-map-detail|\/pages\/map\/detail|XICHENG-MAP-001/,
  'native evidence validator should explain the scan entry target requirement'
)

const missingEvidenceRefFileResult = runValidator({
  ...baseEvidence,
  scenarios: baseEvidence.scenarios.map((scenario) => (
    scenario.id === 'camera-photo-recognition'
      ? { ...scenario, evidenceRef: path.relative(repoRoot, path.join(qaEvidenceDir, 'missing-camera-photo-recognition.jpg')) }
      : scenario
  ))
})
assert.notEqual(
  missingEvidenceRefFileResult.status,
  0,
  'native evidence validator should reject scenario evidenceRef paths that do not exist'
)
assert.match(
  `${missingEvidenceRefFileResult.stderr}\n${missingEvidenceRefFileResult.stdout}`,
  /camera-photo-recognition|evidenceRef|not found|截图|录屏/i,
  'native evidence validator should name the missing scenario evidence file'
)

const emptyEvidenceRefFile = path.join(qaEvidenceDir, 'empty-xiaojing-blocked-answer.jpg')
fs.writeFileSync(emptyEvidenceRefFile, '')
const emptyEvidenceRefFileResult = runValidator({
  ...baseEvidence,
  scenarios: baseEvidence.scenarios.map((scenario) => (
    scenario.id === 'xiaojing-blocked-answer'
      ? { ...scenario, evidenceRef: emptyEvidenceRefFile }
      : scenario
  ))
})
assert.notEqual(
  emptyEvidenceRefFileResult.status,
  0,
  'native evidence validator should reject empty scenario evidence files'
)
assert.match(
  `${emptyEvidenceRefFileResult.stderr}\n${emptyEvidenceRefFileResult.stdout}`,
  /xiaojing-blocked-answer|evidenceRef|empty|截图|录屏/i,
  'native evidence validator should explain empty scenario evidence file rejection'
)

const outsideQaEvidenceRefFile = path.join(outsideQaEvidenceDir, 'recording-start-stop.jpg')
fs.writeFileSync(outsideQaEvidenceRefFile, 'recording-start-stop proof outside qa should be rejected\n')
const outsideQaEvidenceRefResult = runValidator({
  ...baseEvidence,
  scenarios: baseEvidence.scenarios.map((scenario) => (
    scenario.id === 'recording-start-stop'
      ? { ...scenario, evidenceRef: outsideQaEvidenceRefFile }
      : scenario
  ))
})
assert.notEqual(
  outsideQaEvidenceRefResult.status,
  0,
  'native evidence validator should reject evidenceRef files outside the repository qa directory'
)
assert.match(
  `${outsideQaEvidenceRefResult.stderr}\n${outsideQaEvidenceRefResult.stdout}`,
  /recording-start-stop|evidenceRef|qa\//i,
  'native evidence validator should explain that scenario evidence must be stored under qa/'
)

const localGatewayResult = runValidator({
  ...baseEvidence,
  appApiBaseUrl: 'https://localhost'
})
assert.notEqual(localGatewayResult.status, 0, 'native evidence validator should reject local HTTPS gateways')
assert.match(
  `${localGatewayResult.stderr}\n${localGatewayResult.stdout}`,
  /non-local HTTPS/,
  'native evidence validator should explain local HTTPS gateway rejection'
)

const invalidTenantResult = runValidator({
  ...baseEvidence,
  tenantId: 'tenant-prod'
})
assert.notEqual(invalidTenantResult.status, 0, 'native evidence validator should reject non-numeric tenant ids')
assert.match(
  `${invalidTenantResult.stderr}\n${invalidTenantResult.stdout}`,
  /tenant.*positive integer|正整数/i,
  'native evidence validator should explain tenant id validation'
)

const missingDeviceResult = runValidator({
  ...baseEvidence,
  devices: []
})
assert.notEqual(missingDeviceResult.status, 0, 'native evidence validator should require a physical device record')
assert.match(
  `${missingDeviceResult.stderr}\n${missingDeviceResult.stdout}`,
  /device.*android/i,
  'native evidence validator should name the missing release target device'
)

const wrongHashResult = runValidator({
  ...baseEvidence,
  build: {
    ...baseEvidence.build,
    artifactSha256: '0'.repeat(64)
  }
})
assert.notEqual(wrongHashResult.status, 0, 'native evidence validator should reject a release artifact hash mismatch')
assert.match(
  `${wrongHashResult.stderr}\n${wrongHashResult.stdout}`,
  /artifactSha256|SHA256/i,
  'native evidence validator should explain the release artifact hash mismatch'
)

const missingArtifactResult = runValidator({
  ...baseEvidence,
  build: {
    ...baseEvidence.build,
    artifact: path.join(artifactTempDir, 'missing-release.apk')
  }
})
assert.notEqual(missingArtifactResult.status, 0, 'native evidence validator should reject evidence whose release artifact is missing')
assert.match(
  `${missingArtifactResult.stderr}\n${missingArtifactResult.stdout}`,
  /artifact.*not found|release artifact/i,
  'native evidence validator should explain the missing release artifact'
)

const invalidArtifactTypeResult = runValidator({
  ...baseEvidence,
  build: {
    ...baseEvidence.build,
    artifact: nonMobileArtifactPath,
    artifactSha256: nonMobileArtifactSha256,
    artifactSizeBytes: nonMobileArtifactBytes.length
  }
})
assert.notEqual(invalidArtifactTypeResult.status, 0, 'native evidence validator should reject non-mobile release artifacts')
assert.match(
  `${invalidArtifactTypeResult.stderr}\n${invalidArtifactTypeResult.stdout}`,
  /APK|AAB|IPA|install package|安装包/i,
  'native evidence validator should explain release artifact type validation'
)

const invalidReleaseTargetResult = runValidator({
  ...baseEvidence,
  releaseTargets: ['web'],
  devices: [
    {
      platform: 'web',
      model: 'Chrome desktop',
      osVersion: 'macOS',
      appVersion: '1.0.0'
    }
  ],
  scenarios: baseEvidence.scenarios.map((scenario) => ({
    ...scenario,
    platform: 'web'
  }))
})
assert.notEqual(invalidReleaseTargetResult.status, 0, 'native evidence validator should reject non-mobile release targets')
assert.match(
  `${invalidReleaseTargetResult.stderr}\n${invalidReleaseTargetResult.stdout}`,
  /releaseTargets|platform|android|ios|手机/i,
  'native evidence validator should explain supported mobile release targets'
)

const iosTargetWithApkResult = runValidator({
  ...baseEvidence,
  releaseTargets: ['ios'],
  devices: [
    {
      platform: 'ios',
      model: 'iPhone 15',
      osVersion: 'iOS 18',
      appVersion: '1.0.0'
    }
  ],
  scenarios: baseEvidence.scenarios.map((scenario) => ({
    ...scenario,
    platform: 'ios'
  }))
})
assert.notEqual(iosTargetWithApkResult.status, 0, 'native evidence validator should reject iOS targets with APK artifacts')
assert.match(
  `${iosTargetWithApkResult.stderr}\n${iosTargetWithApkResult.stdout}`,
  /ios|IPA|artifact|安装包/i,
  'native evidence validator should explain iOS artifact matching'
)

const androidTargetWithIpaResult = runValidator({
  ...baseEvidence,
  build: {
    ...baseEvidence.build,
    artifact: iosArtifactPath,
    artifactSha256: iosArtifactSha256,
    artifactSizeBytes: iosArtifactBytes.length
  }
})
assert.notEqual(androidTargetWithIpaResult.status, 0, 'native evidence validator should reject Android targets with IPA artifacts')
assert.match(
  `${androidTargetWithIpaResult.stderr}\n${androidTargetWithIpaResult.stdout}`,
  /android|APK|AAB|artifact|安装包/i,
  'native evidence validator should explain Android artifact matching'
)

const mixedTargetsResult = runValidator({
  ...baseEvidence,
  releaseTargets: ['android', 'ios'],
  devices: [
    ...baseEvidence.devices,
    {
      platform: 'ios',
      model: 'iPhone 15',
      osVersion: 'iOS 18',
      appVersion: '1.0.0'
    }
  ]
})
assert.notEqual(mixedTargetsResult.status, 0, 'native evidence validator should reject mixed platform targets for one artifact')
assert.match(
  `${mixedTargetsResult.stderr}\n${mixedTargetsResult.stdout}`,
  /single release artifact|one platform|android|ios|安装包/i,
  'native evidence validator should explain why mixed targets need separate evidence files'
)

const staleEvidenceResult = runValidator({
  ...baseEvidence,
  createdAt: '2000-01-01T00:00:00.000Z'
})
assert.notEqual(staleEvidenceResult.status, 0, 'native evidence validator should reject stale physical-device evidence')
assert.match(
  `${staleEvidenceResult.stderr}\n${staleEvidenceResult.stdout}`,
  /createdAt|fresh|72|过期|新鲜度/i,
  'native evidence validator should explain stale evidence rejection'
)
