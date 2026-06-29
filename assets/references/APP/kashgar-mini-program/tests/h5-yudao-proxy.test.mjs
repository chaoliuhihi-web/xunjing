import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const viteConfig = fs.readFileSync(path.join(root, 'vite.config.js'), 'utf8')
const scripts = packageJson.scripts || {}

assert.match(
  scripts['dev:h5'],
  /VITE_XUNJING_YUDAO_APP_BASE_URL=\/\s+/,
  'H5 dev should use relative /app-api requests so Vite can proxy Yudao APP APIs without browser CORS'
)

assert.match(
  scripts['dev:h5'],
  /VITE_XUNJING_H5_PROXY_TARGET=http:\/\/localhost:48082\s+/,
  'H5 dev should proxy Xunjing APP APIs to the local Yudao server so P0 recognition uses reviewed backend results instead of development fixtures'
)

assert.doesNotMatch(
  scripts['build:app'],
  /VITE_XUNJING_YUDAO_APP_BASE_URL=\//,
  'APP production build should not inherit the H5 local proxy base URL'
)

for (const required of [
  'server:',
  'proxy:',
  "'/app-api/xunjing'",
  "target: process.env.VITE_XUNJING_H5_PROXY_TARGET || 'https://kashi.weiapp.net'",
  'changeOrigin: true',
  'secure: true'
]) {
  assert.ok(viteConfig.includes(required), `Vite config should expose H5 Yudao proxy setting ${required}`)
}

assert.doesNotMatch(
  viteConfig,
  /localhost|127\.0\.0\.1|\/admin-api\//i,
  'H5 proxy should not point to local/admin endpoints by default'
)
