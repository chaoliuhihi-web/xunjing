import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

assert.ok(
  regionConfig.includes("reviewStorageKey: 'xicheng:reviewSubmissions'"),
  'Xicheng config should define a local review submission storage key'
)

for (const required of [
  '审核提交记录',
  'reviewSubmission',
  'submitReviewPackage',
  'reviewStorageKey',
  'submittedAt',
  'publicPreview',
  'createReviewPublicPreview',
  'materialCount',
  'sourceCount',
  'posterStatus',
  'pdfStatus',
  'withdrawReviewSubmission',
  '撤回审核'
]) {
  assert.ok(travelogue.includes(required), `Travelogue page should support review submission evidence ${required}`)
}

assert.match(
  travelogue,
  /submitReview\(\)[\s\S]*const reviewPayload = this\.submitReviewPackage\(\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.reviewStorageKey/,
  'submitReview should create and persist a review payload for operations auditing'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*draft:\s*this\.draft[\s\S]*materials:\s*this\.materials[\s\S]*recognizedRoute:\s*this\.recognizedRoute[\s\S]*reviewStatus:\s*this\.reviewText/,
  'review payload should include draft, materials, recognized route, and review status'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*return \{[\s\S]*regionCode:\s*XICHENG_REGION_CONFIG\.regionCode[\s\S]*packageCode:\s*XICHENG_REGION_CONFIG\.packageCode[\s\S]*sceneCode:\s*XICHENG_REGION_CONFIG\.sceneCode[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*companionName:\s*XICHENG_REGION_CONFIG\.companionName/,
  'review payload should carry Xicheng package, scene, source channel, and companion context for operations review'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*reviewReadinessSummary:\s*this\.reviewReadinessSummary[\s\S]*sourceReadinessStatus:\s*this\.reviewReadinessSummary\.sourceReadinessStatus[\s\S]*reviewBlockerCount:\s*this\.reviewReadinessSummary\.reviewBlockers\.length/,
  'review payload should carry source readiness and blocker count for operations triage'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*publicPreview:\s*this\.createReviewPublicPreview\(\)/,
  'review payload should include a sanitized public preview so operators do not use raw review evidence as share content'
)

assert.match(
  travelogue,
  /createReviewPublicPreview\(\)[\s\S]*const publicRouteCheckins = this\.routeCheckins[\s\S]*filter\(checkin => this\.hasReviewableRouteCheckinEvidence\(checkin\)\)[\s\S]*map\(checkin => this\.sanitizeRouteCheckinForPublicShare\(checkin\)\)[\s\S]*const publicMaterials = this\.materials[\s\S]*filter\(material => hasReviewableMaterialEvidence\(material\)\)[\s\S]*map\(material => this\.sanitizeMaterialForPublicShare\(material\)\)[\s\S]*publicStudyTaskEvidence:\s*this\.completedStudyTaskEvidence\.map\(evidence => this\.sanitizeStudyTaskEvidenceForPublicShare\(evidence\)\)[\s\S]*publicRecordingSummary:\s*this\.createPublicRecordingSummary\(\)[\s\S]*privacy:\s*\{[\s\S]*shareLocationPrecision:\s*'poi_area'[\s\S]*exactCoordinatesHidden:\s*true/,
  'review public preview should reuse the public-share sanitizers for materials, route check-ins, study evidence, and recording summary'
)

assert.doesNotMatch(
  travelogue.match(/\n\t\tcreateReviewPublicPreview\(\)[\s\S]*?\n\t\t\},\n\t\tcreateShareArtifact/)?.[0] || '',
  /materials:\s*this\.materials|routeCheckins:\s*this\.routeCheckins|studyTaskEvidence:\s*this\.studyTaskEvidence|recordingSession:\s*this\.recordingSession|trackPoints|stayPoints|latitude|longitude|photoPath|imagePath|captureLocation|exifLocation/,
  'review public preview should not embed raw materials, check-ins, study evidence, recording sessions, exact coordinates, or local photo paths'
)

assert.match(
  travelogue,
  /公开预览[\s\S]*reviewSubmission\.publicPreview\.materialCount[\s\S]*reviewSubmission\.publicPreview\.checkinCount[\s\S]*reviewSubmission\.publicPreview\.studyTaskEvidenceCount/,
  'review submission card should show sanitized public preview counts for operator acceptance'
)

assert.match(
  travelogue,
  /uni\.getStorageSync\(XICHENG_REGION_CONFIG\.reviewStorageKey\)[\s\S]*this\.reviewSubmission/,
  'travelogue should restore the last review submission on load'
)

assert.match(
  travelogue,
  /v-if="reviewSubmission"[\s\S]*@click="withdrawReviewSubmission"[\s\S]*撤回审核/,
  'review submission card should expose a withdraw action before local review/public handoff'
)

assert.match(
  travelogue,
  /withdrawReviewSubmission\(\)[\s\S]*const submittedAt = this\.reviewSubmission && this\.reviewSubmission\.submittedAt \? this\.reviewSubmission\.submittedAt : ''[\s\S]*const existingSubmissions = uni\.getStorageSync\(XICHENG_REGION_CONFIG\.reviewStorageKey\)[\s\S]*const remainingSubmissions = submittedAt[\s\S]*submission\.submittedAt !== submittedAt[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.reviewStorageKey, remainingSubmissions\)[\s\S]*this\.reviewSubmission = remainingSubmissions\[0\] \|\| null[\s\S]*this\.reviewText = this\.reviewSubmission \? this\.reviewSubmission\.reviewStatus : XICHENG_REGION_CONFIG\.reviewStatus\.draft[\s\S]*this\.saveDraft\(\{ silent: true \}\)[\s\S]*审核提交已撤回/,
  'withdrawing a review submission should remove the current local package, restore draft review state when empty, and refresh the saved draft'
)

assert.doesNotMatch(
  travelogue,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'local review MVP should not introduce backend calls or client-side secrets'
)
