import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const config = fs.readFileSync(path.join(root, 'request', 'config.js'), 'utf8')
const apiContract = fs.readFileSync(path.join(root, 'docs', 'online-api-first-contract.md'), 'utf8')

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
