import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const mastersPage = fs.readFileSync(path.join(root, 'subPackages', 'feature', 'map_two', 'masters.vue'), 'utf8')

for (const required of [
  'KASHGAR_TRAVEL_GUIDE_LOCAL_CONTENT_ENABLED',
  'useKashgarTravelGuide',
  'kashgar-travel-guide',
  'legacy-masters-page',
  '喀什旅行指南',
  '喀什市',
  '喀什古城',
  '香妃园',
  '艾提尕尔广场',
  '高台民居',
  '喀什大巴扎',
  '国家5A级景区，千年古城活化石，维吾尔族传统生活的生动写照。',
  '香妃的故乡，典雅的维吾尔园林，感受动人传奇与文化魅力。',
  '喀什的心脏，清真寺与广场交相辉映，感受浓厚的宗教氛围与市井气息。',
  '交通指南',
  '必吃美食',
  '推荐路线',
  '旅行贴士',
  '/static/kashgar/guide-old-city.png',
  '/static/kashgar/guide-xiangfei.png',
  '/static/kashgar/guide-aitigar.png',
  '/static/kashgar/guide-gaotai.png',
  '/static/kashgar/guide-bazaar.png',
]) {
  assert.ok(
    mastersPage.includes(required),
    `Kashgar travel guide list should include ${required}`
  )
}

assert.match(
  mastersPage,
  /<view v-if="useKashgarTravelGuide" class="kashgar-travel-guide">[\s\S]*<view v-else class="legacy-masters-page">/,
  'Travel guide list should render the local Kashgar branch while preserving the original backend list fallback'
)

assert.match(
  mastersPage,
  /if\s*\(this\.useKashgarTravelGuide\)\s*\{[\s\S]*return[\s\S]*\}[\s\S]*this\.fetchData\(\)/,
  'Local Kashgar travel guide should not call the legacy backend list on page load'
)

assert.match(
  mastersPage,
  /mapdetail\(item\)\s*\{[\s\S]*map_two\/detail\?type=[\s\S]*masters=/,
  'Travel guide cards should continue to navigate through the existing scenic detail route'
)

assert.match(
  mastersPage,
  /<tab-bar\s+:current="1"\s*\/>/,
  'Travel guide screen should keep the AI companion tab active like the reference flow'
)

assert.match(
  mastersPage,
  /<\/scroll-view>\s*<view class="kashgar-guide-actions">/,
  'Travel guide quick actions should sit outside the scroll list so they do not cover scenic cards mid-list'
)

assert.match(
  mastersPage,
  /\.kashgar-guide-actions\s*\{[\s\S]*position:\s*absolute[\s\S]*bottom:\s*160rpx/,
  'Travel guide quick actions should be fixed above the APP tab bar like the reference screen'
)

assert.match(
  mastersPage,
  /\.kashgar-guide-card\s*\{[\s\S]*min-height:\s*198rpx/,
  'Travel guide scenic cards should be compact enough for the five-card reference first viewport'
)

assert.match(
  mastersPage,
  /\.kashgar-guide-cover\s*\{[\s\S]*height:\s*176rpx/,
  'Travel guide scenic covers should use a compact horizontal crop like the reference cards'
)
