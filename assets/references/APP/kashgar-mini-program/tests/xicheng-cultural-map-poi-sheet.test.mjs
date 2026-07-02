import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

const componentPath = ['components', 'xicheng', 'XichengCulturalMap.vue']
const backdropPath = ['components', 'xicheng', 'XichengCulturalMapBackdrop.vue']
const poiSheetPath = ['components', 'xicheng', 'XichengCulturalMapPoiSheet.vue']
const mapConfigPath = ['config', 'regions', 'xichengMap.js']

assert.ok(
  exists(...componentPath),
  'Xicheng cultural map should be extracted into a dedicated component instead of staying as a flat decorative canvas'
)
assert.ok(
  exists(...poiSheetPath),
  'Cultural map POI bottom sheet should be extracted into a dedicated component'
)
assert.ok(
  exists(...backdropPath),
  'Cultural map decorative backdrop should be extracted into a dedicated component'
)
assert.ok(
  exists(...mapConfigPath),
  'Cultural map POI layout and category data should be extracted into config'
)

const culturalMap = read(...componentPath)
const backdrop = read(...backdropPath)
const poiSheet = read(...poiSheetPath)
const mapConfig = read(...mapConfigPath)
const routes = read('pages', 'xicheng', 'routes', 'routes.vue')
const mapShell = `${culturalMap}\n${backdrop}\n${poiSheet}\n${mapConfig}`

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
  'xicheng-map-route-segment',
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
  assert.ok(mapShell.includes(required), `Cultural map component should include ${required}`)
}

assert.match(
  backdrop,
  /v-for="category in mapCategories"[\s\S]*category\.label/,
  'Cultural map backdrop should render category legend from structured data'
)

assert.match(
  culturalMap,
  /v-for="poi in positionedPois"[\s\S]*selectPoi\(poi\)/,
  'Cultural map shell should render tappable POI pins from structured data'
)

assert.match(
  culturalMap,
  /v-for="segment in routeSegments"[\s\S]*class="xicheng-map-route-path xicheng-map-route-segment"[\s\S]*:style="getRouteSegmentStyle\(segment\)"/,
  'Cultural map route path should be rendered from dynamic route-stop segments instead of a fixed decorative line'
)

assert.match(
  culturalMap,
  /routeSegments\(\)[\s\S]*this\.routeStopMarkers[\s\S]*slice\(0,\s*-1\)[\s\S]*Math\.hypot[\s\S]*Math\.atan2/,
  'Cultural map should calculate each route segment from adjacent positioned POI coordinates'
)

assert.match(
  culturalMap,
  /getRouteSegmentStyle\(segment = \{\}\)[\s\S]*left:\$\{segment\.left\}%[\s\S]*top:\$\{segment\.top\}%[\s\S]*width:\$\{segment\.width\}%[\s\S]*rotate\(\$\{segment\.angle\}deg\)/,
  'Cultural map should style dynamic route segments with percentage position, length, and rotation'
)

assert.doesNotMatch(
  culturalMap,
  /box-shadow:\s*[\s\S]*76rpx\s+-90rpx\s+0\s+-2rpx\s+#173F35/,
  'Cultural map should not use the old fixed box-shadow route path because it cannot follow selected or imported POIs'
)

assert.match(
  mapShell,
  /selectedPoi[\s\S]*class="xicheng-map-bottom-sheet"[\s\S]*selectedPoi\.poiName[\s\S]*selectedPoi\.summary/,
  'Cultural map should show a bottom sheet with the selected POI name and introduction'
)

assert.match(
  culturalMap,
  /data\(\)[\s\S]*selectedPoiCode:\s*''/,
  'Cultural map should start with no selected POI so the map canvas stays fully tappable'
)

assert.doesNotMatch(
  culturalMap,
  /mounted\(\)[\s\S]*selectedPoiCode[\s\S]*positionedPois\[0\]/,
  'Cultural map should not auto-open the first POI sheet on mount because it blocks lower POI pins'
)

assert.match(
  culturalMap,
  /<xicheng-cultural-map-poi-sheet[\s\S]*@close="clearSelectedPoi"/,
  'Cultural map bottom sheet should expose a close control like the approved POI sheet reference'
)

assert.match(
  poiSheet,
  /class="xicheng-map-sheet-close"[\s\S]*@click="\$emit\('close'\)"[\s\S]*×/,
  'Extracted POI sheet should keep a close control like the approved reference'
)

assert.match(
  poiSheet,
  /class="xicheng-map-sheet-detail-list"[\s\S]*开放时间[\s\S]*selectedPoi\.openTime \|\| '09:00-17:00'[\s\S]*步行约 12 分钟[\s\S]*距当前位置约 850 米[\s\S]*来源：西城文旅官方资料库/,
  'Cultural map bottom sheet should show open time, walking distance, and source detail rows before navigation'
)

assert.match(
  poiSheet,
  /class="xicheng-map-sheet-primary[\s\S]*<xicheng-icon name="route"[\s\S]*class="xicheng-map-sheet-primary-icon"[\s\S]*导航去这里/,
  'Cultural map primary navigation action should use the shared route icon and clear navigation copy'
)

assert.ok(
  culturalMap.includes('\n\t\t\t<xicheng-cultural-map-poi-sheet'),
  'Cultural map POI bottom sheet should render inside the map canvas as an in-map overlay'
)

assert.match(
  poiSheet,
  /\.xicheng-map-bottom-sheet\s*\{[\s\S]*position:\s*absolute[\s\S]*left:\s*20rpx[\s\S]*right:\s*20rpx[\s\S]*bottom:\s*18rpx/,
  'Cultural map POI bottom sheet should be absolutely positioned inside the map canvas'
)

assert.match(
  poiSheet,
  /\.xicheng-map-sheet-desc\s*\{[\s\S]*max-height:\s*64rpx[\s\S]*overflow:\s*hidden/,
  'Cultural map POI introduction should stay compact inside the in-map overlay'
)

assert.match(
  culturalMap,
  /clearSelectedPoi\(\)[\s\S]*this\.selectedPoiCode = ''/,
  'Cultural map close control should clear the selected POI without navigating away'
)

assert.match(
  poiSheet,
  /:class="\{ 'xicheng-map-sheet-head-no-image': !selectedPoi\.image \}"/,
  'Cultural map bottom sheet should switch to a one-column layout when the selected POI has no card image'
)

assert.match(
  poiSheet,
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
  mapShell + routes,
  /\/app-api\/xunjing|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Cultural map POI shell should not introduce backend calls or client-side secrets'
)
