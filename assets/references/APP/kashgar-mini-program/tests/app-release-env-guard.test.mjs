import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const scriptPath = path.join(root, 'scripts', 'verify_release_app_env.mjs')
const buildRunnerPath = path.join(root, 'scripts', 'run_release_app_build.mjs')
const buildRunner = fs.readFileSync(buildRunnerPath, 'utf8')
const releaseScript = packageJson.scripts?.['build:app:release'] || ''

assert.ok(
  fs.existsSync(scriptPath),
  'APP release environment guard should live in scripts/verify_release_app_env.mjs instead of growing package.json shell logic'
)

assert.ok(
  releaseScript.includes('node scripts/run_release_app_build.mjs') &&
    buildRunner.includes('readReleaseAppEnv') &&
    buildRunner.includes('uni'),
  'APP release build should run the release environment guard through the Node build runner before UniApp build'
)

const runGuard = (env = {}) => spawnSync(
  process.execPath,
  [scriptPath],
  {
    cwd: root,
    env: {
      ...process.env,
      XUNJING_APP_API_BASE_URL: '',
      XUNJING_TENANT_ID: '',
      ...env
    },
    encoding: 'utf8'
  }
)

for (const invalidBaseUrl of [
  'http://api.example.com',
  'https://localhost',
  'https://127.0.0.1:48082',
  'https://0.0.0.0',
  'https://192.168.110.190',
  'https://10.0.0.8',
  'https://172.16.0.8',
  'https://api.example.com',
  'https://preprod.example.net',
  'https://xicheng.test',
  'https://xicheng.invalid',
  'https://placeholder.xingheai.net',
]) {
  const result = runGuard({
    XUNJING_APP_API_BASE_URL: invalidBaseUrl,
    XUNJING_TENANT_ID: '1'
  })
  assert.notEqual(result.status, 0, `release env guard should reject ${invalidBaseUrl}`)
  assert.match(
    `${result.stderr}\n${result.stdout}`,
    /non-local HTTPS URL|must start with https:\/\/|reserved|placeholder|占位/i,
    `release env guard should explain why ${invalidBaseUrl} is invalid`
  )
}

assert.notEqual(
  runGuard({ XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net' }).status,
  0,
  'release env guard should require XUNJING_TENANT_ID'
)

for (const invalidTenantId of ['0', '-1', 'tenant-prod']) {
  const result = runGuard({
    XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
    XUNJING_TENANT_ID: invalidTenantId
  })
  assert.notEqual(result.status, 0, `release env guard should reject invalid tenant id ${invalidTenantId}`)
  assert.match(
    `${result.stderr}\n${result.stdout}`,
    /tenant.*positive integer|正整数/i,
    `release env guard should explain why tenant id ${invalidTenantId} is invalid`
  )
}

assert.equal(
  runGuard({
    XUNJING_APP_API_BASE_URL: 'https://api.xingheai.net',
    XUNJING_TENANT_ID: '1'
  }).status,
  0,
  'release env guard should allow explicit tenant and non-local HTTPS API gateway'
)
