import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const home = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'home', 'home.vue'), 'utf8')
const continueRecentSource = home.match(/continueRecentRecognitionWithXiaojing\(\)[\s\S]*?\n\t\t\},\n\t\taskXiaojing/)?.[0] || ''

for (const required of [
  '最近识别',
  'recentRecognition',
  'loadRecentRecognition',
  'openRecentRecognition',
  'continueRecentRecognitionWithXiaojing',
  'XICHENG_REGION_CONFIG.storageKey',
  'onShow'
]) {
  assert.ok(home.includes(required), `Xicheng home should expose recent recognition behavior ${required}`)
}

assert.match(
  home,
  /onLoad\(\)\s*\{[\s\S]*this\.prepareLocation\(\)[\s\S]*this\.loadRecentRecognition\(\)/,
  'Xicheng home should load recent recognition during initial page load'
)

assert.match(
  home,
  /onShow\(\)\s*\{[\s\S]*this\.loadRecentRecognition\(\)/,
  'Xicheng home should refresh recent recognition when users return from result or chat pages'
)

assert.match(
  home,
  /loadRecentRecognition\(\)\s*\{[\s\S]*uni\.getStorageSync\(XICHENG_REGION_CONFIG\.storageKey\)[\s\S]*this\.recentRecognition/,
  'Xicheng home should restore the latest recognition result from the canonical storage key'
)

assert.match(
  home,
  /openRecentRecognition\(\)[\s\S]*\/pages\/xicheng\/scan-result\/scan-result\?[\s\S]*poiCode=\$\{encodeURIComponent\(this\.recentRecognition\.poiCode \|\| ''\)\}/,
  'Recent recognition card should navigate back to the recognition result page with poiCode'
)

for (const required of [
  '/pages/ai-guide/ai-guide?',
  'regionCode=${encodeURIComponent(this.recentRecognition.regionCode || this.region.regionCode)}',
  "poiCode=${encodeURIComponent(this.recentRecognition.poiCode || '')}",
  "poiName=${encodeURIComponent(this.recentRecognition.poiName || '')}",
  "question=${encodeURIComponent(prompt)}"
]) {
  assert.ok(continueRecentSource.includes(required), `Recent recognition card should carry Xiaojing query part ${required}`)
}

assert.doesNotMatch(
  home,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Recent recognition home card should use local recognition cache and not introduce backend calls or secrets'
)
