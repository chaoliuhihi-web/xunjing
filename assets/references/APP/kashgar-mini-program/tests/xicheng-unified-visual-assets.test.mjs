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
const bottomNavComponent = readOptional('components', 'xicheng-bottom-nav', 'xicheng-bottom-nav.vue')

for (const [relativePath, maxBytes] of [
  ['static/xicheng/xiaojing-companion.png', 500 * 1024],
  ['static/xicheng/xiaojing-companion-cutout-v2.png', 360 * 1024],
  ['static/xicheng/home-hero-xicheng-approved-v3.jpg', 220 * 1024],
  ['static/xicheng/scene-baitasi-waterfront.jpg', 300 * 1024],
  ['static/xicheng/poi-baitasi-card.jpg', 300 * 1024],
  ['static/xicheng/route-passport-stamp.png', 220 * 1024],
  ['static/xicheng/share-poster-background.jpg', 420 * 1024]
]) {
  assertAsset(relativePath, maxBytes)
}

assert.match(
  regionConfig,
  /visualAssets:\s*\{[\s\S]*homeHeroBackground:\s*'\/static\/xicheng\/home-hero-xicheng-approved-v3\.jpg'[\s\S]*homeCompanion:\s*'\/static\/xicheng\/xiaojing-companion-cutout-v2\.png'[\s\S]*poiCards:\s*\{[\s\S]*['"]xicheng-baitasi['"]:\s*'\/static\/xicheng\/poi-baitasi-card\.jpg'[\s\S]*passportStamp:\s*'\/static\/xicheng\/route-passport-stamp\.png'[\s\S]*sharePosterBackground:\s*'\/static\/xicheng\/share-poster-background\.jpg'/,
  'Xicheng visual assets should centralize the home hero art, home companion cutout, POI card art, route passport stamp, and share poster background in region config'
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
  'TAB_VECTOR_ICON_NAMES',
  "const TAB_VECTOR_ICON_NAMES = Object.freeze(['explore'])",
  'usesCustomTabVectorIcon',
  'xicheng-tab-vector',
  'xicheng-tab-vector-explore',
  "explore: Object.freeze({ default: 'home', active: 'home-filled' })",
  "routes: Object.freeze({ default: 'map', active: 'map-filled' })",
  "favorite: Object.freeze({ default: 'star', active: 'star-filled' })",
  "mine: Object.freeze({ default: 'person', active: 'person-filled' })",
  "this.variant === 'tab'",
  'xicheng-icon-tab',
  'xicheng-icon-primary',
  'xicheng-icon-active'
]) {
  assert.ok(iconComponent.includes(required), `Unified Xicheng icon component should include ${required}`)
}

assert.doesNotMatch(
  iconComponent,
  /xicheng-tab-vector-(routes|favorite|mine)|xicheng-tab-vector-star|xicheng-tab-vector-person/,
  'Unified Xicheng tab icons should keep only the heritage explore mark custom while map, favorite, and mine use the cleaner line icon set'
)

assert.match(
  home,
  /<xicheng-bottom-nav[\s\S]*:items="xichengHomeNavItems"[\s\S]*active-key="explore"[\s\S]*@navigate="handleXichengHomeNav"/,
  'Xicheng home bottom navigation should use the shared bottom nav component instead of page-local tab bar markup'
)

assert.match(
  bottomNavComponent,
  /v-for="item in items"[\s\S]*<xicheng-icon[\s\S]*:name="item\.icon"[\s\S]*variant="tab"[\s\S]*:active="isActive\(item\.key\)"/,
  'Shared bottom nav component should use the unified vector icon component with the tab-specific variant'
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
