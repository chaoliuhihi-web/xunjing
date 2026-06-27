import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

for (const required of [
  '标记停留',
  'markStayPoint',
  'stayPointCount',
  'stayPoint',
  'stayText',
  '停留点摘要'
]) {
  assert.ok(travelogue.includes(required), `Travelogue should support stay point evidence ${required}`)
}

assert.match(
  travelogue,
  /<text class="report-value">\{\{ stayPointCount \}\}<\/text>/,
  'Recording summary should render stayPointCount instead of directly reading the raw stayPoints array'
)

assert.match(
  travelogue,
  /@click="markStayPoint"/,
  'Recording actions should expose an explicit mark-stay-point button'
)

assert.match(
  travelogue,
  /const stayPointCount = recordingSession && Array\.isArray\(recordingSession\.stayPoints\)[\s\S]*const stayText[\s\S]*本次标记了 \$\{stayPointCount\} 个停留点/,
  'Travelogue draft should summarize marked stay points'
)

assert.match(
  travelogue,
  /stayPointCount\(\)[\s\S]*Array\.isArray\(this\.recordingSession\.stayPoints\)[\s\S]*this\.recordingSession\.stayPoints\.length/,
  'Travelogue should compute stay point count from the recording session'
)

assert.match(
  travelogue,
  /markStayPoint\(\)[\s\S]*requestCurrentLocationForTrigger\(\)[\s\S]*pointType:\s*'stay'[\s\S]*stayPoints:\s*\[[\s\S]*this\.recordingSession\.stayPoints/,
  'Marking a stay point should capture foreground location and append it to stayPoints'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*stayPointCount:\s*this\.stayPointCount/,
  'Review package should include stay point count'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*stayPointCount:\s*this\.stayPointCount/,
  'Poster and PDF artifacts should include stay point count'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*stayPointCount:\s*this\.stayPointCount/,
  'Local operations report should include stay point count'
)

assert.doesNotMatch(
  travelogue,
  /background-location|startLocationUpdateBackground|\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Stay point MVP should avoid background location, backend calls, and client-side secrets'
)
