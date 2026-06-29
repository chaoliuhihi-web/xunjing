import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const triggerRequest = read('request', 'xunjing', 'trigger.js')

for (const required of [
  '可能匹配地点',
  'candidateList',
  'selectCandidate(candidate)',
  'isUnsafeCandidate(candidate)',
  'showUnsafeCandidateToast',
  'normalizeRecognitionCandidates',
  'uni.setStorageSync(XICHENG_REGION_CONFIG.storageKey, this.result)'
]) {
  assert.ok(scanResult.includes(required), `Recognition result page should support candidate confirmation token ${required}`)
}

assert.match(
  scanResult,
  /const normalizeRecognitionCandidate\s*=\s*\(candidate = \{\}\) => \(\{[\s\S]*poiCode:\s*candidate\.poiCode \|\| ''[\s\S]*poiName:\s*candidate\.poiName \|\| ''[\s\S]*confidence:\s*normalizeCandidateConfidence\(candidate\)[\s\S]*safetyStatus:\s*normalizeXichengSafetyStatus\(candidate\.safetyStatus\)[\s\S]*suggestedQuestions:\s*normalizeSuggestedQuestions\(candidate\)[\s\S]*sources:\s*normalizeReviewedSources\(candidate\)/,
  'Recognition result page should normalize backend candidate POI, confidence, safety status, questions, and reviewed sources before display'
)

assert.match(
  scanResult,
  /candidateList\(\)[\s\S]*return normalizeRecognitionCandidates\(this\.result\.candidates\)/,
  'Recognition result page should expose a normalized candidate list from backend trigger candidates'
)

assert.match(
  scanResult,
  /selectCandidate\(candidate\)[\s\S]*const selectedCandidate = normalizeRecognitionCandidate\(applyXichengOfficialPoiDefaults\(candidate\)\)[\s\S]*if \(this\.isUnsafeCandidate\(selectedCandidate\)\) \{[\s\S]*this\.showUnsafeCandidateToast\(selectedCandidate\)[\s\S]*return[\s\S]*const retainedReviewedSources = selectedCandidate\.sources\.length > 0 \? selectedCandidate\.sources : this\.sourceList[\s\S]*poiCode:\s*selectedCandidate\.poiCode[\s\S]*poiName:\s*selectedCandidate\.poiName[\s\S]*requiresUserConfirm:\s*false[\s\S]*safetyStatus:\s*selectedCandidate\.safetyStatus[\s\S]*sources:\s*retainedReviewedSources[\s\S]*suggestedQuestions:\s*selectedCandidate\.suggestedQuestions[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.storageKey, this\.result\)/,
  'Selecting a safe candidate should apply official POI defaults, update the active POI and safety context, while unsafe candidates are blocked before persistence'
)

assert.match(
  scanResult,
  /selectCandidate\(candidate\)[\s\S]*\.\.\.selectedCandidate[\s\S]*officialPoiMatched[\s\S]*sources:\s*retainedReviewedSources/,
  'Selecting a local official POI candidate should persist officialPoiMatched and reviewed fallback sources so the follow-up gate opens'
)

assert.match(
  scanResult,
  /selectCandidate\(candidate\)[\s\S]*const retainedRouteRecommendation = selectedCandidate\.routeRecommendation \|\| selectedCandidate\.recommendedRoute \|\| this\.result\.routeRecommendation \|\| this\.result\.recommendedRoute \|\| null[\s\S]*routeRecommendation:\s*retainedRouteRecommendation[\s\S]*recommendedRoute:\s*retainedRouteRecommendation/,
  'Selecting a safe official POI candidate should retain an existing safe route recommendation when the candidate has no route payload'
)

assert.match(
  scanResult,
  /isUnsafeCandidate\(candidate = \{\}\)[\s\S]*const safetyStatus = normalizeXichengSafetyStatus\(candidate\.safetyStatus\)[\s\S]*return isXichengUnsafeSafetyStatus\(safetyStatus\)/,
  'Candidate confirmation should detect BLOCKED or UNAVAILABLE candidate safety status before selection'
)

assert.match(
  triggerRequest,
  /candidates:\s*normalizeXichengTriggerCandidates\(result\.candidates\)/,
  'Trigger normalization should normalize backend candidates before home stores the recognition result'
)

assert.match(
  triggerRequest,
  /const normalizeXichengTriggerCandidate\s*=\s*\(candidate = \{\}\) => \(\{[\s\S]*safetyStatus:\s*normalizeSourceBackedSafetyStatus\(candidate\.safetyStatus, normalizeReviewedSources\(candidate\)\)[\s\S]*sources:\s*normalizeReviewedSources\(candidate\)[\s\S]*suggestedQuestions:\s*normalizeSuggestedQuestions\(candidate\)/,
  'Trigger candidate normalization should preserve source-backed safety status, reviewed sources, and suggested questions for candidate confirmation'
)
