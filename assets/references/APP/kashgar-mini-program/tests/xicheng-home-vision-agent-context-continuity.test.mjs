import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const home = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'home', 'home.vue'), 'utf8')

const buildVisionAgentSceneContextBlock = home.match(/buildVisionAgentSceneContext\(source = '', trigger = \{\}\)[\s\S]*?\n\t\t\},\n\t\tbuildSceneVisionEntryUrl/)?.[0] || ''
const openScanResultBlock = home.match(/openScanResult\(trigger = \{\}, source = ''\)[\s\S]*?\n\t\t\},\n\t\topenRecentRecognition/)?.[0] || ''
const continueRecentRecognitionBlock = home.match(/continueRecentRecognitionWithXiaojing\(\)[\s\S]*?\n\t\t\},\n\t\taskXiaojing/)?.[0] || ''
const askXiaojingBlock = home.match(/askXiaojing\(\)[\s\S]*?\n\t\t\},\n\t\thandleXichengHomeNav/)?.[0] || ''

assert.ok(buildVisionAgentSceneContextBlock, 'Home should expose a Vision Agent result-context builder')
assert.ok(openScanResultBlock, 'Home should expose openScanResult')
assert.ok(continueRecentRecognitionBlock, 'Home should expose continueRecentRecognitionWithXiaojing')
assert.ok(askXiaojingBlock, 'Home should expose askXiaojing')

for (const required of [
  'const context = this.buildSceneVisionContext()',
  'const sceneFusionSignals = this.buildSceneVisionSignals(context)',
  'sceneFusionSummary: this.buildSceneVisionSummary(context, sceneFusionSignals)',
  'sceneFusionSignals',
  'source',
  "poiCode: trigger.poiCode || ''",
  "poiName: trigger.poiName || ''",
  "sourceLabel: trigger.sourceLabel || ''",
  "confidence: trigger.confidence || ''",
  "safetyStatus: trigger.safetyStatus || ''",
  'visionAgentMemorySessionPackage: context.visionAgentMemorySessionPackage',
  'visionAgentMemorySessionText: context.visionAgentMemorySessionText',
  'memorySessionSceneCount: context.memorySessionSceneCount'
]) {
  assert.ok(
    buildVisionAgentSceneContextBlock.includes(required),
    `Home Vision Agent result context should include ${required}`
  )
}

assert.match(
  openScanResultBlock,
  /visionAgentContext:\s*this\.buildVisionAgentSceneContext\(source, trigger\)/,
  'Fresh home text/OCR/photo/GPS recognition results should persist fused Vision Agent context before opening scan-result'
)

assert.match(
  continueRecentRecognitionBlock,
  /const visionAgentContext = this\.recentRecognition\.visionAgentContext && typeof this\.recentRecognition\.visionAgentContext === 'object'[\s\S]*this\.recentRecognition\.visionAgentContext[\s\S]*this\.buildVisionAgentSceneContext\(this\.recentRecognition\.source \|\| 'recent', this\.recentRecognition\)/,
  'Recent-recognition Xiaojing shortcut should recover the cached Vision Agent context or rebuild it from the current recognition'
)

for (const required of [
  '`visionAgentContext=${encodeRouteValue(JSON.stringify(visionAgentContext))}`',
  "`sourceRecognitionContext=${encodeRouteValue(visionAgentContext.sourceRecognitionContext || '')}`"
]) {
  assert.ok(
    continueRecentRecognitionBlock.includes(required),
    `Recent-recognition Xiaojing shortcut should carry ${required}`
  )
}

for (const required of [
  "const visionAgentContext = this.buildVisionAgentSceneContext('home-xiaojing', this.recentRecognition || {})",
  '`visionAgentContext=${encodeRouteValue(JSON.stringify(visionAgentContext))}`',
  "`sourceRecognitionContext=${encodeRouteValue(visionAgentContext.sourceRecognitionContext || '')}`",
  "`memorySessionSceneCount=${encodeRouteValue(visionAgentContext.memorySessionSceneCount || '')}`",
  "`poiCode=${encodeRouteValue(visionAgentContext.poiCode || '')}`",
  "`poiName=${encodeRouteValue(visionAgentContext.poiName || '')}`"
]) {
  assert.ok(
    askXiaojingBlock.includes(required),
    `Primary Xiaojing entry should carry live AI识境 context: ${required}`
  )
}
