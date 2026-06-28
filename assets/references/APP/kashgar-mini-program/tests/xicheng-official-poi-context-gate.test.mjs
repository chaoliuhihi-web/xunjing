import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')

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
  /missingOfficialPoiContext\(\)[\s\S]*return !this\.result\.poiCode \|\| !this\.result\.poiName \|\| this\.result\.poiName === XICHENG_EMPTY_RECOGNITION_RESULT\.poiName/,
  'Recognition result should treat missing poiCode or default placeholder poiName as missing official POI context'
)

assert.match(
  scanResult,
  /recognitionActionBlocked\(\)[\s\S]*return this\.pendingCandidateConfirmation \|\| this\.missingOfficialPoiContext/,
  'Recognition result should use a single blocker for unresolved candidates and missing official POI context'
)

assert.match(
  scanResult,
  /<button class="primary-button" :disabled="recognitionActionBlocked" @click="askXiaojing\(\)">问问小京<\/button>/,
  'Primary Xiaojing action should be disabled when the official POI context is missing'
)

assert.match(
  scanResult,
  /<button class="ghost-button" :disabled="recognitionActionBlocked" @click="startRecording">开始记录<\/button>/,
  'Start recording should be disabled when the official POI context is missing'
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

assert.doesNotMatch(
  scanResult,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Official POI context gate should stay local and must not introduce backend calls or client-side secrets'
)
