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
  '--android.certfile',
  '请先导入'
]) {
  assert.ok(releaseChecklist.includes(required), `Release checklist should mention native cloud pack item ${required}`)
  assert.ok(preprodRunbook.includes(required), `Preprod runbook should mention native cloud pack item ${required}`)
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-native-cloud-pack-'))
const keystorePath = path.join(tempDir, 'xicheng-release.keystore')
const fakeCliPath = path.join(tempDir, 'hbuilderx-cli')
const importSoftFailureCliPath = path.join(tempDir, 'hbuilderx-import-soft-failure-cli')
const softFailureCliPath = path.join(tempDir, 'hbuilderx-soft-failure-cli')
const missingPluginCliPath = path.join(tempDir, 'hbuilderx-missing-plugin-cli')
const loginFailureCliPath = path.join(tempDir, 'hbuilderx-login-failure-cli')
const invocationPath = path.join(tempDir, 'hbuilderx-invocation.json')

const keytoolResult = spawnSync('keytool', [
  '-genkeypair',
  '-alias',
  'xicheng-release',
  '-keystore',
  keystorePath,
  '-storepass',
  'store-secret',
  '-keypass',
  'key-secret',
  '-storetype',
  'PKCS12',
  '-keyalg',
  'RSA',
  '-keysize',
  '2048',
  '-validity',
  '3650',
  '-dname',
  'CN=Xicheng Release, OU=Xinghe, O=Xinghe, L=Beijing, ST=Beijing, C=CN',
  '-noprompt'
], {
  cwd: tempDir,
  encoding: 'utf8'
})
assert.equal(
  keytoolResult.status,
  0,
  `test fixture should create a valid Android keystore with keytool: ${keytoolResult.stderr || keytoolResult.stdout}`
)
fs.writeFileSync(fakeCliPath, [
  '#!/bin/sh',
  `{
    printf '%s\\n' '---'
    printf '%s\\n' "$@"
  } >> ${JSON.stringify(invocationPath)}`,
  'exit 0'
].join('\n'))
fs.chmodSync(fakeCliPath, 0o755)

fs.writeFileSync(softFailureCliPath, [
  '#!/bin/sh',
  'if [ "$1" = "project" ]; then',
  '  exit 0',
  'fi',
  'printf "%s\\n" "01:44:51.737 项目 /tmp/xunjing-app 不存在，请先导入"',
  'exit 0'
].join('\n'))
fs.chmodSync(softFailureCliPath, 0o755)

fs.writeFileSync(importSoftFailureCliPath, [
  '#!/bin/sh',
  'if [ "$1" = "project" ]; then',
  '  printf "%s\\n" "01:44:51.737 项目 /tmp/xunjing-app 不存在，请先导入"',
  '  exit 0',
  'fi',
  'printf "%s\\n" "pack should not run after project import soft failure"',
  'exit 0'
].join('\n'))
fs.chmodSync(importSoftFailureCliPath, 0o755)

fs.writeFileSync(loginFailureCliPath, [
  '#!/bin/sh',
  'if [ "$1" = "project" ]; then',
  '  exit 0',
  'fi',
  'printf "%s\\n" "01:59:13.144 user not login"',
  'exit 0'
].join('\n'))
fs.chmodSync(loginFailureCliPath, 0o755)

fs.writeFileSync(missingPluginCliPath, [
  '#!/bin/sh',
  'if [ "$1" = "project" ]; then',
  '  exit 0',
  'fi',
  'printf "%s\\n" "09:45:10.298 当前操作依赖插件【app-safe-pack】，请安装后再试"',
  'exit 0'
].join('\n'))
fs.chmodSync(missingPluginCliPath, 0o755)

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

const readInvocationBlocks = () => fs.readFileSync(invocationPath, 'utf8')
  .split('---\n')
  .map((block) => block.trim().split('\n').filter(Boolean))
  .filter((block) => block.length > 0)

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
const invocationBlocks = readInvocationBlocks()
assert.equal(invocationBlocks.length, 2, 'execute should import the HBuilderX project before running pack')
const importArgs = invocationBlocks[0]
const invokedArgs = invocationBlocks[1]
assert.deepEqual(
  importArgs,
  ['project', 'open', '--path', executeJson.command.argv[executeJson.command.argv.indexOf('--project') + 1]],
  'execute should import the exact project path that will be passed to HBuilderX pack'
)
assert.ok(invokedArgs.includes('pack'))
assert.ok(invokedArgs.includes('--android.certpassword'))
assert.ok(invokedArgs.includes('key-secret'))
assert.ok(invokedArgs.includes('--android.storepassword'))
assert.ok(invokedArgs.includes('store-secret'))

const importSoftFailureExecuteResult = runPack({
  XUNJING_NATIVE_PACK_CONFIRM: 'cloud-pack',
  HBUILDERX_CLI: importSoftFailureCliPath
}, ['--execute'])
assert.notEqual(
  importSoftFailureExecuteResult.status,
  0,
  'native cloud pack execute should fail when HBuilderX project import prints a soft failure even with exit 0'
)
assert.match(
  `${importSoftFailureExecuteResult.stderr}\n${importSoftFailureExecuteResult.stdout}`,
  /不存在|请先导入|project|import/i,
  'native cloud pack execute should explain HBuilderX project import soft failure output'
)

const softFailureExecuteResult = runPack({
  XUNJING_NATIVE_PACK_CONFIRM: 'cloud-pack',
  HBUILDERX_CLI: softFailureCliPath
}, ['--execute'])
assert.notEqual(
  softFailureExecuteResult.status,
  0,
  'native cloud pack execute should fail when HBuilderX prints a project-not-imported soft failure even with exit 0'
)
assert.match(
  `${softFailureExecuteResult.stderr}\n${softFailureExecuteResult.stdout}`,
  /不存在|请先导入|project/i,
  'native cloud pack execute should explain HBuilderX soft failure output'
)

const loginFailureExecuteResult = runPack({
  XUNJING_NATIVE_PACK_CONFIRM: 'cloud-pack',
  HBUILDERX_CLI: loginFailureCliPath
}, ['--execute'])
assert.notEqual(
  loginFailureExecuteResult.status,
  0,
  'native cloud pack execute should fail when HBuilderX prints a not-login soft failure even with exit 0'
)
assert.match(
  `${loginFailureExecuteResult.stderr}\n${loginFailureExecuteResult.stdout}`,
  /login|登录/i,
  'native cloud pack execute should explain HBuilderX login soft failure output'
)

const missingPluginExecuteResult = runPack({
  XUNJING_NATIVE_PACK_CONFIRM: 'cloud-pack',
  HBUILDERX_CLI: missingPluginCliPath
}, ['--execute'])
assert.notEqual(
  missingPluginExecuteResult.status,
  0,
  'native cloud pack execute should fail when HBuilderX reports a missing app-safe-pack plugin even with exit 0'
)
assert.match(
  `${missingPluginExecuteResult.stderr}\n${missingPluginExecuteResult.stdout}`,
  /app-safe-pack|插件|请安装/i,
  'native cloud pack execute should explain HBuilderX missing plugin soft failure output'
)

const missingEnvResult = runPack({
  XUNJING_ANDROID_PACKAGE_NAME: ''
})
assert.notEqual(missingEnvResult.status, 0, 'native cloud pack dry-run should fail when readiness env is incomplete')
assert.match(
  `${missingEnvResult.stderr}\n${missingEnvResult.stdout}`,
  /XUNJING_ANDROID_PACKAGE_NAME/i,
  'native cloud pack dry-run should surface readiness validation errors'
)
