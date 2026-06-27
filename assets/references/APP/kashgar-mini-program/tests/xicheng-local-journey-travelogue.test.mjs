import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

assert.ok(
  exists('pages', 'xicheng', 'travelogue', 'travelogue.vue'),
  'Xicheng P0 should have a dedicated local Citywalk and travelogue draft page'
)

const pagesJson = read('pages.json')
const regionConfig = read('config', 'regions', 'xicheng.js')
const home = read('pages', 'xicheng', 'home', 'home.vue')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

assert.match(
  pagesJson,
  /"path":\s*"pages\/xicheng\/travelogue\/travelogue"[\s\S]*"navigationBarTitleText":\s*"西城游记草稿"/,
  'pages.json should register the Xicheng travelogue draft page'
)

for (const required of [
  'journeyStorageKey',
  'materialsStorageKey',
  'reviewStatus',
  'localOpsReportKey'
]) {
  assert.ok(regionConfig.includes(required), `Xicheng config should include ${required}`)
}

for (const required of [
  '开始记录 Citywalk',
  '生成游记草稿',
  'openXichengTravelogue',
  '/pages/xicheng/travelogue/travelogue?'
]) {
  assert.ok(home.includes(required), `Xicheng home should expose local journey entry ${required}`)
}

assert.match(
  scanResult,
  /startRecording\(\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.materialsStorageKey[\s\S]*\/pages\/xicheng\/travelogue\/travelogue\?/,
  'Recognition result startRecording should save the recognized POI as journey material and open the Xicheng travelogue page'
)

assert.doesNotMatch(
  scanResult,
  /startRecording\(\)[\s\S]*\/pages\/ai-guide\/ai-guide\?mode=diary/,
  'Xicheng start recording should not route to the Kashgar diary generator'
)

for (const required of [
  '路线护照',
  '旅行素材盒',
  '游记草稿',
  '亲子研学任务',
  '西城印章',
  '分享海报',
  'PDF纪念册',
  '作品审核',
  '城市运营报告',
  'createXichengTravelogueDraft',
  'saveDraft',
  'generatePoster',
  'exportMemorialPdf',
  'submitReview'
]) {
  assert.ok(travelogue.includes(required), `Xicheng travelogue page should include ${required}`)
}

assert.match(
  travelogue,
  /uni\.getStorageSync\(XICHENG_REGION_CONFIG\.materialsStorageKey\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.journeyStorageKey/,
  'Travelogue page should load local journey materials and persist the editable draft locally'
)

assert.match(
  travelogue,
  /saveDraft\(\{ silent = false \} = \{\}\)[\s\S]*const payload = \{[\s\S]*regionCode:\s*XICHENG_REGION_CONFIG\.regionCode[\s\S]*packageCode:\s*XICHENG_REGION_CONFIG\.packageCode[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*companionName:\s*XICHENG_REGION_CONFIG\.companionName/,
  'Saved travelogue draft should carry Xicheng package, source channel, and companion context for release attribution'
)

assert.doesNotMatch(
  travelogue,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Local P0 travelogue page should not introduce backend calls or client-side secrets'
)
