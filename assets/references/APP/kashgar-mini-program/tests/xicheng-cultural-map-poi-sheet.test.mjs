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
  '开放时间',
  '09:00-17:00',
  '距当前位置约 850 米',
  '已审核来源',
  'xicheng-map-sheet-close',
  'xicheng-map-sheet-detail-list',
  'xicheng-map-sheet-primary-icon',
  'clearSelectedPoi',
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
  /class="xicheng-map-sheet-close"[\s\S]*@click="clearSelectedPoi"[\s\S]*×/,
  'Cultural map bottom sheet should expose a close control like the approved POI sheet reference'
)

assert.match(
  culturalMap,
  /class="xicheng-map-sheet-detail-list"[\s\S]*开放时间[\s\S]*selectedPoi\.openTime \|\| '09:00-17:00'[\s\S]*步行约 12 分钟[\s\S]*距当前位置约 850 米[\s\S]*来源：西城文旅官方资料库/,
  'Cultural map bottom sheet should show open time, walking distance, and source detail rows before navigation'
)

assert.match(
  culturalMap,
  /class="xicheng-map-sheet-primary[\s\S]*<xicheng-icon name="route"[\s\S]*class="xicheng-map-sheet-primary-icon"[\s\S]*导航去这里/,
  'Cultural map primary navigation action should use the shared route icon and clear navigation copy'
)

assert.ok(
  culturalMap.includes('\n\t\t\t<view v-if="selectedPoi" class="xicheng-map-bottom-sheet">'),
  'Cultural map POI bottom sheet should render inside the map canvas as an in-map overlay'
)

assert.match(
  culturalMap,
  /\.xicheng-map-bottom-sheet\s*\{[\s\S]*position:\s*absolute[\s\S]*left:\s*20rpx[\s\S]*right:\s*20rpx[\s\S]*bottom:\s*18rpx/,
  'Cultural map POI bottom sheet should be absolutely positioned inside the map canvas'
)

assert.match(
  culturalMap,
  /\.xicheng-map-sheet-desc\s*\{[\s\S]*max-height:\s*64rpx[\s\S]*overflow:\s*hidden/,
  'Cultural map POI introduction should stay compact inside the in-map overlay'
)

assert.match(
  culturalMap,
  /clearSelectedPoi\(\)[\s\S]*this\.selectedPoiCode = ''/,
  'Cultural map close control should clear the selected POI without navigating away'
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
