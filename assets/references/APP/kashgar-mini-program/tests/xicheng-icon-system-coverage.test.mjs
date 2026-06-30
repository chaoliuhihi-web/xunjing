import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const iconComponent = read('components', 'xicheng-icon', 'xicheng-icon.vue')
const routes = read('pages', 'xicheng', 'routes', 'routes.vue')
const poi = read('pages', 'xicheng', 'poi', 'poi.vue')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const recording = read('pages', 'xicheng', 'recording', 'recording.vue')
const routeDetail = read('pages', 'xicheng', 'route-detail', 'route-detail.vue')

for (const required of [
  "refresh: 'refresh'",
  "source: 'info'",
  "next: 'right'",
  "check: 'checkmarkempty'",
  "study: 'medal'",
  "passport: 'medal'",
  "record: 'flag'",
  "resume: 'sound-filled'"
]) {
  assert.ok(iconComponent.includes(required), `Xicheng icon system should include reusable ${required}`)
}

assert.match(
  routes,
  /<xicheng-icon[\s\S]*name="refresh"/,
  'Route list rerank action should use the shared refresh icon instead of a raw glyph'
)

assert.match(
  poi,
  /<xicheng-icon[\s\S]*name="check"[\s\S]*<xicheng-icon[\s\S]*name="next"[\s\S]*<xicheng-icon[\s\S]*name="next"/,
  'POI detail status and forward actions should use shared check and next icons'
)

assert.match(
  scanResult,
  /<xicheng-icon[\s\S]*name="back"[\s\S]*<xicheng-icon[\s\S]*:name="recognitionActionBlocked \? 'locked' : 'source'"/,
  'Scan result top navigation and source summary should use shared icons'
)

assert.match(
  recording,
  /<xicheng-icon[\s\S]*name="back"[\s\S]*:name="recordingSession\.status === 'paused' \? 'resume' : 'record'"[\s\S]*name="route"[\s\S]*name="study"/,
  'Recording page should use shared icons for navigation, recording state, route marker, and study task'
)

assert.match(
  routeDetail,
  /<xicheng-icon[\s\S]*name="back"[\s\S]*name="passport"[\s\S]*name="play"/,
  'Route detail should use shared icons for back, route passport, and playback'
)
