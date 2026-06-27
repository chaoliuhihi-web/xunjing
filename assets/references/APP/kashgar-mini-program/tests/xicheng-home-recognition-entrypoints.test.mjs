import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const home = read('pages', 'xicheng', 'home', 'home.vue')
const triggerRequest = read('request', 'xunjing', 'trigger.js')

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
  'startGpsRecognition',
  'startTextRecognition'
]) {
  assert.ok(home.includes(required), `Xicheng home should expose recognition entry ${required}`)
}

assert.match(
  home,
  /startGpsRecognition\(\)[\s\S]*requestCurrentLocationForTrigger\(\)[\s\S]*resolveXichengTextTrigger\(\{[\s\S]*source:\s*'gps'[\s\S]*location/,
  'GPS recognition should collect the current location and resolve a Xicheng trigger with source=gps'
)

assert.match(
  home,
  /startTextRecognition\(\)[\s\S]*this\.textRecognitionInput\.trim\(\)[\s\S]*resolveTextAndOpenResult\(text,\s*'text'\)/,
  'Text recognition should resolve the user-entered text through the shared Xicheng trigger flow'
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
