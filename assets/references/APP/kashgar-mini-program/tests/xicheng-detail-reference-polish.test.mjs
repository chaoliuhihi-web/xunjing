import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')
const aiGuideXichengChat = read('pages', 'ai-guide', 'ai-guide-xicheng-chat.css')
const poi = read('pages', 'xicheng', 'poi', 'poi.vue')
const scan = read('pages', 'xicheng', 'scan', 'scan.vue')
const footprint = read('pages', 'xicheng', 'footprint', 'footprint.vue')
const passport = read('pages', 'xicheng', 'passport', 'passport.vue')
const share = read('pages', 'xicheng', 'share', 'share.vue')
const works = read('pages', 'xicheng', 'works', 'works.vue')
const worksProfileCard = read('components', 'xicheng', 'XichengWorksProfileCard.vue')
const opsReport = read('pages', 'xicheng', 'ops-report', 'ops-report.vue')

for (const required of [
  'xichengAiGuideMode',
  'isXichengPlaybackMode',
  'XICHENG_PLAYBACK_WAVE_BARS',
  'xicheng-playback-card',
  'xicheng-playback-console',
  'xicheng-playback-source-pill',
  'normalizeXichengAiGuideMode(routeOptions.mode)'
]) {
  assert.ok(aiGuide.includes(required), `AI guide should expose approved playback-detail token ${required}`)
}

assert.match(
  poi,
  /const playbackQuery = prompt === this\.playQuestion \? `&mode=\$\{encodeRouteValue\('playback'\)\}` : ''[\s\S]*\/pages\/ai-guide\/ai-guide\?question=\$\{encodeRouteValue\(prompt\)\}\$\{playbackQuery\}/,
  'POI playback action should enter Xiaojing with mode=playback while preserving the existing AI-guide route'
)

assert.match(
  aiGuideXichengChat,
  /\.xicheng-playback-console\s*\{[\s\S]*linear-gradient\(145deg,\s*#163D34[\s\S]*\.xicheng-playback-wave-bar-active[\s\S]*#E0BE7B/,
  'Playback visual shell should match the approved dark green player and gold waveform'
)

for (const required of [
  'scan-reference-hero',
  'footprint-reference-hero',
  'footprint-empty-step',
  'footprint-draft-card',
  'passport-reference-hero',
  'passport-stamp-orbit',
  'passport-badge-grid',
  'share-reference-poster-frame',
  'share-setting-list',
  'share-review-steps',
  'profile-card',
  'library-overview',
  'privacy-card',
  'ops-reference-dashboard',
  'trend-chart',
  'ops-safety-lane',
  'xiaojing-insight-card'
]) {
  const allSources = [
    scan,
    footprint,
    passport,
    share,
    works,
    worksProfileCard,
    opsReport
  ].join('\n')
  assert.ok(allSources.includes(required), `Xicheng detail pages should keep approved reference token ${required}`)
}

for (const [fileName, source] of [
  ['footprint.vue', footprint],
  ['passport.vue', passport],
  ['share.vue', share],
  ['works.vue', works],
  ['XichengWorksProfileCard.vue', worksProfileCard],
  ['ops-report.vue', opsReport]
]) {
  assert.doesNotMatch(
    source,
    /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|background-location|startLocationUpdateBackground/,
    `${fileName} detail polish should not add backend calls, client secrets, or high-risk background permissions`
  )
}
