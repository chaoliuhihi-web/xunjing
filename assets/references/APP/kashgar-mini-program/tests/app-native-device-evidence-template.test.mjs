import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const scriptPath = path.join(root, 'scripts', 'create_native_device_evidence_template.mjs')
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

assert.ok(
  fs.existsSync(scriptPath),
  'APP should provide scripts/create_native_device_evidence_template.mjs for release candidate evidence initialization'
)

assert.ok(
  (packageJson.scripts?.['prepare:native:evidence'] || '').includes('node scripts/create_native_device_evidence_template.mjs'),
  'APP package should expose npm run prepare:native:evidence'
)

for (const required of [
  'npm run prepare:native:evidence',
  'XUNJING_RELEASE_ARTIFACT',
  'qa/xicheng-native-device-evidence.json',
  'artifactSha256',
  'artifactSizeBytes',
  'scan-entry-map-detail',
  '/pages/map/detail',
  'XICHENG-MAP-001',
  'qa/native',
  'TODO',
  '不得把模板当成通过证据'
]) {
  assert.ok(releaseChecklist.includes(required), `Release checklist should mention native evidence template item ${required}`)
  assert.ok(preprodRunbook.includes(required), `Preprod runbook should mention native evidence template item ${required}`)
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-native-template-'))
const artifactPath = path.join(tempDir, 'xicheng-release.apk')
const artifactBytes = Buffer.from('release candidate apk bytes for native template test\n', 'utf8')
fs.writeFileSync(artifactPath, artifactBytes)
const artifactSha256 = crypto.createHash('sha256').update(artifactBytes).digest('hex')
const outputPath = path.join(tempDir, 'native-evidence.json')

const result = spawnSync(
  process.execPath,
  [
    scriptPath,
    '--artifact',
    artifactPath,
    '--output',
    outputPath,
    '--platform',
    'android'
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      XUNJING_APP_API_BASE_URL: 'https://api.example.com',
      XUNJING_TENANT_ID: '1'
    },
    encoding: 'utf8'
  }
)

assert.equal(
  result.status,
  0,
  `native evidence template generator should create a release candidate template: ${result.stderr || result.stdout}`
)

const generated = JSON.parse(fs.readFileSync(outputPath, 'utf8'))
assert.equal(generated.artifactType, 'xicheng-native-device-evidence')
assert.equal(generated.branch, 'feature/xicheng-p0')
assert.equal(generated.commit, currentCommit)
assert.equal(generated.appApiBaseUrl, 'https://api.example.com')
assert.equal(generated.tenantId, '1')
assert.deepEqual(generated.releaseTargets, ['android'])
assert.equal(generated.build.mode, 'release')
assert.equal(generated.build.artifact, artifactPath)
assert.equal(generated.build.artifactSha256, artifactSha256)
assert.equal(generated.build.artifactSizeBytes, artifactBytes.length)
assert.equal(generated.devices.length, 1)
assert.equal(generated.devices[0].platform, 'android')
assert.equal(generated.devices[0].model, 'TODO physical device model')
assert.deepEqual(generated.scenarios.map((scenario) => scenario.id), requiredScenarioIds)
assert.ok(
  generated.scenarios.every((scenario) => scenario.evidenceRef === `qa/native/${scenario.id}.jpg`),
  'native evidence template should suggest durable qa/native evidenceRef paths'
)
const generatedScanEntryScenario = generated.scenarios.find((scenario) => scenario.id === 'scan-entry-map-detail')
assert.ok(
  generatedScanEntryScenario.notes.includes('/pages/map/detail') &&
    generatedScanEntryScenario.notes.includes('XICHENG-MAP-001'),
  'native evidence template should tell testers to prove scan entry lands on the Xicheng map detail page'
)
assert.ok(
  generated.scenarios.every((scenario) => scenario.status === 'TODO'),
  'native evidence template generator must not mark scenarios PASS before real-device verification'
)

const overwriteResult = spawnSync(
  process.execPath,
  [scriptPath, '--artifact', artifactPath, '--output', outputPath],
  {
    cwd: root,
    env: {
      ...process.env,
      XUNJING_APP_API_BASE_URL: 'https://api.example.com',
      XUNJING_TENANT_ID: '1'
    },
    encoding: 'utf8'
  }
)
assert.notEqual(overwriteResult.status, 0, 'native evidence template generator should not overwrite existing evidence by default')
assert.match(
  `${overwriteResult.stderr}\n${overwriteResult.stdout}`,
  /already exists|--force/i,
  'native evidence template generator should explain how to intentionally overwrite a template'
)

const localGatewayResult = spawnSync(
  process.execPath,
  [scriptPath, '--artifact', artifactPath, '--output', path.join(tempDir, 'local.json'), '--force'],
  {
    cwd: root,
    env: {
      ...process.env,
      XUNJING_APP_API_BASE_URL: 'http://127.0.0.1:48082',
      XUNJING_TENANT_ID: '1'
    },
    encoding: 'utf8'
  }
)
assert.notEqual(localGatewayResult.status, 0, 'native evidence template generator should reject local gateways')
assert.match(
  `${localGatewayResult.stderr}\n${localGatewayResult.stdout}`,
  /non-local HTTPS/i,
  'native evidence template generator should explain local gateway rejection'
)
