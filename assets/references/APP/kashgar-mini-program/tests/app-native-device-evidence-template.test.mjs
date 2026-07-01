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
const requiredSourceAssertionScenarioIds = [
  'scan-result-sources',
  'xiaojing-sourced-answer',
  'xiaojing-blocked-answer'
]

assert.ok(
  fs.existsSync(scriptPath),
  'APP should provide scripts/create_native_device_evidence_template.mjs for release candidate evidence initialization'
)

assert.ok(
  (packageJson.scripts?.['prepare:native:evidence'] || '').includes('node scripts/create_native_device_evidence_template.mjs'),
  'APP package should expose npm run prepare:native:evidence'
)

assert.ok(
  !(packageJson.scripts?.['prepare:native:evidence'] || '').includes('XUNJING_RELEASE_ARTIFACT:?'),
  'prepare:native:evidence should let the Node template generator load XUNJING_RELEASE_ARTIFACT from XUNJING_RELEASE_ENV_FILE instead of shell-blocking first'
)

for (const required of [
  'npm run prepare:native:evidence',
  'XUNJING_RELEASE_ARTIFACT',
  'qa/xicheng-native-device-evidence.json',
  'artifactSha256',
  'artifactSizeBytes',
  'scan-entry-map-detail',
  'safetyStatus',
  'sourcesVisible',
  'sourceCount',
  '无已审核来源，不能回答',
  'noLocalFabrication',
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
const createZipArtifact = (fileName, files) => {
  const sourceDir = fs.mkdtempSync(path.join(tempDir, `${path.basename(fileName, path.extname(fileName))}-source-`))
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(sourceDir, relativePath)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, content)
  }
  const artifactPath = path.join(tempDir, fileName)
  const zipResult = spawnSync('zip', ['-qr', artifactPath, '.'], {
    cwd: sourceDir,
    encoding: 'utf8'
  })
  assert.equal(zipResult.status, 0, `test fixture should create readable ${fileName}: ${zipResult.stderr || zipResult.stdout}`)
  const artifactBytes = fs.readFileSync(artifactPath)
  return {
    artifactPath,
    artifactBytes,
    artifactSha256: crypto.createHash('sha256').update(artifactBytes).digest('hex')
  }
}
const androidArtifact = createZipArtifact('xicheng-release.apk', {
  'AndroidManifest.xml': '<manifest package="com.xinghe.xunjing"></manifest>',
  'assets/index.js': 'const apiBase="https://api.xingheai.net";const tenantId="1";'
})
const artifactPath = androidArtifact.artifactPath
const artifactBytes = androidArtifact.artifactBytes
const artifactSha256 = androidArtifact.artifactSha256
const iosArtifact = createZipArtifact('xicheng-release.ipa', {
  'Payload/XingheXunjing.app/config.json': '{"apiBase":"https://api.xingheai.net","tenantId":"1"}'
})
const iosArtifactPath = iosArtifact.artifactPath
const renamedTextArtifactPath = path.join(tempDir, 'xicheng-renamed-text.apk')
fs.writeFileSync(renamedTextArtifactPath, 'renamed text file is not a readable mobile archive\n')
const genericZipArtifact = createZipArtifact('xicheng-generic-renamed.apk', {
  'assets/index.js': 'const apiBase="https://api.xingheai.net";const tenantId="1";'
})
const outputPath = path.join(tempDir, 'native-evidence.json')
const nonMobileArtifactPath = path.join(tempDir, 'xicheng-release.txt')
fs.writeFileSync(nonMobileArtifactPath, 'not a mobile install package\n')

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
      XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
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
assert.equal(generated.appApiBaseUrl, 'https://api.xingheai.net')
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
for (const scenarioId of requiredSourceAssertionScenarioIds) {
  const scenario = generated.scenarios.find((item) => item.id === scenarioId)
  assert.ok(scenario?.assertions, `native evidence template should include structured assertions for ${scenarioId}`)
}
const scanResultSourcesScenario = generated.scenarios.find((scenario) => scenario.id === 'scan-result-sources')
assert.equal(scanResultSourcesScenario.assertions.sourcesVisible, 'TODO confirm sources list is visible on the recognition result page')
assert.equal(scanResultSourcesScenario.assertions.minSourceCount, 1)
const sourcedAnswerScenario = generated.scenarios.find((scenario) => scenario.id === 'xiaojing-sourced-answer')
assert.equal(sourcedAnswerScenario.assertions.safetyStatus, 'PASSED')
assert.equal(sourcedAnswerScenario.assertions.sourcesVisible, 'TODO confirm Xiaojing answer shows reviewed sources')
assert.equal(sourcedAnswerScenario.assertions.minSourceCount, 1)
const blockedAnswerScenario = generated.scenarios.find((scenario) => scenario.id === 'xiaojing-blocked-answer')
assert.equal(blockedAnswerScenario.assertions.safetyStatus, 'BLOCKED')
assert.equal(blockedAnswerScenario.assertions.sourcesVisible, false)
assert.equal(blockedAnswerScenario.assertions.sourceCount, 0)
assert.equal(blockedAnswerScenario.assertions.blockedMessage, '无已审核来源，不能回答')
assert.equal(blockedAnswerScenario.assertions.noLocalFabrication, true)

const envFileOutputPath = path.join(tempDir, 'native-evidence-from-env-file.json')
const releaseEnvFilePath = path.join(tempDir, 'native-evidence-release.env')
fs.writeFileSync(releaseEnvFilePath, [
  'XUNJING_APP_API_BASE_URL=https://api.xingheai.net',
  'XUNJING_TENANT_ID=1',
  'XUNJING_RELEASE_TARGETS=android'
].join('\n'))
const envFileResult = spawnSync(
  process.execPath,
  [
    scriptPath,
    '--artifact',
    artifactPath,
    '--output',
    envFileOutputPath
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      XUNJING_RELEASE_ENV_FILE: releaseEnvFilePath,
      XUNJING_APP_API_BASE_URL: '',
      XUNJING_TENANT_ID: '',
      XUNJING_RELEASE_TARGETS: ''
    },
    encoding: 'utf8'
  }
)

assert.equal(
  envFileResult.status,
  0,
  `native evidence template generator should load API, tenant and target from XUNJING_RELEASE_ENV_FILE: ${envFileResult.stderr || envFileResult.stdout}`
)
const envFileGenerated = JSON.parse(fs.readFileSync(envFileOutputPath, 'utf8'))
assert.equal(envFileGenerated.appApiBaseUrl, 'https://api.xingheai.net')
assert.equal(envFileGenerated.tenantId, '1')
assert.deepEqual(envFileGenerated.releaseTargets, ['android'])

const npmEnvFileOutputPath = path.join(tempDir, 'native-evidence-from-npm-env-file.json')
const npmReleaseEnvFilePath = path.join(tempDir, 'native-evidence-npm-release.env')
fs.writeFileSync(npmReleaseEnvFilePath, [
  'XUNJING_APP_API_BASE_URL=https://api.xingheai.net',
  'XUNJING_TENANT_ID=1',
  'XUNJING_RELEASE_TARGETS=android',
  `XUNJING_RELEASE_ARTIFACT=${artifactPath}`,
  `XUNJING_NATIVE_DEVICE_EVIDENCE_FILE=${npmEnvFileOutputPath}`
].join('\n'))
const npmEnvFileResult = spawnSync('npm', ['run', 'prepare:native:evidence'], {
  cwd: root,
  env: {
    ...process.env,
    XUNJING_RELEASE_ENV_FILE: npmReleaseEnvFilePath,
    XUNJING_APP_API_BASE_URL: '',
    XUNJING_TENANT_ID: '',
    XUNJING_RELEASE_TARGETS: '',
    XUNJING_RELEASE_ARTIFACT: '',
    XUNJING_NATIVE_DEVICE_EVIDENCE_FILE: ''
  },
  encoding: 'utf8'
})

assert.equal(
  npmEnvFileResult.status,
  0,
  `npm run prepare:native:evidence should load artifact, output, API, tenant and target from XUNJING_RELEASE_ENV_FILE: ${npmEnvFileResult.stderr || npmEnvFileResult.stdout}`
)
const npmEnvFileGenerated = JSON.parse(fs.readFileSync(npmEnvFileOutputPath, 'utf8'))
assert.equal(npmEnvFileGenerated.build.artifact, artifactPath)
assert.equal(npmEnvFileGenerated.appApiBaseUrl, 'https://api.xingheai.net')
assert.equal(npmEnvFileGenerated.tenantId, '1')
assert.deepEqual(npmEnvFileGenerated.releaseTargets, ['android'])

const overwriteResult = spawnSync(
  process.execPath,
  [scriptPath, '--artifact', artifactPath, '--output', outputPath],
  {
    cwd: root,
    env: {
      ...process.env,
      XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
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

const invalidTenantResult = spawnSync(
  process.execPath,
  [scriptPath, '--artifact', artifactPath, '--output', path.join(tempDir, 'invalid-tenant.json'), '--force'],
  {
    cwd: root,
    env: {
      ...process.env,
      XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
      XUNJING_TENANT_ID: 'tenant-prod'
    },
    encoding: 'utf8'
  }
)
assert.notEqual(invalidTenantResult.status, 0, 'native evidence template generator should reject non-numeric tenant ids')
assert.match(
  `${invalidTenantResult.stderr}\n${invalidTenantResult.stdout}`,
  /tenant.*positive integer|正整数/i,
  'native evidence template generator should explain tenant id validation'
)

const invalidArtifactTypeResult = spawnSync(
  process.execPath,
  [scriptPath, '--artifact', nonMobileArtifactPath, '--output', path.join(tempDir, 'invalid-artifact-type.json'), '--force'],
  {
    cwd: root,
    env: {
      ...process.env,
      XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
      XUNJING_TENANT_ID: '1'
    },
    encoding: 'utf8'
  }
)
assert.notEqual(invalidArtifactTypeResult.status, 0, 'native evidence template generator should reject non-mobile release artifacts')
assert.match(
  `${invalidArtifactTypeResult.stderr}\n${invalidArtifactTypeResult.stdout}`,
  /APK|AAB|IPA|install package|安装包/i,
  'native evidence template generator should explain release artifact type validation'
)

const renamedTextArtifactResult = spawnSync(
  process.execPath,
  [scriptPath, '--artifact', renamedTextArtifactPath, '--output', path.join(tempDir, 'renamed-text-artifact.json'), '--force'],
  {
    cwd: root,
    env: {
      ...process.env,
      XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
      XUNJING_TENANT_ID: '1',
      XUNJING_RELEASE_TARGETS: 'android'
    },
    encoding: 'utf8'
  }
)
assert.notEqual(renamedTextArtifactResult.status, 0, 'native evidence template generator should reject text files renamed with an APK extension')
assert.match(
  `${renamedTextArtifactResult.stderr}\n${renamedTextArtifactResult.stdout}`,
  /APK|AAB|IPA|archive|ZIP|install package|安装包/i,
  'native evidence template generator should explain readable mobile archive validation'
)

const genericZipArtifactResult = spawnSync(
  process.execPath,
  [scriptPath, '--artifact', genericZipArtifact.artifactPath, '--output', path.join(tempDir, 'generic-zip-artifact.json'), '--force'],
  {
    cwd: root,
    env: {
      ...process.env,
      XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
      XUNJING_TENANT_ID: '1',
      XUNJING_RELEASE_TARGETS: 'android'
    },
    encoding: 'utf8'
  }
)
assert.notEqual(genericZipArtifactResult.status, 0, 'native evidence template generator should reject a generic ZIP renamed with an APK extension')
assert.match(
  `${genericZipArtifactResult.stderr}\n${genericZipArtifactResult.stdout}`,
  /AndroidManifest|APK|AAB|IPA|platform|install package|安装包/i,
  'native evidence template generator should explain platform-specific mobile package structure validation'
)

const invalidPlatformResult = spawnSync(
  process.execPath,
  [
    scriptPath,
    '--artifact',
    artifactPath,
    '--output',
    path.join(tempDir, 'invalid-platform.json'),
    '--platform',
    'web',
    '--force'
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
      XUNJING_TENANT_ID: '1'
    },
    encoding: 'utf8'
  }
)
assert.notEqual(invalidPlatformResult.status, 0, 'native evidence template generator should reject non-mobile release targets')
assert.match(
  `${invalidPlatformResult.stderr}\n${invalidPlatformResult.stdout}`,
  /releaseTargets|platform|android|ios|手机/i,
  'native evidence template generator should explain supported mobile release targets'
)

const iosTargetWithApkResult = spawnSync(
  process.execPath,
  [
    scriptPath,
    '--artifact',
    artifactPath,
    '--output',
    path.join(tempDir, 'ios-target-apk.json'),
    '--platform',
    'ios',
    '--force'
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
      XUNJING_TENANT_ID: '1'
    },
    encoding: 'utf8'
  }
)
assert.notEqual(iosTargetWithApkResult.status, 0, 'native evidence template generator should reject iOS targets with APK artifacts')
assert.match(
  `${iosTargetWithApkResult.stderr}\n${iosTargetWithApkResult.stdout}`,
  /ios|IPA|artifact|安装包/i,
  'native evidence template generator should explain iOS artifact matching'
)

const androidTargetWithIpaResult = spawnSync(
  process.execPath,
  [
    scriptPath,
    '--artifact',
    iosArtifactPath,
    '--output',
    path.join(tempDir, 'android-target-ipa.json'),
    '--platform',
    'android',
    '--force'
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
      XUNJING_TENANT_ID: '1'
    },
    encoding: 'utf8'
  }
)
assert.notEqual(androidTargetWithIpaResult.status, 0, 'native evidence template generator should reject Android targets with IPA artifacts')
assert.match(
  `${androidTargetWithIpaResult.stderr}\n${androidTargetWithIpaResult.stdout}`,
  /android|APK|AAB|artifact|安装包/i,
  'native evidence template generator should explain Android artifact matching'
)

const mixedTargetsResult = spawnSync(
  process.execPath,
  [
    scriptPath,
    '--artifact',
    artifactPath,
    '--output',
    path.join(tempDir, 'mixed-targets.json'),
    '--platform',
    'android,ios',
    '--force'
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
      XUNJING_TENANT_ID: '1'
    },
    encoding: 'utf8'
  }
)
assert.notEqual(mixedTargetsResult.status, 0, 'native evidence template generator should reject mixed platform targets for a single artifact')
assert.match(
  `${mixedTargetsResult.stderr}\n${mixedTargetsResult.stdout}`,
  /single release artifact|one platform|android|ios|安装包/i,
  'native evidence template generator should explain why mixed targets need separate evidence files'
)
