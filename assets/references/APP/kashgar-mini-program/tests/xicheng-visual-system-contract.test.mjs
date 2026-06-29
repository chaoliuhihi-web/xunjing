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
const routeDetail = fs.readFileSync(path.join(appRoot, 'pages', 'xicheng', 'route-detail', 'route-detail.vue'), 'utf8')
const travelogue = fs.readFileSync(path.join(appRoot, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')
const aiGuide = fs.readFileSync(path.join(appRoot, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')

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
  ['scan-result.vue', scanResult],
  ['route-detail.vue', routeDetail],
  ['travelogue.vue', travelogue]
]) {
  for (const className of [
    'xicheng-designed-page',
    'xicheng-paper-card',
    'xicheng-primary-action'
  ]) {
    assert.ok(source.includes(className), `${fileName} should use ${className} from the shared visual theme`)
  }
}

for (const token of [
  'xicheng-inspiration-shell',
  'xicheng-inspiration-hero',
  'xicheng-inspiration-actions'
]) {
  assert.ok(inspiration.includes(token), `inspiration.vue should support Xicheng inspiration visual token ${token}`)
}

for (const token of [
  'xicheng-travelogue-shell',
  'xicheng-travelogue-hero',
  'xicheng-travelogue-actions'
]) {
  assert.ok(travelogue.includes(token), `travelogue.vue should support Xicheng travelogue visual token ${token}`)
}

for (const token of [
  'xicheng-route-detail',
  'route-hero',
  'route-stop-card',
  'xiaojing-card'
]) {
  assert.ok(routeDetail.includes(token), `route-detail.vue should support Xicheng route detail visual token ${token}`)
}

for (const token of [
  'xicheng-chat-shell',
  'xicheng-chat-container',
  'chatNavTitle',
  'activeAiAvatar'
]) {
  assert.ok(aiGuide.includes(token), `ai-guide.vue should support Xicheng chat visual token ${token}`)
}
