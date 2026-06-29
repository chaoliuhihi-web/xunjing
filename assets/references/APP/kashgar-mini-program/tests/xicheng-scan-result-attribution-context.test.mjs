import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const home = read('pages', 'xicheng', 'home', 'home.vue')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')

const getBlock = (source, pattern, label) => {
  const block = source.match(pattern)?.[0] || ''
  assert.ok(block, `Should find ${label}`)
  return block
}

const openScanResultBlock = getBlock(
  home,
  /openScanResult\(trigger = \{\}, source = ''\)[\s\S]*?\n\t\t\},\n\t\topenRecentRecognition/,
  'home openScanResult block'
)
const openRecentRecognitionBlock = getBlock(
  home,
  /openRecentRecognition\(\)[\s\S]*?\n\t\t\},\n\t\tcontinueRecentRecognitionWithXiaojing/,
  'home openRecentRecognition block'
)
const continueRecentRecognitionBlock = getBlock(
  home,
  /continueRecentRecognitionWithXiaojing\(\)[\s\S]*?\n\t\t\},\n\t\taskXiaojing/,
  'home continueRecentRecognitionWithXiaojing block'
)
const homeAskXiaojingBlock = getBlock(
  home,
  /askXiaojing\(\)[\s\S]*?\n\t\t\},\n\t\topenRecommendedRoute/,
  'home askXiaojing block'
)
const emptyRecognitionBlock = getBlock(
  scanResult,
  /const XICHENG_EMPTY_RECOGNITION_RESULT = Object\.freeze\(\{[\s\S]*?\n\}\)/,
  'empty recognition result block'
)
const normalizeRouteOptionsBlock = getBlock(
  scanResult,
  /const normalizeRouteOptions = \(options = \{\}\) => \(\{[\s\S]*?\n\}\)/,
  'normalizeRouteOptions block'
)
const encodeRouteValueBlock = getBlock(
  scanResult,
  /const encodeRouteValue = \(value = ''\) => createXichengRouteOutputValue\(value, \{ platform: process\.env\.UNI_PLATFORM \}\)/,
  'encodeRouteValue block'
)
const normalizeResultBlock = getBlock(
  scanResult,
  /const normalizeResult = \(result = \{\}\) => \(\{[\s\S]*?\n\}\)/,
  'normalizeResult block'
)
const onLoadBlock = getBlock(
  scanResult,
  /onLoad\(options = \{\}\) \{[\s\S]*?\n\t\},\n\tmethods:/,
  'scan result onLoad block'
)
const scanAskXiaojingBlock = getBlock(
  scanResult,
  /askXiaojing\(question = ''\)[\s\S]*?\n\t\t\},\n\t\tselectCandidate/,
  'scan result askXiaojing block'
)
const startRecordingBlock = getBlock(
  scanResult,
  /startRecording\(\)[\s\S]*?\n\t\t\},\n\t\tcreateRouteCheckinEvent/,
  'scan result startRecording block'
)
const createRouteCheckinEventBlock = getBlock(
  scanResult,
  /createRouteCheckinEvent\(material\) \{[\s\S]*?\n\t\t\},\n\t\tpersistRouteCheckinEvent/,
  'scan result createRouteCheckinEvent block'
)
const createRecognitionFeedbackBlock = getBlock(
  scanResult,
  /createRecognitionFeedback\(feedbackType = 'correct'\) \{[\s\S]*?\n\t\t\},\n\t\tpersistRecognitionFeedback/,
  'scan result createRecognitionFeedback block'
)

for (const required of [
  'sceneCode: trigger.sceneCode || this.region.sceneCode',
  'sourceChannel: trigger.sourceChannel || this.region.sourceChannel',
  'sceneCode=${encodeRouteValue(result.sceneCode || this.region.sceneCode)}',
  'sourceChannel=${encodeRouteValue(result.sourceChannel || this.region.sourceChannel)}'
]) {
  assert.ok(openScanResultBlock.includes(required), `Fresh recognition should carry attribution field ${required}`)
}

for (const required of [
  'sceneCode=${encodeRouteValue(this.recentRecognition.sceneCode || this.region.sceneCode)}',
  'sourceChannel=${encodeRouteValue(this.recentRecognition.sourceChannel || this.region.sourceChannel)}'
]) {
  assert.ok(openRecentRecognitionBlock.includes(required), `Recent recognition route should carry attribution field ${required}`)
}

for (const required of [
  'sceneCode=${encodeRouteValue(this.recentRecognition.sceneCode || this.region.sceneCode)}',
  'sourceChannel=${encodeRouteValue(this.recentRecognition.sourceChannel || this.region.sourceChannel)}'
]) {
  assert.ok(continueRecentRecognitionBlock.includes(required), `Recent recognition Xiaojing query should carry ${required}`)
}

for (const required of [
  'sceneCode=${encodeRouteValue(this.region.aiSceneCode || this.region.sceneCode)}',
  'sourceChannel=${encodeRouteValue(this.region.sourceChannel)}'
]) {
  assert.ok(homeAskXiaojingBlock.includes(required), `Direct Xiaojing entry should carry ${required}`)
}

for (const required of [
  'sceneCode: XICHENG_REGION_CONFIG.sceneCode',
  'sourceChannel: XICHENG_REGION_CONFIG.sourceChannel'
]) {
  assert.ok(emptyRecognitionBlock.includes(required), `Empty recognition result should default ${required}`)
}

for (const required of [
  'sceneCode: result.sceneCode || XICHENG_REGION_CONFIG.sceneCode',
  'sourceChannel: result.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel'
]) {
  assert.ok(normalizeResultBlock.includes(required), `Normalized recognition result should default ${required}`)
}

for (const required of [
  'sceneCode: decodeRouteValue(options.sceneCode)',
  'sourceChannel: decodeRouteValue(options.sourceChannel)'
]) {
  assert.ok(normalizeRouteOptionsBlock.includes(required), `Route options should decode ${required}`)
}

for (const required of [
  'sceneCode: routeOptions.sceneCode || (selectedCached && selectedCached.sceneCode) || XICHENG_REGION_CONFIG.sceneCode',
  'sourceChannel: routeOptions.sourceChannel || (selectedCached && selectedCached.sourceChannel) || XICHENG_REGION_CONFIG.sourceChannel'
]) {
  assert.ok(onLoadBlock.includes(required), `Scan result onLoad should merge attribution field ${required}`)
}

for (const required of [
  'sceneCode=${encodeURIComponent(this.result.sceneCode || XICHENG_REGION_CONFIG.sceneCode)}',
  'sourceChannel=${encodeURIComponent(this.result.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel)}'
]) {
  assert.ok(scanAskXiaojingBlock.includes(required), `Scan result Xiaojing query should carry ${required}`)
}

assert.ok(
  encodeRouteValueBlock.includes('createXichengRouteOutputValue(value'),
  'Scan result route encoder should delegate platform-safe outbound query params to the shared route helper'
)

for (const required of [
  'question=${encodeRouteValue(prompt)}',
  'poiCode=${encodeRouteValue(this.result.poiCode || \'\')}',
  'poiName=${encodeRouteValue(this.result.poiName || \'\')}',
  'companionName=${encodeRouteValue(this.result.companionName || XICHENG_REGION_CONFIG.companionName)}'
]) {
  assert.ok(scanAskXiaojingBlock.includes(required), `Scan result Xiaojing query should avoid double encoding ${required}`)
}

for (const required of [
  'sceneCode: this.result.sceneCode || XICHENG_REGION_CONFIG.sceneCode',
  'sourceChannel: this.result.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel'
]) {
  assert.ok(startRecordingBlock.includes(required), `Recognition material should persist ${required}`)
}

for (const required of [
  'poiCode=${encodeRouteValue(this.result.poiCode || \'\')}',
  'poiName=${encodeRouteValue(this.result.poiName || \'\')}',
  'companionName=${encodeRouteValue(this.result.companionName || XICHENG_REGION_CONFIG.companionName)}'
]) {
  assert.ok(startRecordingBlock.includes(required), `Start recording route should avoid double encoding ${required}`)
}

for (const required of [
  'sceneCode: material.sceneCode',
  'sourceChannel: material.sourceChannel'
]) {
  assert.ok(createRouteCheckinEventBlock.includes(required), `Route check-in event should persist ${required}`)
}

for (const required of [
  'sceneCode: this.result.sceneCode',
  'sourceChannel: this.result.sourceChannel'
]) {
  assert.ok(createRecognitionFeedbackBlock.includes(required), `Recognition feedback should persist ${required}`)
}
