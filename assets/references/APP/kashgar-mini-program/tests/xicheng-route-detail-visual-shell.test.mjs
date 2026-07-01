import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const routeDetail = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'route-detail', 'route-detail.vue'), 'utf8')
const routeDetailPanel = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengRouteDetailPanel.vue'), 'utf8')
const routeDetailShell = `${routeDetail}\n${routeDetailPanel}`

for (const required of [
  'class="route-detail-hero-image"',
  ':src="routeHeroImage"',
  'class="route-detail-dashed-path"',
  'route-detail-timeline',
  'class="route-detail-nav-button route-detail-share-button"',
  'name="passport"',
  '沿途看点',
  '听讲解',
  '开始记录',
  'class="route-detail-stop-image"',
  ':src="getStopThumbnail(stop, index)"',
  'startRouteRecording',
  'generateRouteTravelogue'
]) {
  assert.ok(routeDetailShell.includes(required), `Xicheng route detail visual shell should include ${required}`)
}

assert.match(
  routeDetailShell,
  /routeHeroImage\(\)[\s\S]*this\.region\.visualAssets[\s\S]*routeThumbnails[\s\S]*this\.activeRoute\.routeCode[\s\S]*heroLandmark/,
  'Route detail hero should use compact route thumbnails and fall back to the Xicheng hero landmark asset'
)

assert.match(
  routeDetailShell,
  /displayRouteTitle\(\)[\s\S]*白塔寺文化线[\s\S]*什刹海水岸线[\s\S]*胡同烟火线/,
  'Route detail component should translate official route titles into concise display route names'
)

assert.match(
  routeDetailShell,
  /getStopThumbnail\(stop = \{\}, index = 0\)[\s\S]*xicheng-baitasi[\s\S]*xicheng-shichahai[\s\S]*this\.routeHeroImage/,
  'Route stop cards should use stable POI/route thumbnails instead of full-page design mockup images'
)

assert.match(
  routeDetail,
  /startRouteRecording\(\)[\s\S]*this\.persistRoutePassport\(\)[\s\S]*\/pages\/xicheng\/recording\/recording\?autoStart=1[\s\S]*routeCode=\$\{encodeRouteValue\(this\.activeRoute\.routeCode \|\| ''\)\}[\s\S]*companionName=\$\{encodeRouteValue\(this\.routeOptions\.companionName \|\| this\.region\.companionName\)\}/,
  'Route detail should offer a start-recording handoff to the dedicated recording page with autoStart=1, routeCode, and decoded companionName preserved'
)

assert.match(
  routeDetailShell,
  /\.route-detail-hero-image\s*\{[\s\S]*width:\s*100%[\s\S]*height:\s*100%[\s\S]*object-fit:\s*cover/,
  'Route hero image should keep stable mobile dimensions without layout shift'
)

assert.match(
  routeDetailShell,
  /\.route-detail-stop-image\s*\{[\s\S]*width:\s*180rpx[\s\S]*height:\s*154rpx[\s\S]*object-fit:\s*cover/,
  'Route stop thumbnail should keep stable mobile dimensions without layout shift'
)

assert.doesNotMatch(
  routeDetailShell,
  /<button class="nav-icon" @click="startRoutePassport">存<\/button>/,
  'Route detail passport action should use a familiar bookmark-style icon instead of the ambiguous visible text 存'
)

assert.doesNotMatch(
  routeDetailShell,
  /xicheng-multimodal\/design-mockups|04-route-detail-baitasi-culture\.png/,
  'Route detail runtime UI should not reference full-page design mockup screenshots'
)
