import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const indexPage = fs.readFileSync(path.join(root, 'pages', 'index', 'index.vue'), 'utf8')
const kashgarHomeContent = fs.readFileSync(path.join(root, 'pages', 'index', 'kashgar-home-content.js'), 'utf8')
const kashgarNotesStyle = fs.readFileSync(path.join(root, 'pages', 'index', 'index-kashgar-notes.css'), 'utf8')
const homeSource = `${indexPage}\n${kashgarHomeContent}\n${kashgarNotesStyle}`

for (const required of [
  'kashgar-travel-notes-home',
  'kashgar-search-row',
  '搜索目的地/景点/游记',
  '遇见喀什，遇见千年',
  '丝路古城 · 多元文化 · 人间烟火',
  '喀什文旅地图',
  '路线指南',
  '民宿酒店',
  '好物美食',
  '上镜喀什',
  '跟着游记',
  '游记剧场',
  '喀什古城的冬日时光',
  '喀什烤包子，外酥里嫩超满足',
  '听听木卡姆，千年旋律的回响',
  '老茶馆里的喀什慢时光',
  '喀什花窗，光影里的艺术',
  '巴扎的烟火气，最抚人心',
  '/static/kashgar/home-travel-banner.png',
  '/static/kashgar/note-old-city-winter.png',
  '/static/kashgar/note-baked-bun.png',
  '/static/kashgar/note-muqam.png',
  '/static/kashgar/note-teahouse.png',
  '/static/kashgar/note-window.png',
  '/static/kashgar/note-bazaar.png',
]) {
  assert.ok(homeSource.includes(required), `Kashgar travel notes home should include ${required}`)
}

assert.match(
  indexPage,
  /<view v-else-if="useKashgarLocalContent" class="kashgar-home kashgar-travel-notes-home">/,
  'Kashgar local default branch should keep the reference travel-notes home shell'
)

assert.match(
  homeSource,
  /KASHGAR_MAP_SHORTCUTS\s*=\s*\[[\s\S]*route-guide[\s\S]*homestay[\s\S]*food[\s\S]*camera-city/,
  'Home should define the four Kashgar map shortcut entries from the reference'
)

assert.match(
  homeSource,
  /KASHGAR_TRAVEL_NOTES\s*=\s*\[[\s\S]*note-old-city-winter[\s\S]*note-baked-bun[\s\S]*note-muqam[\s\S]*note-teahouse[\s\S]*note-window[\s\S]*note-bazaar/,
  'Home should define the six visible travel-note cards from the reference'
)

assert.match(
  homeSource,
  /\.kashgar-travel-note-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
  'Travel-note feed should keep the two-column reference layout'
)

assert.match(
  indexPage,
  /<tab-bar\s+:current="0"\s*\/>/,
  'Home should keep the first APP tab selected'
)
