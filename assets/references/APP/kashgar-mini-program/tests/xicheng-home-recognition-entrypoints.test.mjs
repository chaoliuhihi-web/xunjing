import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const home = read('pages', 'xicheng', 'home', 'home.vue')
const triggerRequest = read('request', 'xunjing', 'trigger.js')
const resolveTextBlock = home.match(/resolveTextAndOpenResult\(text = '', source = 'ocr'\)[\s\S]*?\n\t\t\},\n\t\tstartScanRecognition/)?.[0] || ''
const homeActionDuoStyleBlock = home.match(/\.home-action-duo\s*\{[\s\S]*?\n\s*\}/)?.[0] || ''
const homeActionCardStyleBlock = home.match(/\.home-action-card\s*\{[\s\S]*?\n\s*\}/)?.[0] || ''

for (const required of [
  "{ key: 'gps'",
  "title: 'GPS定位'",
  "source: 'gps'",
  "{ key: 'text'",
  "title: '文本识别'",
  "source: 'text'",
]) {
  assert.ok(regionConfig.includes(required), `Xicheng home action config should include ${required}`)
}

for (const required of [
  'home-scan-card',
  '扫一扫',
  '拍照识别 · 文字识别 · 附近触发',
  'hero-ask-card',
  'id="xicheng-recent-recognition-section"',
  'textRecognitionInput',
  'textRecognitionPanelExpanded',
  'openTextRecognitionPanel',
  'startGpsRecognition',
  'startTextRecognition'
]) {
  assert.ok(home.includes(required), `Xicheng home should expose recognition entry ${required}`)
}

for (const forbidden of [
  'quick-card-gps',
  'quick-card-ocr',
  'quick-card-text',
  'GPS定位</text>',
  'OCR识别</text>',
  '文本识别</text>'
]) {
  assert.ok(!home.includes(forbidden), `Xicheng home first screen should not expose separate recognition choice ${forbidden}`)
}

assert.match(
  home,
  /v-if="textRecognitionPanelExpanded"[\s\S]*id="xicheng-text-recognition-panel"/,
  'Text recognition input panel should stay collapsed by default so the fixed bottom nav does not cover an editable field'
)

assert.match(
  homeActionDuoStyleBlock,
  /display:\s*grid;[\s\S]*grid-template-columns:\s*1fr 1fr/,
  'Recognition entry should render as the approved two-card mobile layout: scan and recent recognition'
)

assert.doesNotMatch(
  homeActionDuoStyleBlock,
  /overflow-x:\s*auto|scroll-snap-type/,
  'Recognition entry cards should not rely on hidden horizontal scrolling for P0 actions'
)

assert.doesNotMatch(
  homeActionCardStyleBlock,
  /flex:\s*0\s+0/,
  'Recognition entry cards should not reserve horizontal carousel widths that move P0 actions outside the viewport'
)

assert.match(
  home,
  /openTextRecognitionPanel\(\)[\s\S]*textRecognitionPanelExpanded\s*=\s*true[\s\S]*selector:\s*'#xicheng-text-recognition-panel'/,
  'Text recognition entry should expand the input panel and scroll it above the bottom navigation'
)

assert.match(
  home,
  /startGpsRecognition\(\)[\s\S]*requestCurrentLocationForTrigger\(\)[\s\S]*resolveXichengTextTrigger\(\{[\s\S]*source:\s*'gps'[\s\S]*location/,
  'GPS recognition should collect the current location and resolve a Xicheng trigger with source=gps'
)

assert.match(
  home,
  /startTextRecognition\(\)[\s\S]*this\.textRecognitionInput\.trim\(\)[\s\S]*openTextRecognitionPanel\(\)[\s\S]*resolveTextAndOpenResult\(text,\s*'text'\)/,
  'Text recognition should resolve the user-entered text through the shared Xicheng trigger flow'
)

assert.match(
  resolveTextBlock,
  /const location = this\.currentLocation[\s\S]*resolveXichengTextTrigger\(\{[\s\S]*location/,
  'Text and scan recognition should reuse an existing user-authorized location when available'
)

assert.doesNotMatch(
  resolveTextBlock,
  /requestCurrentLocationForTrigger\(\)/,
  'Text and scan recognition should not actively request GPS permission; only the GPS recognition entry should request location'
)

assert.match(
  triggerRequest,
  /sourceLabel:\s*result\.sourceLabel\s*\|\|\s*resolveXichengSourceLabel\(source\)/,
  'Trigger result normalization should preserve backend labels and otherwise use a centralized source label resolver'
)

for (const required of [
  "gps: 'GPS定位'",
  "text: '文本识别'",
  'createXichengTriggerSceneSignals',
  'sceneSignals: normalizedSceneSignals',
  'sceneDomainIntentKey',
  'agentDecisionReasonSummary'
]) {
  assert.ok(triggerRequest.includes(required), `Trigger source labels should include ${required}`)
}

assert.doesNotMatch(
  triggerRequest.match(/export const createXichengTriggerSceneSignals[\s\S]*?\n\}/)?.[0] || '',
  /sourceRecognitionContext|photoPath|imagePath|latitude|longitude/,
  'Trigger Scene Engine signal normalizer should keep raw recognition context, photo paths, and exact coordinates out of sceneSignals'
)
