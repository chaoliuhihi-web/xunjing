import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8')

const config = read('request', 'config.js')
const requestClient = read('request', 'request.js')
const authPage = read('pagesLogin', 'auth', 'auth.vue')
const myPage = read('subPackages', 'user', 'my', 'my.vue')
const indexPage = read('pages', 'index', 'index.vue')
const aiGuidePage = read('pages', 'ai-guide', 'ai-guide.vue')
const imageAskDoc = read('图片提问功能说明.md')
const contractPath = path.join(root, 'docs', 'online-api-first-contract.md')
const apiContract = fs.existsSync(contractPath) ? fs.readFileSync(contractPath, 'utf8') : ''

assert.match(
  config,
  /UrlRequest:\s*"https:\/\/kashi\.weiapp\.net\/"/,
  'Default request base should stay on the existing online Kashgar service'
)

assert.match(
  requestClient,
  /url:\s*config\.UrlRequest\s*\+\s*url/,
  'Shared request client should compose api2 paths against the online base URL'
)

assert.match(
  config,
  /UrlYudaoAppRequest:\s*normalizeApiBaseUrl\(runtimeEnv\.VITE_XUNJING_YUDAO_APP_BASE_URL\s*\|\|\s*"https:\/\/kashi\.weiapp\.net\/"\)/,
  'Yudao APP API should default to the online HTTPS base while allowing deployment override'
)

assert.match(
  config,
  /XunjingTenantId:\s*String\(runtimeEnv\.VITE_XUNJING_TENANT_ID\s*\|\|\s*"1"\)/,
  'Yudao APP API calls should carry the configured tenant id required by the backend'
)

assert.match(
  authPage,
  /uni\.login\(\{[\s\S]*provider:\s*'weixin'[\s\S]*onlyAuthorize:\s*true[\s\S]*wxLogin\(loginRes\.code\)/,
  'Registration/login should keep the original WeChat login flow'
)

assert.match(
  authPage,
  /request\('api2\/user\/get_user',\s*params,\s*'GET',\s*false\)/,
  'WeChat code exchange should keep using the existing online api2/user/get_user endpoint'
)

assert.match(
  myPage,
  /request\('api2\/user\/user_save',\s*\{\s*openid,\s*\.\.\.payload\s*\},\s*'POST'\)/,
  'User profile save should keep using existing online api2/user/user_save'
)

for (const required of [
  "apiPath: 'app-api/xunjing/scan/resolve'",
  'buildYudaoAppApiUrl(XUNJING_SCAN_CONFIG.apiPath)',
  "'tenant-id': XUNJING_SCAN_CONFIG.tenantId",
  'userTraceId: this.getXunjingUserTraceId()',
  'resolveXunjingScanLaunch(options)',
  'uni.scanCode',
  '/subPackages/feature/map/map'
]) {
  assert.ok(indexPage.includes(required), `Index page should call the Yudao APP scan resolver: ${required}`)
}

for (const required of [
  "apiPath: 'app-api/xunjing/ai/chat'",
  "apiPath: 'app-api/xunjing/resource/package'",
  "apiPath: 'app-api/xunjing/resource/events'",
  'buildYudaoAppApiUrl(XUNJING_AI_CONFIG.apiPath)',
  'buildYudaoAppApiUrl(XUNJING_RESOURCE_CONFIG.apiPath)',
  'buildYudaoAppApiUrl(XUNJING_EVENT_CONFIG.apiPath)',
  "'tenant-id': XUNJING_AI_CONFIG.tenantId",
  "'tenant-id': XUNJING_RESOURCE_CONFIG.tenantId",
  "'tenant-id': XUNJING_EVENT_CONFIG.tenantId",
  'packageCode: XUNJING_AI_CONFIG.packageCode',
  'packageCode: XUNJING_RESOURCE_CONFIG.packageCode',
  'packageCode: XUNJING_EVENT_CONFIG.packageCode',
  "sceneCode: XUNJING_AI_CONFIG.sceneCode",
  "sourceChannel: XUNJING_AI_CONFIG.sourceChannel",
  'question'
]) {
  assert.ok(aiGuidePage.includes(required), `AI guide should call the Yudao APP AI proxy: ${required}`)
}

for (const [label, source] of [
  ['request config', config],
  ['auth page', authPage],
  ['my page', myPage],
  ['index page', indexPage],
]) {
  assert.doesNotMatch(
    source,
    /localhost|127\.0\.0\.1|\/admin-api\//i,
    `${label} should not switch APP runtime calls to local or admin endpoints`
  )
}

for (const [label, source] of [
  ['auth page', authPage],
  ['my page', myPage],
]) {
  assert.doesNotMatch(
    source,
    /\/app-api\/|yudao/i,
    `${label} should keep original api2 auth/profile endpoints and not move to Yudao`
  )
}

assert.doesNotMatch(
  aiGuidePage,
  /https:\/\/api\.coze\.cn|Authorization['"]?\s*:\s*`Bearer|enableChunked:\s*true|stream:\s*true|uni\.uploadFile\(/,
  'AI guide should not call Coze or upload files directly from the APP client'
)

for (const [label, source] of [
  ['AI guide page', aiGuidePage],
  ['image ask doc', imageAskDoc]
]) {
  assert.doesNotMatch(
    source,
    /pat_[A-Za-z0-9]{20,}/,
    `${label} should not contain a real client-side Coze PAT`
  )
}

for (const required of [
  '线上接口优先',
  'api2/user/get_user',
  'api2/user/user_save',
  '/app-api/xunjing/scan/resolve',
  '/app-api/xunjing/resource/package',
  '/app-api/xunjing/resource/events',
  '/app-api/xunjing/ai/chat',
  '扫码场景解析走 Yudao APP 代理',
  '资源包公开读取走 Yudao APP 代理',
  '访问与 AI 提问事件回传走 Yudao APP 代理',
  'AI 对话走 Yudao APP 代理',
  '客户端不保存 Coze Token',
  'Yudao 只承接线上接口无法覆盖的能力'
]) {
  assert.ok(apiContract.includes(required), `Online API contract should document ${required}`)
}
