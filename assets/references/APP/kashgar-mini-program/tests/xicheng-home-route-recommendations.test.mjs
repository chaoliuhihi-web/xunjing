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
  'id="xicheng-map-entry-section"',
  '文旅地图',
  'POI 地图 · 路线推荐',
  'openXichengRoutes',
  '/pages/xicheng/routes/routes?'
]) {
  assert.ok(home.includes(required), `Xicheng home should expose only a compact map entry ${required}`)
}

assert.doesNotMatch(
  home,
  /filteredRecommendedRoutes|route-recommendation-section|route-reference-grid|v-for="route in filteredRecommendedRoutes\.slice\(0, 3\)"|openRecommendedRoute\(route = \{\}\)|createXichengOfficialPoiSources/,
  'Home should not own route recommendation rendering or route material persistence after route recommendations move to the cultural map page'
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
