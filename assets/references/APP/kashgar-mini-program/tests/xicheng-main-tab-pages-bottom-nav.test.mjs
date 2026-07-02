import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

const componentPath = ['components', 'xicheng', 'XichengMainTabNav.vue']

assert.ok(
  exists(...componentPath),
  'Xicheng main tab navigation should be extracted into a compact wrapper component'
)

const mainTabNav = read(...componentPath)

for (const token of [
  "name: 'XichengMainTabNav'",
  "import XichengBottomNav from '@/components/xicheng-bottom-nav/xicheng-bottom-nav.vue'",
  '<xicheng-bottom-nav',
  ':items="xichengMainTabItems"',
  ':active-key="activeKey"',
  "title: '探索'",
  "title: '地图'",
  "title: '记录'",
  "title: '我的'",
  "case 'explore'",
  "case 'routes'",
  "case 'record'",
  "case 'mine'",
  '/pages/xicheng/home/home',
  '/pages/xicheng/routes/routes',
  '/pages/xicheng/recording/recording',
  '/pages/xicheng/works/works'
]) {
  assert.ok(mainTabNav.includes(token), `Main tab component should include ${token}`)
}

assert.match(
  mainTabNav,
  /if \(key === this\.activeKey\)[\s\S]*uni\.pageScrollTo/,
  'Tapping the already active main tab should scroll to top instead of stacking duplicate pages'
)

assert.ok(
  mainTabNav.split(/\r?\n/).length < 130,
  'Main tab wrapper should stay compact and keep route pages from growing'
)

const pages = [
  {
    label: 'map',
    path: ['pages', 'xicheng', 'routes', 'routes.vue'],
    activeKey: 'routes',
    activeTitle: '地图'
  },
  {
    label: 'record',
    path: ['pages', 'xicheng', 'recording', 'recording.vue'],
    activeKey: 'record',
    activeTitle: '记录'
  },
  {
    label: 'mine',
    path: ['pages', 'xicheng', 'works', 'works.vue'],
    activeKey: 'mine',
    activeTitle: '我的'
  }
]

for (const page of pages) {
  const source = read(...page.path)

  assert.match(
    source,
    /import XichengMainTabNav from '@\/components\/xicheng\/XichengMainTabNav\.vue'/,
    `${page.label} page should import the compact Xicheng main tab wrapper instead of acting like a secondary page`
  )

  assert.match(
    source,
    /components:\s*\{[\s\S]*XichengMainTabNav/,
    `${page.label} page should register the shared main tab wrapper`
  )

  assert.match(
    source,
    /<xicheng-main-tab-nav[\s\S]*active-key="[^"]+"/,
    `${page.label} page should render the shared four-tab bottom navigation wrapper`
  )

  assert.ok(
    source.includes(`active-key="${page.activeKey}"`),
    `${page.label} page should highlight the ${page.activeTitle} tab`
  )

  assert.doesNotMatch(
    source,
    /<tab-bar|@\/components\/tab-bar\/tab-bar\.vue|xichengMainTabItems:\s*\[|handleXichengMainTabNav\(key|title:\s*'收藏'|key:\s*'footprint'|title:\s*'AI识境'|case 'vision':/,
    `${page.label} page should not regress to old Kashgar tabs, 收藏, or AI识境 as a fifth tab`
  )
}
