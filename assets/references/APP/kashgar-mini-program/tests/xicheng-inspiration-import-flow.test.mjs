import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

assert.ok(exists('request', 'xunjing', 'inspiration.js'), 'P1 should add request/xunjing/inspiration.js')
assert.ok(exists('pages', 'xicheng', 'inspiration', 'inspiration.vue'), 'P1 should add a Xicheng inspiration import page')

const regionConfig = read('config', 'regions', 'xicheng.js')
const inspirationRequest = read('request', 'xunjing', 'inspiration.js')
const home = read('pages', 'xicheng', 'home', 'home.vue')
const inspirationPage = read('pages', 'xicheng', 'inspiration', 'inspiration.vue')
const routeDetail = read('pages', 'xicheng', 'route-detail', 'route-detail.vue')
const pagesJson = read('pages.json')
const combined = [regionConfig, inspirationRequest, home, inspirationPage, routeDetail].join('\n')

for (const required of [
  'XICHENG_OFFICIAL_POI_FIXTURES',
  'xicheng-baitasi',
  'xicheng-diwangmiao',
  'xicheng-shichahai',
  'officialPoiOnly',
  'inspirationImport'
]) {
  assert.ok(regionConfig.includes(required), `Xicheng region config should seed ${required}`)
}

for (const required of [
  'app-api/xunjing/inspirations/import',
  'app-api/xunjing/inspirations/{id}/confirm-pois',
  'app-api/xunjing/routes/generate',
  "'tenant-id': XICHENG_REGION_CONFIG.tenantId",
  'regionCode: XICHENG_REGION_CONFIG.regionCode',
  'packageCode: XICHENG_REGION_CONFIG.packageCode',
  'sourceChannel: XICHENG_REGION_CONFIG.sourceChannel',
  'importXichengInspiration',
  'confirmXichengInspirationPois',
  'generateXichengInspirationRoute',
  'extractXichengPlaceHints',
  'matchXichengOfficialPois',
  'createXichengInspirationDevelopmentFallback',
  'doNotStoreThirdPartyRawContent'
]) {
  assert.ok(inspirationRequest.includes(required), `Inspiration request facade should include ${required}`)
}

assert.doesNotMatch(
  inspirationRequest,
  /https:\/\/www\.xiaohongshu\.com|mp\.weixin\.qq\.com|fetch\(|uni\.request\(\{[\s\S]{0,160}xiaohongshu|uni\.request\(\{[\s\S]{0,160}mp\.weixin/,
  'Inspiration MVP must not crawl Xiaohongshu or WeChat article URLs from the client'
)

assert.match(
  pagesJson,
  /"path":\s*"pages\/xicheng\/inspiration\/inspiration"[\s\S]*"navigationBarTitleText":\s*"导入灵感"/,
  'pages.json should register the Xicheng inspiration page'
)

for (const required of [
  '一键抄作业',
  '导入灵感',
  '/pages/xicheng/inspiration/inspiration'
]) {
  assert.ok(home.includes(required), `Xicheng home should include ${required}`)
}

for (const required of [
  '一键抄作业',
  '小红书',
  '公众号',
  '图片',
  '文字',
  'AI 提取地点',
  '匹配官方 POI',
  '生成可走路线',
  '不抓取第三方平台原文',
  '不复制小红书、公众号正文和图片',
  'importXichengInspiration',
  'confirmXichengInspirationPois',
  'generateXichengInspirationRoute',
  'chooseInspirationImage',
  '/pages/xicheng/route-detail/route-detail'
]) {
  assert.ok(inspirationPage.includes(required), `Inspiration page should include ${required}`)
}

assert.ok(
  inspirationPage.includes('normalizeMatchedPoiForConfirmation'),
  'Inspiration page should normalize matched POIs before user confirmation'
)

assert.match(
  inspirationPage,
  /confirmed:\s*poi\.confirmed === false \? true : poi\.confirmed !== false/,
  'Matched official POIs should be selected by default so route generation is not blocked before user toggles confirmation'
)

assert.match(
  inspirationPage,
  /<view\s+v-if="!extractedPlaces\.length"\s+class="input-card">/,
  'Inspiration input card should collapse after extraction so POI confirmation and route generation are visible on mobile'
)

assert.match(
  inspirationPage,
  /matchedPois[\s\S]*poiCode[\s\S]*poiName[\s\S]*confidence[\s\S]*confirmed/,
  'Inspiration page should display official POI matches with user confirmation state'
)

assert.match(
  routeDetail,
  /XICHENG_GENERATED_ROUTE_STORAGE_KEY[\s\S]*uni\.getStorageSync\(XICHENG_GENERATED_ROUTE_STORAGE_KEY\)/,
  'Route detail should be able to load a generated walkable route from inspiration import'
)

assert.doesNotMatch(
  combined,
  /COZE_CONFIG|QWEN_API_KEY|DASHSCOPE_API_KEY|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Inspiration import flow should not expose AI vendor secrets'
)
