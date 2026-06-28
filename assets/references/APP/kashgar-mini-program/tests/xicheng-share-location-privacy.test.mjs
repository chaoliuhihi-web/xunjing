import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')

for (const required of [
  'sanitizeMaterialForPublicShare',
  'sanitizeStudyTaskEvidenceForPublicShare',
  'createPublicCandidateConfirmationSummary',
  'createPublicRecordingSummary',
  'publicMaterials',
  'publicStudyTaskEvidence',
  'publicCandidateConfirmationSummary',
  'publicRecordingSummary',
  "shareLocationPrecision: 'poi_area'",
  'exactCoordinatesHidden: true'
]) {
  assert.ok(travelogue.includes(required), `Share exports should declare location privacy token ${required}`)
}

const sanitizeBlock = travelogue.match(/sanitizeMaterialForPublicShare\(material = \{\}\)[\s\S]*?\n\t\t\},\n\t\tcreatePublicRecordingSummary/)?.[0] || ''
assert.ok(sanitizeBlock, 'Travelogue should expose a bounded public material sanitizer for share exports')

for (const required of [
  'publicLocationLabel: material.publicLocationLabel || this.createPublicLocationLabel(material)',
  'locationHidden: true',
  'sourceCount: Array.isArray(material.sources) ? material.sources.length : 0'
]) {
  assert.ok(sanitizeBlock.includes(required), `Public material sanitizer should preserve safe public field ${required}`)
}

assert.doesNotMatch(
  sanitizeBlock,
  /captureLocation|exifLocation|nearestTrackPoint|latitude|longitude|trackPoints|stayPoints/,
  'Public material sanitizer should not expose exact coordinates, EXIF location, track points, or stay points'
)

const studyEvidenceSanitizeBlock = travelogue.match(/sanitizeStudyTaskEvidenceForPublicShare\(evidence = \{\}\)[\s\S]*?\n\t\t\},\n\t\tcreatePublicRecordingSummary/)?.[0] || ''
assert.ok(studyEvidenceSanitizeBlock, 'Travelogue should expose a bounded public study-task evidence sanitizer for share exports')

for (const required of [
  'taskId: evidence.taskId ||',
  'taskText: evidence.taskText ||',
  'evidenceType: evidence.evidenceType ||',
  'answerText: evidence.answerText ||',
  'hasPhoto: Boolean(evidence.photoPath)',
  'completedAt: evidence.completedAt ||'
]) {
  assert.ok(studyEvidenceSanitizeBlock.includes(required), `Public study evidence sanitizer should preserve safe field ${required}`)
}

assert.doesNotMatch(
  studyEvidenceSanitizeBlock,
  /photoPath:|imagePath:|captureLocation|exifLocation|latitude|longitude/,
  'Public study-task evidence sanitizer should not expose raw photo paths or exact location metadata'
)

const candidateSummaryBlock = travelogue.match(/createPublicCandidateConfirmationSummary\(\)[\s\S]*?\n\t\t\},\n\t\tcreatePublicRecordingSummary/)?.[0] || ''
assert.ok(candidateSummaryBlock, 'Travelogue should expose a bounded public candidate-confirmation summary for share exports')

for (const required of [
  'candidateConfirmationCount: this.candidateConfirmationCount',
  'confirmedPoiNames',
  'slice(0, 5)'
]) {
  assert.ok(candidateSummaryBlock.includes(required), `Public candidate confirmation summary should preserve safe field ${required}`)
}

assert.doesNotMatch(
  candidateSummaryBlock,
  /candidatePoiCodes|candidatePoiNames|selectedCandidateConfidence|reviewedSourceCount|confirmationSource/,
  'Public candidate confirmation summary should not expose raw candidate set, confidence, source counts, or internal confirmation metadata'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*publicMaterials:\s*this\.materials\.map\(material => this\.sanitizeMaterialForPublicShare\(material\)\)[\s\S]*publicStudyTaskEvidence:\s*this\.completedStudyTaskEvidence\.map\(evidence => this\.sanitizeStudyTaskEvidenceForPublicShare\(evidence\)\)[\s\S]*publicCandidateConfirmationSummary:\s*this\.createPublicCandidateConfirmationSummary\(\)[\s\S]*publicRecordingSummary:\s*this\.createPublicRecordingSummary\(\)[\s\S]*privacy:\s*\{[\s\S]*shareLocationPrecision:\s*'poi_area'[\s\S]*exactCoordinatesHidden:\s*true/,
  'Generated poster and PDF assets should include only sanitized public materials, study evidence, candidate confirmation summary, and recording summary'
)

assert.doesNotMatch(
  travelogue.match(/createShareArtifact\(assetType\)[\s\S]*?\n\t\t\},\n\t\tcreatePosterTemplate/)?.[0] || '',
  /materials:\s*this\.materials|studyTaskEvidence:\s*this\.completedStudyTaskEvidence|candidateConfirmationAudits:\s*this\.candidateConfirmationAudits|recordingSession:\s*this\.recordingSession|trackPoints:\s*this\.recordingSession\.trackPoints|stayPoints:\s*this\.recordingSession\.stayPoints/,
  'Share assets should not embed raw materials, raw study-task evidence, raw candidate audits, full recording sessions, or exact track arrays'
)
