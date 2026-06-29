import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')

for (const required of [
  'pendingCandidateConfirmation',
  'questionSectionTitle',
  'recognitionActionBlocked',
  'requireOfficialPoiConfirmation',
  '请先选择官方 POI 再',
  '确认官方 POI 后可问小京'
]) {
  assert.ok(
    scanResult.includes(required),
    `Recognition result should gate unresolved candidate matches with token ${required}`
  )
}

assert.match(
  scanResult,
  /pendingCandidateConfirmation\(\)[\s\S]*return Boolean\(this\.result\.requiresUserConfirm && this\.candidateList\.length > 0\)/,
  'Recognition result should treat unresolved backend candidates as requiring official POI confirmation'
)

assert.match(
  scanResult,
  /questionSectionTitle\(\)[\s\S]*if \(this\.pendingCandidateConfirmation\) return '确认官方 POI 后可问小京'[\s\S]*return '可以继续问小京'/,
  'Question section should not imply Xiaojing is immediately available before candidate confirmation'
)

assert.match(
  scanResult,
  /<button class="[^"]*\bprimary-button\b[^"]*" :disabled="recognitionActionBlocked" @click="askXiaojing\(\)">问问小京<\/button>/,
  'Primary Xiaojing action should be disabled while candidate confirmation is pending'
)

assert.match(
  scanResult,
  /<button class="[^"]*\bghost-button\b[^"]*" :disabled="recognitionActionBlocked" @click="startRecording">开始记录<\/button>/,
  'Start recording should be disabled while candidate confirmation is pending'
)

assert.match(
  scanResult,
  /requireOfficialPoiConfirmation\(actionLabel = '继续'\)[\s\S]*uni\.showToast\(\{[\s\S]*title:\s*`请先选择官方 POI 再\$\{actionLabel\}`[\s\S]*icon:\s*'none'/,
  'Blocked candidate actions should explain that an official POI selection is required'
)

assert.match(
  scanResult,
  /askXiaojing\(question = ''\)\s*\{[\s\S]*if \(this\.pendingCandidateConfirmation\) \{[\s\S]*this\.requireOfficialPoiConfirmation\('问小京'\)[\s\S]*return[\s\S]*const prompt = question/,
  'Question rows and Xiaojing entry should not navigate before candidate confirmation'
)

assert.match(
  scanResult,
  /startRecording\(\)\s*\{[\s\S]*if \(this\.pendingCandidateConfirmation\) \{[\s\S]*this\.requireOfficialPoiConfirmation\('开始记录'\)[\s\S]*return[\s\S]*const existingMaterials = uni\.getStorageSync\(XICHENG_REGION_CONFIG\.materialsStorageKey\)/,
  'Start recording should not persist journey material before candidate confirmation'
)

assert.doesNotMatch(
  scanResult,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Candidate confirmation gate should stay local and must not introduce backend calls or client-side secrets'
)
