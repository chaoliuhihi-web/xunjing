import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const share = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'share', 'share.vue'), 'utf8')

for (const required of [
  'getReviewableShareArtifacts',
  'hasReviewableShareArtifact',
  'showShareArtifactRequiredToast',
  'getShareJourneyDraft',
  'createShareAuditSummary',
  'createSharePublicPreview',
  'sanitizePublicMaterialPreview',
  'sanitizePublicStudyEvidencePreview',
  'sanitizePublicRouteCheckinPreview',
  'reviewEvidencePolicy',
  '请先生成分享产物再提交审核',
  'shareArtifactCount',
  'assetTypes',
  'shareArtifacts: reviewableShareArtifacts'
]) {
  assert.ok(share.includes(required), `Share review submission should expose artifact gate token ${required}`)
}

assert.match(
  share,
  /getReviewableShareArtifacts\(\)\s*\{[\s\S]*return safeArray\(this\.shareArtifacts\)[\s\S]*filter\(artifact => artifact && \['poster', 'pdf', 'study'\]\.includes\(artifact\.assetType\)[\s\S]*artifact\.auditRequired === true[\s\S]*artifact\.publishStatus === 'private'[\s\S]*artifact\.reviewStatus === XICHENG_REGION_CONFIG\.reviewStatus\.pending\)/,
  'Share review gate should only accept generated poster, PDF, or study report artifacts that remain audit-required and private'
)

assert.match(
  share,
  /hasReviewableShareArtifact\(\)\s*\{[\s\S]*return this\.getReviewableShareArtifacts\(\)\.length > 0/,
  'Share review gate should require at least one generated share artifact'
)

assert.match(
  share,
  /submitReview\(\)\s*\{[\s\S]*const reviewableShareArtifacts = this\.getReviewableShareArtifacts\(\)[\s\S]*if \(!this\.hasReviewableShareArtifact\(\)\) \{[\s\S]*this\.showShareArtifactRequiredToast\(\)[\s\S]*return[\s\S]*const reviewPayload = \{/,
  'Share review submission should stop before creating an operations review payload when no artifact exists'
)

assert.match(
  share,
  /const reviewPayload = \{[\s\S]*shareArtifacts:\s*reviewableShareArtifacts[\s\S]*shareArtifactCount:\s*reviewableShareArtifacts\.length[\s\S]*assetTypes:\s*Array\.from\(new Set\(reviewableShareArtifacts\.map\(item => item\.assetType\)\)\)/,
  'Share review submission should carry the generated artifacts and their asset types for operations review'
)

assert.match(
  share,
  /createShareArtifact\(assetType\)[\s\S]*const journeyDraft = this\.getShareJourneyDraft\(\)[\s\S]*const auditSummary = this\.createShareAuditSummary\(journeyDraft\)[\s\S]*publicPreview:\s*this\.createSharePublicPreview\(journeyDraft\)[\s\S]*reviewEvidencePolicy:\s*\{[\s\S]*rawEvidenceUse:\s*'local-ops-review-only'[\s\S]*exactLocationPolicy:\s*'raw-review-only'[\s\S]*auditRequired:\s*true[\s\S]*publishStatus:\s*'private'[\s\S]*\.\.\.auditSummary/,
  'Share page generated artifacts should carry sanitized public preview and review-only evidence policy from the current journey draft'
)

assert.match(
  share,
  /createShareAuditSummary\(journeyDraft = \{\}\)[\s\S]*reviewReadinessSummary[\s\S]*safetyStatusSummary[\s\S]*sourceReadinessStatus[\s\S]*reviewBlockers[\s\S]*reviewBlockerCount/,
  'Share artifact audit summary should preserve source readiness, safety counts, and review blockers for operations triage'
)

assert.match(
  share,
  /createSharePublicPreview\(journeyDraft = \{\}\)[\s\S]*publicMaterials:\s*safeArray\(publicPreview\.publicMaterials\)\.map\(item => this\.sanitizePublicMaterialPreview\(item\)\)[\s\S]*publicStudyTaskEvidence:\s*safeArray\(publicPreview\.publicStudyTaskEvidence\)\.map\(item => this\.sanitizePublicStudyEvidencePreview\(item\)\)[\s\S]*publicRouteCheckins:\s*safeArray\(publicPreview\.publicRouteCheckins\)\.map\(item => this\.sanitizePublicRouteCheckinPreview\(item\)\)[\s\S]*shareLocationPrecision:\s*'poi_area'[\s\S]*exactCoordinatesHidden:\s*true/,
  'Share artifact public preview should expose only sanitized public journey fields and coarse location privacy'
)

for (const [methodName, forbiddenPattern] of [
  ['sanitizePublicMaterialPreview', /imagePath|photoPath|captureLocation|exifLocation|nearestTrackPoint|latitude|longitude|sources:/],
  ['sanitizePublicStudyEvidencePreview', /photoPath|imagePath|answerText|captureLocation|exifLocation|latitude|longitude/],
  ['sanitizePublicRouteCheckinPreview', /sources:|candidateConfirmationAudit|selectedCandidateConfidence|captureLocation|exifLocation|latitude|longitude/]
]) {
  const block = share.match(new RegExp(`${methodName}\\(item = \\{\\}\\)[\\s\\S]*?\\n\\t\\t\\},\\n\\t\\t`))?.[0] || ''
  assert.ok(block, `Share page should define ${methodName}`)
  assert.doesNotMatch(
    block,
    forbiddenPattern,
    `${methodName} should not expose raw source, location, photo path, or candidate metadata`
  )
}

assert.doesNotMatch(
  share.match(/createShareArtifact\(assetType\)[\s\S]*?\n\t\t\},\n\t\ttoggleShareSetting/)?.[0] || '',
  /materials:\s*journeyDraft\.materials|routeCheckins:\s*journeyDraft\.routeCheckins|recordingSession:\s*journeyDraft\.recordingSession|trackPoints|stayPoints|filteredTrackPoints|latitude|longitude|imagePath:\s*|photoPath:\s*/,
  'Share page generated artifacts should not embed raw journey materials, route check-ins, recording sessions, tracks, coordinates, or local photo paths'
)

assert.doesNotMatch(
  share,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Share review artifact gate must not introduce backend calls or client-side secrets'
)
