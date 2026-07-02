import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const home = read('pages', 'xicheng', 'home', 'home.vue')
const bottomNav = read('components', 'xicheng-bottom-nav', 'xicheng-bottom-nav.vue')
const pagesJson = read('pages.json')

for (const required of [
  'class="home-action-card home-scan-card"',
  '扫一扫',
  '拍照识别 · 文字识别 · 附近触发',
  '@click="startScanRecognition"',
  'startSceneVisionAgent()',
  "const entry = 'home-primary'",
  'this.buildSceneVisionEntryUrl(this.buildSceneVisionContext(), entry)'
]) {
  assert.ok(home.includes(required), `Home should keep AI识境 behind the approved scan entry: ${required}`)
}

assert.match(
  home,
  /xichengHomeNavItems:\s*\[[\s\S]*key:\s*'explore'[\s\S]*key:\s*'routes'[\s\S]*key:\s*'record'[\s\S]*key:\s*'mine'[\s\S]*\]/,
  'Home bottom nav should follow the approved four-tab structure'
)

assert.doesNotMatch(
  home,
  /xichengHomeNavItems:\s*\[[\s\S]*key:\s*'vision'[\s\S]*\]|case 'vision':|title:\s*'AI识境'[\s\S]*icon:\s*'scan'/,
  'AI识境 should not be promoted as a fifth primary bottom-nav entry'
)

assert.match(
  bottomNav,
  /:style="navGridStyle"[\s\S]*navGridStyle\(\)[\s\S]*const count = Array\.isArray\(this\.items\)[\s\S]*repeat\(\$\{count\}, minmax\(0, 1fr\)\)/,
  'Shared Xicheng bottom nav should size its grid from the actual item count'
)

assert.match(
  bottomNav,
  /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/,
  'Bottom nav default CSS should match the approved four-tab layout'
)

assert.match(
  pagesJson,
  /"path":\s*"pages\/xicheng\/scan\/scan"[\s\S]*"navigationBarTitleText":\s*"AI识境"/,
  'AI识境 remains a registered scan page even though it is not a bottom-nav tab'
)
