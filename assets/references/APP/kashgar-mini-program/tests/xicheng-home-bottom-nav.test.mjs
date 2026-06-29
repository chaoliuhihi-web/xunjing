import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const home = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'home', 'home.vue'), 'utf8')

for (const required of [
  'xicheng-home-bottom-nav',
  'xichengHomeNavItems',
  "title: '探索'",
  "title: '地图'",
  "title: '收藏'",
  "title: '我的'",
  'handleXichengHomeNav(item.key)'
]) {
  assert.ok(home.includes(required), `Xicheng home should expose bottom navigation contract ${required}`)
}

assert.match(
  home,
  /id="xicheng-route-section"[\s\S]*class="route-recommendation-section xicheng-paper-card"/,
  'Xicheng home bottom navigation should have a stable route-section anchor'
)

assert.match(
  home,
  /handleXichengHomeNav\(key = 'explore'\)[\s\S]*case 'explore':[\s\S]*scrollTop:\s*0/,
  'Explore bottom nav item should return to the first-viewport home surface'
)

assert.match(
  home,
  /handleXichengHomeNav\(key = 'explore'\)[\s\S]*case 'routes':[\s\S]*selector:\s*'#xicheng-route-section'/,
  'Map bottom nav item should jump to the route recommendation section instead of a missing map page'
)

assert.match(
  home,
  /handleXichengHomeNav\(key = 'explore'\)[\s\S]*case 'travelogue':[\s\S]*openXichengTravelogue\('draft'\)/,
  'Collection bottom nav item should open the P0 local draft and material surface'
)

assert.match(
  home,
  /handleXichengHomeNav\(key = 'explore'\)[\s\S]*case 'mine':[\s\S]*openXichengTravelogue\('record'\)/,
  'Mine bottom nav item should open the local journey/material surface rather than an unrelated old account page'
)

assert.doesNotMatch(
  home,
  /<tab-bar|@\/components\/tab-bar\/tab-bar\.vue|\/subPackages\/user\/my\/my/,
  'Xicheng home should not reuse the Kashgar tab-bar or jump to old account pages for the P0 bottom navigation'
)
