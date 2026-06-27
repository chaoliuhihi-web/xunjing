import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const myPath = path.join(root, 'subPackages', 'user', 'my', 'my.vue')
const myPage = fs.readFileSync(myPath, 'utf8')

const requiredSnippets = [
  'KASHGAR_ITINERARY_LOCAL_CONTENT_ENABLED',
  'useKashgarItinerary',
  'kashgar-itinerary-page',
  '我的旅行日程',
  '喀什亲子之旅',
  '2025.05.01 - 2025.05.07 · 共7天',
  '古城慢游 · 亲子时光 · 美食探索',
  '喀小寻已为你整理',
  'Day 1',
  '5/01 周四',
  'Day 7',
  '5/07 周三',
  '09:30',
  '我们抵达喀什古城，阳光洒在土黄色的街巷上，满满的异域风情迎面而来。',
  '13:10',
  '在百年老茶馆里喝了杯维吾尔奶茶，孩子还学会了打馕，体验感满分！',
  '18:45',
  '傍晚时分，登上高台民居，俯瞰整个喀什城，夕阳太美了！',
  'Day 2',
  '艾提尕尔广场',
  '香妃园',
  '喀什大巴扎',
  '调整行程安排',
  '/static/kashgar/itinerary-hero.png',
  '/static/kashgar/itinerary-old-city-1.png',
  '/static/kashgar/itinerary-old-city-2.png',
  '/static/kashgar/itinerary-old-city-3.png',
  '/static/kashgar/itinerary-teahouse-1.png',
  '/static/kashgar/itinerary-sunset-1.png',
  '<tab-bar :current="2" />',
  'bottom: calc(204rpx + env(safe-area-inset-bottom));'
]

for (const snippet of requiredSnippets) {
  assert.ok(myPage.includes(snippet), `my itinerary page should include ${snippet}`)
}

assert.match(
  myPage,
  /<view\s+v-if="useKashgarItinerary"\s+class="kashgar-itinerary-page"/,
  'my page should render the Kashgar itinerary branch before the legacy profile page'
)

assert.match(
  myPage,
  /if\s*\(\s*useKashgarItinerary\.value\s*\)\s*\{[\s\S]*?return[\s\S]*?\}[\s\S]*?loadLikeCount\(\)/,
  'local itinerary branch should return before loading legacy profile backend counts'
)

assert.match(
  myPage,
  /\.kashgar-itinerary-timeline\s*\{[\s\S]*?padding:\s*0 8rpx 260rpx;/,
  'timeline should leave enough bottom space for the fixed action and tab bar'
)

assert.match(
  myPage,
  /\.kashgar-itinerary-section\s*\{[\s\S]*?grid-template-columns:\s*82rpx 1rpx minmax\(0, 1fr\);/,
  'timeline day column should stay compact like the reference layout'
)

const requiredAssets = [
  'static/kashgar/itinerary-hero.png',
  'static/kashgar/itinerary-old-city-1.png',
  'static/kashgar/itinerary-old-city-2.png',
  'static/kashgar/itinerary-old-city-3.png',
  'static/kashgar/itinerary-teahouse-1.png',
  'static/kashgar/itinerary-sunset-1.png'
]

for (const asset of requiredAssets) {
  assert.ok(fs.existsSync(path.join(root, asset)), `missing itinerary asset ${asset}`)
}
