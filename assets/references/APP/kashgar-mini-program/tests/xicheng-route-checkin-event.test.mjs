import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

assert.ok(
  regionConfig.includes("checkinStorageKey: 'xicheng:routeCheckins'"),
  'Xicheng config should define a local route check-in event storage key'
)

for (const required of [
  'createRouteCheckinEvent',
  'persistRouteCheckinEvent',
  'checkinStorageKey',
  'checkinId',
  'checkinType',
  'routeTitle',
  'poiCode',
  'poiName',
  'checkedInAt',
  '打卡事件'
]) {
  assert.ok(scanResult.includes(required), `Recognition result should create route check-in evidence ${required}`)
}

assert.match(
  scanResult,
  /startRecording\(\)[\s\S]*const checkinEvent = this\.createRouteCheckinEvent\(material\)[\s\S]*this\.persistRouteCheckinEvent\(checkinEvent\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.materialsStorageKey/,
  'Starting a recording from recognition should persist a route check-in event before opening the travelogue'
)

assert.match(
  scanResult,
  /createRouteCheckinEvent\(material\)[\s\S]*checkinId:\s*`checkin-\$\{Date\.now\(\)\}`[\s\S]*checkinType:\s*'recognition-poi'[\s\S]*routeTitle:\s*this\.recommendedRoute && this\.recommendedRoute\.title \? this\.recommendedRoute\.title : '西城 Citywalk'[\s\S]*poiCode:\s*material\.poiCode[\s\S]*poiName:\s*material\.poiName[\s\S]*sources:\s*material\.sources[\s\S]*checkedInAt:\s*material\.capturedAt/,
  'Route check-in event should include route, POI, sources, and timestamp evidence'
)

assert.match(
  scanResult,
  /persistRouteCheckinEvent\(checkinEvent\)[\s\S]*const existingCheckins = uni\.getStorageSync\(XICHENG_REGION_CONFIG\.checkinStorageKey\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.checkinStorageKey/,
  'Route check-in event should be stored independently from journey materials'
)

for (const required of [
  'routeCheckins',
  'checkinCount',
  '路线打卡',
  '打卡事件',
  'checkinStorageKey',
  'checkinEventLabel',
  'createCheckinEventLabel'
]) {
  assert.ok(travelogue.includes(required), `Travelogue should expose route check-in evidence ${required}`)
}

assert.match(
  travelogue,
  /uni\.getStorageSync\(XICHENG_REGION_CONFIG\.checkinStorageKey\)[\s\S]*this\.routeCheckins/,
  'Travelogue should restore route check-ins from local storage'
)

assert.match(
  travelogue,
  /checkinCount\(\)[\s\S]*return this\.routeCheckins\.length/,
  'Travelogue should compute check-in count from restored route check-ins'
)

assert.match(
  travelogue,
  /saveDraft\(\{ silent = false \} = \{\}\)[\s\S]*routeCheckins:\s*this\.routeCheckins[\s\S]*checkinCount:\s*this\.checkinCount/,
  'Saved travelogue draft should include route check-in evidence'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*routeCheckins:\s*this\.routeCheckins[\s\S]*checkinCount:\s*this\.checkinCount/,
  'Review package should include route check-in events for operations review'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*routeCheckins:\s*this\.routeCheckins[\s\S]*checkinCount:\s*this\.checkinCount/,
  'Poster and PDF assets should include route check-in events'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*checkinCount:\s*this\.checkinCount/,
  'Local operations report should include check-in count'
)

assert.doesNotMatch(
  `${scanResult}\n${travelogue}`,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Local check-in MVP should not introduce backend calls or client-side secrets'
)
