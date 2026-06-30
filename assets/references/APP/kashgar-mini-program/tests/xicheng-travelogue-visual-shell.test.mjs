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
  'generateTravelogueDraft',
  "travelogueMode: 'draft'",
  'normalizeTravelogueMode',
  'isTravelogueEditMode',
  'travelogue-editor-topbar',
  'travelogue-editor-back',
  'travelogue-editor-more',
  '<text class="travelogue-editor-title">编辑游记</text>',
  'travelogueHeroTitle',
  'travelogueHeroSubtitle',
  '<view v-if="!isTravelogueEditMode" :class="[\'hero\'',
  'v-if="isTravelogueEditMode"',
  'travelogue-editor-reference-stack',
  'travelogue-secondary-directory',
  'travelogueSecondaryEntries',
  'openTravelogueSecondaryEntry',
  '记录与足迹',
  '路线护照与研学',
  '分享与审核',
  '运营与隐私',
  '编辑游记',
  '小京已生成草稿，可继续修改',
  '发布前提交审核'
]) {
  assert.ok(travelogue.includes(required), `Xicheng travelogue visual shell should include ${required}`)
}

assert.match(
  travelogue,
  /normalizeTravelogueMode\s*=\s*\(mode = 'draft'\) =>[\s\S]*\['draft', 'edit', 'record'\]\.includes\(normalizedMode\)/,
  'Travelogue page should normalize route mode so mode=edit has a stable approved reference state'
)

assert.match(
  travelogue,
  /this\.travelogueMode\s*=\s*normalizeTravelogueMode\(options\.mode\)/,
  'Travelogue onLoad should persist route mode before rendering the approved draft or edit reference UI'
)

assert.match(
  travelogue,
  /goBack\(\)[\s\S]*uni\.navigateBack[\s\S]*uni\.reLaunch\(\{\s*url:\s*'\/pages\/xicheng\/home\/home'/,
  'Travelogue edit topbar should return to the previous page or the xicheng home fallback'
)

assert.match(
  travelogue,
  /<view v-if="isTravelogueEditMode" class="travelogue-secondary-directory[\s\S]*v-for="entry in travelogueSecondaryEntries"[\s\S]*@click="openTravelogueSecondaryEntry\(entry\)"/,
  'Travelogue edit mode should collapse secondary workflows into a compact directory instead of rendering one long page'
)

assert.match(
  travelogue,
  /<template v-if="!isTravelogueEditMode">[\s\S]*class="stats-grid"[\s\S]*记录会话[\s\S]*旅行素材盒[\s\S]*亲子研学任务[\s\S]*城市运营报告[\s\S]*<\/template>/,
  'Long travelogue operations should stay outside edit mode and move behind secondary entries'
)

assert.match(
  travelogueCss,
  /\.travelogue-secondary-directory\s*\{[\s\S]*margin-top:\s*24rpx[\s\S]*\.travelogue-secondary-entry-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
  'Travelogue secondary directory should render as a compact two-column mobile grid'
)

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
