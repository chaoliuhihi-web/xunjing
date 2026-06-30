import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const home = read('pages', 'xicheng', 'home', 'home.vue')

for (const required of [
  'missingOfficialPoiContext',
  'recognitionActionBlocked',
  'showMissingOfficialPoiToast',
  '暂无官方 POI 匹配，不能'
]) {
  assert.ok(
    scanResult.includes(required),
    `Recognition result should require official POI context before continuing with token ${required}`
  )
}

assert.match(
  scanResult,
  /missingOfficialPoiContext\(\)[\s\S]*const hasMissingPoi = !this\.result\.poiCode \|\| !this\.result\.poiName \|\| this\.result\.poiName === XICHENG_EMPTY_RECOGNITION_RESULT\.poiName[\s\S]*return hasMissingPoi/,
  'Recognition result should treat missing poiCode or default placeholder poiName as missing official POI context'
)

assert.match(
  scanResult,
  /missingOfficialPoiContext\(\)[\s\S]*const hasOfficialPoiMatch = Boolean\(this\.result\.officialPoiMatched\)[\s\S]*const hasReviewedSources = this\.sourceList\.length > 0[\s\S]*!hasOfficialPoiMatch && !hasReviewedSources/,
  'Recognition result should block route-only unknown POIs unless they are matched to official POI config or carry reviewed backend sources'
)

assert.match(
  scanResult,
  /recognitionActionBlocked\(\)[\s\S]*return this\.pendingCandidateConfirmation \|\| this\.missingOfficialPoiContext/,
  'Recognition result should use a single blocker for unresolved candidates and missing official POI context'
)

assert.match(
  scanResult,
  /<view class="result-reference-actions">[\s\S]*<button class="[^"]*\bprimary-button\b[^"]*" :disabled="recognitionActionBlocked" @click="askXiaojing\(\)">开始 AI 讲解<\/button>/,
  'Primary Xiaojing explanation action should be disabled when the official POI context is missing'
)

assert.match(
  scanResult,
  /<view class="result-reference-actions">[\s\S]*<button class="[^"]*\bghost-button\b[^"]*" :disabled="recognitionActionBlocked" @click="askXiaojing\(suggestedQuestions\[1\]\)">问问小京<\/button>/,
  'Secondary Xiaojing question action should be disabled when the official POI context is missing'
)

assert.match(
  scanResult,
  /showMissingOfficialPoiToast\(actionLabel = '继续'\)[\s\S]*uni\.showToast\(\{[\s\S]*title:\s*`暂无官方 POI 匹配，不能\$\{actionLabel\}`[\s\S]*icon:\s*'none'/,
  'Blocked official-POI actions should explain that no official POI match is available'
)

assert.match(
  scanResult,
  /askXiaojing\(question = ''\)\s*\{[\s\S]*if \(this\.missingOfficialPoiContext\) \{[\s\S]*this\.showMissingOfficialPoiToast\('问小京'\)[\s\S]*return[\s\S]*const prompt = question/,
  'Xiaojing entry should not navigate before a recognition result has official poiCode and poiName'
)

assert.match(
  scanResult,
  /startRecording\(\)\s*\{[\s\S]*if \(this\.missingOfficialPoiContext\) \{[\s\S]*this\.showMissingOfficialPoiToast\('开始记录'\)[\s\S]*return[\s\S]*const existingMaterials = uni\.getStorageSync\(XICHENG_REGION_CONFIG\.materialsStorageKey\)/,
  'Start recording should not persist journey material before a recognition result has official poiCode and poiName'
)

assert.match(
  home,
  /const XICHENG_EMPTY_RECOGNITION_POI_NAME\s*=\s*'待确认西城文化点'/,
  'Xicheng home should share the empty recognition POI placeholder used by the result page gate'
)

assert.match(
  home,
  /recentRecognitionMissingOfficialPoi\(\)[\s\S]*const hasMissingPoi = !recognition\.poiCode \|\| !recognition\.poiName \|\| recognition\.poiName === XICHENG_EMPTY_RECOGNITION_POI_NAME[\s\S]*return hasMissingPoi/,
  'Recent recognition Xiaojing entry should treat the empty placeholder name as missing official POI context'
)

assert.match(
  home,
  /recentRecognitionMissingOfficialPoi\(\)[\s\S]*const hasOfficialPoiMatch = Boolean\(recognition\.officialPoiMatched\)[\s\S]*const hasReviewedSources = Array\.isArray\(recognition\.sources\) && recognition\.sources\.length > 0[\s\S]*!hasOfficialPoiMatch && !hasReviewedSources/,
  'Recent recognition Xiaojing entry should block route-only unknown POIs but allow production backend POIs with reviewed sources'
)

assert.doesNotMatch(
  `${scanResult}\n${home}`,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Official POI context gate should stay local and must not introduce backend calls or client-side secrets'
)
