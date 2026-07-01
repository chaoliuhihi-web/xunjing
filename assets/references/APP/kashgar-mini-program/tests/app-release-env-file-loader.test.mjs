import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const repoRoot = spawnSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: root,
  encoding: 'utf8'
}).stdout.trim()
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const scriptPath = path.join(root, 'scripts', 'verify_release_app_env.mjs')
const buildRunnerPath = path.join(root, 'scripts', 'run_release_app_build.mjs')
const preprodRunnerPath = path.join(root, 'scripts', 'run_preprod_yudao_verify.mjs')
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xicheng-release-env-'))
const envFilePath = path.join(tempDir, 'preprod.env')
const platformEnvFilePath = path.join(tempDir, 'platform.env')

assert.ok(
  fs.existsSync(buildRunnerPath),
  'APP should provide scripts/run_release_app_build.mjs so build:app:release can inherit values loaded from XUNJING_RELEASE_ENV_FILE'
)

assert.ok(
  (packageJson.scripts?.['build:app:release'] || '').includes('node scripts/run_release_app_build.mjs'),
  'build:app:release should use the Node release build runner instead of shell-only env interpolation'
)

assert.ok(
  fs.existsSync(preprodRunnerPath),
  'APP should provide scripts/run_preprod_yudao_verify.mjs so verify:yudao:preprod can inherit values loaded from XUNJING_RELEASE_ENV_FILE'
)

assert.ok(
  (packageJson.scripts?.['verify:yudao:preprod'] || '').includes('node scripts/run_preprod_yudao_verify.mjs'),
  'verify:yudao:preprod should use the Node preprod runner instead of shell-only env interpolation'
)

fs.writeFileSync(envFilePath, [
  '# APP release gateway values are loaded from a secure env file.',
  'XUNJING_APP_API_BASE_URL="https://api.xingheai.net/"',
  'XUNJING_TENANT_ID=1'
].join('\n'))

fs.writeFileSync(platformEnvFilePath, [
  '# Full platform readiness variables are kept separate from APP release signing variables.',
  'SPRING_PROFILES_ACTIVE=preprod',
  'MYSQL_HOST=preprod-db.internal'
].join('\n'))

const result = spawnSync(process.execPath, [scriptPath], {
  cwd: root,
  env: {
    ...process.env,
    XUNJING_RELEASE_ENV_FILE: envFilePath,
    XUNJING_APP_API_BASE_URL: '',
    XUNJING_TENANT_ID: ''
  },
  encoding: 'utf8'
})

assert.equal(
  result.status,
  0,
  `release env verification should load gateway values from XUNJING_RELEASE_ENV_FILE: ${result.stderr || result.stdout}`
)

const dryRunResult = spawnSync(process.execPath, [buildRunnerPath, '--dry-run'], {
  cwd: root,
  env: {
    ...process.env,
    XUNJING_RELEASE_ENV_FILE: envFilePath,
    XUNJING_APP_API_BASE_URL: '',
    XUNJING_TENANT_ID: ''
  },
  encoding: 'utf8'
})

assert.equal(
  dryRunResult.status,
  0,
  `release build runner should load gateway values from XUNJING_RELEASE_ENV_FILE: ${dryRunResult.stderr || dryRunResult.stdout}`
)
const dryRunJson = JSON.parse(dryRunResult.stdout)
assert.equal(dryRunJson.ok, true)
assert.equal(dryRunJson.env.VITE_XUNJING_YUDAO_APP_BASE_URL, 'https://api.xingheai.net/')
assert.equal(dryRunJson.env.VITE_XUNJING_TENANT_ID, '1')
assert.equal(dryRunJson.env.UNI_OUTPUT_DIR, 'dist/build/app-release')

const preprodDryRunResult = spawnSync(process.execPath, [preprodRunnerPath, '--dry-run'], {
  cwd: root,
  env: {
    ...process.env,
    XUNJING_RELEASE_ENV_FILE: envFilePath,
    XUNJING_PLATFORM_ENV_FILE: platformEnvFilePath,
    XUNJING_APP_API_BASE_URL: '',
    XUNJING_TENANT_ID: ''
  },
  encoding: 'utf8'
})

assert.equal(
  preprodDryRunResult.status,
  0,
  `preprod verify runner should load gateway values from XUNJING_RELEASE_ENV_FILE: ${preprodDryRunResult.stderr || preprodDryRunResult.stdout}`
)
const preprodDryRunJson = JSON.parse(preprodDryRunResult.stdout)
assert.equal(preprodDryRunJson.ok, true)
assert.equal(preprodDryRunJson.cwd, repoRoot)
assert.ok(preprodDryRunJson.args.includes('--include-xicheng-app-check'))
assert.ok(preprodDryRunJson.args.includes('--include-xicheng-trigger-check'))
assert.equal(preprodDryRunJson.args[preprodDryRunJson.args.indexOf('--env-file') + 1], platformEnvFilePath)
assert.equal(preprodDryRunJson.args[preprodDryRunJson.args.indexOf('--base-url') + 1], 'https://api.xingheai.net/')
assert.equal(preprodDryRunJson.args[preprodDryRunJson.args.indexOf('--tenant-id') + 1], '1')

const relativePlatformDryRunResult = spawnSync(process.execPath, [preprodRunnerPath, '--dry-run'], {
  cwd: root,
  env: {
    ...process.env,
    XUNJING_RELEASE_ENV_FILE: envFilePath,
    XUNJING_PLATFORM_ENV_FILE: 'ops/xunjing-platform.env.example',
    XUNJING_APP_API_BASE_URL: '',
    XUNJING_TENANT_ID: ''
  },
  encoding: 'utf8'
})

assert.equal(
  relativePlatformDryRunResult.status,
  0,
  `preprod verify runner should accept repo-root relative platform env paths: ${relativePlatformDryRunResult.stderr || relativePlatformDryRunResult.stdout}`
)
const relativePlatformDryRunJson = JSON.parse(relativePlatformDryRunResult.stdout)
assert.equal(
  relativePlatformDryRunJson.args[relativePlatformDryRunJson.args.indexOf('--env-file') + 1],
  path.join(repoRoot, 'ops', 'xunjing-platform.env.example'),
  'preprod verify runner should resolve relative XUNJING_PLATFORM_ENV_FILE from repo root, not the APP package directory'
)

const localEnvFilePath = path.join(tempDir, 'local.env')
fs.writeFileSync(localEnvFilePath, [
  'XUNJING_APP_API_BASE_URL=http://127.0.0.1:48082',
  'XUNJING_TENANT_ID=1'
].join('\n'))

const localResult = spawnSync(process.execPath, [scriptPath], {
  cwd: root,
  env: {
    ...process.env,
    XUNJING_RELEASE_ENV_FILE: localEnvFilePath,
    XUNJING_APP_API_BASE_URL: '',
    XUNJING_TENANT_ID: ''
  },
  encoding: 'utf8'
})

assert.notEqual(localResult.status, 0, 'release env verification should still reject local gateways loaded from env files')
assert.match(
  `${localResult.stderr}\n${localResult.stdout}`,
  /non-local HTTPS|https:\/\//i,
  'release env verification should explain the non-local HTTPS requirement for env-file values'
)
