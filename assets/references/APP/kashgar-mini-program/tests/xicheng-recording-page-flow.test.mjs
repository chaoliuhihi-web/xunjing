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
const routeDetail = read('pages', 'xicheng', 'route-detail', 'route-detail.vue')
const recording = readOptional('pages', 'xicheng', 'recording', 'recording.vue')
const recordingPanel = readOptional('components', 'xicheng', 'XichengRouteRecordingPanel.vue')
const recordingShell = `${recording}\n${recordingPanel}`

assert.ok(
  pagesJson.includes('"path": "pages/xicheng/recording/recording"'),
  'Xicheng APP should register a dedicated route recording page'
)

assert.ok(
  app.includes("'pages/xicheng/recording/recording'"),
  'Route recording page should be public so shared route links do not force login'
)

assert.match(
  routeDetail,
  /startRouteRecording\(\)[\s\S]*persistRoutePassport\(\)[\s\S]*\/pages\/xicheng\/recording\/recording\?autoStart=1[\s\S]*routeCode=\$\{encodeRouteValue\(this\.activeRoute\.routeCode \|\| ''\)\}[\s\S]*regionCode=\$\{encodeRouteValue\(this\.routeOptions\.regionCode \|\| this\.region\.regionCode\)\}[\s\S]*packageCode=\$\{encodeRouteValue\(this\.routeOptions\.packageCode \|\| this\.region\.packageCode\)\}[\s\S]*sceneCode=\$\{encodeRouteValue\(this\.routeOptions\.sceneCode \|\| this\.region\.sceneCode\)\}[\s\S]*sourceChannel=\$\{encodeRouteValue\(this\.routeOptions\.sourceChannel \|\| this\.region\.sourceChannel\)\}[\s\S]*companionName=\$\{encodeRouteValue\(this\.routeOptions\.companionName \|\| this\.region\.companionName\)\}/,
  'Route detail start-recording should hand off to the dedicated recording page with route and Xicheng attribution context'
)

for (const required of [
  'xicheng-recording',
  '记录中',
  'recordMapCard',
  'recordingSession',
  'routeStopCards',
  'nextStop',
  '到达打卡',
  '亲子研学任务',
  'pauseRecordingSession',
  'resumeRecordingSession',
  'arriveAtNextStop',
  'askXiaojingForNextStop',
  'generateTravelogue',
  'recordingStorageKey',
  'checkinStorageKey',
  'createRouteCheckinEvent',
  'persistRouteCheckinEvent',
  'createXichengOfficialPoiSources',
  'centerOnRecordingLocation',
  'toggleRecordingMapLayer'
]) {
  assert.ok(recordingShell.includes(required), `Dedicated recording page should expose ${required}`)
}

assert.match(
  recordingShell,
  /<button class="recording-map-tool" @click="\$emit\('locate'\)">[\s\S]*<xicheng-icon name="location"[\s\S]*<button class="recording-map-tool" @click="\$emit\('toggle-layer'\)">[\s\S]*<xicheng-icon name="layer"/,
  'Recording map location and layer tool buttons should be wired through component events instead of inert buttons'
)

assert.match(
  recording,
  /import \{[\s\S]*XICHENG_RECOMMENDED_ROUTES[\s\S]*XICHENG_REGION_CONFIG[\s\S]*normalizeXichengRouteCode[\s\S]*\} from '@\/config\/regions\/xicheng\.js'[\s\S]*import \{ createXichengOfficialPoiSources \} from '@\/request\/xunjing\/officialPoi\.js'[\s\S]*import \{ decodeXichengRouteValue, createXichengRouteOutputValue \} from '@\/request\/xunjing\/routeParams\.js'/,
  'Recording page should reuse shared Xicheng route data, source normalization, and route param helpers'
)

assert.match(
  recording,
  /ensureRecordingSession\(\)[\s\S]*sessionId:\s*`recording-\$\{Date\.now\(\)\}`[\s\S]*routeCode:\s*this\.activeRoute\.routeCode[\s\S]*routeTitle:\s*this\.activeRoute\.title[\s\S]*status:\s*'recording'[\s\S]*startedAt:[\s\S]*currentStopIndex:\s*0[\s\S]*trackPoints:\s*\[\]/,
  'Recording page should create a local foreground route recording session without backend calls'
)

assert.match(
  recording,
  /saveRecordingSession\(\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.recordingStorageKey,\s*this\.recordingSession\)/,
  'Recording page should persist the active session to the canonical local recording storage key'
)

assert.match(
  recording,
  /centerOnRecordingLocation\(\)[\s\S]*this\.ensureRecordingSession\(\)[\s\S]*this\.captureForegroundTrackPoint\('recenter'\)[\s\S]*this\.saveRecordingSession\(\)[\s\S]*uni\.showToast\(\{[\s\S]*title:\s*'已校准当前位置'/,
  'Recording location tool should add a foreground recenter track point, save the session, and provide user feedback'
)

assert.match(
  recording,
  /toggleRecordingMapLayer\(\)[\s\S]*const nextLayerMode = this\.recordingSession\.mapLayerMode === 'source' \? 'route' : 'source'[\s\S]*mapLayerMode:\s*nextLayerMode[\s\S]*this\.saveRecordingSession\(\)[\s\S]*uni\.showToast\(\{[\s\S]*title:\s*nextLayerMode === 'source' \? '已切换来源图层' : '已切换路线图层'/,
  'Recording layer tool should toggle and persist the route/source map layer mode with user feedback'
)

assert.match(
  recording,
  /arriveAtNextStop\(\)[\s\S]*const checkinEvent = this\.createRouteCheckinEvent\(stop\)[\s\S]*this\.persistRouteCheckinEvent\(checkinEvent\)[\s\S]*this\.saveRecordingSession\(\)/,
  'Arriving at the next stop should create reviewable route check-in evidence and save the session'
)

assert.match(
  recording,
  /createRouteCheckinEvent\(stop = \{\}\)[\s\S]*const sources = createXichengOfficialPoiSources\(stop\)[\s\S]*checkinType:\s*'route-stop'[\s\S]*routeCode:\s*this\.activeRoute\.routeCode[\s\S]*poiCode:\s*stop\.poiCode[\s\S]*poiName:\s*stop\.poiName[\s\S]*sources,[\s\S]*sourceCount:\s*sources\.length[\s\S]*safetyStatus:\s*'PASSED'[\s\S]*reviewStatus:\s*XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'/,
  'Route stop check-ins should carry official POI sources, explicit PASSED safety status, and stay private pending review'
)

assert.match(
  recording,
  /persistStopMaterial\(stop = \{\}, checkinEvent = \{\}\)[\s\S]*type:\s*'route-recording-checkin'[\s\S]*sources,[\s\S]*sourceCount:\s*sources\.length[\s\S]*safetyStatus:\s*'PASSED'[\s\S]*reviewStatus:\s*XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'/,
  'Route recording materials should carry explicit PASSED safety status so review and share summaries count them'
)

assert.match(
  recording,
  /askXiaojingForNextStop\(\)[\s\S]*this\.persistStopGuideContext\(stop, question\)[\s\S]*\/pages\/ai-guide\/ai-guide\?question=\$\{encodeRouteValue\(question\)\}[\s\S]*poiCode=\$\{encodeRouteValue\(stop\.poiCode \|\| ''\)\}[\s\S]*poiName=\$\{encodeRouteValue\(stop\.poiName \|\| ''\)\}[\s\S]*safetyStatus=\$\{encodeRouteValue\('PASSED'\)\}/,
  'Recording page should open Xiaojing with reviewed route stop source context'
)

assert.match(
  recording,
  /generateTravelogue\(\)[\s\S]*\/pages\/xicheng\/travelogue\/travelogue\?mode=record[\s\S]*routeCode=\$\{encodeRouteValue\(this\.activeRoute\.routeCode \|\| ''\)\}[\s\S]*companionName=\$\{encodeRouteValue\(this\.routeOptions\.companionName \|\| this\.region\.companionName\)\}/,
  'Recording page should hand recorded route evidence into travelogue generation'
)

assert.doesNotMatch(
  recording,
  /background-location|startLocationUpdateBackground|\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Dedicated recording MVP should not add background location, backend calls, or client-side secrets'
)
