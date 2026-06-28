import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

assert.ok(
  regionConfig.includes("shareAssetStorageKey: 'xicheng:shareAssets'"),
  'Xicheng config should define a local share asset storage key'
)

for (const required of [
  '分享产物包',
  'shareArtifacts',
  'createShareArtifact',
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
  assert.ok(travelogue.includes(required), `Travelogue page should support share asset export evidence ${required}`)
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
  travelogue,
  /v-for="\(\s*artifact,\s*index\s*\) in shareArtifacts\.slice\(0, 3\)"[\s\S]*@click="deleteShareArtifact\(index\)"[\s\S]*删除产物/,
  'Share artifact list should expose a per-asset delete action before review/public sharing'
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
  /submitReviewPackage\(\)[\s\S]*shareArtifacts:\s*this\.shareArtifacts/,
  'review submission package should include generated share assets'
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

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*reviewReadinessSummary:\s*this\.reviewReadinessSummary[\s\S]*sourceReadinessStatus:\s*this\.reviewReadinessSummary\.sourceReadinessStatus[\s\S]*reviewBlockers:\s*this\.reviewReadinessSummary\.reviewBlockers/,
  'Generated poster and PDF assets should carry source readiness and review blockers for operations triage'
)

assert.match(
  travelogue,
  /artifact\.assetLabel[\s\S]*artifact\.visibilityLabel/,
  'Share artifact list should show audit visibility so operators know generated works are not public'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*templateCode:\s*assetType === 'pdf' \? 'xicheng-memorial-pdf-v1' : 'xicheng-share-poster-v1'[\s\S]*templateSections:\s*assetType === 'pdf' \? this\.createMemorialPdfTemplate\(routeTitle, createdAt\) : this\.createPosterTemplate\(routeTitle\)/,
  'Share artifacts should record which fixed template produced the poster or PDF package'
)

assert.match(
  travelogue,
  /createMemorialPdfTemplate\(routeTitle, createdAt\)[\s\S]*sectionKey:\s*'cover'[\s\S]*sectionKey:\s*'route-map'[\s\S]*sectionKey:\s*'photo-timeline'[\s\S]*sectionKey:\s*'travelogue-body'[\s\S]*sectionKey:\s*'knowledge-cards'[\s\S]*sectionKey:\s*'badge-page'/,
  'PDF memorial asset should include the P0 fixed template sections: cover, route map, photo timeline, travelogue body, knowledge cards, and badge page'
)

assert.match(
  travelogue,
  /createMemorialPdfTemplate\(routeTitle, createdAt\)[\s\S]*sectionKey:\s*'knowledge-cards'[\s\S]*sourceCount:\s*this\.sourceCount[\s\S]*sourceCards:\s*this\.createMemorialPdfSourceCards\(\)/,
  'PDF memorial knowledge cards should include reviewed source cards, not only a source count'
)

assert.match(
  travelogue,
  /createMemorialPdfSourceCards\(\)[\s\S]*this\.materials[\s\S]*filter\(material => hasReviewableMaterialEvidence\(material\)\)[\s\S]*forEach[\s\S]*Array\.isArray\(material\.sources\)[\s\S]*title:\s*source\.title \|\| source\.name[\s\S]*excerpt:\s*source\.excerpt \|\| source\.summary \|\| source\.url[\s\S]*poiName:\s*material\.poiName \|\| ''[\s\S]*slice\(0, 8\)/,
  'PDF memorial source cards should summarize reviewed sources from reviewable materials with POI attribution and a bounded card count'
)

assert.match(
  travelogue,
  /artifact\.templateLabel/,
  'Share artifact list should expose the fixed template label for operations review'
)

assert.doesNotMatch(
  travelogue,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'local share asset MVP should not introduce backend calls or client-side secrets'
)
