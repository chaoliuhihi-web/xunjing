import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

const pagesJson = read('pages.json')
const appVue = read('App.vue')
const home = read('pages', 'xicheng', 'home', 'home.vue')

assert.ok(
  exists('pages', 'xicheng', 'routes', 'routes.vue'),
  'Xicheng P0 should have a dedicated official route list page for route operations'
)

const routes = read('pages', 'xicheng', 'routes', 'routes.vue')

assert.match(
  pagesJson,
  /"path":\s*"pages\/xicheng\/routes\/routes"[\s\S]*"navigationBarTitleText":\s*"文旅地图"/,
  'pages.json should register pages/xicheng/routes/routes as the Xicheng cultural map page'
)

assert.ok(
  appVue.includes("'pages/xicheng/routes/routes'"),
  'Xicheng route list should be a public route so it is reachable before login'
)

assert.match(
  home,
  /openXichengRoutes\(\)[\s\S]*\/pages\/xicheng\/routes\/routes\?[\s\S]*regionCode=\$\{encodeRouteValue\(this\.region\.regionCode\)\}[\s\S]*packageCode=\$\{encodeRouteValue\(this\.region\.packageCode\)\}[\s\S]*sourceChannel=\$\{encodeRouteValue\(this\.region\.sourceChannel\)\}/,
  'Home route list entry should preserve Xicheng region, package, and source channel context'
)

assert.match(
  home,
  /case 'routes':[\s\S]*this\.openXichengRoutes\(\)/,
  'Home P0 map action should open the dedicated cultural map instead of only scrolling the home page'
)

for (const required of [
  '文旅地图',
  '西城文旅地图',
  '看官方 POI、路线推荐和 Citywalk 记录',
  'XichengCulturalMap',
  'culture-map-card',
  'xicheng-cultural-map',
  'mapPois',
  'selectedMapPoi',
  'mapPreviewRoute',
  'mapPreviewStops',
  'loadInspirationRoute',
  'id="xicheng-route-recommendation-bottom"',
  '路线推荐',
  '官方 Citywalk',
  '一键抄作业',
  'XICHENG_RECOMMENDED_ROUTES',
  'XICHENG_ROUTE_RECOMMENDATION_FILTERS',
  'filteredRoutes',
  'route-list-card',
  '查看路线',
  '开始记录',
  '让小京重新推荐',
  'createXichengOfficialPoiSources',
  'openRouteDetail(route)',
  'startRouteRecording(route)',
  'generateRouteTravelogue(route)',
  'openInspirationImport'
]) {
  assert.ok(routes.includes(required), `Cultural map route page should include ${required}`)
}

assert.match(
  routes,
  /<xicheng-cultural-map[\s\S]*:pois="mapPois"[\s\S]*:route-stops="mapPreviewStops"[\s\S]*@select-poi="selectMapPoi"[\s\S]*@navigate-poi="navigateToMapPoi"[\s\S]*@ask-poi="askMapPoi"[\s\S]*@add-poi-to-route="addMapPoiToRoute"/,
  'Cultural map should render POI pins and route stops through the dedicated high-fidelity map component'
)

assert.match(
  routes,
  /mapPreviewRoute\(\)[\s\S]*this\.inspirationRoute[\s\S]*return importedRoute \|\| this\.filteredRoutes\[0\]/,
  'Cultural map should prefer an imported inspiration route when one exists'
)

assert.match(
  routes,
  /openInspirationImport\(\)[\s\S]*\/pages\/xicheng\/inspiration\/inspiration\?target=map[\s\S]*regionCode=\$\{encodeRouteValue\(this\.routeContext\.regionCode\)\}/,
  'One-click homework should open inspiration import in map target mode with Xicheng context'
)

assert.match(
  routes,
  /v-for="filter in routeRecommendationFilters"[\s\S]*activeRouteFilter = filter\.key/,
  'Route list page should support approved time and interest filter chips'
)

assert.match(
  routes,
  /v-for="route in filteredRoutes"[\s\S]*getRouteThumbnail\(route\)[\s\S]*getDisplayRouteTitle\(route\)[\s\S]*route\.durationText[\s\S]*route\.distanceText[\s\S]*getRouteStopCount\(route\)/,
  'Route list page should render official route cards with image, title, duration, distance, and stop count'
)

assert.match(
  routes,
  /openRouteDetail\(route = \{\}\)[\s\S]*\/pages\/xicheng\/route-detail\/route-detail\?routeCode=\$\{encodeRouteValue\(route\.routeCode \|\| ''\)\}[\s\S]*regionCode=\$\{encodeRouteValue\(this\.routeContext\.regionCode/,
  'Route list page should enter route detail with route and Xicheng context'
)

assert.match(
  routes,
  /persistRoutePassport\(route = \{\}\)[\s\S]*routeSource:\s*'route-list'[\s\S]*sourceLabel:\s*'官方路线列表'[\s\S]*uni\.setStorageSync\(this\.region\.inspirationStorageKey,\s*routePayload\)[\s\S]*uni\.setStorageSync\(this\.region\.materialsStorageKey/,
  'Route list page should persist route passport materials before handoff'
)

assert.match(
  routes,
  /startRouteRecording\(route = \{\}\)[\s\S]*this\.persistRoutePassport\(route\)[\s\S]*\/pages\/xicheng\/recording\/recording\?autoStart=1[\s\S]*routeCode=\$\{encodeRouteValue\(route\.routeCode \|\| ''\)\}[\s\S]*regionCode=\$\{encodeRouteValue\(this\.routeContext\.regionCode\)\}[\s\S]*packageCode=\$\{encodeRouteValue\(this\.routeContext\.packageCode\)\}[\s\S]*sceneCode=\$\{encodeRouteValue\(this\.routeContext\.sceneCode\)\}[\s\S]*sourceChannel=\$\{encodeRouteValue\(this\.routeContext\.sourceChannel\)\}[\s\S]*companionName=\$\{encodeRouteValue\(this\.routeContext\.companionName\)\}/,
  'Route list page should turn official Citywalk selection into a recording handoff instead of a toast-only passport action'
)

assert.doesNotMatch(
  routes,
  /@click="startRoutePassport\(route\)">路线护照|startRoutePassport\(route = \{\}\)[\s\S]*已加入路线护照/,
  'Route list cards should not keep route-passport as the visible secondary action'
)

assert.match(
  routes,
  /const routeMaterials = stops\.map\(stop => \{[\s\S]*const sources = createXichengOfficialPoiSources\(stop\)[\s\S]*type:\s*'official-route-poi'[\s\S]*sourceCount:\s*sources\.length[\s\S]*safetyStatus:\s*'PASSED'[\s\S]*reviewStatus:\s*this\.region\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'/,
  'Route list route materials should carry approved source cards, explicit PASSED safety status, and private pending-review status'
)

assert.match(
  routes,
  /persistMapSelectedPoi\(poi = \{\}\)[\s\S]*const sources = createXichengOfficialPoiSources\(poi\)[\s\S]*type:\s*'map-selected-poi'[\s\S]*sourceLabel:\s*'文旅地图选点'[\s\S]*sourceCount:\s*sources\.length[\s\S]*safetyStatus:\s*'PASSED'[\s\S]*publishStatus:\s*'private'/,
  'Cultural map selected POI materials should also carry approved source cards and private pending-review status'
)

assert.match(
  routes,
  /generateRouteTravelogue\(route = \{\}\)[\s\S]*\/pages\/xicheng\/travelogue\/travelogue\?mode=route[\s\S]*routeCode=\$\{encodeRouteValue\(route\.routeCode \|\| ''\)\}/,
  'Route list page should hand selected routes into travelogue generation'
)

assert.doesNotMatch(
  routes,
  /\/app-api\/xunjing|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Route list page should not introduce backend calls or client-side secrets'
)
