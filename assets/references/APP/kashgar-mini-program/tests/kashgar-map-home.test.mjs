import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const mapPage = fs.readFileSync(path.join(root, 'subPackages', 'feature', 'map', 'map.vue'), 'utf8')

for (const required of [
  'KASHGAR_MAP_LOCAL_CONTENT_ENABLED',
  'useKashgarMapHome',
  'kashgar-map-home',
  '喀什文旅地图',
  '星河寻境',
  '自然风光',
  '人文景点',
  '特色美食',
  '行程建议',
  '艾提尕尔清真寺',
  '香妃园',
  '高台民居',
  '喀什古城集市',
  '喀什古城西门',
  '喀什古城东门',
  '千年古城的迎客之门',
  '国家AAAAA级旅游景区',
  '/static/kashgar/map-illustration.png',
  '/static/kashgar/map-gate-east.png',
]) {
  assert.ok(
    mapPage.includes(required),
    `Kashgar map page should include ${required}`
  )
}

assert.match(
  mapPage,
  /<tab-bar\s+:current="1"\s*\/>/,
  'Kashgar map page should keep the AI companion tab active like the reference flow'
)

assert.match(
  mapPage,
  /<view v-if="useKashgarMapHome" class="kashgar-map-home">[\s\S]*<view v-else class="legacy-map-home">/,
  'Kashgar map page should keep the existing backend/remote map in the fallback branch'
)

assert.match(
  mapPage,
  /const openKashgarMapSpot\s*=\s*\(spot\) => \{[\s\S]*uni\.navigateTo\(\{[\s\S]*map_two\/detail/,
  'Kashgar map markers and bottom card should navigate into the existing detail flow'
)

assert.match(
  mapPage,
  /\.kashgar-map-place-card\s*\{[\s\S]*bottom:\s*150rpx/,
  'Kashgar map bottom card should sit above the fixed APP tab bar'
)

assert.doesNotMatch(
  mapPage,
  /class="map_img"[\s\S]{0,120}<tab-bar/,
  'Legacy full-screen map image should not be the rendered local Kashgar map home'
)
