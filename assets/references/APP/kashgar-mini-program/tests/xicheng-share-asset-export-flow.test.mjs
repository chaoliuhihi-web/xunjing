import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const opsDetails = read('components', 'xicheng', 'XichengTravelogueOpsDetails.vue')
const travelogueShareAssetSurface = `${travelogue}\n${opsDetails}`
const sourceHelper = read('request', 'xunjing', 'sources.js')
const extractTravelogueMethodBlock = (methodName, nextMethodName) => {
  const block = travelogue.match(new RegExp(`${methodName}\\([^)]*\\)[\\s\\S]*?\\n\\t\\t\\},\\n\\t\\t${nextMethodName}`))?.[0] || ''
  assert.ok(block, `Travelogue should define ${methodName}`)
  return block
}

assert.ok(
  regionConfig.includes("shareAssetStorageKey: 'xicheng:shareAssets'"),
  'Xicheng config should define a local share asset storage key'
)

for (const required of [
  '分享产物包',
  'shareArtifacts',
  'createShareArtifact',
  'sanitizeShareArtifactForReview',
  'getReviewableShareArtifacts',
  'persistShareArtifact',
  'deleteShareArtifact',
  'shareAssetStorageKey',
  'assetId',
  'assetType',
  'assetLabel',
  'draftExcerpt',
  'passportProgress',
  'auditRequired',
  'publishStatus',
  'visibilityLabel',
  'templateCode',
  'templateSections',
  'createMemorialPdfTemplate',
  'createMemorialPdfSourceCards',
  'shareAssetCount',
  'formatArtifactTime',
  '删除产物'
]) {
  assert.ok(travelogueShareAssetSurface.includes(required), `Travelogue page should support share asset export evidence ${required}`)
}

assert.match(
  travelogue,
  /generatePoster\(\)[\s\S]*const posterAsset = this\.createShareArtifact\('poster'\)[\s\S]*this\.persistShareArtifact\(posterAsset\)/,
  'generatePoster should create and persist a poster share asset'
)

assert.match(
  travelogue,
  /exportMemorialPdf\(\)[\s\S]*const pdfAsset = this\.createShareArtifact\('pdf'\)[\s\S]*this\.persistShareArtifact\(pdfAsset\)/,
  'exportMemorialPdf should create and persist a PDF memorial asset'
)

assert.match(
  travelogue,
  /persistShareArtifact\(artifact\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.shareAssetStorageKey/,
  'share assets should be persisted to local storage for review and operations handoff'
)

assert.match(
  opsDetails,
  /v-for="\(\s*artifact,\s*index\s*\) in shareArtifacts\.slice\(0, 3\)"[\s\S]*@click="\$emit\('delete-share-artifact', index\)"[\s\S]*删除产物/,
  'Share artifact list should expose a per-asset delete action before review/public sharing through the split component'
)

assert.match(
  travelogue,
  /@delete-share-artifact="deleteShareArtifact"/,
  'Travelogue page should bind the split share-artifact delete event back to page logic'
)

assert.match(
  travelogue,
  /deleteShareArtifact\(index\)[\s\S]*this\.shareArtifacts = this\.shareArtifacts\.filter\(\(_, artifactIndex\) => artifactIndex !== index\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.shareAssetStorageKey, this\.shareArtifacts\)[\s\S]*this\.saveDraft\(\{ silent: true \}\)[\s\S]*分享产物已删除/,
  'Deleting a share asset should update local storage, refresh the draft package, and confirm deletion'
)

assert.match(
  travelogue,
  /uni\.getStorageSync\(XICHENG_REGION_CONFIG\.shareAssetStorageKey\)[\s\S]*this\.shareArtifacts/,
  'travelogue should restore existing share assets on load'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*const reviewableShareArtifacts = this\.getReviewableShareArtifacts\(\)[\s\S]*shareArtifacts:\s*reviewableShareArtifacts/,
  'review submission package should include sanitized generated share assets'
)

assert.match(
  travelogue,
  /getReviewableShareArtifacts\(\)[\s\S]*return this\.shareArtifacts[\s\S]*\.map\(artifact => this\.sanitizeShareArtifactForReview\(artifact\)\)[\s\S]*\.filter\(Boolean\)/,
  'Travelogue review package should resanitize cached share artifacts before operations handoff'
)

assert.match(
  travelogue,
  /sanitizeShareArtifactForReview\(artifact = \{\}\)[\s\S]*if \(!artifact \|\| !\['poster', 'pdf', 'study'\]\.includes\(artifact\.assetType\)\) return null[\s\S]*artifact\.auditRequired !== true[\s\S]*artifact\.publishStatus !== 'private'[\s\S]*artifact\.reviewStatus !== XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*const publicPreview = this\.createReviewPublicPreview\(\)[\s\S]*publicPreview,[\s\S]*publicMaterials:\s*publicPreview\.publicMaterials[\s\S]*publicRecordingSummary:\s*publicPreview\.publicRecordingSummary[\s\S]*reviewEvidencePolicy:\s*\{/,
  'Travelogue share artifact sanitizer should rebuild public preview and keep artifacts private pending review'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*regionCode:\s*XICHENG_REGION_CONFIG\.regionCode[\s\S]*packageCode:\s*XICHENG_REGION_CONFIG\.packageCode[\s\S]*sceneCode:\s*XICHENG_REGION_CONFIG\.sceneCode[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*companionName:\s*XICHENG_REGION_CONFIG\.companionName/,
  'Generated poster and PDF assets should carry scene, source channel, and companion context for operations attribution'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*auditRequired:\s*true[\s\S]*reviewStatus:\s*XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'[\s\S]*visibilityLabel:\s*'待审核 · 未公开'/,
  'Generated poster and PDF assets should default to audit-required private visibility'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*safetyStatusSummary:\s*this\.safetyStatusSummary[\s\S]*safetyBlockedCount:\s*this\.safetyBlockedCount[\s\S]*safetyUnavailableCount:\s*this\.safetyUnavailableCount/,
  'Generated poster and PDF assets should carry safety audit summary for review before publishing'
)

const publicStudyEvidenceBlock = extractTravelogueMethodBlock('sanitizeStudyTaskEvidenceForPublicShare', 'sanitizeRouteCheckinForPublicShare')

assert.match(
  publicStudyEvidenceBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(evidence\.safetyStatus\)[\s\S]*if \(isXichengUnsafeSafetyStatus\(safetyStatus\)\) return null[\s\S]*safetyStatus,/,
  'Travelogue share artifact study evidence sanitizer should drop BLOCKED or UNAVAILABLE study evidence and preserve normalized safetyStatus'
)

assert.match(
  travelogue,
  /createReviewPublicPreview\(\)[\s\S]*const publicStudyTaskEvidence = this\.completedStudyTaskEvidence[\s\S]*\.map\(evidence => this\.sanitizeStudyTaskEvidenceForPublicShare\(evidence\)\)[\s\S]*\.filter\(Boolean\)/,
  'Travelogue review public preview should remove unsafe or invalid study evidence after sanitization'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*publicStudyTaskEvidence:\s*this\.completedStudyTaskEvidence\.map\(evidence => this\.sanitizeStudyTaskEvidenceForPublicShare\(evidence\)\)\.filter\(Boolean\)/,
  'Travelogue generated share artifacts should remove unsafe or invalid study evidence after sanitization'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*reviewReadinessSummary:\s*this\.reviewReadinessSummary[\s\S]*sourceReadinessStatus:\s*this\.reviewReadinessSummary\.sourceReadinessStatus[\s\S]*reviewBlockers:\s*this\.reviewReadinessSummary\.reviewBlockers/,
  'Generated poster and PDF assets should carry source readiness and review blockers for operations triage'
)

assert.match(
  opsDetails,
  /getShareArtifactLabel\(artifact\)[\s\S]*artifact\.visibilityLabel/,
  'Split share artifact list should show audit visibility so operators know generated works are not public'
)

assert.doesNotMatch(
  travelogue.match(/sanitizeShareArtifactForReview\(artifact = \{\}\)[\s\S]*?\n\t\t\},\n\t\tcreatePosterTemplate/)?.[0] || '',
  /materials:\s*artifact\.materials|routeCheckins:\s*artifact\.routeCheckins|recordingSession:\s*artifact\.recordingSession|trackPoints|stayPoints|filteredTrackPoints|latitude|longitude|imagePath:\s*|photoPath:\s*|sources:\s*artifact\.sources|publicPreview:\s*artifact\.publicPreview|publicMaterials:\s*artifact\.publicMaterials|templateSections:\s*artifact\.templateSections|candidateConfirmationAudit|selectedCandidateConfidence/,
  'Travelogue share artifact sanitizer should not pass raw cached materials, tracks, coordinates, local photo paths, source payloads, public preview objects, template sections, or candidate audit metadata into review submissions'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*templateCode:\s*assetType === 'pdf' \? 'xicheng-memorial-pdf-v1' : 'xicheng-share-poster-v1'[\s\S]*templateSections:\s*assetType === 'pdf' \? this\.createMemorialPdfTemplate\(routeTitle, createdAt\) : this\.createPosterTemplate\(routeTitle\)/,
  'Share artifacts should record which fixed template produced the poster or PDF package'
)

assert.match(
  travelogue,
  /createMemorialPdfTemplate\(routeTitle, createdAt\)[\s\S]*sectionKey:\s*'cover'[\s\S]*sectionKey:\s*'route-map'[\s\S]*sectionKey:\s*'photo-timeline'[\s\S]*sectionKey:\s*'travelogue-body'[\s\S]*sectionKey:\s*'knowledge-cards'[\s\S]*sectionKey:\s*'route-review'/,
  'PDF memorial asset should include the P0 fixed template sections: cover, route map, photo timeline, travelogue body, knowledge cards, and route review'
)

assert.match(
  travelogue,
  /createMemorialPdfTemplate\(routeTitle, createdAt\)[\s\S]*sectionKey:\s*'knowledge-cards'[\s\S]*sourceCount:\s*this\.sourceCount[\s\S]*sourceCards:\s*this\.createMemorialPdfSourceCards\(\)/,
  'PDF memorial knowledge cards should include reviewed source cards, not only a source count'
)

assert.match(
  travelogue,
  /createMemorialPdfSourceCards\(\)[\s\S]*this\.materials[\s\S]*filter\(material => hasReviewableMaterialEvidence\(material\)\)[\s\S]*forEach[\s\S]*getReviewableMaterialSources\(material\)[\s\S]*this\.getDisplaySourceTitle\(source\)[\s\S]*this\.getDisplaySourceDescription\(source\)[\s\S]*poiName:\s*material\.poiName \|\| ''[\s\S]*slice\(0, 8\)/,
  'PDF memorial source cards should summarize display-safe reviewed sources from reviewable materials with POI attribution and a bounded card count'
)

assert.match(
  travelogue,
  /createMemorialPdfSourceCards\(\)[\s\S]*this\.routeCheckins[\s\S]*filter\(checkin => this\.hasReviewableRouteCheckinEvidence\(checkin\)\)[\s\S]*forEach[\s\S]*getReviewableRouteCheckinSources\(checkin\)[\s\S]*poiName:\s*checkin\.poiName \|\| ''[\s\S]*slice\(0, 8\)/,
  'PDF memorial source cards should also summarize reviewed sources from route record check-ins'
)

assert.match(
  opsDetails,
  /artifact\.templateLabel/,
  'Split share artifact list should expose the fixed template label for operations review'
)

assert.match(
  travelogue,
  /getDisplaySourceTitle\(source = \{\}\)[\s\S]*return getXichengDisplaySourceTitle\(source\)/,
  'PDF memorial source cards should delegate title cleanup to the shared source display helper'
)

assert.match(
  travelogue,
  /getDisplaySourceDescription\(source = \{\}\)[\s\S]*return getXichengDisplaySourceDescription\(source, 96\)/,
  'PDF memorial source cards should request a bounded PDF summary from the shared source display helper'
)

assert.match(
  sourceHelper,
  /source\.excerpt \|\| source\.summary \|\| source\.contentDigest[\s\S]*replace\(\s*\/POI 级已审核来源：\[\^。\]\*。\/g[\s\S]*replace\(\s*\/生产发布前仍需完成\[\^。\]\*。\/g[\s\S]*cleanedDescription\.length > boundedLength[\s\S]*cleanedDescription\.slice\(0, boundedLength\)/,
  'Shared source display helper should strip internal seed and production-review notes before exporting source summaries'
)

assert.doesNotMatch(
  travelogue,
  /sourceCards\.push\(\{[\s\S]*excerpt:\s*source\.excerpt \|\| source\.summary \|\| source\.url/,
  'PDF memorial source cards should not export raw source excerpt, summary, or URL fields directly'
)

assert.doesNotMatch(
  travelogue,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'local share asset MVP should not introduce backend calls or client-side secrets'
)
