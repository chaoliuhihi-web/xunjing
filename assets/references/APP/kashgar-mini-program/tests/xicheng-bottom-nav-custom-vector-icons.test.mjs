import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const iconComponent = read('components', 'xicheng-icon', 'xicheng-icon.vue')
const bottomNavComponent = read('components', 'xicheng-bottom-nav', 'xicheng-bottom-nav.vue')
const home = read('pages', 'xicheng', 'home', 'home.vue')

for (const required of [
  'TAB_VECTOR_ICON_NAMES',
  'usesCustomTabVectorIcon',
  'xicheng-tab-vector',
  'xicheng-tab-vector-explore',
  'xicheng-tab-vector-routes',
  'xicheng-tab-vector-favorite',
  'xicheng-tab-vector-mine',
  'xicheng-tab-vector-active'
]) {
  assert.ok(iconComponent.includes(required), `Xicheng tab icons should use the unified custom vector token ${required}`)
}

assert.match(
  iconComponent,
  /<view\s+v-if="usesCustomTabVectorIcon"[\s\S]*:class="\[[\s\S]*'xicheng-tab-vector'[\s\S]*`xicheng-tab-vector-\$\{name\}`[\s\S]*'xicheng-tab-vector-active'[\s\S]*<uni-icons\s+v-else/,
  'Tab icons should render custom vector shapes first and only fall back to uni-icons outside the tab vector set'
)

assert.doesNotMatch(
  iconComponent,
  /explore:\s*Object\.freeze\(\{\s*default:\s*'shop'/,
  'Explore bottom nav icon should not use the generic shop icon when the approved UI shows a heritage pavilion mark'
)

assert.match(
  bottomNavComponent,
  /<xicheng-icon[\s\S]*variant="tab"[\s\S]*:active="isActive\(item\.key\)"/,
  'Bottom navigation should keep routing all tab icons through the unified XichengIcon tab variant'
)

assert.match(
  home,
  /xichengHomeNavItems:\s*\[[\s\S]*\{ key: 'explore', title: '探索', icon: 'explore' \}[\s\S]*\{ key: 'routes', title: '地图', icon: 'routes' \}[\s\S]*\{ key: 'footprint', title: '收藏', icon: 'favorite' \}[\s\S]*\{ key: 'mine', title: '我的', icon: 'mine' \}/,
  'Home bottom nav should preserve approved labels while using the unified semantic icon names'
)
