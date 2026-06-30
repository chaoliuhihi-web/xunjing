import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')
const travelogueCss = fs.existsSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.css'))
  ? fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.css'), 'utf8')
  : travelogue

for (const required of [
  'travelogue-generation-hero',
  '生成西城游记',
  '我已帮你整理今天的西城片段',
  'class="travelogue-summary-grid"',
  'summaryCards',
  'class="travelogue-style-selector"',
  'travelogueStyleOptions',
  'activeTravelogueStyle',
  'class="travelogue-preview-card"',
  ':src="traveloguePreviewImage"',
  '在白塔下遇见西城',
  '继续编辑',
  'generateTravelogueDraft'
]) {
  assert.ok(travelogue.includes(required), `Xicheng travelogue visual shell should include ${required}`)
}

assert.match(
  travelogue,
  /traveloguePreviewImage\(\)[\s\S]*this\.region\.visualAssets[\s\S]*heroLandmark/,
  'Travelogue preview should reuse compact Xicheng visual assets instead of full mockup screenshots'
)

assert.match(
  travelogue,
  /summaryCards\(\)[\s\S]*识别地点[\s\S]*路线[\s\S]*照片[\s\S]*问答/,
  'Travelogue summary cards should surface recognized POI, route, photo, and Xiaojing Q&A counts for operation-ready review'
)

assert.match(
  travelogue,
  /travelogueStyleOptions:\s*\[[\s\S]*亲子研学[\s\S]*城市漫步[\s\S]*文化札记/,
  'Travelogue generation should expose the three P0 style choices from the design reference'
)

assert.match(
  travelogueCss,
  /\.travelogue-preview-image\s*\{[\s\S]*width:\s*220rpx[\s\S]*height:\s*260rpx[\s\S]*object-fit:\s*cover/,
  'Travelogue preview image should use stable mobile dimensions without layout shift'
)

assert.doesNotMatch(
  travelogue,
  /xicheng-multimodal\/design-mockups|05-travelogue-generation\.png/,
  'Travelogue runtime UI should not reference full-page design mockup screenshots'
)
