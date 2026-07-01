import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const config = fs.readFileSync(path.join(root, 'request', 'config.js'), 'utf8')
const viteConfig = fs.readFileSync(path.join(root, 'vite.config.js'), 'utf8')
const apiContract = fs.readFileSync(path.join(root, 'docs', 'online-api-first-contract.md'), 'utf8')
const releaseEnvGuard = fs.readFileSync(path.join(root, 'scripts', 'verify_release_app_env.mjs'), 'utf8')
const releaseAppEnv = fs.readFileSync(path.join(root, 'scripts', 'release_app_env.mjs'), 'utf8')
const releaseUrlGuard = fs.readFileSync(path.join(root, 'scripts', 'release_url_guard.mjs'), 'utf8')
const releaseBuildRunner = fs.readFileSync(path.join(root, 'scripts', 'run_release_app_build.mjs'), 'utf8')
const preprodRunner = fs.readFileSync(path.join(root, 'scripts', 'run_preprod_yudao_verify.mjs'), 'utf8')
const scripts = packageJson.scripts || {}
const { normalizeReleaseHttpsUrl } = await import(pathToFileURL(path.join(root, 'scripts', 'release_url_guard.mjs')).href)

assert.match(
  config,
  /VITE_XUNJING_YUDAO_APP_BASE_URL/,
  'Yudao APP API base URL should be overridable at APP build time'
)

assert.match(
  config,
  /VITE_XUNJING_TENANT_ID/,
  'Yudao tenant id should be overridable at APP build time'
)

assert.ok(
  viteConfig.includes('__XUNJING_BUILD_YUDAO_APP_BASE_URL__') &&
  viteConfig.includes('__XUNJING_BUILD_TENANT_ID__'),
  'Vite config should define release build constants so app-plus output can inline the selected Yudao APP gateway and tenant'
)

assert.ok(
  config.includes('__XUNJING_BUILD_YUDAO_APP_BASE_URL__') &&
  config.includes('__XUNJING_BUILD_TENANT_ID__'),
  'Request config should prefer build-time constants before import.meta.env so release app-plus bundles do not retain stale Yudao fallback gateways'
)

assert.match(
  config,
  /const normalizeApiBaseUrl\s*=\s*\(value\)[\s\S]*replace\(\/\\\/\+\$\/,\s*''\)[\s\S]*`\$\{base\}\/`/,
  'Yudao APP API base URL should be normalized to one trailing slash'
)

assert.match(
  config,
  /UrlYudaoAppRequest:\s*normalizeApiBaseUrl\(buildTimeYudaoAppBaseUrl\s*\|\|\s*runtimeEnv\.VITE_XUNJING_YUDAO_APP_BASE_URL\s*\|\|\s*"https:\/\/kashi\.weiapp\.net\/"\)/,
  'Yudao APP API base should prefer build-time release constants, then runtime env, then the current online fallback'
)

assert.match(
  config,
  /XunjingTenantId:\s*String\(buildTimeTenantId\s*\|\|\s*runtimeEnv\.VITE_XUNJING_TENANT_ID\s*\|\|\s*"1"\)/,
  'Yudao tenant id should prefer build-time release constants, then runtime env, then tenant 1 fallback'
)

assert.ok(
  apiContract.includes('VITE_XUNJING_YUDAO_APP_BASE_URL'),
  'Online API contract should document the Yudao APP API build-time override'
)

assert.ok(
  apiContract.includes('VITE_XUNJING_TENANT_ID'),
  'Online API contract should document the tenant build-time override'
)

assert.match(
  scripts['build:app:release'] || '',
  /node scripts\/run_release_app_build\.mjs/,
  'APP release build should run the Node release build runner'
)

assert.ok(
  releaseEnvGuard.includes('readReleaseAppEnv') &&
    releaseAppEnv.includes('Set XUNJING_APP_API_BASE_URL to a non-local HTTPS Yudao APP gateway'),
  'APP release environment guard should fail fast unless a non-local HTTPS Yudao APP gateway is provided'
)

assert.match(
  releaseUrlGuard,
  /parsed\.protocol !== 'https:'/,
  'APP release environment guard should require HTTPS API bases'
)

for (const forbiddenReleaseBase of [
  'https://localhost',
  'https://127.0.0.1',
  'https://0.0.0.0',
  'https://[::1]',
  'https://192.168.110.190',
  'https://10.0.0.8',
  'https://172.16.0.8',
  'https://[::ffff:127.0.0.1]',
  'https://[::ffff:10.0.0.8]',
]) {
  assert.throws(
    () => normalizeReleaseHttpsUrl('test release URL', forbiddenReleaseBase),
    /non-local HTTPS URL|reserved|placeholder/i,
    `APP release environment guard should reject ${forbiddenReleaseBase}`
  )
}

assert.ok(
  releaseUrlGuard.includes('must be a non-local HTTPS URL'),
  'APP release build should reject local and LAN API bases so field packages do not ship against development services'
)

for (const reservedReleaseBase of [
  "hostname === 'example.com'",
  "hostname.endsWith('.example.com')",
  "hostname.endsWith('.test')",
  "hostname.endsWith('.invalid')",
  "hostname.includes('placeholder')"
]) {
  assert.ok(
    releaseUrlGuard.includes(reservedReleaseBase),
    `APP release environment guard should reject reserved or placeholder base ${reservedReleaseBase}`
  )
}

assert.match(
  releaseBuildRunner,
  /VITE_XUNJING_YUDAO_APP_BASE_URL:\s*releaseEnv\.apiBaseUrl/,
  'APP release build should pass the release gateway into the UniApp bundle'
)

assert.match(
  releaseBuildRunner,
  /VITE_XUNJING_TENANT_ID:\s*releaseEnv\.tenantId/,
  'APP release build should require the release tenant id instead of silently using tenant 1'
)

assert.match(
  scripts['verify:yudao:local'] || '',
  /cd \.\.\/\.\.\/\.\.\/\.\. && npm run xunjing:platform:verify --/,
  'APP local readiness script should run the root Yudao platform verifier from the APP directory'
)

for (const required of [
  '--base-url ${XUNJING_LOCAL_APP_API_BASE_URL:-http://127.0.0.1:48082}',
  '--tenant-id ${XUNJING_TENANT_ID:-1}',
  '--skip-admin-check',
  '--include-xicheng-app-check',
  '--include-xicheng-trigger-check',
  '--evidence-file qa/xicheng-app-readiness-local-evidence.json'
]) {
  assert.ok(
    (scripts['verify:yudao:local'] || '').includes(required),
    `APP local readiness script should include ${required}`
  )
}

assert.match(
  scripts['verify:yudao:preprod'] || '',
  /node scripts\/run_preprod_yudao_verify\.mjs/,
  'APP preprod readiness script should use the Node preprod runner'
)

assert.match(
  preprodRunner,
  /xunjing:platform:verify/,
  'APP preprod readiness runner should run the root Yudao platform verifier from the APP directory'
)

for (const required of [
  '--env-file',
  '--base-url',
  '--tenant-id',
  '--skip-admin-check',
  '--include-xicheng-app-check',
  '--include-xicheng-trigger-check',
  '--evidence-file',
  'qa/xicheng-app-readiness-evidence.json'
]) {
  assert.ok(
    preprodRunner.includes(required),
    `APP preprod readiness runner should include ${required}`
  )
}
