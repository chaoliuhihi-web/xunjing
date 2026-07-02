import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const appRoot = root
const appReferenceRoot = path.resolve(root, '..')

const themePath = path.join(appRoot, 'styles', 'xicheng-theme.scss')
const appVue = fs.readFileSync(path.join(appRoot, 'App.vue'), 'utf8')
const home = fs.readFileSync(path.join(appRoot, 'pages', 'xicheng', 'home', 'home.vue'), 'utf8')
const inspiration = fs.readFileSync(path.join(appRoot, 'pages', 'xicheng', 'inspiration', 'inspiration.vue'), 'utf8')
const scanResult = fs.readFileSync(path.join(appRoot, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')
const scanResultSummaryHero = fs.readFileSync(path.join(appRoot, 'components', 'xicheng', 'XichengScanResultSummaryHero.vue'), 'utf8')
const scanResultShell = `${scanResult}\n${scanResultSummaryHero}`
const routeDetail = fs.readFileSync(path.join(appRoot, 'pages', 'xicheng', 'route-detail', 'route-detail.vue'), 'utf8')
const routeDetailPanel = fs.readFileSync(path.join(appRoot, 'components', 'xicheng', 'XichengRouteDetailPanel.vue'), 'utf8')
const routeDetailShell = `${routeDetail}\n${routeDetailPanel}`
const travelogue = fs.readFileSync(path.join(appRoot, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')
const travelogueCss = fs.existsSync(path.join(appRoot, 'pages', 'xicheng', 'travelogue', 'travelogue.css'))
  ? fs.readFileSync(path.join(appRoot, 'pages', 'xicheng', 'travelogue', 'travelogue.css'), 'utf8')
  : travelogue
const travelogueActionGrid = fs.readFileSync(path.join(appRoot, 'components', 'xicheng', 'XichengTravelogueActionGrid.vue'), 'utf8')
const travelogueOpsDetails = fs.readFileSync(path.join(appRoot, 'components', 'xicheng', 'XichengTravelogueOpsDetails.vue'), 'utf8')
const travelogueVisualSurface = `${travelogue}\n${travelogueActionGrid}\n${travelogueOpsDetails}`
const travelogueStyleSurface = `${travelogueCss}\n${travelogueActionGrid}\n${travelogueOpsDetails}`
const aiGuide = fs.readFileSync(path.join(appRoot, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')
const qaReport = fs.readFileSync(path.join(appRoot, 'design-qa.md'), 'utf8')

const mockupDir = path.join(appReferenceRoot, 'xicheng-multimodal', 'design-mockups')
const requiredMockups = [
  '01-home-xiaojing-xicheng.png',
  '02-recognition-result-baitasi.png',
  '03-ask-xiaojing-chat.png',
  '04-route-detail-baitasi-culture.png',
  '05-travelogue-generation.png',
  '06-scan-entry.png',
  '07-route-list.png',
  '08-poi-guide-baitasi.png',
  '10-xicheng-footprint.png',
  '11-travelogue-editor-share.png'
]

for (const mockup of requiredMockups) {
  assert.ok(
    fs.existsSync(path.join(mockupDir, mockup)),
    `Missing Xicheng visual reference mockup: ${mockup}`
  )
}

assert.ok(fs.existsSync(themePath), 'Xicheng APP should have a shared visual theme file instead of page-only styling')

const theme = fs.readFileSync(themePath, 'utf8')
for (const token of [
  '$xicheng-ink-green',
  '$xicheng-gold',
  '$xicheng-paper',
  '.xicheng-designed-page',
  '.xicheng-paper-card',
  '.xicheng-primary-action',
  '.xicheng-primary-action[disabled]',
  '.xicheng-secondary-action[disabled]',
  '.xicheng-companion-bubble',
  '.xicheng-bottom-safe'
]) {
  assert.ok(theme.includes(token), `Xicheng visual theme should define ${token}`)
}

assert.match(
  appVue,
  /@import ['"]@\/styles\/xicheng-theme\.scss['"];/,
  'App.vue should import the shared Xicheng visual theme globally'
)

for (const [fileName, source] of [
  ['home.vue', home],
  ['inspiration.vue', inspiration],
  ['scan-result.vue', scanResultShell],
  ['route-detail.vue', routeDetailShell],
  ['travelogue.vue', travelogue]
]) {
  for (const className of [
    'xicheng-designed-page',
    'xicheng-paper-card',
    'xicheng-primary-action'
  ]) {
    const visualSurface = fileName === 'travelogue.vue' ? travelogueVisualSurface : source
    assert.ok(visualSurface.includes(className), `${fileName} should use ${className} from the shared visual theme`)
  }
}

for (const token of [
  'xicheng-inspiration-shell',
  'xicheng-inspiration-hero',
  'xicheng-inspiration-actions'
]) {
  assert.ok(inspiration.includes(token), `inspiration.vue should support Xicheng inspiration visual token ${token}`)
}

for (const required of [
  '西城 AI 旅伴',
  '扫一扫',
  '拍照识别 · 文字识别 · 附近触发'
]) {
  assert.ok(home.includes(required), `home.vue should keep the Xicheng reference first-screen copy ${required}`)
}

for (const token of [
  'xicheng-travelogue-shell',
  'xicheng-travelogue-hero',
  'xicheng-travelogue-actions'
]) {
  assert.ok(travelogueVisualSurface.includes(token), `travelogue.vue should support Xicheng travelogue visual token ${token}`)
}

const travelogueActionsStyle = travelogueStyleSurface.match(/\.xicheng-travelogue-actions\s*\{[\s\S]*?\n\}/)?.[0] || ''
assert.ok(travelogueActionsStyle, 'travelogue.vue should style the Xicheng travelogue action group')
assert.doesNotMatch(
  travelogueActionsStyle,
  /position:\s*(sticky|fixed)/,
  'Travelogue share, PDF, and review actions should stay in the page flow instead of overlaying the generated draft preview'
)

for (const token of [
  'xicheng-route-detail',
  'route-detail-hero',
  'route-detail-stop-card',
  'route-detail-xiaojing'
]) {
  assert.ok(routeDetailShell.includes(token), `route-detail.vue should support Xicheng route detail visual token ${token}`)
}

for (const token of [
  'xicheng-chat-shell',
  'xicheng-chat-container',
  'chatNavTitle',
  'activeAiAvatar',
  'xicheng-chat-more-btn',
  'showXichengChatMenu'
]) {
  assert.ok(aiGuide.includes(token), `ai-guide.vue should support Xicheng chat visual token ${token}`)
}

assert.match(
  aiGuide,
  /<view v-if="isXichengChatMode" class="xicheng-chat-more-btn"[\s\S]*showXichengChatMenu[\s\S]*<view v-else class="clear-history-btn"/,
  'Xicheng Xiaojing chat should replace the always-visible destructive clear button with a design-aligned more menu'
)

assert.match(
  aiGuide,
  /showXichengChatMenu[\s\S]*uni\.showActionSheet[\s\S]*清空对话[\s\S]*返回西城首页/,
  'Xicheng Xiaojing more menu should keep clear-history behind a secondary action and expose return-home navigation'
)

for (const required of [
  'Xicheng P0 Visual QA',
  '01-home-xiaojing-xicheng.png',
  '02-recognition-result-baitasi.png',
  '03-ask-xiaojing-chat.png',
  '04-route-detail-baitasi-culture.png',
  '05-travelogue-generation.png',
  '10-xicheng-footprint.png',
  '11-travelogue-editor-share.png',
  'home -> scan-result -> xiaojing -> route-detail -> travelogue',
  'official POI source context remains visible in Xiaojing',
  'current-head-ai-guide-from-official-poi-smoke.png',
  'xicheng-app-preprod-evidence-runbook.md',
  'qa/xicheng-app-readiness-evidence.json',
  'VITE_XUNJING_YUDAO_APP_BASE_URL',
  'final result: passed'
]) {
  assert.ok(qaReport.includes(required), `Xicheng design QA report should include ${required}`)
}

for (const forbidden of [
  'Source Visual Truth',
  'Kashgar',
  'kashgar-',
  '喀什',
  '喀小寻',
  '喀什文旅地图',
  '沿着石巷去看喀什',
  '生成我的喀什游记'
]) {
  assert.ok(
    !qaReport.includes(forbidden),
    `Xicheng design QA report should not include legacy Kashgar QA evidence: ${forbidden}`
  )
}
