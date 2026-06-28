import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

assert.ok(
  exists('pages', 'xicheng', 'inspiration', 'inspiration.vue'),
  'Xicheng P0 should have a dedicated inspiration import page'
)

const pagesJson = read('pages.json')
const regionConfig = read('config', 'regions', 'xicheng.js')
const home = read('pages', 'xicheng', 'home', 'home.vue')
const inspiration = read('pages', 'xicheng', 'inspiration', 'inspiration.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const sliceBetween = (content, start, end) => {
  const startIndex = content.indexOf(start)
  const endIndex = content.indexOf(end, startIndex)
  assert.ok(startIndex >= 0, `missing start marker ${start}`)
  assert.ok(endIndex > startIndex, `missing end marker ${end}`)
  return content.slice(startIndex, endIndex)
}
const saveRouteBlock = sliceBetween(
  inspiration,
  'saveInspirationRoute({ silent = false, includeImageOnly = false } = {})',
  'createInspirationTextExcerpt(text = \'\')'
)
const openTravelogueBlock = sliceBetween(
  inspiration,
  'openTravelogue()',
  '</script>'
)

assert.match(
  pagesJson,
  /"path":\s*"pages\/xicheng\/inspiration\/inspiration"[\s\S]*"navigationBarTitleText":\s*"导入灵感"/,
  'pages.json should register the Xicheng inspiration import page'
)

for (const required of [
  'inspirationStorageKey',
  'XICHENG_OFFICIAL_POIS',
  "poiCode: 'xicheng-baitasi'",
  "poiCode: 'xicheng-imperial-temple'",
  "poiCode: 'xicheng-shichahai'",
  'aliases'
]) {
  assert.ok(regionConfig.includes(required), `Xicheng config should include official POI matching data ${required}`)
}

for (const required of [
  '一键导入灵感',
  'AI 提取地点',
  'openXichengInspiration',
  '/pages/xicheng/inspiration/inspiration?'
]) {
  assert.ok(home.includes(required), `Xicheng home should expose inspiration import entry ${required}`)
}

for (const required of [
  '导入灵感',
  '粘贴攻略文字',
  '上传攻略图片',
  'AI提取地点',
  '匹配官方 POI',
  '生成可走路线',
  '加入路线护照',
  'extractXichengPoiMatches',
  'buildXichengWalkRoute',
  'chooseInspirationImage',
  'saveInspirationRoute',
  'openTravelogue'
]) {
  assert.ok(inspiration.includes(required), `Inspiration page should include ${required}`)
}

assert.match(
  inspiration,
  /uni\.setStorageSync\(XICHENG_REGION_CONFIG\.inspirationStorageKey[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.materialsStorageKey/,
  'Inspiration route should persist the imported route and add matched POIs to the local journey materials'
)

assert.match(
  saveRouteBlock,
  /const route = \{[\s\S]*regionCode:\s*XICHENG_REGION_CONFIG\.regionCode[\s\S]*packageCode:\s*XICHENG_REGION_CONFIG\.packageCode[\s\S]*sceneCode:\s*XICHENG_REGION_CONFIG\.sceneCode[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel/,
  'Inspiration route should persist Xicheng package, scene, and source channel for route passport attribution'
)

assert.match(
  saveRouteBlock,
  /route\.stops\.map\(stop => \(\{[\s\S]*regionCode:\s*XICHENG_REGION_CONFIG\.regionCode[\s\S]*packageCode:\s*XICHENG_REGION_CONFIG\.packageCode[\s\S]*sceneCode:\s*XICHENG_REGION_CONFIG\.sceneCode[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel/,
  'Inspiration route POI materials should carry package, scene, and source channel for review and operations attribution'
)

assert.match(
  saveRouteBlock,
  /type:\s*'inspiration-image'[\s\S]*regionCode:\s*XICHENG_REGION_CONFIG\.regionCode[\s\S]*packageCode:\s*XICHENG_REGION_CONFIG\.packageCode[\s\S]*sceneCode:\s*XICHENG_REGION_CONFIG\.sceneCode[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel/,
  'Inspiration image material should carry package, scene, and source channel for review and operations attribution'
)

assert.match(
  openTravelogueBlock,
  /regionCode=\$\{encodeURIComponent\(this\.region\.regionCode\)\}[\s\S]*packageCode=\$\{encodeURIComponent\(this\.region\.packageCode\)\}[\s\S]*sceneCode=\$\{encodeURIComponent\(this\.region\.sceneCode\)\}[\s\S]*sourceChannel=\$\{encodeURIComponent\(this\.region\.sourceChannel\)\}[\s\S]*companionName=\$\{encodeURIComponent\(this\.region\.companionName\)\}/,
  'Inspiration openTravelogue should preserve package, scene, source channel, and companion context'
)

assert.match(
  inspiration,
  /extractXichengPoiMatches\s*=\s*\(text = ''[\s\S]*XICHENG_OFFICIAL_POIS[\s\S]*poi\.aliases[\s\S]*includes/,
  'Inspiration page should extract route candidates by matching text against official Xicheng POI aliases'
)

assert.match(
  travelogue,
  /inspirationStorageKey[\s\S]*灵感导入路线|灵感导入路线[\s\S]*inspirationStorageKey/,
  'Travelogue page should surface the imported inspiration route as part of the route passport flow'
)

assert.doesNotMatch(
  inspiration,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|https:\/\/www\.xiaohongshu\.com|mp\.weixin\.qq\.com/,
  'Inspiration MVP should not call backend APIs, expose secrets, or scrape third-party platform URLs'
)
