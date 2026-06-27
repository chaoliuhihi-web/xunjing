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
  'shareAssetStorageKey',
  'assetId',
  'assetType',
  'assetLabel',
  'draftExcerpt',
  'passportProgress',
  'auditRequired',
  'publishStatus',
  'visibilityLabel',
  'shareAssetCount',
  'formatArtifactTime'
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
  /createShareArtifact\(assetType\)[\s\S]*auditRequired:\s*true[\s\S]*reviewStatus:\s*XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'[\s\S]*visibilityLabel:\s*'待审核 · 未公开'/,
  'Generated poster and PDF assets should default to audit-required private visibility'
)

assert.match(
  travelogue,
  /artifact\.assetLabel[\s\S]*artifact\.visibilityLabel/,
  'Share artifact list should show audit visibility so operators know generated works are not public'
)

assert.doesNotMatch(
  travelogue,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'local share asset MVP should not introduce backend calls or client-side secrets'
)
