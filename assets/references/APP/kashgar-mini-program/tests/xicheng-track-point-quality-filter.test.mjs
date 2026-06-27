import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')

for (const required of [
  'XICHENG_TRACK_POINT_QUALITY',
  'maxPoiAttributionAccuracyMeters: 80',
  'abnormalJumpWindowSeconds: 5',
  'abnormalJumpDistanceMeters: 500',
  'filteredTrackPoints',
  'calculateTrackPointDistanceMeters',
  'createTrackPointQuality',
  'persistFilteredTrackPoint',
  'poiAttributionEligible',
  'locationQuality'
]) {
  assert.ok(travelogue.includes(required), `Travelogue track recording should declare quality gate token ${required}`)
}

assert.match(
  travelogue,
  /createEmptyRecordingSession[\s\S]*trackPoints:\s*\[\][\s\S]*stayPoints:\s*\[\][\s\S]*filteredTrackPoints:\s*\[\]/,
  'Recording session should keep filtered track points separate from accepted route points'
)

assert.match(
  travelogue,
  /createTrackPointQuality\(point = \{\}, previousPoint = null\)[\s\S]*accuracyMeters > XICHENG_TRACK_POINT_QUALITY\.maxPoiAttributionAccuracyMeters[\s\S]*locationQuality:\s*'low_accuracy'[\s\S]*poiAttributionEligible:\s*false/,
  'Track point quality should downgrade accuracy over 80m so it is not used for POI attribution'
)

assert.match(
  travelogue,
  /createTrackPointQuality\(point = \{\}, previousPoint = null\)[\s\S]*secondsFromPrevious <= XICHENG_TRACK_POINT_QUALITY\.abnormalJumpWindowSeconds[\s\S]*distanceFromPreviousMeters >= XICHENG_TRACK_POINT_QUALITY\.abnormalJumpDistanceMeters[\s\S]*locationQuality:\s*'abnormal_jump'[\s\S]*filteredReason:\s*'abnormal_jump'/,
  'Track point quality should identify short-window abnormal jumps for filtering'
)

assert.match(
  travelogue,
  /captureTrackPoint\(pointType = 'manual'\)[\s\S]*const quality = this\.createTrackPointQuality\(point, this\.getLastAcceptedTrackPoint\(\)\)[\s\S]*if \(quality\.filteredReason === 'abnormal_jump'\)[\s\S]*this\.persistFilteredTrackPoint\(\{[\s\S]*\.\.\.point[\s\S]*\.\.\.quality[\s\S]*\}\)[\s\S]*return null/,
  'Capturing a track point should filter abnormal jumps instead of appending them to accepted trackPoints'
)

assert.match(
  travelogue,
  /trackPoints\.filter\(point => point && point\.poiAttributionEligible !== false\)/,
  'Nearest track point matching should ignore low-accuracy points that are not POI-attribution eligible'
)

assert.match(
  travelogue,
  /normalizeTrackPointForMaterial\(point = null\)[\s\S]*locationQuality:\s*point\.locationQuality \|\| 'usable'[\s\S]*poiAttributionEligible:\s*point\.poiAttributionEligible !== false/,
  'Photo material track binding should preserve location quality and POI-attribution eligibility'
)

assert.doesNotMatch(
  travelogue,
  /background-location|startLocationUpdateBackground|\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Track quality filtering should not introduce background location, backend calls, or client-side secrets'
)
