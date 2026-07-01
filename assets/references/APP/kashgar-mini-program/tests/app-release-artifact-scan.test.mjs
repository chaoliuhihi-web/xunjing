import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const scriptPath = path.join(root, 'scripts', 'verify_release_build_artifact.mjs')
const releaseBuildRunnerPath = path.join(root, 'scripts', 'run_release_app_build.mjs')
const releaseBuildRunner = fs.readFileSync(releaseBuildRunnerPath, 'utf8')
const releaseChecklist = fs.readFileSync(path.join(root, 'docs', 'xicheng-app-release-checklist.md'), 'utf8')
const preprodRunbook = fs.readFileSync(path.join(root, 'docs', 'xicheng-app-preprod-evidence-runbook.md'), 'utf8')

assert.ok(
  fs.existsSync(scriptPath),
  'APP should provide scripts/verify_release_build_artifact.mjs for post-build release artifact scanning'
)

assert.ok(
  (packageJson.scripts?.['verify:release:artifact'] || '').includes('node scripts/verify_release_build_artifact.mjs'),
  'APP package should expose npm run verify:release:artifact'
)

assert.ok(
  (packageJson.scripts?.['build:app:release'] || '').includes('node scripts/run_release_app_build.mjs') &&
    releaseBuildRunner.includes('verify_release_build_artifact.mjs') &&
    releaseBuildRunner.includes('dist/build/app-release'),
  'APP release build runner should scan dist/build/app-release after UniApp build'
)

for (const required of [
  'verify:release:artifact',
  'dist/build/app-release',
  'XUNJING_TENANT_ID',
  'APK',
  'localhost',
  'IPv4',
  'IPv6',
  'IPv4-mapped IPv6',
  'URL 内嵌账号密码',
  'XICHENG_DEVELOPMENT_TRIGGER_FIXTURE',
  'sk-',
  'pat_',
  'AKIA',
  '真实 token',
  'release 构建产物'
]) {
  assert.ok(releaseChecklist.includes(required), `Release checklist should mention release artifact scan item ${required}`)
  assert.ok(preprodRunbook.includes(required), `Preprod runbook should mention release artifact scan item ${required}`)
}

const makeArtifactDir = (files) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-release-artifact-scan-'))
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(tempDir, relativePath)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, content)
  }
  return tempDir
}

const makeZipArtifact = (files, fileName = 'xicheng-release.apk') => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-release-zip-scan-'))
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
  assert.equal(result.status, 0, `test fixture zip should be created: ${result.stderr || result.stdout}`)
  return archivePath
}

const runScanner = (artifactDir, env = {}) => spawnSync(
  process.execPath,
  [scriptPath, artifactDir],
  {
    cwd: root,
    env: {
      ...process.env,
      XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
      XUNJING_TENANT_ID: '1',
      ...env
    },
    encoding: 'utf8'
  }
)

const validArtifactDir = makeArtifactDir({
  'index.html': '<!doctype html><script src="./assets/index.js"></script>',
  'assets/index.js': 'const apiBase="https://api.xingheai.net";const docs="https://github.com/uuidjs/uuid#getrandomvalues-not-supported";const tenantId="1";'
})
const validResult = runScanner(validArtifactDir)
assert.equal(
  validResult.status,
  0,
  `release artifact scanner should accept a clean release artifact: ${validResult.stderr || validResult.stdout}`
)
assert.match(
  validResult.stdout,
  /"ok": true/,
  'release artifact scanner should print a machine-readable OK summary'
)

const legacyOnlineApiDir = makeArtifactDir({
  'assets/index.js': 'const apiBase="https://api.xingheai.net";const tenantId="1";const UrlRequest="https://kashi.weiapp.net/";'
})
const legacyOnlineApiResult = runScanner(legacyOnlineApiDir)
assert.equal(
  legacyOnlineApiResult.status,
  0,
  `release artifact scanner should allow the legacy online api2 base while Yudao APP API uses the release gateway: ${legacyOnlineApiResult.stderr || legacyOnlineApiResult.stdout}`
)

const svgNamespaceDir = makeArtifactDir({
  'assets/index.js': 'const apiBase="https://api.xingheai.net";const tenantId="1";const icon="<svg xmlns=\\"http://www.w3.org/2000/svg\\"></svg>";'
})
const svgNamespaceResult = runScanner(svgNamespaceDir)
assert.equal(
  svgNamespaceResult.status,
  0,
  `release artifact scanner should allow standard SVG/XML namespace URLs while still enforcing API gateways: ${svgNamespaceResult.stderr || svgNamespaceResult.stdout}`
)

const missingExpectedGatewayDir = makeArtifactDir({
  'assets/index.js': 'const tenantId="1"; const relativeApi="/app-api/xunjing";'
})
const missingExpectedGatewayResult = runScanner(missingExpectedGatewayDir)
assert.notEqual(
  missingExpectedGatewayResult.status,
  0,
  'release artifact scanner should reject artifacts that do not embed the configured release API gateway'
)
assert.match(
  `${missingExpectedGatewayResult.stderr}\n${missingExpectedGatewayResult.stdout}`,
  /expected API|XUNJING_APP_API_BASE_URL|embed|网关/i,
  'release artifact scanner should explain that the configured release API gateway must be embedded in the package'
)

const mismatchedTenantDir = makeArtifactDir({
  'assets/index.js': 'const apiBase="https://api.xingheai.net";const tenantId="2";'
})
const mismatchedTenantResult = runScanner(mismatchedTenantDir)
assert.notEqual(
  mismatchedTenantResult.status,
  0,
  'release artifact scanner should reject artifacts whose embedded tenant id does not match XUNJING_TENANT_ID'
)
assert.match(
  `${mismatchedTenantResult.stderr}\n${mismatchedTenantResult.stdout}`,
  /tenant|XUNJING_TENANT_ID/i,
  'release artifact scanner should explain expected tenant id mismatch'
)

for (const invalidTenantId of ['0', '-1', 'tenant-prod']) {
  const result = runScanner(validArtifactDir, { XUNJING_TENANT_ID: invalidTenantId })
  assert.notEqual(result.status, 0, `release artifact scanner should reject invalid tenant id ${invalidTenantId}`)
  assert.match(
    `${result.stderr}\n${result.stdout}`,
    /tenant.*positive integer|正整数/i,
    `release artifact scanner should explain why tenant id ${invalidTenantId} is invalid`
  )
}

const validApkArtifact = makeZipArtifact({
  'assets/index.js': 'const apiBase="https://api.xingheai.net";const tenantId="1";'
})
const validApkResult = runScanner(validApkArtifact)
assert.equal(
  validApkResult.status,
  0,
  `release artifact scanner should accept a clean APK artifact: ${validApkResult.stderr || validApkResult.stdout}`
)
assert.match(
  validApkResult.stdout,
  /archiveFilesScanned/,
  'release artifact scanner should report scanned APK inner files'
)

const plainZipArtifact = makeZipArtifact({
  'assets/index.js': 'const apiBase="https://api.xingheai.net";const tenantId="1";'
}, 'xicheng-release.zip')
const plainZipResult = runScanner(plainZipArtifact)
assert.notEqual(
  plainZipResult.status,
  0,
  'release artifact scanner should reject plain ZIP files as final mobile release artifacts'
)
assert.match(
  `${plainZipResult.stderr}\n${plainZipResult.stdout}`,
  /APK|AAB|IPA|mobile|install package|安装包/i,
  'release artifact scanner should explain that final mobile release artifacts must be APK, AAB, or IPA'
)

for (const mobileArchiveName of ['xicheng-release.aab', 'xicheng-release.ipa']) {
  const validMobileArchive = makeZipArtifact({
    'assets/index.js': 'const apiBase="https://api.xingheai.net";const tenantId="1";'
  }, mobileArchiveName)
  const result = runScanner(validMobileArchive)
  assert.equal(
    result.status,
    0,
    `release artifact scanner should accept a clean mobile package archive ${mobileArchiveName}: ${result.stderr || result.stdout}`
  )
  assert.match(
    result.stdout,
    /archiveFilesScanned/,
    `release artifact scanner should report scanned mobile package archive files for ${mobileArchiveName}`
  )
}

for (const [label, content, expectedMessage] of [
  ['localhost gateway', 'const apiBase="http://localhost:48082/app-api/xunjing";', /localhost|local/i],
  ['lan gateway', 'const apiBase="https://192.168.1.8/app-api/xunjing";', /192\.168|local|LAN/i],
  [
    'IPv4 link-local asset URL',
    'const apiBase="https://api.xingheai.net";const tenantId="1";const previewImage="https://169.254.1.8/poster.png";',
    /169\.254|link-local|local|LAN/i
  ],
  [
    'CGNAT asset URL',
    'const apiBase="https://api.xingheai.net";const tenantId="1";const previewImage="https://100.64.1.8/poster.png";',
    /100\.64|CGNAT|reserved|local|LAN/i
  ],
  [
    'benchmark reserved asset URL',
    'const apiBase="https://api.xingheai.net";const tenantId="1";const previewImage="https://198.18.1.8/poster.png";',
    /198\.18|benchmark|reserved|local|LAN/i
  ],
  [
    'multicast asset URL',
    'const apiBase="https://api.xingheai.net";const tenantId="1";const previewImage="https://224.0.0.1/poster.png";',
    /224\.0\.0\.1|multicast|reserved|local|LAN/i
  ],
  [
    'private IPv6 gateway',
    'const apiBase="https://api.xingheai.net";const tenantId="1";const fallback="https://[fd00::1]/app-api/xunjing";',
    /IPv6|private|local|LAN|fd00/i
  ],
  [
    'link-local IPv6 gateway',
    'const apiBase="https://api.xingheai.net";const tenantId="1";const fallback="https://[fe80::1]/app-api/xunjing";',
    /IPv6|link-local|local|LAN|fe80/i
  ],
  ['development fixture', 'const bad="XICHENG_DEVELOPMENT_TRIGGER_FIXTURE";', /XICHENG_DEVELOPMENT_TRIGGER_FIXTURE/],
  ['h5 proxy target', 'const proxy="VITE_XUNJING_H5_PROXY_TARGET";', /VITE_XUNJING_H5_PROXY_TARGET/]
]) {
  const artifactDir = makeArtifactDir({ 'assets/index.js': content })
  const result = runScanner(artifactDir)
  assert.notEqual(result.status, 0, `release artifact scanner should reject ${label}`)
  assert.match(
    `${result.stderr}\n${result.stdout}`,
    expectedMessage,
    `release artifact scanner should explain rejection for ${label}`
  )
}

for (const [label, content] of [
  ['URL embedded short username/password credential', 'const apiBase="https://api.xingheai.net";const tenantId="1";const bad="https://u:p@static.xingheai.net/poster.png";'],
  ['OpenAI-style secret key', `const key="sk-${'a'.repeat(32)}";`],
  ['GitHub/Gitee PAT token', `const pat="pat_${'A'.repeat(32)}";`],
  ['GitHub token', `const ghp="ghp_${'B'.repeat(36)}";`],
  ['AWS access key id', 'const aws="AKIAABCDEFGHIJKLMNOP";'],
  ['Coze API token marker', `const COZE_API_TOKEN="coze_${'c'.repeat(32)}";`],
  ['Qwen API token marker', `const QWEN_API_KEY="qwen_${'d'.repeat(32)}";`]
]) {
  const artifactDir = makeArtifactDir({ 'assets/index.js': content })
  const result = runScanner(artifactDir)
  assert.notEqual(result.status, 0, `release artifact scanner should reject ${label}`)
  assert.match(
    `${result.stderr}\n${result.stdout}`,
    /secret|token|credential|密钥|令牌/i,
    `release artifact scanner should explain credential rejection for ${label}`
  )
}

const apkWithSecret = makeZipArtifact({
  'assets/index.js': `const key="sk-${'e'.repeat(32)}";`
})
const apkSecretResult = runScanner(apkWithSecret)
assert.notEqual(apkSecretResult.status, 0, 'release artifact scanner should reject secrets inside APK/ZIP artifacts')
assert.match(
  `${apkSecretResult.stderr}\n${apkSecretResult.stdout}`,
  /secret|token|credential|APK|ZIP|archive|密钥|令牌/i,
  'release artifact scanner should explain credential rejection inside APK/ZIP artifacts'
)

const artifactDirWithEnvSecret = makeArtifactDir({
  'assets/index.js': 'const apiBase="https://api.xingheai.net";const tenantId="1";',
  '.env': `OPENAI_API_KEY="sk-${'f'.repeat(32)}"`
})
const envSecretResult = runScanner(artifactDirWithEnvSecret)
assert.notEqual(envSecretResult.status, 0, 'release artifact scanner should scan dot-env files and reject embedded secrets')
assert.match(
  `${envSecretResult.stderr}\n${envSecretResult.stdout}`,
  /\.env|secret|token|credential|密钥|令牌/i,
  'release artifact scanner should explain credential rejection from dot-env files'
)

const artifactDirWithUnquotedProviderSecret = makeArtifactDir({
  'assets/index.js': 'const apiBase="https://api.xingheai.net";const tenantId="1";',
  '.env.production': `QWEN_API_KEY=qwen_${'g'.repeat(32)}`
})
const unquotedProviderSecretResult = runScanner(artifactDirWithUnquotedProviderSecret)
assert.notEqual(
  unquotedProviderSecretResult.status,
  0,
  'release artifact scanner should reject unquoted AI provider secrets from dot-env files'
)
assert.match(
  `${unquotedProviderSecretResult.stderr}\n${unquotedProviderSecretResult.stdout}`,
  /\.env\.production|secret|token|credential|密钥|令牌/i,
  'release artifact scanner should explain credential rejection from unquoted dot-env provider secrets'
)

const artifactDirWithYudaoInternalToken = makeArtifactDir({
  'assets/index.js': 'const apiBase="https://api.xingheai.net";const tenantId="1";',
  '.env.production': `YUDAO_INTERNAL_AUTH_TOKEN=yudao_${'h'.repeat(32)}`
})
const yudaoInternalTokenResult = runScanner(artifactDirWithYudaoInternalToken)
assert.notEqual(
  yudaoInternalTokenResult.status,
  0,
  'release artifact scanner should reject Yudao/internal auth tokens from dot-env files'
)
assert.match(
  `${yudaoInternalTokenResult.stderr}\n${yudaoInternalTokenResult.stdout}`,
  /YUDAO_INTERNAL_AUTH_TOKEN|secret|token|credential|密钥|令牌/i,
  'release artifact scanner should explain credential rejection from Yudao/internal auth token markers'
)

const artifactDirWithBearerToken = makeArtifactDir({
  'assets/index.js': `const apiBase="https://api.xingheai.net";const tenantId="1";const headers={Authorization:"Bearer ${'jwtsegment.'.repeat(4)}signature"};`
})
const bearerTokenResult = runScanner(artifactDirWithBearerToken)
assert.notEqual(
  bearerTokenResult.status,
  0,
  'release artifact scanner should reject embedded Authorization Bearer tokens'
)
assert.match(
  `${bearerTokenResult.stderr}\n${bearerTokenResult.stdout}`,
  /Authorization|Bearer|secret|token|credential|密钥|令牌/i,
  'release artifact scanner should explain credential rejection from embedded Bearer tokens'
)

const artifactDirWithQuotedBearerToken = makeArtifactDir({
  'assets/index.js': `const apiBase="https://api.xingheai.net";const tenantId="1";const headers={"Authorization":"Bearer ${'quotedjwt.'.repeat(4)}signature"};`
})
const quotedBearerTokenResult = runScanner(artifactDirWithQuotedBearerToken)
assert.notEqual(
  quotedBearerTokenResult.status,
  0,
  'release artifact scanner should reject quoted Authorization Bearer tokens'
)
assert.match(
  `${quotedBearerTokenResult.stderr}\n${quotedBearerTokenResult.stdout}`,
  /Authorization|Bearer|secret|token|credential|密钥|令牌/i,
  'release artifact scanner should explain credential rejection from quoted Bearer tokens'
)

const artifactDirWithTemplateBearerToken = makeArtifactDir({
  'assets/index.js': `const apiBase="https://api.xingheai.net";const tenantId="1";const headers={Authorization:\`Bearer ${'templatejwt.'.repeat(4)}signature\`};`
})
const templateBearerTokenResult = runScanner(artifactDirWithTemplateBearerToken)
assert.notEqual(
  templateBearerTokenResult.status,
  0,
  'release artifact scanner should reject template-literal Authorization Bearer tokens'
)
assert.match(
  `${templateBearerTokenResult.stderr}\n${templateBearerTokenResult.stdout}`,
  /Authorization|Bearer|secret|token|credential|密钥|令牌/i,
  'release artifact scanner should explain credential rejection from template-literal Bearer tokens'
)

const artifactDirWithCredentialUrl = makeArtifactDir({
  'assets/index.js': 'const apiBase="https://api.xingheai.net";const tenantId="1";const posterUrl="https://preview-user:superSecret123@media.xingheai.net/poster.png";'
})
const credentialUrlResult = runScanner(artifactDirWithCredentialUrl)
assert.notEqual(
  credentialUrlResult.status,
  0,
  'release artifact scanner should reject URLs with embedded username/password credentials'
)
assert.match(
  `${credentialUrlResult.stderr}\n${credentialUrlResult.stdout}`,
  /URL|credential|username|password|secret|密钥|凭证/i,
  'release artifact scanner should explain credential rejection from userinfo URLs'
)

const apkWithLocalGateway = makeZipArtifact({
  'assets/index.js': 'const apiBase="http://localhost:48082/app-api/xunjing";'
})
const apkLocalGatewayResult = runScanner(apkWithLocalGateway)
assert.notEqual(apkLocalGatewayResult.status, 0, 'release artifact scanner should reject local gateways inside APK/ZIP artifacts')
assert.match(
  `${apkLocalGatewayResult.stderr}\n${apkLocalGatewayResult.stdout}`,
  /localhost|APK|ZIP|archive/i,
  'release artifact scanner should explain local gateway rejection inside APK/ZIP artifacts'
)

const apkWithFixture = makeZipArtifact({
  'assets/index.js': 'const fixture="XICHENG_DEVELOPMENT_TRIGGER_FIXTURE";'
})
const apkFixtureResult = runScanner(apkWithFixture)
assert.notEqual(apkFixtureResult.status, 0, 'release artifact scanner should reject development fixtures inside APK/ZIP artifacts')
assert.match(
  `${apkFixtureResult.stderr}\n${apkFixtureResult.stdout}`,
  /XICHENG_DEVELOPMENT_TRIGGER_FIXTURE|APK|ZIP|archive/i,
  'release artifact scanner should explain fixture rejection inside APK/ZIP artifacts'
)

const mismatchedGatewayDir = makeArtifactDir({
  'assets/index.js': 'const apiBase="https://wrong.xingheai.net";'
})
const mismatchedGatewayResult = runScanner(mismatchedGatewayDir)
assert.notEqual(
  mismatchedGatewayResult.status,
  0,
  'release artifact scanner should reject a different embedded HTTPS API gateway when one is present'
)
assert.match(
  `${mismatchedGatewayResult.stderr}\n${mismatchedGatewayResult.stdout}`,
  /XUNJING_APP_API_BASE_URL|expected API/i,
  'release artifact scanner should explain expected API mismatch'
)

const missingDirResult = runScanner(path.join(os.tmpdir(), 'missing-xicheng-release-artifact-dir'))
assert.notEqual(missingDirResult.status, 0, 'release artifact scanner should reject missing artifact directories')
assert.match(
  `${missingDirResult.stderr}\n${missingDirResult.stdout}`,
  /not found|artifact/i,
  'release artifact scanner should explain missing artifact directories'
)
