import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const sliceBetween = (content, start, end) => {
  const startIndex = content.indexOf(start)
  const endIndex = content.indexOf(end, startIndex)
  assert.ok(startIndex >= 0, `missing start marker ${start}`)
  assert.ok(endIndex > startIndex, `missing end marker ${end}`)
  return content.slice(startIndex, endIndex)
}
const candidateConfirmationAuditFactory = sliceBetween(
  scanResult,
  '\t\tcreateCandidateConfirmationAudit(selectedCandidate, retainedReviewedSources) {',
  'formatCandidateSummary(candidate = {})'
)

for (const required of [
  'candidateConfirmationAudit',
  'createCandidateConfirmationAudit',
  'candidateCount',
  'selectedCandidatePoiCode',
  'selectedCandidatePoiName',
  'confirmationSource'
]) {
  assert.ok(scanResult.includes(required), `Recognition result should persist candidate confirmation audit token ${required}`)
}

assert.match(
  scanResult,
  /selectCandidate\(candidate\)[\s\S]*const retainedReviewedSources = selectedCandidate\.sources\.length > 0 \? selectedCandidate\.sources : this\.sourceList[\s\S]*const candidateConfirmationAudit = this\.createCandidateConfirmationAudit\(selectedCandidate, retainedReviewedSources\)[\s\S]*requiresUserConfirm:\s*false[\s\S]*candidateConfirmationAudit[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.storageKey, this\.result\)/,
  'Selecting a candidate should create and persist an audit record with the active recognition result'
)

assert.match(
  candidateConfirmationAuditFactory,
  /auditType:\s*'recognition-candidate-confirmation'[\s\S]*regionCode:\s*this\.result\.regionCode \|\| XICHENG_REGION_CONFIG\.regionCode[\s\S]*packageCode:\s*this\.result\.packageCode \|\| XICHENG_REGION_CONFIG\.packageCode[\s\S]*sceneCode:\s*this\.result\.sceneCode \|\| XICHENG_REGION_CONFIG\.sceneCode[\s\S]*sourceChannel:\s*this\.result\.sourceChannel \|\| XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*candidateCount:\s*this\.candidateList\.length[\s\S]*candidatePoiCodes:\s*this\.candidateList[\s\S]*selectedCandidatePoiCode:\s*selectedCandidate\.poiCode[\s\S]*selectedCandidatePoiName:\s*selectedCandidate\.poiName[\s\S]*selectedCandidateConfidence:\s*selectedCandidate\.confidence[\s\S]*reviewedSourceCount:\s*retainedReviewedSources\.length[\s\S]*confirmationSource:\s*'user-selected-candidate'/,
  'Candidate confirmation audit should include attribution context, candidate set, chosen POI, confidence, source count, and confirmation source'
)

assert.match(
  scanResult,
  /startRecording\(\)[\s\S]*candidateConfirmationAudit:\s*this\.result\.candidateConfirmationAudit \|\| null[\s\S]*const checkinEvent = this\.createRouteCheckinEvent\(material\)/,
  'Starting recording should put candidate confirmation audit into journey material before creating the check-in event'
)

assert.match(
  scanResult,
  /createRouteCheckinEvent\(material\)[\s\S]*candidateConfirmationAudit:\s*material\.candidateConfirmationAudit \|\| null[\s\S]*checkedInAt:\s*material\.capturedAt/,
  'Route check-in event should retain candidate confirmation audit evidence'
)

assert.match(
  scanResult,
  /createRecognitionFeedback\(feedbackType = 'correct'\)[\s\S]*candidateConfirmationAudit:\s*this\.result\.candidateConfirmationAudit \|\| null[\s\S]*feedbackNote:\s*this\.feedbackNote\.trim\(\)/,
  'Recognition feedback should include candidate confirmation audit evidence for POI correction review'
)

for (const required of [
  'candidateConfirmationAudits',
  'candidateConfirmationCount',
  'candidateConfirmedPoiLabel',
  '候选确认'
]) {
  assert.ok(travelogue.includes(required), `Travelogue should expose candidate confirmation audit evidence ${required}`)
}

assert.match(
  travelogue,
  /candidateConfirmationAudits\(\)[\s\S]*this\.materials[\s\S]*this\.routeCheckins[\s\S]*this\.recognitionFeedbacks[\s\S]*candidateConfirmationAudit[\s\S]*return audits/,
  'Travelogue should aggregate candidate confirmation audits from materials, route check-ins, and feedback records'
)

assert.match(
  travelogue,
  /saveDraft\(\{ silent = false \} = \{\}\)[\s\S]*candidateConfirmationAudits:\s*this\.candidateConfirmationAudits[\s\S]*candidateConfirmationCount:\s*this\.candidateConfirmationCount/,
  'Saved travelogue draft should include candidate confirmation audit evidence'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*candidateConfirmationAudits:\s*this\.candidateConfirmationAudits[\s\S]*candidateConfirmationCount:\s*this\.candidateConfirmationCount/,
  'Review package should include candidate confirmation audits for operations review'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*publicCandidateConfirmationSummary:\s*this\.createPublicCandidateConfirmationSummary\(\)[\s\S]*candidateConfirmationCount:\s*this\.candidateConfirmationCount/,
  'Poster and PDF assets should include a sanitized public candidate confirmation summary and count'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*candidateConfirmationCount:\s*this\.candidateConfirmationCount[\s\S]*candidateConfirmedPoiLabel:\s*this\.candidateConfirmedPoiLabel/,
  'Local operations report should expose candidate confirmation audit metrics'
)

assert.doesNotMatch(
  `${scanResult}\n${travelogue}`,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Candidate confirmation audit should stay local and must not introduce backend calls or client-side secrets'
)
