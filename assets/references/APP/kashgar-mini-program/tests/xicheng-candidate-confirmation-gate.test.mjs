import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const summaryHero = read('components', 'xicheng', 'XichengScanResultSummaryHero.vue')

for (const required of [
  'candidateSectionBadge',
  'pendingCandidateConfirmation',
  'questionSectionTitle',
  'recognitionActionBlocked',
  'requireOfficialPoiConfirmation',
  '请先选择官方 POI 再',
  '已确认官方 POI',
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
  /candidateSectionBadge\(\)[\s\S]*if \(this\.pendingCandidateConfirmation\) return '请选择官方 POI'[\s\S]*return '已确认官方 POI'/,
  'Candidate section should show confirmed state after the user selects an official POI'
)

assert.match(
  scanResult,
  /questionSectionTitle\(\)[\s\S]*if \(this\.pendingCandidateConfirmation\) return '确认官方 POI 后可问小京'[\s\S]*return '可以继续问小京'/,
  'Question section should not imply Xiaojing is immediately available before candidate confirmation'
)

assert.match(
  scanResult,
  /<xicheng-scan-result-summary-hero[\s\S]*:recognition-action-blocked="recognitionActionBlocked"/,
  'Recognition result page should pass candidate-confirmation blocking state into the summary hero actions'
)

assert.match(
  summaryHero,
  /<button[\s\S]*class="[^"]*\bprimary-button\b[^"]*"[\s\S]*:disabled="recognitionActionBlocked"[\s\S]*@click="\$emit\('start-guide'\)"[\s\S]*开始 AI 讲解[\s\S]*<\/button>/,
  'Primary Xiaojing explanation action should be disabled while candidate confirmation is pending'
)

assert.match(
  summaryHero,
  /<button[\s\S]*class="[^"]*\bghost-button\b[^"]*"[\s\S]*:disabled="recognitionActionBlocked"[\s\S]*@click="\$emit\('ask-xiaojing'\)"[\s\S]*问问小京[\s\S]*<\/button>/,
  'Secondary Xiaojing question action should be disabled while candidate confirmation is pending'
)

assert.match(
  scanResult,
  /requireOfficialPoiConfirmation\(actionLabel = '继续'\)[\s\S]*uni\.showToast\(\{[\s\S]*title:\s*`请先选择官方 POI 再\$\{actionLabel\}`[\s\S]*icon:\s*'none'/,
  'Blocked candidate actions should explain that an official POI selection is required'
)

assert.match(
  scanResult,
  /askXiaojing\(question = '', \{ serviceHandoffContext = null \} = \{\}\)\s*\{[\s\S]*if \(this\.pendingCandidateConfirmation\) \{[\s\S]*this\.requireOfficialPoiConfirmation\('问小京'\)[\s\S]*return[\s\S]*const prompt = question/,
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
