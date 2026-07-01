import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const home = read('pages', 'xicheng', 'home', 'home.vue')
const bottomNav = read('components', 'xicheng-bottom-nav', 'xicheng-bottom-nav.vue')
const tabBar = read('components', 'tab-bar', 'tab-bar.vue')
const appConfig = read('app.js')

for (const required of [
  "key: 'vision'",
  "title: 'AI识境'",
  "icon: 'scan'",
  "case 'vision':",
  'this.startSceneVisionAgent()'
]) {
  assert.ok(home.includes(required), `Xicheng home bottom nav should promote AI识境 as a primary entry: ${required}`)
}

assert.match(
  home,
  /xichengHomeNavItems:\s*\[[\s\S]*key:\s*'explore'[\s\S]*key:\s*'vision'[\s\S]*key:\s*'routes'[\s\S]*key:\s*'record'[\s\S]*key:\s*'mine'/,
  'AI识境 should sit directly after Explore in the Xicheng primary bottom navigation'
)

assert.match(
  home,
  /handleXichengHomeNav\(key = 'explore'\)[\s\S]*case 'vision':[\s\S]*this\.startSceneVisionAgent\(\)[\s\S]*break/,
  'Tapping the AI识境 bottom-nav item should open the same Vision Agent camera entry as the world-entry card'
)

assert.match(
  bottomNav,
  /grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/,
  'Xicheng bottom nav should reserve stable five-column geometry for the AI识境 primary entry'
)

assert.match(
  tabBar,
  /<navigator class="center-btn-wrapper" url="\/pages\/xicheng\/scan\/scan" open-type="reLaunch"/,
  'The global center tab should launch AI识境 directly instead of the old AI guide chat surface'
)

assert.match(
  tabBar,
  /<text class="center-text">AI识境<\/text>/,
  'The global center tab label should make AI识境 the visible primary action'
)

assert.doesNotMatch(
  tabBar,
  /center-btn-wrapper" url="\/pages\/ai-guide\/ai-guide"[\s\S]*AI旅伴/,
  'The global center tab should not keep the old menu-like AI guide entry as the primary camera action'
)

assert.match(
  appConfig,
  /tabBar:\s*\{[\s\S]*pagePath:\s*'pages\/xicheng\/scan\/scan'[\s\S]*text:\s*'AI识境'/,
  'Global APP tab config should include AI识境 as a first-level tab entry for app shells that consume app.js'
)
