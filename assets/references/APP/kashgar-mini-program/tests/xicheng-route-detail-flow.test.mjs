import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const readOptional = (...segments) => {
  const filePath = path.join(root, ...segments)
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
}

const pagesJson = read('pages.json')
const regionConfig = read('config', 'regions', 'xicheng.js')
const home = read('pages', 'xicheng', 'home', 'home.vue')
const routeDetail = readOptional('pages', 'xicheng', 'route-detail', 'route-detail.vue')

assert.ok(
  pagesJson.includes('"path": "pages/xicheng/route-detail/route-detail"'),
  'Xicheng APP should register a route detail page for route recommendation operations'
)

for (const required of [
  'XICHENG_ROUTE_RECOMMENDATION_FILTERS',
  'XICHENG_ROUTE_CODE_ALIASES',
  'normalizeXichengRouteCode',
  'distanceText',
  'routeTips',
  'nearbyHighlights',
  'guidePrompt',
  'walkText',
  'recommendedFilterKeys'
]) {
  assert.ok(regionConfig.includes(required), `Xicheng route data should include route detail field ${required}`)
}

for (const required of [
  'route-filter-bar',
  'route-filter-chip',
  'filteredRecommendedRoutes',
  'openRecommendedRouteDetail(route)',
  '查看路线',
  '加入路线护照'
]) {
  assert.ok(home.includes(required), `Xicheng home route list should expose ${required}`)
}

assert.match(
  home,
  /openRecommendedRouteDetail\(route = \{\}\)[\s\S]*\/pages\/xicheng\/route-detail\/route-detail\?routeCode=\$\{encodeRouteValue\(route\.routeCode \|\| ''\)\}[\s\S]*regionCode=\$\{encodeRouteValue\(this\.region\.regionCode\)\}[\s\S]*packageCode=\$\{encodeRouteValue\(this\.region\.packageCode\)\}[\s\S]*sceneCode=\$\{encodeRouteValue\(this\.region\.sceneCode\)\}[\s\S]*sourceChannel=\$\{encodeRouteValue\(this\.region\.sourceChannel\)\}[\s\S]*companionName=\$\{encodeRouteValue\(this\.region\.companionName\)\}/,
  'Home route detail entry should preserve routeCode and Xicheng attribution context'
)

for (const required of [
  'xicheng-route-detail',
  'routeHero',
  'routeStopCards',
  '沿途看点',
  '听讲解',
  'startRoutePassport',
  'generateRouteTravelogue',
  'askStopGuide(stop)'
]) {
  assert.ok(routeDetail.includes(required), `Route detail page should expose ${required}`)
}

assert.match(
  routeDetail,
  /import \{ createXichengOfficialPoiSources \} from '@\/request\/xunjing\/officialPoi\.js'/,
  'Route detail should reuse the shared official POI source helper for route passport materials'
)

assert.match(
  routeDetail,
  /import \{[\s\S]*normalizeXichengRouteCode[\s\S]*\} from '@\/config\/regions\/xicheng\.js'[\s\S]*import \{ decodeXichengRouteValue, createXichengRouteOutputValue \} from '@\/request\/xunjing\/routeParams\.js'[\s\S]*const encodeRouteValue = \(value = ''\) => createXichengRouteOutputValue\(value, \{ platform: process\.env\.UNI_PLATFORM \}\)/,
  'Route detail should encode outbound route values through the shared platform-safe helper to prevent double-encoded attribution params'
)

assert.match(
  routeDetail,
  /routeCode:\s*normalizeXichengRouteCode\(decodeXichengRouteValue\(options\.routeCode \|\| options\.routeId\)\)/,
  'Route detail should accept legacy routeId deep links and normalize them to official routeCode'
)

assert.match(
  routeDetail,
  /createRouteMaterials\(capturedAt\)[\s\S]*this\.routeStopCards\.map\(stop => \{[\s\S]*const sources = createXichengOfficialPoiSources\(stop\)[\s\S]*return \{[\s\S]*type:\s*'official-route-poi'[\s\S]*sourceLabel:\s*'官方路线详情'[\s\S]*sources,[\s\S]*sourceCount:\s*sources\.length[\s\S]*reviewStatus:\s*this\.region\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'/,
  'Route detail POI materials should carry approved official POI source cards so travelogue, PDF, and review evidence stay traceable'
)

assert.match(
  routeDetail,
  /persistStopGuideContext\(stop = \{\}, question = ''\)[\s\S]*const sources = createXichengOfficialPoiSources\(stop\)[\s\S]*uni\.setStorageSync\(this\.region\.storageKey,\s*\{[\s\S]*regionCode:\s*this\.routeOptions\.regionCode \|\| this\.region\.regionCode[\s\S]*packageCode:\s*this\.routeOptions\.packageCode \|\| this\.region\.packageCode[\s\S]*sceneCode:\s*this\.region\.aiSceneCode \|\| this\.routeOptions\.sceneCode \|\| this\.region\.sceneCode[\s\S]*poiCode:\s*stop\.poiCode[\s\S]*poiName:\s*stop\.poiName[\s\S]*sourceLabel:\s*'官方路线详情'[\s\S]*sources,[\s\S]*sourceCount:\s*sources\.length[\s\S]*suggestedQuestions:\s*question \? \[question\] : \[\][\s\S]*safetyStatus:\s*'PASSED'/,
  'Route detail stop guide should cache official reviewed source context before opening Xiaojing'
)

assert.match(
  routeDetail,
  /askStopGuide\(stop = \{\}\)[\s\S]*const question = stop\.guidePrompt \|\| `讲讲\$\{stop\.poiName\}`[\s\S]*this\.persistStopGuideContext\(stop, question\)[\s\S]*question=\$\{encodeRouteValue\(question\)\}[\s\S]*regionCode=\$\{encodeRouteValue\(this\.routeOptions\.regionCode \|\| this\.region\.regionCode\)\}[\s\S]*poiCode=\$\{encodeRouteValue\(stop\.poiCode \|\| ''\)\}[\s\S]*poiName=\$\{encodeRouteValue\(stop\.poiName \|\| ''\)\}[\s\S]*safetyStatus=\$\{encodeRouteValue\('PASSED'\)\}[\s\S]*companionName=\$\{encodeRouteValue\(this\.routeOptions\.companionName \|\| this\.region\.companionName\)\}/,
  'Route detail stop guide entry should navigate to Xiaojing with regionCode, poiCode, poiName, reviewed safetyStatus, and decoded companionName'
)

assert.match(
  routeDetail,
  /persistRoutePassport\(\)[\s\S]*uni\.setStorageSync\(this\.region\.inspirationStorageKey,\s*routePayload\)[\s\S]*uni\.setStorageSync\(this\.region\.materialsStorageKey/,
  'Route detail should persist official route payload and POI materials before travelogue handoff'
)

assert.match(
  routeDetail,
  /generateRouteTravelogue\(\)[\s\S]*persistRoutePassport\(\)[\s\S]*\/pages\/xicheng\/travelogue\/travelogue\?mode=route[\s\S]*routeCode=\$\{encodeRouteValue\(this\.activeRoute\.routeCode \|\| ''\)\}[\s\S]*companionName=\$\{encodeRouteValue\(this\.routeOptions\.companionName \|\| this\.region\.companionName\)\}/,
  'Route detail should generate a route travelogue draft with routeCode and decoded companionName preserved'
)

assert.doesNotMatch(
  routeDetail,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Route detail MVP should not add backend calls or client-side secrets'
)
