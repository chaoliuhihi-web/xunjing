import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')

const computedBlock = travelogue.match(/computed:\s*\{[\s\S]*?\n\t\},\n\tonLoad/)?.[0] || ''
const methodsBlock = travelogue.match(/methods:\s*\{[\s\S]*?\n\t\}\n\}/)?.[0] || ''
const opsReportBlock = travelogue.match(/opsReport\(\)[\s\S]*?\n\t\t\},\n\t\troutePointCount/)?.[0] || ''
const saveDraftBlock = travelogue.match(/saveDraft\(\{ silent = false \} = \{\}\)[\s\S]*?\n\t\t\},\n\t\tgeneratePoster/)?.[0] || ''
const reviewPackageBlock = travelogue.match(/submitReviewPackage\(\)[\s\S]*?\n\t\t\},\n\t\tcreateShareArtifact/)?.[0] || ''

assert.ok(computedBlock, 'Travelogue page should expose computed properties')
assert.ok(methodsBlock, 'Travelogue page should expose methods')
assert.ok(opsReportBlock, 'Travelogue page should expose opsReport')
assert.ok(saveDraftBlock, 'Travelogue page should persist local journey drafts')
assert.ok(reviewPackageBlock, 'Travelogue page should expose submitReviewPackage')

for (const required of [
  'safetyStatusSummary()',
  'safetyBlockedCount()',
  'safetyUnavailableCount()',
  'workSourceCount()',
  'reviewReadinessSummary()'
]) {
  assert.ok(computedBlock.includes(required), `Travelogue computed report should include ${required}`)
}

assert.match(
  methodsBlock,
  /createSafetyStatusSummary\(\)[\s\S]*this\.materials[\s\S]*this\.routeCheckins[\s\S]*this\.recognitionFeedbacks[\s\S]*const status = normalizeXichengSafetyStatus\(item\.safetyStatus\)[\s\S]*statusCounts\.BLOCKED[\s\S]*statusCounts\.UNAVAILABLE/,
  'Safety status summary should normalize and aggregate BLOCKED and UNAVAILABLE evidence from materials, check-ins, and recognition feedback'
)

assert.doesNotMatch(
  methodsBlock.match(/createSafetyStatusSummary\(\)[\s\S]*?\n\t\t\},\n\t\tsanitizeRouteRecommendationForPublicShare/)?.[0] || '',
  /String\(item\.safetyStatus \|\| ''\)\.toUpperCase\(\)/,
  'Safety status summary should not hand-roll safetyStatus normalization without trim support'
)

for (const required of [
  'safetyStatusSummary: this.safetyStatusSummary',
  'safetyBlockedCount: this.safetyBlockedCount',
  'safetyUnavailableCount: this.safetyUnavailableCount',
  'reviewReadinessSummary: this.reviewReadinessSummary',
  'sourceReadinessStatus: this.reviewReadinessSummary.sourceReadinessStatus',
  'workSourceCount: this.workSourceCount',
  'reviewBlockers: this.reviewReadinessSummary.reviewBlockers'
]) {
  assert.ok(opsReportBlock.includes(required), `Ops report should include ${required}`)
  assert.ok(saveDraftBlock.includes(required), `Saved journey draft should include ${required}`)
  assert.ok(reviewPackageBlock.includes(required), `Review package should include ${required}`)
}

assert.match(
  computedBlock,
  /reviewReadinessSummary\(\)[\s\S]*if \(this\.workSourceCount === 0\)[\s\S]*missing-reviewed-sources[\s\S]*blocked-ai-answer[\s\S]*ai-source-service-unavailable[\s\S]*sourceReadinessStatus:\s*reviewBlockers\.length === 0 \? 'SOURCE_READY' : 'SOURCE_REVIEW_REQUIRED'[\s\S]*reviewedSourceCount:\s*this\.workSourceCount[\s\S]*totalSourceCount:\s*this\.sourceCount[\s\S]*reviewBlockers/,
  'Review readiness should count only work-reviewable sources while preserving total source count for operations triage'
)

assert.match(
  travelogue,
  /安全拦截：\{\{ opsReport\.safetyBlockedCount \}\} · 服务不可用：\{\{ opsReport\.safetyUnavailableCount \}\}/,
  'City operations report UI should surface safety block and unavailable counts for local acceptance review'
)

assert.doesNotMatch(
  travelogue,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Local safety status report should not introduce backend calls or client-side secrets'
)
