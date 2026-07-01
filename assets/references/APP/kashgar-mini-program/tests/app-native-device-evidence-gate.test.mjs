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
const freshTimestamp = new Date().toISOString()

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
  'xiaojing-blocked-answer',
  'travelogue-draft-generated',
  'release 包',
  'artifactSha256',
  'artifactSizeBytes',
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
  appApiBaseUrl: 'https://preprod.example.com',
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
    evidenceRef: `qa/native/${id}.jpg`,
    notes: `${id} verified on physical device`
  }))
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
