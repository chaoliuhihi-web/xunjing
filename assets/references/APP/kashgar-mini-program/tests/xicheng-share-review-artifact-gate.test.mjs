import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const share = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'share', 'share.vue'), 'utf8')

for (const required of [
  'getReviewableShareArtifacts',
  'hasReviewableShareArtifact',
  'showShareArtifactRequiredToast',
  '请先生成分享产物再提交审核',
  'shareArtifactCount',
  'assetTypes',
  'shareArtifacts: reviewableShareArtifacts'
]) {
  assert.ok(share.includes(required), `Share review submission should expose artifact gate token ${required}`)
}

assert.match(
  share,
  /getReviewableShareArtifacts\(\)\s*\{[\s\S]*return safeArray\(this\.shareArtifacts\)[\s\S]*filter\(artifact => artifact && \['poster', 'pdf', 'study'\]\.includes\(artifact\.assetType\)\)/,
  'Share review gate should only accept generated poster, PDF, or study report artifacts'
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

assert.doesNotMatch(
  share,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Share review artifact gate must not introduce backend calls or client-side secrets'
)
