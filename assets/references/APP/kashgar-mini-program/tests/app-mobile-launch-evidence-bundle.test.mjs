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

const freshTimestamp = new Date().toISOString()

const makeZipArtifact = (files, fileName = 'xicheng-release.apk') => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-launch-artifact-'))
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
  assert.equal(result.status, 0, `test fixture APK/ZIP should be created: ${result.stderr || result.stdout}`)
  return archivePath
}

const describeArtifact = (artifactPath) => {
  const artifactBytes = fs.readFileSync(artifactPath)
  return {
    artifactPath,
    artifactSha256: crypto.createHash('sha256').update(artifactBytes).digest('hex'),
    artifactSizeBytes: artifactBytes.length
  }
}

const cleanArtifact = describeArtifact(makeZipArtifact({
  'AndroidManifest.xml': '<manifest package="com.xinghe.xunjing"></manifest>',
  'assets/index.js': 'const apiBase="https://api.xingheai.net";const tenantId="1";'
}))

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

const repoRoot = spawnSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: root,
  encoding: 'utf8'
}).stdout.trim()
const scenarioEvidenceDir = fs.mkdtempSync(path.join(repoRoot, 'qa', 'launch-scenario-evidence-test-'))
process.on('exit', () => {
  fs.rmSync(scenarioEvidenceDir, { recursive: true, force: true })
})
const jpegEvidenceBytes = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
  0x49, 0x46, 0x00, 0x01, 0xff, 0xd9
])
const scenarioEvidenceRefById = new Map(requiredScenarioIds.map((id) => [
  id,
  path.relative(repoRoot, path.join(scenarioEvidenceDir, `${id}.jpg`))
]))
for (const [id, evidenceRef] of scenarioEvidenceRefById.entries()) {
  fs.writeFileSync(path.resolve(repoRoot, evidenceRef), jpegEvidenceBytes)
}

const makePreprodEvidence = (overrides = {}) => {
  const { summary: summaryOverrides = {}, checks: extraChecks = [], ...topLevelOverrides } = overrides
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
          sceneCode: 'QR-XICHENG-MAP-001',
          targetPath: '/pages/map/detail?packageCode=XICHENG-MAP-001&sceneCode=QR-XICHENG-MAP-001'
        }
      },
      ...extraChecks
    ],
    ...topLevelOverrides
  }
}

const makeNativeEvidence = (overrides = {}) => ({
  artifactType: 'xicheng-native-device-evidence',
  createdAt: freshTimestamp,
  branch: 'main',
  commit: currentCommit,
  appApiBaseUrl: 'https://api.xingheai.net',
  tenantId: '1',
  build: {
    mode: 'release',
    artifact: cleanArtifact.artifactPath,
    artifactSha256: cleanArtifact.artifactSha256,
    artifactSizeBytes: cleanArtifact.artifactSizeBytes
  },
  releaseTargets: ['android'],
  devices: [
    {
      platform: 'android',
      model: 'Pixel 8',
      osVersion: 'Android 15',
      appVersion: '1.0.0',
      installer: 'HBuilderX release test channel'
    }
  ],
  scenarios: requiredScenarioIds.map((id) => ({
    id,
    platform: 'android',
    status: 'PASS',
    evidenceRef: scenarioEvidenceRefById.get(id),
    ...(requiredScenarioAssertions[id] ? { assertions: requiredScenarioAssertions[id] } : {}),
    notes: id === 'scan-entry-map-detail'
      ? 'Scanned QR-XICHENG-MAP-001 on physical device and landed on /pages/map/detail?packageCode=XICHENG-MAP-001'
      : `${id} verified on physical device`
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
  'build.artifact',
  'verify:release:artifact',
  '安装包本体',
  '真机证据',
  '预发证据',
  'live-xicheng-scan-resolve',
  '扫码入口',
  'targetPath',
  '/pages/map/detail',
  'contextEcho',
  'logId',
  'poiCode',
  'poiName',
  '/app-api/xunjing/ai/chat'
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
  makePreprodEvidence({ summary: { baseUrl: 'https://preprod.xingheai.net' } }),
  makeNativeEvidence({ appApiBaseUrl: 'https://api.xingheai.net' })
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

const invalidPreprodTenantResult = runBundleGate(
  makePreprodEvidence({ summary: { tenantId: 'tenant-prod' } }),
  makeNativeEvidence({ tenantId: 'tenant-prod' })
)
assert.notEqual(
  invalidPreprodTenantResult.status,
  0,
  'launch evidence bundle validator should reject non-numeric preprod tenant ids'
)
assert.match(
  `${invalidPreprodTenantResult.stderr}\n${invalidPreprodTenantResult.stdout}`,
  /tenant.*positive integer|正整数/i,
  'launch evidence bundle validator should explain preprod tenant id validation'
)

const wrongPreprodScopeResult = runBundleGate(
  makePreprodEvidence({ summary: { xichengRegionCode: 'beijing-dongcheng' } }),
  makeNativeEvidence()
)
assert.notEqual(
  wrongPreprodScopeResult.status,
  0,
  'launch evidence bundle validator should reject preprod evidence collected for a different city region'
)
assert.match(
  `${wrongPreprodScopeResult.stderr}\n${wrongPreprodScopeResult.stdout}`,
  /xichengRegionCode.*beijing-xicheng|西城/i,
  'launch evidence bundle validator should explain the Xicheng region scope mismatch'
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

const missingScanResolveResult = runBundleGate(
  {
    ...makePreprodEvidence(),
    checks: makePreprodEvidence().checks.filter((check) => check.name !== 'live-xicheng-scan-resolve')
  },
  makeNativeEvidence()
)
assert.notEqual(
  missingScanResolveResult.status,
  0,
  'launch evidence bundle validator should reject preprod evidence without the scan entry resolve check'
)
assert.match(
  `${missingScanResolveResult.stderr}\n${missingScanResolveResult.stdout}`,
  /live-xicheng-scan-resolve|扫码入口|scan/i,
  'launch evidence bundle validator should name the missing scan entry resolve check'
)

const missingAiContextResult = runBundleGate(
  {
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
  },
  makeNativeEvidence()
)
assert.notEqual(
  missingAiContextResult.status,
  0,
  'launch evidence bundle validator should reject AI chat evidence without route context echo, POI attribution, and log id'
)
assert.match(
  `${missingAiContextResult.stderr}\n${missingAiContextResult.stdout}`,
  /contextEcho|poiCode|poiName|logId|\/app-api\/xunjing\/ai\/chat/i,
  'launch evidence bundle validator should explain the required AI chat context evidence'
)

const wrongScanTargetResult = runBundleGate(
  {
    ...makePreprodEvidence(),
    checks: makePreprodEvidence().checks.map((check) => (
      check.name === 'live-xicheng-scan-resolve'
        ? {
            ...check,
            summary: {
              ...check.summary,
              targetPath: '/pages/xicheng/home/home'
            }
          }
        : check
    ))
  },
  makeNativeEvidence()
)
assert.notEqual(
  wrongScanTargetResult.status,
  0,
  'launch evidence bundle validator should reject scan evidence that does not land on the map detail page'
)
assert.match(
  `${wrongScanTargetResult.stderr}\n${wrongScanTargetResult.stdout}`,
  /targetPath|\/pages\/map\/detail/,
  'launch evidence bundle validator should explain the scan targetPath requirement'
)

const malformedTriggerResult = runBundleGate(
  {
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
  },
  makeNativeEvidence()
)
assert.notEqual(
  malformedTriggerResult.status,
  0,
  'launch evidence bundle validator should reject trigger evidence without endpoint, tenant, confidence, and targetPath details'
)
assert.match(
  `${malformedTriggerResult.stderr}\n${malformedTriggerResult.stdout}`,
  /live-xicheng-trigger-baitasi|targetPath|confidence|\/app-api\/xunjing\/triggers\/resolve/i,
  'launch evidence bundle validator should explain the required trigger smoke evidence fields'
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

const artifactWithLocalGateway = describeArtifact(makeZipArtifact({
  'AndroidManifest.xml': '<manifest package="com.xinghe.xunjing"></manifest>',
  'assets/index.js': 'const apiBase="http://localhost:48082/app-api/xunjing";'
}, 'xicheng-local-gateway.apk'))
const localGatewayArtifactResult = runBundleGate(
  makePreprodEvidence(),
  makeNativeEvidence({
    build: {
      mode: 'release',
      artifact: artifactWithLocalGateway.artifactPath,
      artifactSha256: artifactWithLocalGateway.artifactSha256,
      artifactSizeBytes: artifactWithLocalGateway.artifactSizeBytes
    }
  })
)
assert.notEqual(
  localGatewayArtifactResult.status,
  0,
  'launch evidence bundle validator should reject native release artifacts containing local gateways'
)
assert.match(
  `${localGatewayArtifactResult.stderr}\n${localGatewayArtifactResult.stdout}`,
  /localhost|release artifact|build\.artifact|APK|ZIP|安装包/i,
  'launch evidence bundle validator should explain native artifact scan rejection'
)
