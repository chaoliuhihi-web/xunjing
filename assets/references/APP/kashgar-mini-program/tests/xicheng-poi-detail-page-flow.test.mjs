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
const app = read('App.vue')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const poi = readOptional('pages', 'xicheng', 'poi', 'poi.vue')

assert.ok(
  pagesJson.includes('"path": "pages/xicheng/poi/poi"'),
  'Xicheng APP should register a dedicated POI guide page'
)

assert.ok(
  app.includes("'pages/xicheng/poi/poi'"),
  'POI guide page should be public so recognition deep links do not force login'
)

assert.match(
  scanResult,
  /<button class="[^"]*\bghost-button\b[^"]*" :disabled="recognitionActionBlocked" @click="openPoiDetail">地点详情<\/button>/,
  'Recognition result should expose a gated POI detail entry beside Xiaojing and recording actions'
)

assert.match(
  scanResult,
  /openPoiDetail\(\)[\s\S]*if \(this\.pendingCandidateConfirmation\)[\s\S]*if \(this\.missingOfficialPoiContext\)[\s\S]*if \(this\.unsafeRecognitionSafetyStatus\)[\s\S]*\/pages\/xicheng\/poi\/poi\?poiCode=\$\{encodeRouteValue\(this\.result\.poiCode \|\| ''\)\}[\s\S]*poiName=\$\{encodeRouteValue\(this\.result\.poiName \|\| ''\)\}[\s\S]*regionCode=\$\{encodeURIComponent\(this\.result\.regionCode \|\| XICHENG_REGION_CONFIG\.regionCode\)\}[\s\S]*safetyStatus=\$\{encodeURIComponent\(this\.result\.safetyStatus \|\| ''\)\}/,
  'POI detail entry should preserve official POI context, region attribution, and safety status'
)

for (const required of [
  'xicheng-poi-detail',
  '已识别地点',
  '播放讲解',
  '问问小京',
  '加入游记',
  '建筑看点',
  '历史故事',
  '周边漫步',
  '附近推荐',
  'source-list-card',
  'createXichengOfficialPoiSources',
  'XICHENG_OFFICIAL_POIS',
  'XICHENG_RECOMMENDED_ROUTES',
  'normalizeXichengSafetyStatus',
  'isXichengUnsafeSafetyStatus'
]) {
  assert.ok(poi.includes(required), `POI detail page should expose ${required}`)
}

assert.match(
  poi,
  /onLoad\(options = \{\}\)[\s\S]*this\.routeOptions = normalizePoiRouteOptions\(options\)[\s\S]*this\.activePoi = resolveOfficialPoi\(this\.routeOptions\)[\s\S]*this\.sourceList = this\.createPoiSources\(\)/,
  'POI detail should resolve official POI and reviewed sources from route params during page load'
)

assert.match(
  poi,
  /blockedBySafety\(\)[\s\S]*return isXichengUnsafeSafetyStatus\(normalizeXichengSafetyStatus\(this\.routeOptions\.safetyStatus\)\)/,
  'POI detail should gate actions when recognition context is BLOCKED or UNAVAILABLE'
)

assert.match(
  poi,
  /askXiaojing\(question = ''\)[\s\S]*if \(this\.blockedBySafety\)[\s\S]*无已审核来源，不能回答[\s\S]*this\.persistPoiGuideContext\(prompt\)[\s\S]*\/pages\/ai-guide\/ai-guide\?question=\$\{encodeRouteValue\(prompt\)\}[\s\S]*poiCode=\$\{encodeRouteValue\(this\.activePoi\.poiCode \|\| ''\)\}[\s\S]*poiName=\$\{encodeRouteValue\(this\.activePoi\.poiName \|\| ''\)\}[\s\S]*safetyStatus=\$\{encodeRouteValue\('PASSED'\)\}/,
  'POI detail Xiaojing action should refuse BLOCKED contexts and otherwise open Xiaojing with reviewed POI source context'
)

assert.match(
  poi,
  /addPoiToTravelogue\(\)[\s\S]*const material = this\.createPoiMaterial\(\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.materialsStorageKey[\s\S]*\/pages\/xicheng\/travelogue\/travelogue\?mode=poi[\s\S]*poiCode=\$\{encodeRouteValue\(this\.activePoi\.poiCode \|\| ''\)\}/,
  'POI detail should add a reviewable private POI material before opening travelogue'
)

assert.match(
  poi,
  /createPoiMaterial\(\)[\s\S]*type:\s*'poi-guide'[\s\S]*sources:\s*this\.sourceList[\s\S]*sourceCount:\s*this\.sourceList\.length[\s\S]*reviewStatus:\s*XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'/,
  'POI detail material should carry reviewed sources and stay private pending review'
)

assert.doesNotMatch(
  `${scanResult}\n${poi}`,
  /background-location|startLocationUpdateBackground|\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'POI detail MVP should not add backend calls, background location, or client-side secrets'
)
