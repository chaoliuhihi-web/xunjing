import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

const componentPath = ['components', 'xicheng', 'XichengCulturalMap.vue']

assert.ok(
  exists(...componentPath),
  'Xicheng cultural map should be extracted into a dedicated component instead of staying as a flat decorative canvas'
)

const culturalMap = read(...componentPath)
const routes = read('pages', 'xicheng', 'routes', 'routes.vue')

for (const required of [
  '西城文旅地图',
  'POI 地图 · 路线生成',
  '文化建筑',
  '历史遗迹',
  '胡同院落',
  '美食购物',
  '自然景观',
  '白塔寺',
  '历代帝王庙',
  '什刹海',
  '北海北门',
  '护国寺街',
  '大栅栏',
  'xicheng-map-poi-pin',
  'xicheng-map-route-path',
  'xicheng-map-control',
  'xicheng-map-bottom-sheet',
  '导航去这里',
  '问问小京',
  '加入路线',
  '已审核来源',
  '$emit(\'select-poi\'',
  '$emit(\'navigate-poi\'',
  '$emit(\'ask-poi\'',
  '$emit(\'add-poi-to-route\''
]) {
  assert.ok(culturalMap.includes(required), `Cultural map component should include ${required}`)
}

assert.match(
  culturalMap,
  /v-for="category in mapCategories"[\s\S]*category\.label[\s\S]*v-for="poi in positionedPois"[\s\S]*selectPoi\(poi\)/,
  'Cultural map should render category legend and tappable POI pins from structured data'
)

assert.match(
  culturalMap,
  /selectedPoi[\s\S]*class="xicheng-map-bottom-sheet"[\s\S]*selectedPoi\.poiName[\s\S]*selectedPoi\.summary/,
  'Cultural map should show a bottom sheet with the selected POI name and introduction'
)

assert.match(
  culturalMap,
  /:class="\{ 'xicheng-map-sheet-head-no-image': !selectedPoi\.image \}"/,
  'Cultural map bottom sheet should switch to a one-column layout when the selected POI has no card image'
)

assert.match(
  culturalMap,
  /\.xicheng-map-sheet-head-no-image\s*\{[\s\S]*grid-template-columns:\s*1fr/,
  'Cultural map no-image bottom sheet layout should keep POI titles and descriptions readable'
)

assert.match(
  culturalMap,
  /:class="\{ 'xicheng-map-poi-pin-active': selectedPoiCode === poi\.poiCode, 'xicheng-map-poi-pin-route': isRouteStop\(poi\) \}"/,
  'Cultural map POI pins should distinguish active POI and current route stops'
)

assert.match(
  routes,
  /import XichengCulturalMap from '@\/components\/xicheng\/XichengCulturalMap\.vue'/,
  'Route page should import the dedicated cultural map component'
)

assert.match(
  routes,
  /<xicheng-cultural-map[\s\S]*:pois="mapPois"[\s\S]*:route-stops="mapPreviewStops"[\s\S]*@select-poi="selectMapPoi"[\s\S]*@navigate-poi="navigateToMapPoi"[\s\S]*@ask-poi="askMapPoi"[\s\S]*@add-poi-to-route="addMapPoiToRoute"/,
  'Route page should wire POI selection, navigation, Xiaojing, and route-add actions from the map component'
)

for (const required of [
  'XICHENG_OFFICIAL_POIS',
  'mapPois()',
  'selectedMapPoi',
  'selectMapPoi(poi = {})',
  'navigateToMapPoi(poi = {})',
  'askMapPoi(poi = {})',
  'addMapPoiToRoute(poi = {})',
  '/pages/xicheng/poi/poi?',
  '/pages/ai-guide/ai-guide?',
  'createXichengOfficialPoiSources(poi)',
  "type: 'map-selected-poi'",
  "sourceLabel: '文旅地图选点'",
  "safetyStatus: 'PASSED'",
  "publishStatus: 'private'"
]) {
  assert.ok(routes.includes(required), `Route page should include map POI handoff behavior ${required}`)
}

assert.doesNotMatch(
  culturalMap + routes,
  /\/app-api\/xunjing|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Cultural map POI shell should not introduce backend calls or client-side secrets'
)
