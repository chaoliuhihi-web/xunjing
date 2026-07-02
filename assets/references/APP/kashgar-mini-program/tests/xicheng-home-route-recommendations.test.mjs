import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const home = read('pages', 'xicheng', 'home', 'home.vue')
const routes = read('pages', 'xicheng', 'routes', 'routes.vue')

assert.match(
  regionConfig,
  /export const XICHENG_RECOMMENDED_ROUTES\s*=\s*Object\.freeze\(\[/,
  'Xicheng config should expose official route recommendations for map and route operations'
)

for (const required of [
  "routeCode: 'baitasi-imperial-shichahai'",
  "routeCode: 'beihai-shichahai-waterfront'",
  "routeCode: 'dashilar-old-brand-walk'",
  'passportTaskCount',
  'studyTaskCount',
  'stops'
]) {
  assert.ok(regionConfig.includes(required), `Recommended routes should include ${required}`)
}

for (const required of [
  'hero-ask-card',
  '问问小京',
  '故事、路线和建筑',
  '@click="askXiaojing"'
]) {
  assert.ok(home.includes(required), `Xicheng home should place Xiaojing ask entry in the hero ${required}`)
}

for (const required of [
  'class="home-action-duo"',
  '扫一扫',
  'id="xicheng-recent-recognition-section"',
  '最近识别：',
  '开始讲解'
]) {
  assert.ok(home.includes(required), `Xicheng home should pair scan with recent recognition in the primary action row ${required}`)
}

for (const required of [
  'id="xicheng-map-entry-section"',
  '文旅地图',
  'POI 地图 · 路线推荐',
  '游记生成',
  'AI 帮你记录行程，生成专属游记',
  'openXichengRoutes',
  '/pages/xicheng/routes/routes?'
]) {
  assert.ok(home.includes(required), `Xicheng home should pair map and travelogue generation entries ${required}`)
}

for (const required of [
  'id="xicheng-home-route-recommendation-section"',
  '路线推荐',
  '官方 Citywalk',
  '一键抄作业',
  'homeRouteRecommendations',
  'v-for="route in homeRouteRecommendations"',
  'openHomeRecommendedRoute(route)',
  '查看路线'
]) {
  assert.ok(home.includes(required), `Xicheng home should keep a compact route recommendation section ${required}`)
}

assert.match(
  home,
  /class="hero[\s\S]*hero-ask-card[\s\S]*class="home-action-duo"[\s\S]*startScanRecognition[\s\S]*id="xicheng-recent-recognition-section"[\s\S]*id="xicheng-map-entry-section"[\s\S]*文旅地图[\s\S]*游记生成[\s\S]*id="xicheng-home-route-recommendation-section"/,
  'Xicheng home should order modules as hero Xiaojing, scan with recent recognition, map with travelogue generation, then route recommendations'
)

assert.ok(!home.includes('更多路线'), 'Xicheng home route CTA should be renamed from 更多路线 to 一键抄作业')
assert.ok(!home.includes('生成我的西城游记'), 'Xicheng home travelogue entry should use the shorter 游记生成 label')

assert.doesNotMatch(
  home,
  /createXichengOfficialPoiSources|mergeXichengOfficialRouteMaterials|persistRoutePassport\(route = \{\}\)/,
  'Home route recommendations should stay lightweight and leave route material persistence to the cultural map/detail flow'
)

for (const required of [
  '西城文旅地图',
  'culture-map-card',
  'XichengCulturalMap',
  'xicheng-cultural-map',
  'mapPois',
  'selectedMapPoi',
  'mapPreviewRoute',
  'mapPreviewStops',
  'selectMapPoi(poi = {})',
  'navigateToMapPoi(poi = {})',
  'askMapPoi(poi = {})',
  'addMapPoiToRoute(poi = {})',
  'id="xicheng-route-recommendation-bottom"',
  '路线推荐',
  '官方 Citywalk',
  'XICHENG_RECOMMENDED_ROUTES',
  'XICHENG_ROUTE_RECOMMENDATION_FILTERS',
  'createXichengOfficialPoiSources',
  'filteredRoutes',
  'route-list-card',
  '查看路线',
  '路线护照',
  'generateRouteTravelogue(route)',
  'openInspirationImport'
]) {
  assert.ok(routes.includes(required), `Xicheng cultural map page should own route recommendation UI ${required}`)
}

assert.match(
  routes,
  /persistRoutePassport\(route = \{\}\)[\s\S]*routeSource:\s*'route-list'[\s\S]*sourceLabel:\s*'官方路线列表'[\s\S]*uni\.setStorageSync\(this\.region\.inspirationStorageKey,\s*routePayload\)[\s\S]*uni\.setStorageSync\(this\.region\.materialsStorageKey/,
  'Route recommendation selections should persist full route attribution from the cultural map page'
)

assert.match(
  routes,
  /const routeMaterials = stops\.map\(stop => \{[\s\S]*const sources = createXichengOfficialPoiSources\(stop\)[\s\S]*type:\s*'official-route-poi'[\s\S]*sourceCount:\s*sources\.length[\s\S]*safetyStatus:\s*'PASSED'[\s\S]*reviewStatus:\s*this\.region\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'/,
  'Route recommendation POI materials should carry approved source cards, explicit PASSED safety status, and private pending-review status'
)

assert.match(
  routes,
  /persistMapSelectedPoi\(poi = \{\}\)[\s\S]*const sources = createXichengOfficialPoiSources\(poi\)[\s\S]*type:\s*'map-selected-poi'[\s\S]*sourceLabel:\s*'文旅地图选点'[\s\S]*safetyStatus:\s*'PASSED'[\s\S]*publishStatus:\s*'private'/,
  'Cultural map POI selections should carry approved source cards and private pending-review status before handoff'
)

assert.doesNotMatch(
  `${home}\n${routes}`,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Home and cultural map route recommendation MVP should not add backend calls or client-side secrets'
)
