import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')

const computedBlock = travelogue.match(/computed:\s*\{[\s\S]*?\n\t\},\n\tonLoad/)?.[0] || ''
const methodsBlock = travelogue.match(/methods:\s*\{[\s\S]*?\n\t\}\n\}/)?.[0] || ''
const opsReportBlock = travelogue.match(/opsReport\(\)[\s\S]*?\n\t\t\},\n\t\troutePointCount/)?.[0] || ''
const reviewPackageBlock = travelogue.match(/submitReviewPackage\(\)[\s\S]*?\n\t\t\},\n\t\tcreateShareArtifact/)?.[0] || ''

assert.ok(computedBlock, 'Travelogue page should expose computed properties')
assert.ok(methodsBlock, 'Travelogue page should expose methods')
assert.ok(opsReportBlock, 'Travelogue page should expose opsReport')
assert.ok(reviewPackageBlock, 'Travelogue page should expose submitReviewPackage')

for (const required of [
  'safetyStatusSummary()',
  'safetyBlockedCount()',
  'safetyUnavailableCount()'
]) {
  assert.ok(computedBlock.includes(required), `Travelogue computed report should include ${required}`)
}

assert.match(
  methodsBlock,
  /createSafetyStatusSummary\(\)[\s\S]*this\.materials[\s\S]*this\.routeCheckins[\s\S]*this\.recognitionFeedbacks[\s\S]*statusCounts\.BLOCKED[\s\S]*statusCounts\.UNAVAILABLE/,
  'Safety status summary should aggregate BLOCKED and UNAVAILABLE evidence from materials, check-ins, and recognition feedback'
)

for (const required of [
  'safetyStatusSummary: this.safetyStatusSummary',
  'safetyBlockedCount: this.safetyBlockedCount',
  'safetyUnavailableCount: this.safetyUnavailableCount'
]) {
  assert.ok(opsReportBlock.includes(required), `Ops report should include ${required}`)
  assert.ok(reviewPackageBlock.includes(required), `Review package should include ${required}`)
}

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
