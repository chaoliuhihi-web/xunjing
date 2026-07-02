import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const routeDetail = read('pages', 'xicheng', 'route-detail', 'route-detail.vue')
const panel = read('components', 'xicheng', 'XichengRouteDetailPanel.vue')
const timeline = read('components', 'xicheng', 'XichengRouteStopTimeline.vue')

assert.match(
  routeDetail,
  /<xicheng-route-detail-panel[\s\S]*@open-poi-detail="openStopPoiDetail"[\s\S]*@navigate-stop="navigateStopPoi"/,
  'Route detail page should handle stop detail and navigation actions from the panel'
)

assert.match(
  panel,
  /emits:\s*\[[\s\S]*'open-poi-detail'[\s\S]*'navigate-stop'[\s\S]*\]/,
  'Route detail panel should expose explicit POI detail and navigation events'
)

for (const required of [
  'route-detail-stop-actions',
  '地点详情',
  '导航去这里',
  "$emit('open-poi-detail', stop)",
  "$emit('navigate-stop', stop)"
]) {
  assert.ok(timeline.includes(required), `Route detail stop cards should include ${required}`)
}

assert.match(
  routeDetail,
  /openStopPoiDetail\(stop = \{\}\)[\s\S]*this\.openRouteStopPoi\(stop,\s*'detail'\)/,
  'Route detail page should route stop detail taps through a single POI handoff helper'
)

assert.match(
  routeDetail,
  /navigateStopPoi\(stop = \{\}\)[\s\S]*this\.openRouteStopPoi\(stop,\s*'navigation'\)/,
  'Route detail page should route navigation taps through the same reviewed POI handoff helper'
)

assert.match(
  routeDetail,
  /openRouteStopPoi\(stop = \{\}, entryMode = 'detail'\)[\s\S]*if \(!stop\.poiCode \|\| !stop\.poiName\)[\s\S]*this\.persistStopGuideContext\(stop,\s*entryMode === 'navigation' \? `导航去\$\{stop\.poiName\}` : `讲讲\$\{stop\.poiName\}`\)[\s\S]*\/pages\/xicheng\/poi\/poi\?entryMode=\$\{encodeRouteValue\(entryMode\)\}[\s\S]*poiCode=\$\{encodeRouteValue\(stop\.poiCode \|\| ''\)\}[\s\S]*poiName=\$\{encodeRouteValue\(stop\.poiName \|\| ''\)\}[\s\S]*regionCode=\$\{encodeRouteValue\(this\.routeOptions\.regionCode \|\| this\.region\.regionCode\)\}[\s\S]*packageCode=\$\{encodeRouteValue\(this\.routeOptions\.packageCode \|\| this\.region\.packageCode\)\}[\s\S]*sceneCode=\$\{encodeRouteValue\(this\.routeOptions\.sceneCode \|\| this\.region\.sceneCode\)\}[\s\S]*sourceChannel=\$\{encodeRouteValue\(this\.routeOptions\.sourceChannel \|\| this\.region\.sourceChannel\)\}[\s\S]*companionName=\$\{encodeRouteValue\(this\.routeOptions\.companionName \|\| this\.region\.companionName\)\}[\s\S]*safetyStatus=\$\{encodeRouteValue\('PASSED'\)\}/,
  'Route detail stop POI helper should preserve full Xicheng attribution and reviewed safety context'
)

assert.doesNotMatch(
  `${routeDetail}\n${panel}\n${timeline}`,
  /openLocation|startLocationUpdateBackground|\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Route detail stop actions should not add risky location permissions, backend calls, or client-side secrets'
)
