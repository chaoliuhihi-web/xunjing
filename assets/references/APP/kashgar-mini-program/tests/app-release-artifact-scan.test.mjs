import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const scriptPath = path.join(root, 'scripts', 'verify_release_build_artifact.mjs')
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
  (packageJson.scripts?.['build:app:release'] || '').includes('node scripts/verify_release_build_artifact.mjs'),
  'APP release build should scan dist/build/app-release after UniApp build'
)

for (const required of [
  'verify:release:artifact',
  'dist/build/app-release',
  'APK',
  'localhost',
  'XICHENG_DEVELOPMENT_TRIGGER_FIXTURE',
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
      XUNJING_APP_API_BASE_URL: 'https://api.example.com',
      XUNJING_TENANT_ID: '1',
      ...env
    },
    encoding: 'utf8'
  }
)

const validArtifactDir = makeArtifactDir({
  'index.html': '<!doctype html><script src="./assets/index.js"></script>',
  'assets/index.js': 'const apiBase="https://api.example.com";const tenantId="1";'
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

const validApkArtifact = makeZipArtifact({
  'assets/index.js': 'const apiBase="https://api.example.com";const tenantId="1";'
})
const validApkResult = runScanner(validApkArtifact)
assert.equal(
  validApkResult.status,
  0,
  `release artifact scanner should accept a clean APK/ZIP artifact: ${validApkResult.stderr || validApkResult.stdout}`
)
assert.match(
  validApkResult.stdout,
  /archiveFilesScanned/,
  'release artifact scanner should report scanned APK/ZIP inner files'
)

for (const [label, content, expectedMessage] of [
  ['localhost gateway', 'const apiBase="http://localhost:48082/app-api/xunjing";', /localhost|local/i],
  ['lan gateway', 'const apiBase="https://192.168.1.8/app-api/xunjing";', /192\.168|local|LAN/i],
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
  'assets/index.js': 'const apiBase="https://wrong.example.com";'
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
