import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const scriptPath = path.join(root, 'scripts', 'verify_native_package_readiness.mjs')
const releaseChecklist = fs.readFileSync(path.join(root, 'docs', 'xicheng-app-release-checklist.md'), 'utf8')
const preprodRunbook = fs.readFileSync(path.join(root, 'docs', 'xicheng-app-preprod-evidence-runbook.md'), 'utf8')

assert.ok(
  fs.existsSync(scriptPath),
  'APP should provide scripts/verify_native_package_readiness.mjs for signed mobile package readiness'
)

assert.ok(
  (packageJson.scripts?.['verify:native:package:ready'] || '').includes('node scripts/verify_native_package_readiness.mjs'),
  'APP package should expose npm run verify:native:package:ready'
)

for (const required of [
  'npm run verify:native:package:ready',
  'XUNJING_ANDROID_PACKAGE_NAME',
  'XUNJING_ANDROID_KEYSTORE',
  'XUNJING_ANDROID_KEY_ALIAS',
  'XUNJING_RELEASE_TARGETS',
  'signed APK/AAB',
  'HBuilderX',
  'ACCESS_NETWORK_STATE',
  'CAMERA',
  'ACCESS_COARSE_LOCATION',
  'ACCESS_FINE_LOCATION'
]) {
  assert.ok(releaseChecklist.includes(required), `Release checklist should mention native package readiness item ${required}`)
  assert.ok(preprodRunbook.includes(required), `Preprod runbook should mention native package readiness item ${required}`)
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-native-package-ready-'))
const keystorePath = path.join(tempDir, 'xicheng-release.keystore')
fs.writeFileSync(keystorePath, 'placeholder keystore bytes for readiness test\n')

const runReadiness = (envOverrides = {}, args = []) => spawnSync(
  process.execPath,
  [scriptPath, ...args],
  {
    cwd: root,
    env: {
      ...process.env,
      ...envOverrides
    },
    encoding: 'utf8'
  }
)

const baseEnv = {
  XUNJING_APP_API_BASE_URL: 'https://api.example.com',
  XUNJING_TENANT_ID: '1',
  XUNJING_RELEASE_TARGETS: 'android',
  XUNJING_ANDROID_PACKAGE_NAME: 'com.xinghe.xunjing',
  XUNJING_ANDROID_KEYSTORE: keystorePath,
  XUNJING_ANDROID_KEY_ALIAS: 'xicheng-release',
  XUNJING_ANDROID_KEYSTORE_PASSWORD: 'secret',
  XUNJING_ANDROID_KEY_PASSWORD: 'secret'
}

const readyResult = runReadiness(baseEnv, ['--skip-tool-check'])
assert.equal(
  readyResult.status,
  0,
  `native package readiness should pass with complete Android release configuration: ${readyResult.stderr || readyResult.stdout}`
)

const readyJson = JSON.parse(readyResult.stdout)
assert.equal(readyJson.ok, true)
assert.deepEqual(readyJson.releaseTargets, ['android'])
assert.equal(readyJson.app.name, '星河寻境')
assert.equal(readyJson.app.appid, '__UNI__DA550CB')
assert.equal(readyJson.app.versionName, '1.0.0')
assert.equal(readyJson.app.versionCode, '100')
assert.equal(readyJson.android.packageName, 'com.xinghe.xunjing')
assert.equal(readyJson.android.keystore.exists, true)
assert.equal(readyJson.android.permissions.length, 4)
assert.ok(
  readyJson.nextCommands.some((command) => command.includes('npm run build:app:release')),
  'native package readiness should point to the release resource build command'
)
assert.ok(
  readyJson.nextCommands.some((command) => command.includes('npm run prepare:native:evidence')),
  'native package readiness should point to native evidence initialization after packaging'
)
assert.ok(
  readyJson.nextCommands.some((command) => command.includes('npm run pack:native:cloud:dry-run')),
  'native package readiness should point to the HBuilderX cloud pack dry-run command'
)

const fakeHBuilderXApp = path.join(tempDir, 'HBuilderX.app')
const fakeHBuilderXCli = path.join(fakeHBuilderXApp, 'Contents', 'MacOS', 'cli')
fs.mkdirSync(path.dirname(fakeHBuilderXCli), { recursive: true })
fs.writeFileSync(fakeHBuilderXCli, '#!/bin/sh\nexit 0\n')
fs.chmodSync(fakeHBuilderXCli, 0o755)

const autoDetectedToolResult = runReadiness({
  ...baseEnv,
  HBUILDERX_CLI: '',
  XUNJING_HBUILDERX_APP_PATH: fakeHBuilderXApp
})
assert.equal(
  autoDetectedToolResult.status,
  0,
  `native package readiness should auto-detect HBuilderX.app CLI when hbuilderx is not on PATH: ${autoDetectedToolResult.stderr || autoDetectedToolResult.stdout}`
)
const autoDetectedToolJson = JSON.parse(autoDetectedToolResult.stdout)
assert.equal(autoDetectedToolJson.nativeTool.command, fakeHBuilderXCli)
assert.equal(autoDetectedToolJson.nativeTool.autoDetected, true)
assert.equal(autoDetectedToolJson.nativeTool.checked, true)
assert.equal(autoDetectedToolJson.nativeTool.skipped, false)

const envFilePath = path.join(tempDir, 'xicheng-release.env')
fs.writeFileSync(envFilePath, [
  '# Secure release env file fixture. Real secrets must stay outside git.',
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
const envFileResult = runReadiness({
  XUNJING_RELEASE_ENV_FILE: envFilePath,
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
assert.equal(
  envFileResult.status,
  0,
  `native package readiness should load release config from XUNJING_RELEASE_ENV_FILE: ${envFileResult.stderr || envFileResult.stdout}`
)
const envFileJson = JSON.parse(envFileResult.stdout)
assert.equal(envFileJson.appApiBaseUrl, 'https://api.example.com')
assert.equal(envFileJson.tenantId, '1')
assert.equal(envFileJson.android.keystore.path, keystorePath)
assert.equal(envFileJson.nativeTool.skipped, true)

const missingEnvResult = runReadiness({}, ['--skip-tool-check'])
assert.notEqual(missingEnvResult.status, 0, 'native package readiness should reject missing release env')
assert.match(
  `${missingEnvResult.stderr}\n${missingEnvResult.stdout}`,
  /XUNJING_APP_API_BASE_URL|XUNJING_TENANT_ID|XUNJING_ANDROID_PACKAGE_NAME|XUNJING_ANDROID_KEYSTORE/i,
  'native package readiness should name missing release env fields'
)

const localGatewayResult = runReadiness({
  ...baseEnv,
  XUNJING_APP_API_BASE_URL: 'http://127.0.0.1:48082'
}, ['--skip-tool-check'])
assert.notEqual(localGatewayResult.status, 0, 'native package readiness should reject local gateways')
assert.match(
  `${localGatewayResult.stderr}\n${localGatewayResult.stdout}`,
  /non-local HTTPS/i,
  'native package readiness should explain non-local HTTPS requirement'
)

const invalidPackageNameResult = runReadiness({
  ...baseEnv,
  XUNJING_ANDROID_PACKAGE_NAME: 'xinghe'
}, ['--skip-tool-check'])
assert.notEqual(invalidPackageNameResult.status, 0, 'native package readiness should reject invalid Android package names')
assert.match(
  `${invalidPackageNameResult.stderr}\n${invalidPackageNameResult.stdout}`,
  /Android package name|XUNJING_ANDROID_PACKAGE_NAME/i,
  'native package readiness should explain Android package name validation'
)

const missingKeystoreResult = runReadiness({
  ...baseEnv,
  XUNJING_ANDROID_KEYSTORE: path.join(tempDir, 'missing.keystore')
}, ['--skip-tool-check'])
assert.notEqual(missingKeystoreResult.status, 0, 'native package readiness should reject a missing Android keystore')
assert.match(
  `${missingKeystoreResult.stderr}\n${missingKeystoreResult.stdout}`,
  /XUNJING_ANDROID_KEYSTORE|not found/i,
  'native package readiness should explain missing keystore validation'
)

const unsupportedTargetResult = runReadiness({
  ...baseEnv,
  XUNJING_RELEASE_TARGETS: 'web'
}, ['--skip-tool-check'])
assert.notEqual(unsupportedTargetResult.status, 0, 'native package readiness should reject non-native release targets')
assert.match(
  `${unsupportedTargetResult.stderr}\n${unsupportedTargetResult.stdout}`,
  /XUNJING_RELEASE_TARGETS|android|ios/i,
  'native package readiness should explain supported native release targets'
)
