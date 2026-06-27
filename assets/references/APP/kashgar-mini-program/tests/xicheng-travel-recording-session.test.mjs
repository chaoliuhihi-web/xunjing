import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

assert.ok(
  regionConfig.includes("recordingStorageKey: 'xicheng:recordingSession'"),
  'Xicheng config should define a local recording session storage key'
)

for (const required of [
  '记录会话',
  'recordingSession',
  'recordingStatusText',
  'routePointCount',
  'startRecordingSession',
  'pauseRecordingSession',
  'resumeRecordingSession',
  'finishRecordingSession',
  'deleteRecordingSession',
  'captureTrackPoint',
  'requestCurrentLocationForTrigger',
  'recordingStorageKey',
  'trackPoints',
  'stayPoints',
  'startedAt',
  'finishedAt'
]) {
  assert.ok(travelogue.includes(required), `Travelogue page should support active recording session behavior ${required}`)
}

assert.match(
  travelogue,
  /import \{ requestCurrentLocationForTrigger \} from '@\/request\/xunjing\/trigger\.js'/,
  'Travelogue should reuse the Xunjing location helper instead of opening a new location stack'
)

assert.match(
  travelogue,
  /startRecordingSession\(\)[\s\S]*status:\s*'recording'[\s\S]*startedAt[\s\S]*this\.captureTrackPoint\('start'\)/,
  'Starting a recording session should mark it active and capture an initial location point'
)

assert.match(
  travelogue,
  /pauseRecordingSession\(\)[\s\S]*status:\s*'paused'[\s\S]*pausedAt/,
  'Pausing a recording session should preserve the session and mark pausedAt'
)

assert.match(
  travelogue,
  /@click="resumeRecordingSession"/,
  'Recording controls should expose an explicit resume entry after pausing'
)

assert.match(
  travelogue,
  /:disabled="recordingSession\.status === 'recording' \|\| recordingSession\.status === 'paused'"/,
  'Start recording should not reset an existing paused recording session'
)

assert.match(
  travelogue,
  /resumeRecordingSession\(\)[\s\S]*status:\s*'recording'[\s\S]*resumedAt[\s\S]*this\.captureTrackPoint\('resume'\)/,
  'Resuming a paused recording session should preserve the session, mark resumedAt, and capture a resume point'
)

assert.match(
  travelogue,
  /finishRecordingSession\(\)[\s\S]*this\.captureTrackPoint\('finish'\)[\s\S]*status:\s*'finished'[\s\S]*finishedAt/,
  'Finishing a recording session should capture the final point and close the session'
)

assert.match(
  travelogue,
  /@click="deleteRecordingSession"/,
  'Recording controls should expose an explicit delete-recording entry for privacy and acceptance'
)

assert.match(
  travelogue,
  /deleteRecordingSession\(\)[\s\S]*uni\.showModal\([\s\S]*删除记录[\s\S]*uni\.removeStorageSync\(XICHENG_REGION_CONFIG\.recordingStorageKey\)[\s\S]*createEmptyRecordingSession\(\)[\s\S]*refreshDraftFromEvidence\(\)/,
  'Deleting a recording session should confirm with the user, clear local recording storage, reset the session, and refresh draft evidence'
)

assert.match(
  travelogue,
  /captureTrackPoint\(pointType = 'manual'\)[\s\S]*requestCurrentLocationForTrigger\(\)[\s\S]*trackPoints:\s*\[[\s\S]*this\.recordingSession\.trackPoints/,
  'Capturing a track point should request foreground location and append it to the local session'
)

assert.match(
  travelogue,
  /@click="captureTrackPoint\('manual'\)"/,
  'Manual track point capture should not receive the raw click event as pointType'
)

assert.match(
  travelogue,
  /saveRecordingSession\(\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.recordingStorageKey,\s*this\.recordingSession\)/,
  'Recording session should persist to the canonical local recording storage key'
)

assert.match(
  travelogue,
  /saveDraft\(\{ silent = false \} = \{\}\)[\s\S]*recordingSession:\s*this\.recordingSession/,
  'Travelogue draft payload should include the local recording session'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*recordingSession:\s*this\.recordingSession[\s\S]*routePointCount:\s*this\.routePointCount/,
  'Review package should include recording session evidence and route point count'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*routePointCount:\s*this\.routePointCount[\s\S]*recordingStatus:\s*this\.recordingStatusText/,
  'Local city operations report should include route point count and recording status'
)

assert.doesNotMatch(
  travelogue,
  /background-location|startLocationUpdateBackground|\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Local recording MVP should avoid background location, backend calls, and client-side secrets'
)
