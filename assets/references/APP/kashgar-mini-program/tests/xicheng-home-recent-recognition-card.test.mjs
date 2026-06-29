import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const home = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'home', 'home.vue'), 'utf8')
const continueRecentSource = home.match(/continueRecentRecognitionWithXiaojing\(\)[\s\S]*?\n\t\t\},\n\t\taskXiaojing/)?.[0] || ''
const unsafeRecentStatusSource = home.match(/recentRecognitionUnsafeSafetyStatus\(\)[\s\S]*?\n\t\t\},\n\t\tcontinueRecentRecognitionWithXiaojing/)?.[0] || ''
const computedBlock = home.match(/computed:\s*\{[\s\S]*?\n\t\},\n\tonLoad/)?.[0] || ''

for (const required of [
  '最近识别',
  'recentRecognition',
  'loadRecentRecognition',
  'openRecentRecognition',
  'continueRecentRecognitionWithXiaojing',
  'recentRecognitionStatusCopy',
  'recentRecognitionActionBlocked',
  'XICHENG_REGION_CONFIG.storageKey',
  'onShow'
]) {
  assert.ok(home.includes(required), `Xicheng home should expose recent recognition behavior ${required}`)
}

assert.match(
  home,
  /onLoad\(\)\s*\{[\s\S]*this\.loadRecentRecognition\(\)[\s\S]*\}/,
  'Xicheng home should load recent recognition during initial page load without requiring a location prompt'
)

assert.doesNotMatch(
  home,
  /onLoad\(\)\s*\{[\s\S]*this\.prepareLocation\(\)/,
  'Xicheng home should not request GPS during page load; location must be requested after a user recognition action'
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
  /openRecentRecognition\(\)[\s\S]*\/pages\/xicheng\/scan-result\/scan-result\?[\s\S]*poiCode=\$\{encodeRouteValue\(this\.recentRecognition\.poiCode \|\| ''\)\}/,
  'Recent recognition card should navigate back to the recognition result page with poiCode'
)

for (const required of [
  '/pages/ai-guide/ai-guide?',
  'regionCode=${encodeRouteValue(this.recentRecognition.regionCode || this.region.regionCode)}',
  "poiCode=${encodeRouteValue(this.recentRecognition.poiCode || '')}",
  "poiName=${encodeRouteValue(this.recentRecognition.poiName || '')}",
  "question=${encodeRouteValue(prompt)}"
]) {
  assert.ok(continueRecentSource.includes(required), `Recent recognition card should carry Xiaojing query part ${required}`)
}

assert.match(
  continueRecentSource,
  /this\.recentRecognitionNeedsCandidateConfirmation\(\)[\s\S]*请先查看识别结果并选择官方 POI[\s\S]*return[\s\S]*this\.recentRecognitionMissingOfficialPoi\(\)[\s\S]*暂无官方 POI 匹配，不能问小京[\s\S]*return[\s\S]*this\.recentRecognitionUnsafeSafetyStatus\(\)[\s\S]*无已审核来源，不能问小京[\s\S]*return[\s\S]*\/pages\/ai-guide\/ai-guide\?/,
  'Recent recognition should not bypass candidate, official POI, or reviewed-source safety gates when continuing into Xiaojing'
)

assert.match(
  home,
  /import \{[^}]*isXichengUnsafeSafetyStatus[^}]*normalizeXichengSafetyStatus[^}]*\} from '@\/request\/xunjing\/safety\.js'/,
  'Xicheng home should reuse the shared safetyStatus normalizer for recent recognition gates'
)

assert.match(
  unsafeRecentStatusSource,
  /const status = normalizeXichengSafetyStatus\(this\.recentRecognition && this\.recentRecognition\.safetyStatus\)[\s\S]*return isXichengUnsafeSafetyStatus\(status\)/,
  'Recent recognition safety gate should normalize legacy cached safetyStatus values before deciding whether Xiaojing can answer'
)

assert.match(
  computedBlock,
  /recentRecognitionStatusCopy\(\)[\s\S]*this\.recentRecognitionNeedsCandidateConfirmation\(\)[\s\S]*待选择官方 POI[\s\S]*this\.recentRecognitionMissingOfficialPoi\(\)[\s\S]*暂无官方 POI[\s\S]*this\.recentRecognitionUnsafeSafetyStatus\(\)[\s\S]*无已审核来源[\s\S]*可继续问小京/,
  'Recent recognition card should surface why a cached recognition cannot continue into Xiaojing'
)

assert.match(
  computedBlock,
  /recentRecognitionActionBlocked\(\)[\s\S]*return this\.recentRecognitionNeedsCandidateConfirmation\(\)[\s\S]*this\.recentRecognitionMissingOfficialPoi\(\)[\s\S]*this\.recentRecognitionUnsafeSafetyStatus\(\)/,
  'Recent recognition card should compute a single disabled state for unsafe or incomplete cached recognitions'
)

assert.match(
  home,
  /class="recent-status"[\s\S]*\{\{ recentRecognitionStatusCopy \}\}/,
  'Recent recognition card should render the latest continuation status next to cached recognition details'
)

assert.match(
  home,
  /<button class="[^"]*\bprimary-button\b[^"]*" :disabled="recentRecognitionActionBlocked" @click="continueRecentRecognitionWithXiaojing">继续问小京<\/button>/,
  'Recent recognition card should disable the Xiaojing continuation button until official POI and reviewed-source gates are satisfied'
)

assert.doesNotMatch(
  unsafeRecentStatusSource,
  /String\(\(this\.recentRecognition && this\.recentRecognition\.safetyStatus\) \|\| ''\)\.toUpperCase\(\)/,
  'Recent recognition safety gate should not hand-roll safetyStatus normalization without trim support'
)

assert.doesNotMatch(
  home,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Recent recognition home card should use local recognition cache and not introduce backend calls or secrets'
)
