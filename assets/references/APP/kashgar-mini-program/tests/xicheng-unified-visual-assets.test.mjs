import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const readOptional = (...segments) => {
  const filePath = path.join(root, ...segments)
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
}

const assertAsset = (relativePath, maxBytes) => {
  const filePath = path.join(root, relativePath)
  assert.ok(fs.existsSync(filePath), `Missing unified Xicheng visual asset ${relativePath}`)
  assert.ok(
    fs.statSync(filePath).size > 1024,
    `Unified Xicheng visual asset ${relativePath} should be a real image, not an empty placeholder`
  )
  assert.ok(
    fs.statSync(filePath).size < maxBytes,
    `Unified Xicheng visual asset ${relativePath} should stay below ${Math.round(maxBytes / 1024)}KB`
  )
}

const regionConfig = read('config', 'regions', 'xicheng.js')
const home = read('pages', 'xicheng', 'home', 'home.vue')
const poi = read('pages', 'xicheng', 'poi', 'poi.vue')
const routes = read('pages', 'xicheng', 'routes', 'routes.vue')
const iconComponent = readOptional('components', 'xicheng-icon', 'xicheng-icon.vue')

for (const [relativePath, maxBytes] of [
  ['static/xicheng/xiaojing-companion.png', 500 * 1024],
  ['static/xicheng/scene-baitasi-waterfront.jpg', 300 * 1024],
  ['static/xicheng/poi-baitasi-card.jpg', 300 * 1024],
  ['static/xicheng/route-passport-stamp.png', 220 * 1024],
  ['static/xicheng/share-poster-background.jpg', 420 * 1024]
]) {
  assertAsset(relativePath, maxBytes)
}

assert.match(
  regionConfig,
  /visualAssets:\s*\{[\s\S]*poiCards:\s*\{[\s\S]*['"]xicheng-baitasi['"]:\s*'\/static\/xicheng\/poi-baitasi-card\.jpg'[\s\S]*passportStamp:\s*'\/static\/xicheng\/route-passport-stamp\.png'[\s\S]*sharePosterBackground:\s*'\/static\/xicheng\/share-poster-background\.jpg'/,
  'Xicheng visual assets should centralize POI card art, route passport stamp, and share poster background in region config'
)

for (const required of [
  "name: 'XichengIcon'",
  '<uni-icons',
  'ICON_TYPE_MAP',
  "back: 'back'",
  "play: 'sound-filled'",
  "location: 'location-filled'",
  "layer: 'map-filled'",
  "qa: 'chatbubble-filled'",
  "edit: 'compose'",
  "check: 'checkmarkempty'",
  "next: 'right'",
  "refresh: 'refresh'",
  "explore: 'home-filled'",
  "routes: 'map-filled'",
  "travelogue: 'star-filled'",
  "mine: 'person-filled'",
  'xicheng-icon-primary',
  'xicheng-icon-active'
]) {
  assert.ok(iconComponent.includes(required), `Unified Xicheng icon component should include ${required}`)
}

assert.match(
  home,
  /v-for="item in xichengHomeNavItems"[\s\S]*<xicheng-icon[\s\S]*:name="item\.icon"[\s\S]*:active="item\.key === 'explore'"/,
  'Xicheng home bottom navigation should use the shared vector icon component instead of page-local CSS icon drawings'
)

assert.doesNotMatch(
  home,
  /xicheng-home-bottom-nav-icon-[a-z-]+/,
  'Xicheng home bottom navigation should not keep divergent per-item CSS icon drawings after adopting the unified icon component'
)

assert.match(
  poi,
  /<xicheng-icon[\s\S]*name="back"[\s\S]*<xicheng-icon[\s\S]*name="edit"[\s\S]*<xicheng-icon[\s\S]*name="play"[\s\S]*<xicheng-icon[\s\S]*name="qa"/,
  'POI detail should use shared vector icons for back, edit/save, playback, and Xiaojing Q&A actions'
)

assert.match(
  routes,
  /<xicheng-icon[\s\S]*name="back"[\s\S]*<xicheng-icon[\s\S]*name="layer"/,
  'Route list should use shared vector icons for back and layer/map actions'
)

assert.doesNotMatch(
  `${home}\n${poi}\n${routes}`,
  /\/static\/tabbar\/(xiake|xiake1|my|my1|ai_companion_avatar)\.png/,
  'Xicheng P0 runtime pages should not reuse legacy tabbar bitmap icons'
)
