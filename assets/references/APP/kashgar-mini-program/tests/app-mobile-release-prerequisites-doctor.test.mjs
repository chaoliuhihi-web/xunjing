import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const scriptPath = path.join(root, 'scripts', 'diagnose_mobile_release_prerequisites.mjs')
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-release-prereq-'))
const keystorePath = path.join(tempDir, 'xicheng-release.keystore')
const loggedOutCliPath = path.join(tempDir, 'hbuilderx-logged-out-cli')
const loggedInCliPath = path.join(tempDir, 'hbuilderx-logged-in-cli')

assert.ok(
  fs.existsSync(scriptPath),
  'APP should provide scripts/diagnose_mobile_release_prerequisites.mjs for release prerequisite diagnostics'
)

assert.ok(
  (packageJson.scripts?.['doctor:release:prereqs'] || '').includes('node scripts/diagnose_mobile_release_prerequisites.mjs'),
  'APP package should expose npm run doctor:release:prereqs'
)

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

fs.writeFileSync(loggedOutCliPath, [
  '#!/bin/sh',
  'if [ "$1" = "user" ] && [ "$2" = "info" ]; then',
  '  printf "%s\\n" "" "0:user info:OK"',
  '  exit 0',
  'fi',
  'exit 0'
].join('\n'))
fs.chmodSync(loggedOutCliPath, 0o755)

fs.writeFileSync(loggedInCliPath, [
  '#!/bin/sh',
  'if [ "$1" = "user" ] && [ "$2" = "info" ]; then',
  '  printf "%s\\n" "username: release@example.com" "0:user info:OK"',
  '  exit 0',
  'fi',
  'exit 0'
].join('\n'))
fs.chmodSync(loggedInCliPath, 0o755)

const baseEnv = {
  XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
  XUNJING_TENANT_ID: '1',
  XUNJING_RELEASE_TARGETS: 'android',
  XUNJING_ANDROID_PACKAGE_NAME: 'com.xinghe.xunjing',
  XUNJING_ANDROID_KEYSTORE: keystorePath,
  XUNJING_ANDROID_KEY_ALIAS: 'xicheng-release',
  XUNJING_ANDROID_KEYSTORE_PASSWORD: 'store-secret',
  XUNJING_ANDROID_KEY_PASSWORD: 'key-secret',
  XUNJING_RELEASE_PREREQ_SKIP_NETWORK: '1'
}

const runDoctor = (envOverrides = {}) => spawnSync(
  process.execPath,
  [scriptPath],
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

const loggedOutResult = runDoctor({
  HBUILDERX_CLI: loggedOutCliPath
})
assert.notEqual(
  loggedOutResult.status,
  0,
  'release prerequisite doctor should fail when HBuilderX user info has no logged-in account'
)
assert.ok(!loggedOutResult.stdout.includes('store-secret'))
assert.ok(!loggedOutResult.stdout.includes('key-secret'))
const loggedOutJson = JSON.parse(loggedOutResult.stdout)
assert.equal(loggedOutJson.ok, false)
assert.ok(loggedOutJson.blockers.includes('hbuilderx-login-missing'))
assert.equal(loggedOutJson.checks.apiDns.skipped, true)
assert.equal(loggedOutJson.checks.nativePackageDryRun.ok, true)
assert.equal(loggedOutJson.checks.hbuilderxLogin.ok, false)
assert.match(
  loggedOutJson.checks.hbuilderxLogin.nextAction,
  /user login|发布账号/i,
  'HBuilderX login failure should tell the operator how to fix it'
)

const loggedInResult = runDoctor({
  HBUILDERX_CLI: loggedInCliPath
})
assert.equal(
  loggedInResult.status,
  0,
  `release prerequisite doctor should pass when release env is complete, network is skipped, and HBuilderX is logged in: ${loggedInResult.stderr || loggedInResult.stdout}`
)
const loggedInJson = JSON.parse(loggedInResult.stdout)
assert.equal(loggedInJson.ok, true)
assert.equal(loggedInJson.checks.releaseEnv.ok, true)
assert.equal(loggedInJson.checks.nativePackageDryRun.ok, true)
assert.equal(loggedInJson.checks.hbuilderxLogin.ok, true)
assert.match(loggedInJson.checks.hbuilderxLogin.account, /release@example\.com/)
