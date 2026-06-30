import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const home = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'home', 'home.vue'), 'utf8')
const bottomNav = fs.readFileSync(path.join(root, 'components', 'xicheng-bottom-nav', 'xicheng-bottom-nav.vue'), 'utf8')

for (const required of [
  '<xicheng-bottom-nav',
  'xichengHomeNavItems',
  "title: '探索'",
  "title: '地图'",
  "title: '收藏'",
  "title: '我的'",
  '@navigate="handleXichengHomeNav"'
]) {
  assert.ok(home.includes(required), `Xicheng home should expose bottom navigation contract ${required}`)
}

for (const required of [
  "name: 'XichengBottomNav'",
  "emits: ['navigate']",
  'variant="tab"',
  ":active=\"isActive(item.key)\"",
  "this.$emit('navigate', item.key)",
  'xicheng-bottom-nav-shell',
  'xicheng-bottom-nav-item-active'
]) {
  assert.ok(bottomNav.includes(required), `Shared Xicheng bottom nav component should include ${required}`)
}

assert.match(
  home,
  /id="xicheng-route-section"[\s\S]*class="route-recommendation-section(?:\s+xicheng-paper-card)?"/,
  'Xicheng home bottom navigation should have a stable route-section anchor'
)

assert.match(
  home,
  /handleXichengHomeNav\(key = 'explore'\)[\s\S]*case 'explore':[\s\S]*scrollTop:\s*0/,
  'Explore bottom nav item should return to the first-viewport home surface'
)

assert.match(
  home,
  /handleXichengHomeNav\(key = 'explore'\)[\s\S]*case 'routes':[\s\S]*this\.openXichengRoutes\(\)/,
  'Map bottom nav item should open the dedicated Xicheng route list instead of a missing map page'
)

assert.match(
  home,
  /openXichengRoutes\(\)[\s\S]*\/pages\/xicheng\/routes\/routes\?[\s\S]*regionCode=\$\{encodeRouteValue\(this\.region\.regionCode\)\}/,
  'Dedicated route list navigation should preserve Xicheng context from the home bottom nav'
)

assert.match(
  home,
  /handleXichengHomeNav\(key = 'explore'\)[\s\S]*case 'footprint':[\s\S]*openXichengFootprint\(\)/,
  'Footprint bottom nav item should open the P0 local footprint timeline'
)

assert.match(
  home,
  /handleXichengHomeNav\(key = 'explore'\)[\s\S]*case 'mine':[\s\S]*openXichengWorks\(\)/,
  'Mine bottom nav item should open the Xicheng works review surface rather than an unrelated old account page'
)

assert.doesNotMatch(
  home,
  /<tab-bar|@\/components\/tab-bar\/tab-bar\.vue|\/subPackages\/user\/my\/my|xicheng-home-bottom-nav/,
  'Xicheng home should not reuse the Kashgar tab-bar or jump to old account pages for the P0 bottom navigation'
)
