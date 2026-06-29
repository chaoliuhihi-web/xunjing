import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const home = read('pages', 'xicheng', 'home', 'home.vue')
const triggerRequest = read('request', 'xunjing', 'trigger.js')
const resolveTextBlock = home.match(/resolveTextAndOpenResult\(text = '', source = 'ocr'\)[\s\S]*?\n\t\t\},\n\t\tstartScanRecognition/)?.[0] || ''

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
  'GPS定位',
  '用当前位置识别附近文化点',
  '文本识别',
  '粘贴地点、展牌或攻略文字',
  'textRecognitionInput',
  'textRecognitionPanelExpanded',
  'openTextRecognitionPanel',
  'startGpsRecognition',
  'startTextRecognition'
]) {
  assert.ok(home.includes(required), `Xicheng home should expose recognition entry ${required}`)
}

assert.match(
  home,
  /v-if="textRecognitionPanelExpanded"[\s\S]*id="xicheng-text-recognition-panel"/,
  'Text recognition input panel should stay collapsed by default so the fixed bottom nav does not cover an editable field'
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
  "text: '文本识别'"
]) {
  assert.ok(triggerRequest.includes(required), `Trigger source labels should include ${required}`)
}
