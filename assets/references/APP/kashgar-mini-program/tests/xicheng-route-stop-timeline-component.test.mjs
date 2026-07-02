import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

const panelPath = ['components', 'xicheng', 'XichengRouteDetailPanel.vue']
const timelinePath = ['components', 'xicheng', 'XichengRouteStopTimeline.vue']
const detailConfigPath = ['config', 'regions', 'xichengRouteDetail.js']

assert.ok(
  exists(...timelinePath),
  'Route detail stop timeline should be extracted into XichengRouteStopTimeline.vue'
)
assert.ok(
  exists(...detailConfigPath),
  'Route detail thumbnail and walk-distance constants should live in xichengRouteDetail.js config'
)

const panel = read(...panelPath)
const timeline = read(...timelinePath)
const detailConfig = read(...detailConfigPath)
const shell = `${panel}\n${timeline}\n${detailConfig}`

assert.match(
  panel,
  /import XichengRouteStopTimeline from '@\/components\/xicheng\/XichengRouteStopTimeline\.vue'[\s\S]*components:\s*\{[\s\S]*XichengRouteStopTimeline/,
  'Route detail panel should import and register the extracted stop timeline component'
)

assert.match(
  panel,
  /<xicheng-route-stop-timeline[\s\S]*:route-stops="routeStopItems"[\s\S]*:route-hero-image="routeHeroImage"[\s\S]*@ask-stop="\$emit\('ask-stop', \$event\)"[\s\S]*@open-poi-detail="\$emit\('open-poi-detail', \$event\)"[\s\S]*@navigate-stop="\$emit\('navigate-stop', \$event\)"/,
  'Route detail panel should delegate stop rendering while preserving all stop action handoffs'
)

assert.doesNotMatch(
  panel,
  /v-for="\(\s*stop,\s*index\s*\) in routeStopItems"[\s\S]*route-detail-stop-card/,
  'Route detail panel should not keep the full stop-card timeline inline after extraction'
)

assert.match(
  timeline,
  /props:\s*\{[\s\S]*routeStops:[\s\S]*type:\s*Array[\s\S]*routeHeroImage:[\s\S]*type:\s*String/,
  'Route stop timeline component should receive route stops and hero image through props'
)

assert.match(
  timeline,
  /emits:\s*\['ask-stop',\s*'open-poi-detail',\s*'navigate-stop'\]/,
  'Route stop timeline should emit stop actions instead of owning navigation'
)

for (const token of [
  'route-detail-timeline',
  'route-detail-timeline-row',
  'route-detail-stop-card',
  'route-detail-stop-image',
  'route-detail-stop-actions',
  '步行',
  '听讲解',
  '地点详情',
  '导航去这里',
  "$emit('ask-stop', stop)",
  "$emit('open-poi-detail', stop)",
  "$emit('navigate-stop', stop)",
  'route-detail-finish-pin'
]) {
  assert.ok(timeline.includes(token), `Route stop timeline should preserve visible/action token: ${token}`)
}

assert.match(
  timeline,
  /v-for="\(\s*stop,\s*index\s*\) in routeStopItems"[\s\S]*getStepWalkDistance\(index\)[\s\S]*getStepWalkMinutes\(stop\)[\s\S]*getStopThumbnail\(stop, index\)/,
  'Route stop timeline should render each route stop with distance, walking time, and thumbnail helpers'
)

assert.match(
  detailConfig,
  /export const XICHENG_ROUTE_DETAIL_FALLBACK_HIGHLIGHT_IMAGES = Object\.freeze\(\[[\s\S]*route-hutong-life\.jpg[\s\S]*route-shichahai-waterfront\.jpg[\s\S]*poi-baitasi-card\.jpg/,
  'Route detail visual fallback images should be centralized in config'
)

assert.match(
  detailConfig,
  /export const XICHENG_ROUTE_DETAIL_WALK_DISTANCES = Object\.freeze\(\['1\.1 公里',\s*'1\.2 公里',\s*'1\.0 公里',\s*'0\.8 公里'\]\)/,
  'Route detail walk distances should be centralized in config'
)

assert.match(
  detailConfig,
  /export const XICHENG_ROUTE_DETAIL_STOP_THUMBNAILS = Object\.freeze\(\{[\s\S]*'xicheng-baitasi':\s*'\/static\/xicheng\/poi-baitasi-card\.jpg'[\s\S]*'xicheng-dashilar':\s*'\/static\/xicheng\/route-hutong-life\.jpg'/,
  'Route detail stop thumbnail map should be centralized in config'
)

assert.ok(panel.split(/\r?\n/).length < 520, 'Route detail panel should shrink after extracting stop timeline')
assert.ok(timeline.split(/\r?\n/).length < 330, 'Route stop timeline component should stay compact for APP packaging')
assert.ok(detailConfig.split(/\r?\n/).length < 80, 'Route detail config should stay compact and reviewable')

assert.doesNotMatch(
  shell,
  /\/app-api\/xunjing|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}|startLocationUpdateBackground/,
  'Route stop timeline extraction should not introduce backend calls, client secrets, or high-risk background permissions'
)
