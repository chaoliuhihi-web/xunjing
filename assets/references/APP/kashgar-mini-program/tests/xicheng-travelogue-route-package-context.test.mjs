import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

const startRecordingBlock = scanResult.match(/startRecording\(\)[\s\S]*?\n\t\t\},\n\t\tcreateRouteCheckinEvent/)?.[0] || ''
const loadJourneyBlock = travelogue.match(/async loadJourney\(options = \{\}\)[\s\S]*?\n\t\t\},\n\t\tshouldAutoStartRecording/)?.[0] || ''

assert.ok(startRecordingBlock, 'Recognition result should expose startRecording')
assert.ok(loadJourneyBlock, 'Travelogue should expose loadJourney')

for (const required of [
  'mode=record',
  'autoStart=1',
  'regionCode=${encodeURIComponent(this.result.regionCode || XICHENG_REGION_CONFIG.regionCode)}',
  'packageCode=${encodeURIComponent(this.result.packageCode || XICHENG_REGION_CONFIG.packageCode)}',
  'sceneCode=${encodeURIComponent(this.result.sceneCode || XICHENG_REGION_CONFIG.sceneCode)}',
  'sourceChannel=${encodeURIComponent(this.result.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel)}',
  "poiCode=${encodeURIComponent(this.result.poiCode || '')}",
  "poiName=${encodeURIComponent(this.result.poiName || '')}",
  'companionName=${encodeURIComponent(this.result.companionName || XICHENG_REGION_CONFIG.companionName)}',
  "safetyStatus=${encodeURIComponent(this.result.safetyStatus || '')}"
]) {
  assert.ok(startRecordingBlock.includes(required), `Recognition start-record route should carry ${required}`)
}

for (const required of [
  'const routeRegionCode = decodeJourneyRouteValue(options.regionCode) || XICHENG_REGION_CONFIG.regionCode',
  'const routePackageCode = decodeJourneyRouteValue(options.packageCode) || XICHENG_REGION_CONFIG.packageCode',
  'const routeSceneCode = decodeJourneyRouteValue(options.sceneCode) || XICHENG_REGION_CONFIG.sceneCode',
  'const routeSourceChannel = decodeJourneyRouteValue(options.sourceChannel) || XICHENG_REGION_CONFIG.sourceChannel',
  'const routeSafetyStatus = decodeJourneyRouteValue(options.safetyStatus)',
  'regionCode: routeRegionCode',
  'packageCode: routePackageCode',
  'sceneCode: routeSceneCode',
  'sourceChannel: routeSourceChannel',
  'safetyStatus: routeSafetyStatus'
]) {
  assert.ok(loadJourneyBlock.includes(required), `Travelogue route material should preserve ${required}`)
}

assert.doesNotMatch(
  loadJourneyBlock,
  /type:\s*'manual-entry'[\s\S]*regionCode:\s*XICHENG_REGION_CONFIG\.regionCode[\s\S]*poiCode:/,
  'Travelogue should not hardcode regionCode when creating route-only manual-entry materials'
)
