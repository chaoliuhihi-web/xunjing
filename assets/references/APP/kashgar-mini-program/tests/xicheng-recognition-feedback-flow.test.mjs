import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const scanResultFeedbackCard = read('components', 'xicheng', 'XichengScanResultFeedbackCard.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const feedbackSurface = `${scanResult}\n${scanResultFeedbackCard}`

assert.ok(
  regionConfig.includes("recognitionFeedbackStorageKey: 'xicheng:recognitionFeedbacks'"),
  'Xicheng config should define a local recognition feedback storage key for POI correction and operations review'
)

for (const required of [
  'feedbackNote',
  'recognitionFeedback',
  '<xicheng-scan-result-feedback-card',
  '@submit-feedback="submitRecognitionFeedback"',
  '@withdraw-feedback="withdrawRecognitionFeedback"',
  'submitRecognitionFeedback',
  'withdrawRecognitionFeedback',
  'createRecognitionFeedback',
  'persistRecognitionFeedback',
  'recognitionFeedbackStorageKey'
]) {
  assert.ok(scanResult.includes(required), `Recognition result page should include ${required}`)
}

for (const required of [
  '识别反馈',
  '识别准确',
  '识别有误',
  '撤回反馈'
]) {
  assert.ok(feedbackSurface.includes(required), `Recognition result feedback surface should include ${required}`)
}

assert.match(
  scanResult,
  /submitRecognitionFeedback\(feedbackType = 'correct'\)[\s\S]*const feedback = this\.createRecognitionFeedback\(feedbackType\)[\s\S]*this\.persistRecognitionFeedback\(feedback\)/,
  'Submitting recognition feedback should create and persist a reviewable feedback record'
)

assert.match(
  scanResult,
  /createRecognitionFeedback\(feedbackType = 'correct'\)[\s\S]*feedbackId:\s*`feedback-\$\{Date\.now\(\)\}`[\s\S]*feedbackType[\s\S]*feedbackLabel:\s*feedbackType === 'wrong' \? '识别有误' : '识别准确'[\s\S]*regionCode:\s*this\.result\.regionCode[\s\S]*packageCode:\s*this\.result\.packageCode[\s\S]*poiCode:\s*this\.result\.poiCode[\s\S]*poiName:\s*this\.result\.poiName[\s\S]*confidence:\s*this\.result\.confidence[\s\S]*sourceLabel:\s*this\.result\.sourceLabel[\s\S]*sources:\s*this\.sourceList[\s\S]*safetyStatus:\s*normalizeXichengSafetyStatus\(this\.result\.safetyStatus\)[\s\S]*feedbackNote:\s*this\.feedbackNote\.trim\(\)[\s\S]*misTrigger:\s*feedbackType === 'wrong'[\s\S]*reviewStatus:\s*XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'/,
  'Recognition feedback record should include POI, confidence, sources, note, mis-trigger, and private review status'
)

assert.match(
  scanResult,
  /persistRecognitionFeedback\(feedback\)[\s\S]*uni\.getStorageSync\(XICHENG_REGION_CONFIG\.recognitionFeedbackStorageKey\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.recognitionFeedbackStorageKey/,
  'Recognition feedback should be stored locally for operations handoff'
)

assert.match(
  scanResultFeedbackCard,
  /v-if="recognitionFeedback"[\s\S]*@click="\$emit\('withdraw-feedback'\)"[\s\S]*撤回反馈/,
  'Recognition feedback card should emit a withdraw action for accidental correction feedback'
)

assert.match(
  scanResult,
  /withdrawRecognitionFeedback\(\)[\s\S]*const feedbackId = this\.recognitionFeedback && this\.recognitionFeedback\.feedbackId \? this\.recognitionFeedback\.feedbackId : ''[\s\S]*const existingFeedbacks = uni\.getStorageSync\(XICHENG_REGION_CONFIG\.recognitionFeedbackStorageKey\)[\s\S]*const remainingFeedbacks = feedbackId[\s\S]*feedback\.feedbackId !== feedbackId[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.recognitionFeedbackStorageKey, remainingFeedbacks\)[\s\S]*this\.recognitionFeedback = null[\s\S]*识别反馈已撤回/,
  'Withdrawing recognition feedback should remove the current local feedback record and reset page state'
)

for (const required of [
  'recognitionFeedbacks',
  'recognitionFeedbackCount',
  'recognitionFeedbackStorageKey'
]) {
  assert.ok(travelogue.includes(required), `Travelogue should expose recognition feedback evidence ${required}`)
}

assert.match(
  travelogue,
  /uni\.getStorageSync\(XICHENG_REGION_CONFIG\.recognitionFeedbackStorageKey\)[\s\S]*this\.recognitionFeedbacks/,
  'Travelogue should restore recognition feedback records from local storage'
)

assert.match(
  travelogue,
  /misTriggerCount\(\)[\s\S]*this\.recognitionFeedbacks\.filter\(feedback => feedback && feedback\.misTrigger\)\.length[\s\S]*lowConfidenceMaterialCount/,
  'Operations report mis-trigger count should include explicit user correction feedback plus low-confidence materials'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*recognitionFeedbacks:\s*this\.recognitionFeedbacks[\s\S]*recognitionFeedbackCount:\s*this\.recognitionFeedbackCount/,
  'Review package should include recognition feedback records for operations review'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*recognitionFeedbackCount:\s*this\.recognitionFeedbackCount/,
  'Local operations report should include recognition feedback count'
)

assert.doesNotMatch(
  `${scanResult}\n${travelogue}`,
  /Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|imageBase64|imageUrl/,
  'Recognition feedback flow should not introduce client-side secrets or raw image uploads'
)
