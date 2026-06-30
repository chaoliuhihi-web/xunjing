import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const home = read('pages', 'xicheng', 'home', 'home.vue')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const homeStyle = home.match(/<style scoped>[\s\S]*<\/style>/)?.[0] || ''
const resultStyle = scanResult.match(/<style scoped>[\s\S]*<\/style>/)?.[0] || ''

assert.match(
  home,
  /class="hero xicheng-reference-hero"[\s\S]*class="home-action-duo"[\s\S]*home-scan-card[\s\S]*home-ask-card/,
  'Xicheng home should follow the approved reference: immersive hero followed by exactly two primary action cards'
)

assert.doesNotMatch(
  home,
  /class="quick-grid"[\s\S]*quick-card-photo[\s\S]*quick-card-gps[\s\S]*quick-card-ocr[\s\S]*quick-card-text/,
  'Xicheng home first viewport should not show the old multi-choice recognition grid; scan must be one automatic entry'
)

assert.match(
  home,
  /class="route-reference-grid"[\s\S]*filteredRecommendedRoutes\.slice\(0, 3\)[\s\S]*class="route-reference-card"/,
  'Xicheng home should show the approved three-card route preview instead of a long feed card'
)

assert.match(
  homeStyle,
  /\.xicheng-reference-hero\s*\{[\s\S]*min-height:\s*640rpx[\s\S]*border-radius:\s*38rpx[\s\S]*\.home-action-duo\s*\{[\s\S]*grid-template-columns:\s*1fr 1fr[\s\S]*\.route-reference-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
  'Xicheng home styles should preserve reference proportions: tall hero, two action cards, three route cards'
)

for (const required of [
  'xicheng-reference-result-card',
  'confidence-line',
  'official-match-row',
  'result-signal-list',
  'result-reference-actions'
]) {
  assert.ok(
    scanResult.includes(required),
    `Recognition result should follow the approved reference shell token ${required}`
  )
}

assert.doesNotMatch(
  scanResult,
  /class="meta-grid"/,
  'Recognition result first card should not use the old stat-tile meta grid that diverges from the reference'
)

assert.match(
  resultStyle,
  /\.xicheng-reference-result-card\s*\{[\s\S]*position:\s*relative[\s\S]*min-height:\s*660rpx[\s\S]*\.result-reference-actions\s*\{[\s\S]*grid-template-columns:\s*1fr 1fr/,
  'Recognition result styles should keep the approved large card and two-action layout'
)
