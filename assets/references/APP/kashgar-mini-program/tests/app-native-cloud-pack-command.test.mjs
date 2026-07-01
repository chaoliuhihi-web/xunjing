import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const scriptPath = path.join(root, 'scripts', 'run_native_cloud_pack.mjs')
const releaseChecklist = fs.readFileSync(path.join(root, 'docs', 'xicheng-app-release-checklist.md'), 'utf8')
const preprodRunbook = fs.readFileSync(path.join(root, 'docs', 'xicheng-app-preprod-evidence-runbook.md'), 'utf8')

assert.ok(
  fs.existsSync(scriptPath),
  'APP should provide scripts/run_native_cloud_pack.mjs for HBuilderX native cloud packaging'
)

assert.ok(
  (packageJson.scripts?.['pack:native:cloud:dry-run'] || '').includes('node scripts/run_native_cloud_pack.mjs --dry-run'),
  'APP package should expose npm run pack:native:cloud:dry-run'
)

assert.ok(
  (packageJson.scripts?.['pack:native:cloud'] || '').includes('node scripts/run_native_cloud_pack.mjs --execute'),
  'APP package should expose npm run pack:native:cloud'
)

for (const required of [
  'npm run pack:native:cloud:dry-run',
  'npm run pack:native:cloud',
  'XUNJING_NATIVE_PACK_CONFIRM=cloud-pack',
  'run_native_cloud_pack.mjs',
  '--android.packagename',
  '--android.certfile'
]) {
  assert.ok(releaseChecklist.includes(required), `Release checklist should mention native cloud pack item ${required}`)
  assert.ok(preprodRunbook.includes(required), `Preprod runbook should mention native cloud pack item ${required}`)
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-native-cloud-pack-'))
const keystorePath = path.join(tempDir, 'xicheng-release.keystore')
const fakeCliPath = path.join(tempDir, 'hbuilderx-cli')
const invocationPath = path.join(tempDir, 'hbuilderx-invocation.json')

fs.writeFileSync(keystorePath, 'placeholder keystore bytes for cloud pack test\n')
fs.writeFileSync(fakeCliPath, [
  '#!/bin/sh',
  `printf '%s\\n' "$@" > ${JSON.stringify(invocationPath)}`,
  'exit 0'
].join('\n'))
fs.chmodSync(fakeCliPath, 0o755)

const baseEnv = {
  XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
  XUNJING_TENANT_ID: '1',
  XUNJING_RELEASE_TARGETS: 'android',
  XUNJING_ANDROID_PACKAGE_NAME: 'com.xinghe.xunjing',
  XUNJING_ANDROID_KEYSTORE: keystorePath,
  XUNJING_ANDROID_KEY_ALIAS: 'xicheng-release',
  XUNJING_ANDROID_KEYSTORE_PASSWORD: 'store-secret',
  XUNJING_ANDROID_KEY_PASSWORD: 'key-secret',
  HBUILDERX_CLI: fakeCliPath
}

const runPack = (envOverrides = {}, args = ['--dry-run']) => spawnSync(
  process.execPath,
  [scriptPath, ...args],
  {
    cwd: root,
    env: {
      ...process.env,
      ...baseEnv,
      ...envOverrides
    },
    encoding: 'utf8'
  }
)

const dryRunResult = runPack()
assert.equal(
  dryRunResult.status,
  0,
  `native cloud pack dry-run should pass with complete release env: ${dryRunResult.stderr || dryRunResult.stdout}`
)
const dryRunJson = JSON.parse(dryRunResult.stdout)
assert.equal(dryRunJson.ok, true)
assert.equal(dryRunJson.mode, 'dry-run')
assert.equal(dryRunJson.command.executable, fakeCliPath)
assert.deepEqual(dryRunJson.releaseTargets, ['android'])
assert.ok(dryRunJson.command.argv.includes('pack'))
assert.ok(dryRunJson.command.argv.includes('--android.packagename'))
assert.ok(dryRunJson.command.argv.includes('com.xinghe.xunjing'))
assert.ok(dryRunJson.command.argv.includes('--android.certfile'))
assert.ok(dryRunJson.command.argv.includes(keystorePath))
assert.ok(dryRunJson.redactedCommand.includes('***REDACTED***'))
assert.ok(!dryRunJson.redactedCommand.includes('store-secret'))
assert.ok(!dryRunJson.redactedCommand.includes('key-secret'))
assert.equal(fs.existsSync(invocationPath), false, 'dry-run must not execute HBuilderX CLI')

const executeWithoutConfirmResult = runPack({}, ['--execute'])
assert.notEqual(executeWithoutConfirmResult.status, 0, 'native cloud pack execute should require an explicit confirmation env')
assert.match(
  `${executeWithoutConfirmResult.stderr}\n${executeWithoutConfirmResult.stdout}`,
  /XUNJING_NATIVE_PACK_CONFIRM=cloud-pack/i,
  'native cloud pack execute should explain the confirmation env'
)
assert.ok(!executeWithoutConfirmResult.stdout.includes('store-secret'))
assert.ok(!executeWithoutConfirmResult.stderr.includes('key-secret'))

const executeResult = runPack({
  XUNJING_NATIVE_PACK_CONFIRM: 'cloud-pack'
}, ['--execute'])
assert.equal(
  executeResult.status,
  0,
  `native cloud pack execute should invoke HBuilderX CLI after confirmation: ${executeResult.stderr || executeResult.stdout}`
)
const executeJson = JSON.parse(executeResult.stdout)
assert.equal(executeJson.ok, true)
assert.equal(executeJson.mode, 'execute')
assert.ok(!executeResult.stdout.includes('store-secret'))
assert.ok(!executeResult.stdout.includes('key-secret'))
assert.ok(fs.existsSync(invocationPath), 'execute should call the configured HBuilderX CLI')
const invokedArgs = fs.readFileSync(invocationPath, 'utf8').trim().split('\n')
assert.ok(invokedArgs.includes('pack'))
assert.ok(invokedArgs.includes('--android.certpassword'))
assert.ok(invokedArgs.includes('key-secret'))
assert.ok(invokedArgs.includes('--android.storepassword'))
assert.ok(invokedArgs.includes('store-secret'))

const missingEnvResult = runPack({
  XUNJING_ANDROID_PACKAGE_NAME: ''
})
assert.notEqual(missingEnvResult.status, 0, 'native cloud pack dry-run should fail when readiness env is incomplete')
assert.match(
  `${missingEnvResult.stderr}\n${missingEnvResult.stdout}`,
  /XUNJING_ANDROID_PACKAGE_NAME/i,
  'native cloud pack dry-run should surface readiness validation errors'
)
