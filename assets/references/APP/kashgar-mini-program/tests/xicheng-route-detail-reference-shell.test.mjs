import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

const componentPath = ['components', 'xicheng', 'XichengRouteDetailPanel.vue']
const timelinePath = ['components', 'xicheng', 'XichengRouteStopTimeline.vue']

assert.ok(
  exists(...componentPath),
  'Route detail should extract the approved reference UI into a dedicated component'
)
assert.ok(
  exists(...timelinePath),
  'Route detail should extract the stop timeline into a dedicated component'
)

const routeDetail = read('pages', 'xicheng', 'route-detail', 'route-detail.vue')
const panel = read(...componentPath)
const timeline = read(...timelinePath)
const routeDetailShell = `${panel}\n${timeline}`

assert.match(
  routeDetail,
  /import XichengRouteDetailPanel from '@\/components\/xicheng\/XichengRouteDetailPanel\.vue'/,
  'Route detail page should import the dedicated route detail panel'
)

assert.match(
  routeDetail,
  /<xicheng-route-detail-panel[\s\S]*:route="activeRoute"[\s\S]*:route-hero="routeHero"[\s\S]*:route-stops="routeStopCards"[\s\S]*:nearby-highlights="nearbyHighlights"[\s\S]*@ask-stop="askStopGuide"[\s\S]*@start-recording="startRouteRecording"[\s\S]*@generate-travelogue="generateRouteTravelogue"/,
  'Route detail page should pass route state into the component and keep business actions on the page'
)

for (const required of [
  '路线详情',
  '白塔寺文化线',
  '我帮你排好了顺路走法',
  'route-detail-hero',
  'route-detail-map-dots',
  'route-detail-dashed-path',
  'route-detail-timeline',
  'route-detail-stop-card',
  '步行',
  '听讲解',
  '沿途看点',
  '生成这条路线的游记',
  '全程约',
  '建议穿舒适步行鞋',
  '$emit(\'ask-stop\'',
  '$emit(\'start-recording\'',
  '$emit(\'generate-travelogue\'',
  'route-detail-record-shortcut-button'
]) {
  assert.ok(routeDetailShell.includes(required), `Route detail reference shell should include ${required}`)
}

assert.doesNotMatch(
  routeDetailShell,
  /\$emit\('passport'|name="passport"|route-detail-share-button/,
  'Route detail reference shell should keep the top-right shortcut on recording, not route passport'
)

assert.match(
  panel,
  /<image[\s\S]*class="route-detail-hero-image"[\s\S]*:src="routeHeroImage"[\s\S]*mode="aspectFill"/,
  'Route detail hero should render the approved large route image with stable aspect fill'
)

assert.match(
  timeline,
  /v-for="\(\s*stop,\s*index\s*\) in routeStopItems"[\s\S]*class="route-detail-stop-card[^"]*"[\s\S]*getStopThumbnail\(stop, index\)[\s\S]*\$emit\('ask-stop', stop\)/,
  'Route detail timeline should render stop cards from structured route stops and emit stop guide actions'
)

assert.match(
  panel,
  /\.route-detail-hero\s*\{[\s\S]*min-height:\s*440rpx[\s\S]*overflow:\s*hidden/,
  'Route detail hero should reserve stable mobile height and avoid layout shift'
)

assert.match(
  timeline,
  /\.route-detail-stop-card\s*\{[\s\S]*grid-template-columns:\s*180rpx 1fr 112rpx/,
  'Route detail stop cards should use the approved image/text/listen layout instead of a flat list'
)

assert.doesNotMatch(
  routeDetailShell + routeDetail,
  /\/app-api\/xunjing|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'High-fidelity route detail shell should not introduce backend calls or client-side secrets'
)
