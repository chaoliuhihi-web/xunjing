import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const routeDetail = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'route-detail', 'route-detail.vue'), 'utf8')

for (const required of [
  'class="route-hero-image"',
  ':src="routeHeroImage"',
  'class="route-map-trail"',
  'route-operation-strip',
  '路线护照',
  '亲子研学任务',
  '开始记录',
  'class="stop-thumbnail"',
  ':src="getStopThumbnail(stop, index)"',
  'startRouteRecording',
  'generateRouteTravelogue'
]) {
  assert.ok(routeDetail.includes(required), `Xicheng route detail visual shell should include ${required}`)
}

assert.match(
  routeDetail,
  /routeHeroImage\(\)[\s\S]*this\.region\.visualAssets[\s\S]*routeThumbnails[\s\S]*this\.activeRoute\.routeCode[\s\S]*heroLandmark/,
  'Route detail hero should use compact route thumbnails and fall back to the Xicheng hero landmark asset'
)

assert.match(
  routeDetail,
  /routeOperationCards\(\)[\s\S]*路线护照[\s\S]*亲子研学任务[\s\S]*步行距离/,
  'Route detail should summarize passport, study task, and walking distance before the route timeline'
)

assert.match(
  routeDetail,
  /getStopThumbnail\(stop = \{\}, index = 0\)[\s\S]*return this\.routeHeroImage/,
  'Route stop cards should use a stable thumbnail helper instead of full-page design mockup images'
)

assert.match(
  routeDetail,
  /startRouteRecording\(\)[\s\S]*this\.persistRoutePassport\(\)[\s\S]*\/pages\/xicheng\/travelogue\/travelogue\?mode=record[\s\S]*routeCode=\$\{encodeRouteValue\(this\.activeRoute\.routeCode \|\| ''\)\}[\s\S]*companionName=\$\{encodeRouteValue\(this\.routeOptions\.companionName \|\| this\.region\.companionName\)\}/,
  'Route detail should offer a direct start-recording handoff with routeCode and decoded companionName preserved'
)

assert.match(
  routeDetail,
  /\.route-hero-image\s*\{[\s\S]*width:\s*240rpx[\s\S]*height:\s*250rpx[\s\S]*object-fit:\s*cover/,
  'Route hero image should keep stable mobile dimensions without layout shift'
)

assert.match(
  routeDetail,
  /\.stop-thumbnail\s*\{[\s\S]*width:\s*150rpx[\s\S]*height:\s*150rpx[\s\S]*object-fit:\s*cover/,
  'Route stop thumbnail should keep stable mobile dimensions without layout shift'
)

assert.doesNotMatch(
  routeDetail,
  /xicheng-multimodal\/design-mockups|04-route-detail-baitasi-culture\.png/,
  'Route detail runtime UI should not reference full-page design mockup screenshots'
)
