import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const home = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'home', 'home.vue'), 'utf8')

const openScanResultBlock = home.match(/openScanResult\(trigger = \{\}, source = ''\)[\s\S]*?\n\t\t\},\n\t\topenRecentRecognition/)?.[0] || ''
const openRecentRecognitionBlock = home.match(/openRecentRecognition\(\)[\s\S]*?\n\t\t\},\n\t\tcontinueRecentRecognitionWithXiaojing/)?.[0] || ''

assert.ok(openScanResultBlock, 'Xicheng home should expose openScanResult')
assert.ok(openRecentRecognitionBlock, 'Xicheng home should expose openRecentRecognition')

for (const required of [
  'source=${encodeRouteValue(source)}',
  'regionCode=${encodeRouteValue(result.regionCode || this.region.regionCode)}',
  'packageCode=${encodeRouteValue(result.packageCode || this.region.packageCode)}',
  "poiCode=${encodeRouteValue(result.poiCode || '')}",
  "poiName=${encodeRouteValue(result.poiName || '')}",
  'companionName=${encodeRouteValue(result.companionName || this.region.companionName)}',
  'visionAgentContext=${encodeRouteValue(JSON.stringify(result.visionAgentContext || {}))}',
  "sourceRecognitionContext=${encodeRouteValue(result.visionAgentContext.sourceRecognitionContext || '')}",
  "memorySessionSceneCount=${encodeRouteValue(result.visionAgentContext.memorySessionSceneCount || '')}"
]) {
  assert.ok(openScanResultBlock.includes(required), `Fresh recognition result route should carry ${required}`)
}

for (const required of [
  "source=${encodeRouteValue(this.recentRecognition.source || '')}",
  'regionCode=${encodeRouteValue(this.recentRecognition.regionCode || this.region.regionCode)}',
  'packageCode=${encodeRouteValue(this.recentRecognition.packageCode || this.region.packageCode)}',
  "poiCode=${encodeRouteValue(this.recentRecognition.poiCode || '')}",
  "poiName=${encodeRouteValue(this.recentRecognition.poiName || '')}",
  'companionName=${encodeRouteValue(this.recentRecognition.companionName || this.region.companionName)}',
  'visionAgentContext=${encodeRouteValue(JSON.stringify(visionAgentContext))}',
  "sourceRecognitionContext=${encodeRouteValue(visionAgentContext.sourceRecognitionContext || '')}",
  "memorySessionSceneCount=${encodeRouteValue(visionAgentContext.memorySessionSceneCount || '')}"
]) {
  assert.ok(openRecentRecognitionBlock.includes(required), `Recent recognition result route should carry ${required}`)
}

assert.doesNotMatch(
  `${openScanResultBlock}\n${openRecentRecognitionBlock}`,
  /\/pages\/xicheng\/scan-result\/scan-result\?source=\$\{encodeURIComponent\([^)]+\)\}&poiCode=/,
  'Recognition result navigation should not rely on source+poiCode only because cache may be stale or unavailable'
)
