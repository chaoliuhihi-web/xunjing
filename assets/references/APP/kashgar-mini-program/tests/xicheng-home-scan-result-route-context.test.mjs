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
  'source=${encodeURIComponent(source)}',
  'regionCode=${encodeURIComponent(result.regionCode || this.region.regionCode)}',
  'packageCode=${encodeURIComponent(result.packageCode || this.region.packageCode)}',
  "poiCode=${encodeURIComponent(result.poiCode || '')}",
  "poiName=${encodeURIComponent(result.poiName || '')}",
  'companionName=${encodeURIComponent(result.companionName || this.region.companionName)}'
]) {
  assert.ok(openScanResultBlock.includes(required), `Fresh recognition result route should carry ${required}`)
}

for (const required of [
  "source=${encodeURIComponent(this.recentRecognition.source || '')}",
  'regionCode=${encodeURIComponent(this.recentRecognition.regionCode || this.region.regionCode)}',
  'packageCode=${encodeURIComponent(this.recentRecognition.packageCode || this.region.packageCode)}',
  "poiCode=${encodeURIComponent(this.recentRecognition.poiCode || '')}",
  "poiName=${encodeURIComponent(this.recentRecognition.poiName || '')}",
  'companionName=${encodeURIComponent(this.recentRecognition.companionName || this.region.companionName)}'
]) {
  assert.ok(openRecentRecognitionBlock.includes(required), `Recent recognition result route should carry ${required}`)
}

assert.doesNotMatch(
  `${openScanResultBlock}\n${openRecentRecognitionBlock}`,
  /\/pages\/xicheng\/scan-result\/scan-result\?source=\$\{encodeURIComponent\([^)]+\)\}&poiCode=/,
  'Recognition result navigation should not rely on source+poiCode only because cache may be stale or unavailable'
)
