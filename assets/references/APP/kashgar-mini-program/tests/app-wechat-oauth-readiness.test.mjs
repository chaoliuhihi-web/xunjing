import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8')
const readJsonc = (...parts) => JSON.parse(
  read(...parts)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
)

const manifest = readJsonc('manifest.json')
const authPage = read('pagesLogin', 'auth', 'auth.vue')
const apiContract = read('docs', 'online-api-first-contract.md')

assert.ok(
  manifest['app-plus']?.modules?.OAuth,
  'APP manifest should enable the OAuth module required by native WeChat login'
)

assert.match(
  authPage,
  /uni\.getProvider\(\{[\s\S]*service:\s*['"]oauth['"][\s\S]*providerIds\.includes\(['"]weixin['"]\)[\s\S]*resolve\(true\)/,
  'APP login should check the native OAuth provider list before calling uni.login'
)

assert.match(
  authPage,
  /await this\.ensureWeixinOauthProvider\(\)[\s\S]*uni\.login\(\{[\s\S]*provider:\s*'weixin'[\s\S]*onlyAuthorize:\s*true/,
  'WeChat authorization should only run after provider readiness succeeds'
)

assert.match(
  authPage,
  /微信登录服务未配置|当前 APP 包未配置微信登录/,
  'APP login should show a clear readiness error when the WeChat OAuth SDK is missing'
)

for (const required of [
  '原生 APP 微信登录',
  'OAuth(登录鉴权)',
  'uni.getProvider',
  '微信开放平台 AppID',
  '/member/auth/social-login',
  'WECHAT_OPEN',
]) {
  assert.ok(
    apiContract.includes(required),
    `Online API contract should document native APP login readiness: ${required}`
  )
}
