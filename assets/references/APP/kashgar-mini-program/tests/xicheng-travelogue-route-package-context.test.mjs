import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

const startRecordingBlock = scanResult.match(/startRecording\(\)[\s\S]*?\n\t\t\},\n\t\tcreateRouteCheckinEvent/)?.[0] || ''
const loadJourneyBlock = travelogue.match(/async loadJourney\(options = \{\}\)[\s\S]*?\n\t\t\},\n\t\tshouldAutoStartRecording/)?.[0] || ''
const shouldAutoStartBlock = travelogue.match(/shouldAutoStartRecording\(options = \{\}\)[\s\S]*?\n\t\t\},\n\t\topenPrivacyPolicy/)?.[0] || ''

assert.ok(startRecordingBlock, 'Recognition result should expose startRecording')
assert.ok(loadJourneyBlock, 'Travelogue should expose loadJourney')
assert.ok(shouldAutoStartBlock, 'Travelogue should expose shouldAutoStartRecording')

for (const required of [
  'XICHENG_RECOMMENDED_ROUTES',
  "import { createXichengOfficialPoiSources } from '@/request/xunjing/officialPoi.js'",
  'resolveRouteByCode',
  'createOfficialRouteMaterials'
]) {
  assert.ok(travelogue.includes(required), `Travelogue route-code handoff should expose ${required}`)
}

for (const required of [
  'mode=record',
  'autoStart=1',
  'regionCode=${encodeURIComponent(this.result.regionCode || XICHENG_REGION_CONFIG.regionCode)}',
  'packageCode=${encodeURIComponent(this.result.packageCode || XICHENG_REGION_CONFIG.packageCode)}',
  'sceneCode=${encodeURIComponent(this.result.sceneCode || XICHENG_REGION_CONFIG.sceneCode)}',
  'sourceChannel=${encodeURIComponent(this.result.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel)}',
  "poiCode=${encodeRouteValue(this.result.poiCode || '')}",
  "poiName=${encodeRouteValue(this.result.poiName || '')}",
  'companionName=${encodeRouteValue(this.result.companionName || XICHENG_REGION_CONFIG.companionName)}',
  "safetyStatus=${encodeURIComponent(this.result.safetyStatus || '')}"
]) {
  assert.ok(startRecordingBlock.includes(required), `Recognition start-record route should carry ${required}`)
}

for (const required of [
  'const routeRegionCode = decodeJourneyRouteValue(options.regionCode) || XICHENG_REGION_CONFIG.regionCode',
  'const routePackageCode = decodeJourneyRouteValue(options.packageCode) || XICHENG_REGION_CONFIG.packageCode',
  'const routeSceneCode = decodeJourneyRouteValue(options.sceneCode) || XICHENG_REGION_CONFIG.sceneCode',
  'const routeSourceChannel = decodeJourneyRouteValue(options.sourceChannel) || XICHENG_REGION_CONFIG.sourceChannel',
  'const routeSafetyStatus = normalizeXichengSafetyStatus(decodeJourneyRouteValue(options.safetyStatus))',
  'const unsafeRouteSafetyStatus = isXichengUnsafeSafetyStatus(routeSafetyStatus)',
  'regionCode: routeRegionCode',
  'packageCode: routePackageCode',
  'sceneCode: routeSceneCode',
  'sourceChannel: routeSourceChannel',
  'safetyStatus: routeSafetyStatus'
]) {
  assert.ok(loadJourneyBlock.includes(required), `Travelogue route material should preserve ${required}`)
}

assert.match(
  loadJourneyBlock,
  /if \(routePoiName && !unsafeRouteSafetyStatus && !materials\.some\(material => material && material\.poiName === routePoiName\)\) \{/,
  'Travelogue should not create route-only manual-entry materials from BLOCKED or UNAVAILABLE recognition route params'
)

assert.match(
  loadJourneyBlock,
  /const routeCode = normalizeXichengRouteCode\(decodeJourneyRouteValue\(options\.routeCode \|\| options\.routeId\)\)[\s\S]*const routeFromCode = !unsafeRouteSafetyStatus \? resolveRouteByCode\(routeCode\) : null[\s\S]*if \(routeFromCode && !this\.importedRoute\) \{[\s\S]*this\.importedRoute = \{[\s\S]*\.\.\.routeFromCode[\s\S]*regionCode: routeRegionCode[\s\S]*packageCode: routePackageCode[\s\S]*sourceChannel: routeSourceChannel[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.inspirationStorageKey, this\.importedRoute\)/,
  'Travelogue route mode should hydrate the official route with attribution context when users open the route draft directly'
)

assert.match(
  loadJourneyBlock,
  /if \(routeFromCode && !materials\.some\(material => material && material\.routeCode === routeFromCode\.routeCode && material\.type === 'official-route-poi'\)\) \{[\s\S]*const routeMaterials = createOfficialRouteMaterials\(\{[\s\S]*route: routeFromCode[\s\S]*regionCode: routeRegionCode[\s\S]*packageCode: routePackageCode[\s\S]*sceneCode: routeSceneCode[\s\S]*sourceChannel: routeSourceChannel[\s\S]*\}\)[\s\S]*materials\.unshift\(\.\.\.routeMaterials\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.materialsStorageKey, materials\)/,
  'Travelogue route mode should create source-backed official-route-poi materials for share poster and review readiness'
)

assert.match(
  travelogue,
  /createOfficialRouteMaterials[\s\S]*type:\s*'official-route-poi'[\s\S]*sourceCount:\s*sources\.length[\s\S]*safetyStatus:\s*'PASSED'[\s\S]*reviewStatus:\s*XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'/,
  'Travelogue official route materials should carry explicit PASSED safety status so safety summaries count reviewed POI evidence'
)

assert.match(
  shouldAutoStartBlock,
  /const routeSafetyStatus = normalizeXichengSafetyStatus\(decodeJourneyRouteValue\(options\.safetyStatus\)\)[\s\S]*!\s*isXichengUnsafeSafetyStatus\(routeSafetyStatus\)/,
  'Travelogue should not auto-start recording when route params carry BLOCKED or UNAVAILABLE safety status'
)

assert.doesNotMatch(
  loadJourneyBlock,
  /type:\s*'manual-entry'[\s\S]*regionCode:\s*XICHENG_REGION_CONFIG\.regionCode[\s\S]*poiCode:/,
  'Travelogue should not hardcode regionCode when creating route-only manual-entry materials'
)
