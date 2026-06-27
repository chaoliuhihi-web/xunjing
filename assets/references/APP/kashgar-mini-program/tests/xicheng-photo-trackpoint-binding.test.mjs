import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

for (const required of [
  'capturePhotoTrackPointIfRecording',
  "captureTrackPoint('photo')",
  'photoTrackPoint',
  'nearestTrackPoint'
]) {
  assert.ok(travelogue.includes(required), `Photo evidence should bind to recording track evidence marker ${required}`)
}

assert.match(
  travelogue,
  /captureTrackPoint\(pointType = 'manual'\)[\s\S]*const point = \{[\s\S]*pointType[\s\S]*this\.saveRecordingSession\(\)[\s\S]*return point/,
  'Capturing a track point should return the saved point so photo evidence can bind to the forced photo track point'
)

assert.match(
  travelogue,
  /capturePhotoTrackPointIfRecording\(\)[\s\S]*this\.recordingSession\.status !== 'recording'[\s\S]*return null[\s\S]*await this\.captureTrackPoint\('photo'\)[\s\S]*this\.normalizeTrackPointForMaterial\(point\)/,
  'Photo capture should force a foreground photo track point only while an active recording session is running'
)

assert.match(
  travelogue,
  /addPhotoMaterial\(\)[\s\S]*const photoTrackPoint = await this\.capturePhotoTrackPointIfRecording\(\)[\s\S]*nearestTrackPoint:\s*photoTrackPoint \|\| this\.findNearestTrackPoint\(takenAt\)/,
  'Adding photo material should prefer the forced photo track point before falling back to nearest existing track point'
)

assert.doesNotMatch(
  travelogue,
  /background-location|startLocationUpdateBackground|\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Photo track-point binding should remain local and foreground-only without backend calls or client-side secrets'
)
