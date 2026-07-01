import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const scriptPath = path.join(root, 'scripts', 'verify_mobile_launch_evidence_bundle.mjs')
const releaseChecklistPath = path.join(root, 'docs', 'xicheng-app-release-checklist.md')
const preprodRunbookPath = path.join(root, 'docs', 'xicheng-app-preprod-evidence-runbook.md')

const currentCommit = spawnSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8'
}).stdout.trim()

const artifactTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-launch-artifact-'))
const artifactPath = path.join(artifactTempDir, 'xicheng-release.apk')
const artifactBytes = Buffer.from('signed release apk placeholder for launch bundle validator tests\n', 'utf8')
fs.writeFileSync(artifactPath, artifactBytes)
const artifactSha256 = crypto.createHash('sha256').update(artifactBytes).digest('hex')
const freshTimestamp = new Date().toISOString()

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

const makePreprodEvidence = (overrides = {}) => {
  const { summary: summaryOverrides = {}, checks: extraChecks = [], ...topLevelOverrides } = overrides
  return {
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
      failedChecks: 0,
      ...summaryOverrides
    },
    checks: [
    {
      name: 'live-xicheng-ai-chat-sourced',
      ok: true,
      summary: { safetyStatus: 'PASSED', sourceCount: 1 }
    },
    {
      name: 'live-xicheng-ai-chat-blocked',
      ok: true,
      summary: { safetyStatus: 'BLOCKED', sourceCount: 0 }
    },
    {
      name: 'live-xicheng-trigger-baitasi',
      ok: true,
      summary: { poiCode: 'xicheng-baitasi', sourceCount: 1 }
    },
    {
      name: 'live-xicheng-trigger-gongwangfu',
      ok: true,
      summary: { poiCode: 'xicheng-gongwangfu', sourceCount: 1 }
    },
    {
      name: 'live-xicheng-trigger-planetarium',
      ok: true,
      summary: { poiCode: 'xicheng-planetarium', sourceCount: 1 }
    },
      ...extraChecks
    ],
    ...topLevelOverrides
  }
}

const makeNativeEvidence = (overrides = {}) => ({
  artifactType: 'xicheng-native-device-evidence',
  createdAt: freshTimestamp,
  branch: 'feature/xicheng-p0',
  commit: currentCommit,
  appApiBaseUrl: 'https://api.example.com',
  tenantId: '1',
  build: {
    mode: 'release',
    artifact: artifactPath,
    artifactSha256,
    artifactSizeBytes: artifactBytes.length
  },
  releaseTargets: ['android'],
  devices: [
    {
      platform: 'android',
      model: 'Pixel 8',
      osVersion: 'Android 15',
      appVersion: '1.0.0'
    }
  ],
  scenarios: requiredScenarioIds.map((id) => ({
    id,
    platform: 'android',
    status: 'PASS',
    evidenceRef: `qa/native/${id}.jpg`
  })),
  ...overrides
})

const writeJson = (dir, fileName, payload) => {
  const filePath = path.join(dir, fileName)
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`)
  return filePath
}

const runBundleGate = (preprodEvidence, nativeEvidence) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-launch-evidence-'))
  const preprodPath = writeJson(tempDir, 'preprod.json', preprodEvidence)
  const nativePath = writeJson(tempDir, 'native.json', nativeEvidence)

  return spawnSync(
    process.execPath,
    [
      scriptPath,
      '--preprod-evidence',
      preprodPath,
      '--native-evidence',
      nativePath
    ],
    {
      cwd: root,
      encoding: 'utf8'
    }
  )
}

assert.ok(
  fs.existsSync(scriptPath),
  'APP should provide scripts/verify_mobile_launch_evidence_bundle.mjs for final mobile launch evidence validation'
)

assert.ok(
  (packageJson.scripts?.['verify:launch:evidence'] || '').includes('node scripts/verify_mobile_launch_evidence_bundle.mjs'),
  'APP package should expose npm run verify:launch:evidence'
)

for (const required of [
  'verify:launch:evidence',
  'qa/xicheng-app-readiness-evidence.json',
  'qa/xicheng-native-device-evidence.json',
  'baseUrl',
  'tenantId',
  'commit',
  'checkedAt',
  'createdAt',
  '72 小时',
  '真机证据',
  '预发证据'
]) {
  assert.ok(
    fs.readFileSync(releaseChecklistPath, 'utf8').includes(required),
    `Release checklist should mention mobile launch evidence bundle item ${required}`
  )
  assert.ok(
    fs.readFileSync(preprodRunbookPath, 'utf8').includes(required),
    `Preprod runbook should mention mobile launch evidence bundle item ${required}`
  )
}

const passingResult = runBundleGate(makePreprodEvidence(), makeNativeEvidence())
assert.equal(
  passingResult.status,
  0,
  `launch evidence bundle validator should accept matching preprod and native evidence: ${passingResult.stderr || passingResult.stdout}`
)
assert.match(
  passingResult.stdout,
  /"ok": true/,
  'launch evidence bundle validator should print a machine-readable OK summary'
)

const mismatchedGatewayResult = runBundleGate(
  makePreprodEvidence({ summary: { baseUrl: 'https://preprod.example.com' } }),
  makeNativeEvidence({ appApiBaseUrl: 'https://api.example.com' })
)
assert.notEqual(
  mismatchedGatewayResult.status,
  0,
  'launch evidence bundle validator should reject mismatched preprod and native API gateways'
)
assert.match(
  `${mismatchedGatewayResult.stderr}\n${mismatchedGatewayResult.stdout}`,
  /appApiBaseUrl.*baseUrl/i,
  'launch evidence bundle validator should explain the API gateway mismatch'
)

const staleCommitResult = runBundleGate(
  makePreprodEvidence(),
  makeNativeEvidence({ commit: 'deadbeef' })
)
assert.notEqual(
  staleCommitResult.status,
  0,
  'launch evidence bundle validator should reject native evidence from a stale commit'
)
assert.match(
  `${staleCommitResult.stderr}\n${staleCommitResult.stdout}`,
  /commit.*HEAD/i,
  'launch evidence bundle validator should explain that native evidence commit must match HEAD'
)

const missingBlockedResult = runBundleGate(
  {
    ...makePreprodEvidence(),
    checks: makePreprodEvidence().checks.filter((check) => check.name !== 'live-xicheng-ai-chat-blocked')
  },
  makeNativeEvidence()
)
assert.notEqual(
  missingBlockedResult.status,
  0,
  'launch evidence bundle validator should reject preprod evidence without the BLOCKED-source guard check'
)
assert.match(
  `${missingBlockedResult.stderr}\n${missingBlockedResult.stdout}`,
  /live-xicheng-ai-chat-blocked/,
  'launch evidence bundle validator should name the missing BLOCKED-source guard check'
)

const stalePreprodResult = runBundleGate(
  makePreprodEvidence({ checkedAt: '2000-01-01T00:00:00.000Z' }),
  makeNativeEvidence()
)
assert.notEqual(
  stalePreprodResult.status,
  0,
  'launch evidence bundle validator should reject stale preprod readiness evidence'
)
assert.match(
  `${stalePreprodResult.stderr}\n${stalePreprodResult.stdout}`,
  /checkedAt|fresh|72|过期|新鲜度/i,
  'launch evidence bundle validator should explain stale preprod evidence rejection'
)

const staleNativeResult = runBundleGate(
  makePreprodEvidence(),
  makeNativeEvidence({ createdAt: '2000-01-01T00:00:00.000Z' })
)
assert.notEqual(
  staleNativeResult.status,
  0,
  'launch evidence bundle validator should reject stale native device evidence'
)
assert.match(
  `${staleNativeResult.stderr}\n${staleNativeResult.stdout}`,
  /createdAt|fresh|72|过期|新鲜度/i,
  'launch evidence bundle validator should explain stale native evidence rejection'
)
