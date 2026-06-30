import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const share = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'share', 'share.vue'), 'utf8')

assert.match(
  share,
  /import \{[^}]*isXichengUnsafeSafetyStatus[^}]*normalizeXichengSafetyStatus[^}]*\} from '@\/request\/xunjing\/safety\.js'/,
  'Share page should reuse the shared Xicheng safety helpers before exporting public preview artifacts'
)

for (const required of [
  'getReviewableShareArtifacts',
  'sanitizeShareArtifactForReview',
  'hasReviewableShareArtifact',
  'showShareArtifactRequiredToast',
  'getShareJourneyDraft',
  'createShareAuditSummary',
  'createSharePublicPreview',
  'sanitizePublicMaterialPreview',
  'sanitizePublicStudyEvidencePreview',
  'sanitizePublicRouteCheckinPreview',
  'sanitizePublicCandidateConfirmationSummary',
  'sanitizePublicRecordingSummary',
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
  /getReviewableShareArtifacts\(\)\s*\{[\s\S]*return safeArray\(this\.shareArtifacts\)[\s\S]*\.map\(artifact => this\.sanitizeShareArtifactForReview\(artifact\)\)[\s\S]*\.filter\(Boolean\)/,
  'Share review gate should resanitize cached generated artifacts before operations review submission'
)

assert.match(
  share,
  /sanitizeShareArtifactForReview\(artifact = \{\}\)\s*\{[\s\S]*if \(!artifact \|\| !\['poster', 'pdf', 'study'\]\.includes\(artifact\.assetType\)\) return null[\s\S]*artifact\.auditRequired !== true[\s\S]*artifact\.publishStatus !== 'private'[\s\S]*artifact\.reviewStatus !== XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*publicPreview:\s*this\.createSharePublicPreview\(\{ publicPreview: artifact\.publicPreview \}\)[\s\S]*reviewEvidencePolicy:\s*\{[\s\S]*rawEvidenceUse:\s*'local-ops-review-only'[\s\S]*publicPreviewUse:\s*'share-review-preview-only'[\s\S]*exactLocationPolicy:\s*'raw-review-only'[\s\S]*photoPathPolicy:\s*'raw-review-only'[\s\S]*auditRequired:\s*true[\s\S]*publishStatus:\s*'private'[\s\S]*publishStatus:\s*'private'[\s\S]*visibilityLabel:\s*'待审核 · 未公开'/,
  'Share review gate should rebuild cached artifacts as private audit-only objects with sanitized public preview'
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
  /createSharePublicPreview\(journeyDraft = \{\}\)[\s\S]*const publicMaterials = safeArray\(publicPreview\.publicMaterials\)\.map\(item => this\.sanitizePublicMaterialPreview\(item\)\)\.filter\(Boolean\)\.slice\(0, 20\)[\s\S]*const publicStudyTaskEvidence = safeArray\(publicPreview\.publicStudyTaskEvidence\)\.map\(item => this\.sanitizePublicStudyEvidencePreview\(item\)\)\.filter\(Boolean\)\.slice\(0, 20\)[\s\S]*const publicRouteCheckins = safeArray\(publicPreview\.publicRouteCheckins\)\.map\(item => this\.sanitizePublicRouteCheckinPreview\(item\)\)\.filter\(Boolean\)\.slice\(0, 20\)[\s\S]*materialCount:\s*publicMaterials\.length[\s\S]*checkinCount:\s*publicRouteCheckins\.length[\s\S]*shareLocationPrecision:\s*'poi_area'[\s\S]*exactCoordinatesHidden:\s*true/,
  'Share artifact public preview should expose only sanitized public journey fields and coarse location privacy'
)

assert.match(
  share,
  /sanitizePublicCandidateConfirmationSummary\(summary = \{\}\)\s*\{[\s\S]*confirmedPoiNames:\s*safeArray\(summary\.confirmedPoiNames\)[\s\S]*filter\(Boolean\)[\s\S]*slice\(0, 5\)[\s\S]*candidateConfirmationCount:\s*toSafeCount\(summary\.candidateConfirmationCount\)[\s\S]*\}/,
  'Share public preview should whitelist only safe candidate confirmation summary fields'
)

assert.match(
  share,
  /createSharePublicPreview\(journeyDraft = \{\}\)[\s\S]*publicCandidateConfirmationSummary:\s*this\.sanitizePublicCandidateConfirmationSummary\(publicPreview\.publicCandidateConfirmationSummary\)/,
  'Share public preview should resanitize cached candidate confirmation summaries before review or export'
)

assert.match(
  share,
  /sanitizePublicRecordingSummary\(summary = \{\}\)\s*\{[\s\S]*routeCode:\s*summary\.routeCode \|\| ''[\s\S]*routeTitle:\s*summary\.routeTitle \|\| ''[\s\S]*sessionStatus:\s*summary\.sessionStatus \|\| 'idle'[\s\S]*routePointCount:\s*toSafeCount\(summary\.routePointCount\)[\s\S]*stayPointCount:\s*toSafeCount\(summary\.stayPointCount\)[\s\S]*filteredTrackPointCount:\s*toSafeCount\(summary\.filteredTrackPointCount\)[\s\S]*qualityReport:\s*this\.sanitizePublicRecordingQualityReport\(summary\.qualityReport\)[\s\S]*shareTrackDefault:\s*'private'[\s\S]*exactTrackHidden:\s*true/,
  'Share public preview should whitelist only safe recording summary fields and keep tracks private'
)

assert.match(
  share,
  /sanitizePublicRecordingQualityReport\(qualityReport = \{\}\)\s*\{[\s\S]*acceptedTrackPointCount:\s*toSafeCount\(qualityReport\.acceptedTrackPointCount\)[\s\S]*filteredTrackPointCount:\s*toSafeCount\(qualityReport\.filteredTrackPointCount\)[\s\S]*lowAccuracyPointCount:\s*toSafeCount\(qualityReport\.lowAccuracyPointCount\)[\s\S]*abnormalJumpPointCount:\s*toSafeCount\(qualityReport\.abnormalJumpPointCount\)[\s\S]*usableRate:\s*toSafeCount\(qualityReport\.usableRate\)/,
  'Share public preview should whitelist recording quality metrics without raw point arrays'
)

assert.match(
  share,
  /createSharePublicPreview\(journeyDraft = \{\}\)[\s\S]*publicRecordingSummary:\s*this\.sanitizePublicRecordingSummary\(publicPreview\.publicRecordingSummary\)/,
  'Share public preview should resanitize cached recording summaries before review or export'
)

assert.match(
  share,
  /sanitizePublicMaterialPreview\(item = \{\}\)[\s\S]*const safetyStatus = normalizeXichengSafetyStatus\(item\.safetyStatus\)[\s\S]*if \(isXichengUnsafeSafetyStatus\(safetyStatus\)\) return null[\s\S]*safetyStatus,/,
  'Share public material preview sanitizer should drop BLOCKED or UNAVAILABLE material from public preview artifacts'
)

assert.match(
  share,
  /sanitizePublicRouteCheckinPreview\(item = \{\}\)[\s\S]*const safetyStatus = normalizeXichengSafetyStatus\(item\.safetyStatus\)[\s\S]*if \(isXichengUnsafeSafetyStatus\(safetyStatus\)\) return null[\s\S]*safetyStatus,/,
  'Share public route check-in preview sanitizer should drop BLOCKED or UNAVAILABLE check-ins from public preview artifacts'
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
  share.match(/sanitizePublicCandidateConfirmationSummary\(summary = \{\}\)[\s\S]*?\n\t\t\},\n\t\tcreateSharePublicPreview/)?.[0] || '',
  /candidatePoiCodes|candidatePoiNames|selectedCandidateConfidence|reviewedSourceCount|confirmationSource|candidateConfirmationAudit|sources|latitude|longitude/,
  'Share candidate confirmation summary sanitizer should not expose raw candidate sets, confidence, sources, internal audits, or exact location'
)

assert.doesNotMatch(
  share.match(/sanitizePublicRecordingSummary\(summary = \{\}\)[\s\S]*?\n\t\t\},\n\t\tcreateSharePublicPreview/)?.[0] || '',
  /trackPoints|stayPoints|filteredTrackPoints|latitude|longitude|polyline|geometry|coordinates/,
  'Share recording summary sanitizer should not expose raw tracks, stay points, geometry, or exact coordinates'
)

assert.doesNotMatch(
  share.match(/sanitizePublicRecordingQualityReport\(qualityReport = \{\}\)[\s\S]*?\n\t\t\},\n\t\tsanitizePublicRecordingSummary/)?.[0] || '',
  /trackPoints|stayPoints|filteredTrackPoints|latitude|longitude|polyline|geometry|coordinates/,
  'Share recording quality sanitizer should not expose raw point arrays, geometry, or exact coordinates'
)

assert.doesNotMatch(
  share.match(/createShareArtifact\(assetType\)[\s\S]*?\n\t\t\},\n\t\ttoggleShareSetting/)?.[0] || '',
  /materials:\s*journeyDraft\.materials|routeCheckins:\s*journeyDraft\.routeCheckins|recordingSession:\s*journeyDraft\.recordingSession|trackPoints|stayPoints|filteredTrackPoints|latitude|longitude|imagePath:\s*|photoPath:\s*/,
  'Share page generated artifacts should not embed raw journey materials, route check-ins, recording sessions, tracks, coordinates, or local photo paths'
)

assert.doesNotMatch(
  share.match(/sanitizeShareArtifactForReview\(artifact = \{\}\)[\s\S]*?\n\t\t\},\n\t\tgetReviewableShareArtifacts/)?.[0] || '',
  /materials:\s*artifact\.materials|routeCheckins:\s*artifact\.routeCheckins|recordingSession:\s*artifact\.recordingSession|trackPoints|stayPoints|filteredTrackPoints|latitude|longitude|imagePath:\s*|photoPath:\s*|sources:\s*artifact\.sources|candidateConfirmationAudit|selectedCandidateConfidence/,
  'Share review sanitizer should not pass raw cached materials, routes, tracks, coordinates, local photo paths, source payloads, or candidate audit metadata into review submissions'
)

assert.doesNotMatch(
  share,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Share review artifact gate must not introduce backend calls or client-side secrets'
)
