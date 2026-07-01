import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { once } from 'node:events'
import { spawn, spawnSync } from 'node:child_process'

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

const dnsFailedResult = runDoctor({
  HBUILDERX_CLI: loggedInCliPath,
  XUNJING_APP_API_BASE_URL: 'https://xicheng-prereq-doctor.no-such-xunjing',
  XUNJING_RELEASE_PREREQ_SKIP_NETWORK: '',
  XUNJING_RELEASE_PREREQ_DNS_TIMEOUT_MS: '300'
})
assert.notEqual(
  dnsFailedResult.status,
  0,
  'release prerequisite doctor should fail when the APP API DNS hostname cannot resolve'
)
const dnsFailedJson = JSON.parse(dnsFailedResult.stdout)
assert.ok(dnsFailedJson.blockers.includes('api-dns-unavailable'))
assert.ok(!dnsFailedJson.blockers.includes('api-unreachable'))
assert.equal(dnsFailedJson.checks.apiReachability.ok, true)
assert.equal(dnsFailedJson.checks.apiReachability.skipped, true)
assert.equal(
  dnsFailedJson.nextActions.filter((action) => /Fix DNS or network access/.test(action)).length,
  1,
  'dependent skipped checks should not duplicate the DNS repair action'
)

const appApiServerPath = path.join(tempDir, 'app-api-server.mjs')
fs.writeFileSync(appApiServerPath, [
  "import http from 'node:http'",
  "const server = http.createServer((request, response) => {",
  "  if (request.url === '/app-api/xunjing/scan/resolve' && request.headers['tenant-id'] === '1') {",
  "    response.writeHead(405, { 'content-type': 'application/json' })",
  "    response.end(JSON.stringify({ code: 405, msg: 'method not allowed' }))",
  "    return",
  "  }",
  "  response.writeHead(404, { 'content-type': 'application/json' })",
  "  response.end(JSON.stringify({ code: 404, msg: 'not found' }))",
  "})",
  "server.listen(0, '127.0.0.1', () => console.log(server.address().port))",
  "process.on('SIGTERM', () => server.close(() => process.exit(0)))"
].join('\n'))
const appApiServer = spawn(process.execPath, [appApiServerPath], {
  cwd: tempDir,
  stdio: ['ignore', 'pipe', 'inherit']
})
const appApiPort = await new Promise((resolve, reject) => {
  appApiServer.stdout.once('data', (data) => resolve(Number(String(data).trim())))
  appApiServer.once('error', reject)
  appApiServer.once('exit', (code) => {
    if (code !== 0) reject(new Error(`mock APP API server exited before listening: ${code}`))
  })
})
try {
  const reachableResult = runDoctor({
    HBUILDERX_CLI: loggedInCliPath,
    XUNJING_RELEASE_PREREQ_SKIP_NETWORK: '',
    XUNJING_RELEASE_PREREQ_DNS_HOST_OVERRIDE: '127.0.0.1',
    XUNJING_RELEASE_PREREQ_API_ORIGIN_OVERRIDE: `http://127.0.0.1:${appApiPort}`
  })
  assert.equal(
    reachableResult.status,
    0,
    `release prerequisite doctor should pass when the APP API gateway is reachable: ${reachableResult.stderr || reachableResult.stdout}`
  )
  const reachableJson = JSON.parse(reachableResult.stdout)
  assert.equal(reachableJson.checks.apiDns.ok, true)
  assert.equal(reachableJson.checks.apiReachability.ok, true)
  assert.equal(reachableJson.checks.apiReachability.endpoint, '/app-api/xunjing/scan/resolve')
  assert.equal(reachableJson.checks.apiReachability.status, 405)
} finally {
  appApiServer.kill('SIGTERM')
  await once(appApiServer, 'exit')
}

const missingRouteServerPath = path.join(tempDir, 'app-api-missing-route-server.mjs')
fs.writeFileSync(missingRouteServerPath, [
  "import http from 'node:http'",
  "const server = http.createServer((request, response) => {",
  "  response.writeHead(404, { 'content-type': 'application/json' })",
  "  response.end(JSON.stringify({ code: 404, msg: 'not found' }))",
  "})",
  "server.listen(0, '127.0.0.1', () => console.log(server.address().port))",
  "process.on('SIGTERM', () => server.close(() => process.exit(0)))"
].join('\n'))
const missingRouteServer = spawn(process.execPath, [missingRouteServerPath], {
  cwd: tempDir,
  stdio: ['ignore', 'pipe', 'inherit']
})
const missingRoutePort = await new Promise((resolve, reject) => {
  missingRouteServer.stdout.once('data', (data) => resolve(Number(String(data).trim())))
  missingRouteServer.once('error', reject)
  missingRouteServer.once('exit', (code) => {
    if (code !== 0) reject(new Error(`mock missing-route APP API server exited before listening: ${code}`))
  })
})
try {
  const missingRouteResult = runDoctor({
    HBUILDERX_CLI: loggedInCliPath,
    XUNJING_RELEASE_PREREQ_SKIP_NETWORK: '',
    XUNJING_RELEASE_PREREQ_DNS_HOST_OVERRIDE: '127.0.0.1',
    XUNJING_RELEASE_PREREQ_API_ORIGIN_OVERRIDE: `http://127.0.0.1:${missingRoutePort}`
  })
  assert.notEqual(
    missingRouteResult.status,
    0,
    `release prerequisite doctor should fail when the APP API gateway returns 404 for /app-api/xunjing/scan/resolve: ${missingRouteResult.stderr || missingRouteResult.stdout}`
  )
  const missingRouteJson = JSON.parse(missingRouteResult.stdout)
  assert.equal(missingRouteJson.checks.apiReachability.ok, false)
  assert.equal(missingRouteJson.checks.apiReachability.status, 404)
  assert.ok(
    missingRouteJson.blockers.includes('api-route-missing'),
    'release prerequisite doctor should distinguish a missing /app-api/xunjing/** route from generic network reachability'
  )
  assert.match(
    missingRouteJson.checks.apiReachability.nextAction,
    /\/app-api\/xunjing\/scan\/resolve|route|gateway/i,
    'missing route failure should tell operators to fix the deployed xunjing APP API route'
  )
} finally {
  missingRouteServer.kill('SIGTERM')
  await once(missingRouteServer, 'exit')
}

const unauthorizedServerPath = path.join(tempDir, 'app-api-unauthorized-server.mjs')
fs.writeFileSync(unauthorizedServerPath, [
  "import http from 'node:http'",
  "const server = http.createServer((request, response) => {",
  "  if (request.url === '/app-api/xunjing/scan/resolve') {",
  "    response.writeHead(401, { 'content-type': 'application/json' })",
  "    response.end(JSON.stringify({ code: 401, msg: 'unauthorized' }))",
  "    return",
  "  }",
  "  response.writeHead(404, { 'content-type': 'application/json' })",
  "  response.end(JSON.stringify({ code: 404, msg: 'not found' }))",
  "})",
  "server.listen(0, '127.0.0.1', () => console.log(server.address().port))",
  "process.on('SIGTERM', () => server.close(() => process.exit(0)))"
].join('\n'))
const unauthorizedServer = spawn(process.execPath, [unauthorizedServerPath], {
  cwd: tempDir,
  stdio: ['ignore', 'pipe', 'inherit']
})
const unauthorizedPort = await new Promise((resolve, reject) => {
  unauthorizedServer.stdout.once('data', (data) => resolve(Number(String(data).trim())))
  unauthorizedServer.once('error', reject)
  unauthorizedServer.once('exit', (code) => {
    if (code !== 0) reject(new Error(`mock unauthorized APP API server exited before listening: ${code}`))
  })
})
try {
  const unauthorizedResult = runDoctor({
    HBUILDERX_CLI: loggedInCliPath,
    XUNJING_RELEASE_PREREQ_SKIP_NETWORK: '',
    XUNJING_RELEASE_PREREQ_DNS_HOST_OVERRIDE: '127.0.0.1',
    XUNJING_RELEASE_PREREQ_API_ORIGIN_OVERRIDE: `http://127.0.0.1:${unauthorizedPort}`
  })
  assert.notEqual(
    unauthorizedResult.status,
    0,
    `release prerequisite doctor should fail when the APP API gateway requires auth for /app-api/xunjing/scan/resolve: ${unauthorizedResult.stderr || unauthorizedResult.stdout}`
  )
  const unauthorizedJson = JSON.parse(unauthorizedResult.stdout)
  assert.equal(unauthorizedJson.checks.apiReachability.ok, false)
  assert.equal(unauthorizedJson.checks.apiReachability.status, 401)
  assert.ok(
    unauthorizedJson.blockers.includes('api-unauthorized'),
    'release prerequisite doctor should reject APP API gateways that require auth before P0 public scan/recognition flows can run'
  )
  assert.match(
    unauthorizedJson.checks.apiReachability.nextAction,
    /auth|permission|public APP API|\/app-api\/xunjing/i,
    'unauthorized APP API failure should tell operators to fix auth or route permissions'
  )
} finally {
  unauthorizedServer.kill('SIGTERM')
  await once(unauthorizedServer, 'exit')
}
