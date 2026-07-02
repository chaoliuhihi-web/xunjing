import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const iconComponent = read('components', 'xicheng-icon', 'xicheng-icon.vue')
const culturalMap = read('components', 'xicheng', 'XichengCulturalMap.vue')
const routes = read('pages', 'xicheng', 'routes', 'routes.vue')
const poi = read('pages', 'xicheng', 'poi', 'poi.vue')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const scanResultSummaryHero = read('components', 'xicheng', 'XichengScanResultSummaryHero.vue')
const scanResultVisionAgentPanel = read('components', 'xicheng', 'XichengScanResultVisionAgentPanel.vue')
const recording = read('pages', 'xicheng', 'recording', 'recording.vue')
const recordingPanel = read('components', 'xicheng', 'XichengRouteRecordingPanel.vue')
const recordingMapCanvas = read('components', 'xicheng', 'XichengRouteRecordingMapCanvas.vue')
const recordingShell = `${recording}\n${recordingPanel}\n${recordingMapCanvas}`
const routeDetail = read('pages', 'xicheng', 'route-detail', 'route-detail.vue')
const routeDetailPanel = read('components', 'xicheng', 'XichengRouteDetailPanel.vue')
const routeDetailShell = `${routeDetail}\n${routeDetailPanel}`

for (const required of [
  "refresh: 'refresh'",
  "source: 'info'",
  "next: 'right'",
  "check: 'checkmarkempty'",
  "study: 'medal'",
  "passport: 'medal'",
  "record: 'flag'",
  "resume: 'sound-filled'",
  "close: 'closeempty'",
  "more: 'more-filled'",
  "plus: 'plusempty'",
  "heart: 'heart-filled'",
  "share: 'paperplane-filled'",
  "settings: 'settings-filled'"
]) {
  assert.ok(iconComponent.includes(required), `Xicheng icon system should include reusable ${required}`)
}

assert.match(
  routes,
  /<xicheng-icon[\s\S]*name="refresh"/,
  'Route list rerank action should use the shared refresh icon instead of a raw glyph'
)

assert.match(
  culturalMap,
  /<button class="xicheng-map-control" @click="\$emit\('zoom-in'\)">[\s\S]*<xicheng-icon name="plus"/,
  'Cultural map zoom control should use the shared plus icon from the approved map UI instead of a forward arrow'
)

assert.doesNotMatch(
  culturalMap,
  /@click="\$emit\('zoom-in'\)">[\s\S]*<xicheng-icon name="next"/,
  'Cultural map zoom control should not reuse the next-arrow icon for the plus-shaped map zoom action'
)

assert.match(
  poi,
  /<xicheng-icon[\s\S]*name="check"[\s\S]*<xicheng-icon[\s\S]*name="next"[\s\S]*<xicheng-icon[\s\S]*name="next"/,
  'POI detail status and forward actions should use shared check and next icons'
)

assert.match(
  scanResult,
  /<xicheng-icon[\s\S]*name="back"[\s\S]*<xicheng-icon[\s\S]*name="edit"/,
  'Scan result top navigation should use shared back and edit icons'
)

assert.match(
  scanResultSummaryHero,
  /<xicheng-icon[\s\S]*name="check"[\s\S]*<xicheng-icon[\s\S]*:name="recognitionActionBlocked \? 'locked' : 'source'"/,
  'Scan result summary hero should use shared check and source status icons'
)

assert.match(
  scanResultVisionAgentPanel,
  /service-handoff-close[\s\S]*<xicheng-icon[\s\S]*name="close"[\s\S]*service-handoff-primary-arrow[\s\S]*<xicheng-icon[\s\S]*name="next"/,
  'Scan result service handoff close and forward actions should use shared vector icons'
)

assert.doesNotMatch(
  scanResultVisionAgentPanel,
  /class="service-handoff-close"[^>]*>\s*×\s*<\/view>|class="service-handoff-primary-arrow"[^>]*>\s*→\s*<\/text>/,
  'Scan result service handoff should not hand-write structural close or forward glyphs'
)

assert.match(
  scanResultVisionAgentPanel,
  /\.service-handoff-close\s*\{[\s\S]*width:\s*72rpx[\s\S]*height:\s*72rpx/,
  'Scan result service handoff close control should keep a stable app touch target'
)

for (const iconName of ['back', 'record', 'route', 'resume', 'edit']) {
  assert.match(
    recordingShell,
    new RegExp(`<xicheng-icon[\\s\\S]*name="${iconName}"`),
    `Recording page should use the shared ${iconName} icon for navigation, recording state, route marker, resume, and travelogue material actions`
  )
}

assert.match(
  routeDetailShell,
  /<xicheng-icon[\s\S]*name="back"[\s\S]*name="passport"[\s\S]*name="play"/,
  'Route detail should use shared icons for back, route passport, and playback'
)
