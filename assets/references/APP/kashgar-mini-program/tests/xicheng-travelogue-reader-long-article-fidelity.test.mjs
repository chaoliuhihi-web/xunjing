import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const reader = read('pages', 'xicheng', 'travelogue-reader', 'travelogue-reader.vue')
const longPreview = read('components', 'xicheng', 'XichengLongTraveloguePreview.vue')
const shell = `${reader}\n${longPreview}`

assert.match(
  reader,
  /import XichengLongTraveloguePreview from '@\/components\/xicheng\/XichengLongTraveloguePreview\.vue'[\s\S]*components:\s*\{[\s\S]*XichengLongTraveloguePreview/,
  'Travelogue reader should stay as a light page shell and delegate publication-grade article layout to the split long-preview component'
)

assert.match(
  reader,
  /<xicheng-long-travelogue-preview[\s\S]*:title="readerTitle"[\s\S]*:subtitle="readerSubtitle"[\s\S]*:route-items="routeItems"[\s\S]*:chapters="longArticleChapters"[\s\S]*:photo-cards="photoMemoryCards"[\s\S]*@export-pdf="openPdfPrintPage"/,
  'Travelogue reader should pass title, route, chapter, photo and PDF actions into the long article preview component'
)

for (const token of [
  '出版级长文预览',
  '行程路线概览',
  'DAY 1',
  'DAY 2',
  '我记住的瞬间',
  '西城慢行小贴士',
  '写在最后',
  '保存游记',
  '导出PDF',
  '发布到小红书',
  '发朋友圈'
]) {
  assert.ok(shell.includes(token), `Publication-grade travelogue preview should expose ${token}`)
}

assert.match(
  longPreview,
  /dailySections\(\)[\s\S]*return \[[\s\S]*DAY 1[\s\S]*DAY 2[\s\S]*\]/,
  'Long travelogue preview should render a two-day article structure instead of a short generic summary'
)

assert.match(
  longPreview,
  /travelTips\(\)[\s\S]*出行建议[\s\S]*最佳时间[\s\S]*美食推荐[\s\S]*温馨提醒/,
  'Long travelogue preview should include reader-facing travel tips that make the output worth saving and sharing'
)

for (const forbidden of [
  'AI补充',
  'AI 补充',
  '由AI生成',
  '由 AI 生成',
  '小京来源补充'
]) {
  assert.ok(!shell.includes(forbidden), `Published travelogue preview should not visibly reveal generation scaffolding: ${forbidden}`)
}

assert.ok(
  longPreview.split(/\r?\n/).length < 760,
  'Long travelogue preview component should stay compact enough for APP packaging'
)
