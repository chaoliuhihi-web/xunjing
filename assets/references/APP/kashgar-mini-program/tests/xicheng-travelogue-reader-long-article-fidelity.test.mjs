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

assert.match(
  reader,
  /reader-topbar-actions[\s\S]*@click="showReaderContents"[\s\S]*name="source"[\s\S]*目录[\s\S]*@click="openSharePage"[\s\S]*name="share"[\s\S]*分享/,
  'Travelogue reader topbar should match the approved keepsake reader with catalog and share actions'
)

assert.match(
  reader,
  /<xicheng-long-travelogue-preview[\s\S]*:companion-avatar="region\.companionAvatar"[\s\S]*@view-sources="showReaderSources"/,
  'Travelogue reader should pass Xiaojing avatar and source viewing action into the long article component without baking it into the page shell'
)

assert.match(
  reader,
  /scrollReaderTo\(selector, fallbackTitle\)[\s\S]*typeof uni !== 'undefined'[\s\S]*typeof uni\.pageScrollTo === 'function'/,
  'Travelogue reader scroll helpers should guard uni access for H5 tests and APP packaging'
)

assert.doesNotMatch(
  reader,
  /if\s*\(\s*uni\s*&&/,
  'Travelogue reader should not use a bare uni truthiness check that can throw outside UniApp runtime'
)

for (const token of [
  '出版级长文预览',
  '封面',
  '行程路线概览',
  '路线',
  'DAY 1',
  'DAY 2',
  '照片',
  '故事',
  '来源',
  '我记住的瞬间',
  '官方来源',
  '查看来源',
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

assert.match(
  longPreview,
  /class="long-tip-card"[\s\S]*<xicheng-icon[\s\S]*:name="tip\.icon"/,
  'Long travelogue tips should use the shared Xicheng icon system instead of text or emoji-style glyphs'
)

assert.match(
  longPreview,
  /class="long-reader-tabs"[\s\S]*v-for="tab in readerTabs"[\s\S]*:name="tab\.icon"[\s\S]*\{\{ tab\.title \}\}/,
  'Long travelogue preview should expose the approved cover/route/photo/story/source reader tabs using shared icons'
)

assert.match(
  longPreview,
  /travelTips\(\)[\s\S]*icon:\s*'route'[\s\S]*icon:\s*'location'[\s\S]*icon:\s*'favorite'[\s\S]*icon:\s*'heart'/,
  'Long travelogue tips should expose semantic icon names that stay stable across APP platforms'
)

assert.doesNotMatch(
  longPreview,
  /\{\{\s*tip\.icon\s*\}\}/,
  'Long travelogue tips should not render raw tip.icon text glyphs'
)

assert.match(
  longPreview,
  /class="long-source-panel"[\s\S]*companionAvatar[\s\S]*官方来源[\s\S]*\{\{ sourceCountLabel \}\}[\s\S]*@click="\$emit\('view-sources'\)"[\s\S]*查看来源/,
  'Long travelogue preview should render an official-source card with avatar, reviewed source count and view-source action'
)

assert.match(
  longPreview,
  /sourceCountLabel\(\)[\s\S]*this\.sourceCount > 0[\s\S]*`\$\{this\.sourceCount\} 条已核对`[\s\S]*'待补充来源'/,
  'Long travelogue source card should summarize reviewed source count without inflating empty evidence'
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
