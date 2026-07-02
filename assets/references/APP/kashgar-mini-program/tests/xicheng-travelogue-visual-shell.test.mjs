import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')
const secondaryEntries = fs.readFileSync(path.join(root, 'components', 'xicheng', 'travelogueSecondaryEntries.js'), 'utf8')
const secondaryDirectoryPath = path.join(root, 'components', 'xicheng', 'XichengTravelogueSecondaryDirectory.vue')
const recordShellPath = path.join(root, 'components', 'xicheng', 'XichengTravelogueRecordShell.vue')
const generationHeroPath = path.join(root, 'components', 'xicheng', 'XichengTravelogueGenerationHero.vue')
const legacyHeroPath = path.join(root, 'components', 'xicheng', 'XichengTravelogueLegacyHero.vue')
const opsDetailsPath = path.join(root, 'components', 'xicheng', 'XichengTravelogueOpsDetails.vue')
const editTopbarPath = path.join(root, 'components', 'xicheng', 'XichengTravelogueEditTopbar.vue')
assert.ok(
  fs.existsSync(secondaryDirectoryPath),
  'Travelogue secondary directory should be split into XichengTravelogueSecondaryDirectory.vue instead of growing travelogue.vue'
)
assert.ok(
  fs.existsSync(generationHeroPath),
  'Travelogue generation hero should be split into XichengTravelogueGenerationHero.vue instead of growing travelogue.vue'
)
assert.ok(
  fs.existsSync(legacyHeroPath),
  'Legacy travelogue hero should be split into XichengTravelogueLegacyHero.vue instead of growing travelogue.vue'
)
assert.ok(
  fs.existsSync(opsDetailsPath),
  'Travelogue operations details should be split into XichengTravelogueOpsDetails.vue instead of growing travelogue.vue'
)
assert.ok(
  fs.existsSync(editTopbarPath),
  'Travelogue edit topbar should be split into XichengTravelogueEditTopbar.vue instead of growing travelogue.vue'
)
const secondaryDirectory = fs.readFileSync(secondaryDirectoryPath, 'utf8')
const recordShell = fs.readFileSync(recordShellPath, 'utf8')
const generationHero = fs.readFileSync(generationHeroPath, 'utf8')
const legacyHero = fs.readFileSync(legacyHeroPath, 'utf8')
const opsDetails = fs.readFileSync(opsDetailsPath, 'utf8')
const editTopbar = fs.readFileSync(editTopbarPath, 'utf8')
const travelogueSource = `${travelogue}\n${secondaryEntries}\n${secondaryDirectory}\n${recordShell}\n${generationHero}\n${legacyHero}\n${opsDetails}\n${editTopbar}`
const travelogueCss = fs.existsSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.css'))
  ? fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.css'), 'utf8')
  : travelogue
const travelogueStyleSurface = `${travelogueCss}\n${secondaryDirectory}`
const longTraveloguePreview = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengLongTraveloguePreview.vue'), 'utf8')
const longTraveloguePreviewCss = fs.existsSync(path.join(root, 'components', 'xicheng', 'XichengLongTraveloguePreview.css'))
  ? fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengLongTraveloguePreview.css'), 'utf8')
  : ''
const longTraveloguePreviewShell = `${longTraveloguePreview}\n${longTraveloguePreviewCss}`

for (const required of [
  'travelogue-generation-hero',
  '生成西城游记',
  '我已帮你整理今天的西城片段',
  'class="travelogue-summary-grid"',
  'summaryCards',
  'class="travelogue-style-selector"',
  'travelogueStyleOptions',
  'activeTravelogueStyle',
  '<xicheng-long-travelogue-preview',
  ':cover-image="traveloguePreviewImage"',
  ':chapters="longTravelogueChapters"',
  '@export-pdf="exportMemorialPdf"',
  '@publish-xhs="openSharePage"',
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
  '<xicheng-travelogue-legacy-hero',
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
  '小京已整理',
  '预览内容来自你的照片、路线、备注和已核对资料',
  '发布前确认公开范围'
]) {
  assert.ok(travelogueSource.includes(required), `Xicheng travelogue visual shell should include ${required}`)
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
  editTopbar,
  /class="travelogue-editor-back"[\s\S]*<xicheng-icon name="back"[\s\S]*class="travelogue-editor-more"[\s\S]*<xicheng-icon name="more"/,
  'Travelogue edit topbar should use the shared Xicheng icon component for back and more actions'
)

assert.doesNotMatch(
  travelogue,
  /class="travelogue-editor-back"[\s\S]{0,160}<uni-icons|class="travelogue-editor-more"[\s\S]{0,160}<uni-icons/,
  'Travelogue edit topbar should not use raw uni-icons for standard chrome actions'
)

assert.match(
  travelogue,
  /import XichengTravelogueSecondaryDirectory from '@\/components\/xicheng\/XichengTravelogueSecondaryDirectory\.vue'[\s\S]*components:[\s\S]*XichengTravelogueSecondaryDirectory/,
  'Travelogue page should import and register the split secondary directory component'
)

assert.match(
  travelogue,
  /import XichengTravelogueGenerationHero from '@\/components\/xicheng\/XichengTravelogueGenerationHero\.vue'[\s\S]*components:[\s\S]*XichengTravelogueGenerationHero/,
  'Travelogue page should import and register the split generation hero component'
)

assert.match(
  travelogue,
  /import XichengTravelogueLegacyHero from '@\/components\/xicheng\/XichengTravelogueLegacyHero\.vue'[\s\S]*components:[\s\S]*XichengTravelogueLegacyHero/,
  'Travelogue page should import and register the split legacy hero component'
)

assert.match(
  travelogue,
  /<xicheng-travelogue-legacy-hero[\s\S]*v-if="!isTravelogueEditMode && showLegacyTravelogueHero"[\s\S]*:region="region"[\s\S]*:title="travelogueHeroTitle"[\s\S]*:subtitle="travelogueHeroSubtitle"[\s\S]*:companion-line="travelogueCompanionLine"/,
  'Travelogue page should delegate the old optional hero to the split component while preserving display data'
)

assert.doesNotMatch(
  travelogue,
  /<view v-if="!isTravelogueEditMode && showLegacyTravelogueHero" :class="\['hero'[\s\S]*travelogue-companion-bubble/,
  'Travelogue page shell should not keep inline legacy hero markup after extraction'
)

assert.match(
  travelogue,
  /<xicheng-travelogue-generation-hero[\s\S]*v-if="!isTravelogueEditMode && showAdvancedTravelogueGeneration"[\s\S]*:summary-cards="summaryCards"[\s\S]*:style-options="travelogueStyleOptions"[\s\S]*:active-style="activeTravelogueStyle"[\s\S]*@apply-template="applyTravelogueTemplate"[\s\S]*@generate="generateTravelogueDraft"/,
  'Travelogue page should delegate the advanced generation surface to the split component while preserving template and generate handoffs'
)

assert.doesNotMatch(
  travelogue,
  /<view v-if="!isTravelogueEditMode && showAdvancedTravelogueGeneration" class="travelogue-generation-hero xicheng-paper-card">/,
  'Travelogue page shell should not inline the advanced generation hero after extraction'
)

assert.match(
  generationHero,
  /props:[\s\S]*region:[\s\S]*type: Object[\s\S]*summaryCards:[\s\S]*type: Array[\s\S]*styleOptions:[\s\S]*type: Array[\s\S]*activeStyle:[\s\S]*type: String[\s\S]*generationState:[\s\S]*type: String[\s\S]*autoTraveloguePackage:[\s\S]*type: Object/,
  'Split travelogue generation hero should be data-driven and keep page state in travelogue.vue'
)

assert.match(
  generationHero,
  /emits:\s*\[[\s\S]*'apply-template'[\s\S]*'generate'[\s\S]*'edit'[\s\S]*'open-reader'[\s\S]*'export-pdf'[\s\S]*'publish-moments'[\s\S]*'publish-xhs'[\s\S]*\]/,
  'Split travelogue generation hero should emit semantic actions instead of calling page methods directly'
)

assert.match(
  travelogue,
  /<xicheng-travelogue-secondary-directory[\s\S]*v-if="isTravelogueEditMode"[\s\S]*:entries="travelogueSecondaryEntries"[\s\S]*@open="openTravelogueSecondaryEntry"/,
  'Travelogue edit mode should collapse secondary workflows into a compact directory instead of rendering one long page'
)

assert.match(
  secondaryDirectory,
  /class="travelogue-secondary-entry-head"[\s\S]*<xicheng-icon[\s\S]*:name="entry\.icon"/,
  'Travelogue secondary entry cards should use shared Xicheng icons for a consistent approved visual style'
)

assert.match(
  travelogue,
  /travelogueSecondaryEntries\(\)[\s\S]*createXichengTravelogueSecondaryEntries/,
  'Travelogue page should source secondary entry cards from the shared config helper'
)

assert.match(
  secondaryEntries,
  /icon:\s*'route'[\s\S]*icon:\s*'passport'[\s\S]*icon:\s*'share'[\s\S]*icon:\s*'settings'/,
  'Travelogue secondary entry config should expose semantic icon names instead of raw vendor icon types'
)

assert.doesNotMatch(
  travelogue,
  /<uni-icons\b/,
  'Travelogue page should not use raw uni-icons outside the shared Xicheng icon component'
)

assert.match(
  travelogueSource,
  /<xicheng-travelogue-record-shell[\s\S]*@open-works="openWorksPage"[\s\S]*<xicheng-travelogue-action-grid[\s\S]*@open-works="\$emit\('open-works'\)"/,
  'Travelogue page should link to the personal keepsake library through the split action grid in the default record shell'
)

assert.doesNotMatch(
  travelogue,
  /<button class="ghost-button xicheng-secondary-action" @click="openWorksPage">我的作品<\/button>/,
  'Travelogue page should not expose the old 我的作品 label after the approved simplification'
)

assert.match(
  travelogue,
  /<xicheng-travelogue-ops-details[\s\S]*v-if="!isTravelogueEditMode && showTravelogueOpsDetails"[\s\S]*:material-count="materialCount"[\s\S]*:ops-report="opsReport"/,
  'Long travelogue operations should stay outside edit mode and move behind a split details component'
)

assert.match(
  opsDetails,
  /class="stats-grid"[\s\S]*记录会话[\s\S]*旅行素材盒[\s\S]*亲子研学任务[\s\S]*城市运营报告/,
  'Split travelogue operations details should keep the long route, material, study, privacy, and ops sections'
)

assert.match(
  travelogueStyleSurface,
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
  /travelogueStyleOptions:\s*\[[\s\S]*亲子研学[\s\S]*城市漫步杂志[\s\S]*文化札记[\s\S]*照片纪念册/,
  'Travelogue generation should expose the approved long-form travelogue template choices'
)

assert.ok(
  travelogueSource.includes('<xicheng-long-travelogue-preview') &&
    travelogue.includes(':route-items="editorRouteItems"') &&
    travelogue.includes(':photo-cards="editorPhotoCards"') &&
    travelogue.includes(':tags="traveloguePreviewTags"') &&
    generationHero.includes(':route-items="routeItems"') &&
    generationHero.includes(':photo-cards="photoCards"') &&
    generationHero.includes(':tags="tags"'),
  'Travelogue preview should use the approved long-form preview component with stable route, photo and tag inputs'
)

assert.match(
  longTraveloguePreviewShell,
  /\.long-cover-image\s*\{[\s\S]*width:\s*100%[\s\S]*height:\s*100%[\s\S]*\.long-chapter-image\s*\{/,
  'Long travelogue preview should use stable mobile image containers without layout shift'
)

assert.ok(
  longTraveloguePreview.includes('mode="aspectFill"'),
  'Long travelogue preview images should keep aspectFill rendering'
)

for (const required of [
  '我的西城游记',
  '行程路线概览',
  'DAY 1',
  'DAY 2',
  '照片记忆',
  '西城慢行小贴士',
  '导出PDF',
  '发朋友圈',
  '发布到小红书'
]) {
  assert.ok(longTraveloguePreviewShell.includes(required), `Long travelogue preview should include publish-ready module ${required}`)
}

assert.doesNotMatch(
  travelogue,
  /xicheng-multimodal\/design-mockups|05-travelogue-generation\.png/,
  'Travelogue runtime UI should not reference full-page design mockup screenshots'
)
