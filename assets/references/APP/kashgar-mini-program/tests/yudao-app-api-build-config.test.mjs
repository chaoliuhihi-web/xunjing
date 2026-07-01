import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const config = fs.readFileSync(path.join(root, 'request', 'config.js'), 'utf8')
const apiContract = fs.readFileSync(path.join(root, 'docs', 'online-api-first-contract.md'), 'utf8')
const releaseEnvGuard = fs.readFileSync(path.join(root, 'scripts', 'verify_release_app_env.mjs'), 'utf8')
const scripts = packageJson.scripts || {}

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

assert.match(
  config,
  /const normalizeApiBaseUrl\s*=\s*\(value\)[\s\S]*replace\(\/\\\/\+\$\/,\s*''\)[\s\S]*`\$\{base\}\/`/,
  'Yudao APP API base URL should be normalized to one trailing slash'
)

assert.match(
  config,
  /UrlYudaoAppRequest:\s*normalizeApiBaseUrl\(runtimeEnv\.VITE_XUNJING_YUDAO_APP_BASE_URL\s*\|\|\s*"https:\/\/kashi\.weiapp\.net\/"\)/,
  'Yudao APP API base should default to the current online domain while allowing deployment override'
)

assert.match(
  config,
  /XunjingTenantId:\s*String\(runtimeEnv\.VITE_XUNJING_TENANT_ID\s*\|\|\s*"1"\)/,
  'Yudao tenant id should default to the Kashgar P0 tenant and allow deployment override'
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
  /node scripts\/verify_release_app_env\.mjs/,
  'APP release build should run the dedicated release environment guard before UniApp build'
)

assert.ok(
  releaseEnvGuard.includes('Set XUNJING_APP_API_BASE_URL to a non-local HTTPS Yudao APP gateway'),
  'APP release environment guard should fail fast unless a non-local HTTPS Yudao APP gateway is provided'
)

assert.match(
  releaseEnvGuard,
  /parsed\.protocol !== 'https:'/,
  'APP release environment guard should require HTTPS API bases'
)

for (const forbiddenReleaseBase of [
  "hostname === 'localhost'",
  "hostname === '127.0.0.1'",
  "hostname === '0.0.0.0'",
  "hostname === '::1'",
  "hostname.startsWith('192.168.')",
  "hostname.startsWith('10.')",
  "hostname.startsWith('172.')",
]) {
  assert.ok(
    releaseEnvGuard.includes(forbiddenReleaseBase),
    `APP release environment guard should reject ${forbiddenReleaseBase}`
  )
}

assert.ok(
  releaseEnvGuard.includes('XUNJING_APP_API_BASE_URL must be a non-local HTTPS URL'),
  'APP release build should reject local and LAN API bases so field packages do not ship against development services'
)

assert.match(
  scripts['build:app:release'] || '',
  /VITE_XUNJING_YUDAO_APP_BASE_URL="\$XUNJING_APP_API_BASE_URL"/,
  'APP release build should pass the release gateway into the UniApp bundle'
)

assert.match(
  scripts['build:app:release'] || '',
  /VITE_XUNJING_TENANT_ID="\$XUNJING_TENANT_ID"/,
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
  /node scripts\/verify_release_app_env\.mjs/,
  'APP preprod readiness script should reuse the non-local HTTPS release environment guard'
)

assert.match(
  scripts['verify:yudao:preprod'] || '',
  /cd \.\.\/\.\.\/\.\.\/\.\. && npm run xunjing:platform:verify --/,
  'APP preprod readiness script should run the root Yudao platform verifier from the APP directory'
)

for (const required of [
  '--env-file ${XUNJING_RELEASE_ENV_FILE:?Set XUNJING_RELEASE_ENV_FILE to the preprod or production env file}',
  '--base-url "$XUNJING_APP_API_BASE_URL"',
  '--tenant-id "$XUNJING_TENANT_ID"',
  '--skip-admin-check',
  '--include-xicheng-app-check',
  '--include-xicheng-trigger-check',
  '--evidence-file qa/xicheng-app-readiness-evidence.json'
]) {
  assert.ok(
    (scripts['verify:yudao:preprod'] || '').includes(required),
    `APP preprod readiness script should include ${required}`
  )
}
