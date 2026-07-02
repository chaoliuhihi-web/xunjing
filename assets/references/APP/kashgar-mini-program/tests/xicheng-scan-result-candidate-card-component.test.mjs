import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

const page = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const componentPath = ['components', 'xicheng', 'XichengScanResultCandidateCard.vue']

assert.ok(
  exists(...componentPath),
  'Recognition candidate confirmation should be extracted into XichengScanResultCandidateCard.vue'
)

const candidateCard = read(...componentPath)
const shell = `${page}\n${candidateCard}`

assert.match(
  page,
  /import XichengScanResultCandidateCard from '@\/components\/xicheng\/XichengScanResultCandidateCard\.vue'[\s\S]*components:\s*\{[\s\S]*XichengScanResultCandidateCard/,
  'Scan result page should import and register the extracted candidate card component'
)

assert.match(
  page,
  /<xicheng-scan-result-candidate-card[\s\S]*v-if="candidateList\.length > 0"[\s\S]*:candidate-list="candidateList"[\s\S]*:candidate-section-badge="candidateSectionBadge"[\s\S]*@select-candidate="selectCandidate"/,
  'Scan result page should delegate candidate rendering and keep selection handoff in the page shell'
)

for (const token of [
  'candidate-card xicheng-paper-card',
  '可能匹配地点',
  'candidateSectionBadge',
  'candidate-row',
  'candidate-row-disabled',
  'candidate-title',
  'candidate-desc',
  'candidate-side',
  'candidate-confidence',
  'candidate-safety',
  'formatCandidateSummary',
  'isUnsafeCandidate',
  'candidateSafetyLabel',
  '$emit(\'select-candidate\', candidate)'
]) {
  assert.ok(candidateCard.includes(token), `Candidate component should keep token: ${token}`)
}

assert.match(
  candidateCard,
  /props:\s*\{[\s\S]*candidateList:[\s\S]*type:\s*Array[\s\S]*candidateSectionBadge:[\s\S]*type:\s*String/,
  'Candidate card should receive normalized candidates and badge text through props'
)

assert.match(
  candidateCard,
  /emits:\s*\['select-candidate'\]/,
  'Candidate card should emit select-candidate instead of owning result state'
)

assert.match(
  candidateCard,
  /:class="\{ 'candidate-row-disabled': isUnsafeCandidate\(candidate\) \}"[\s\S]*@click="\$emit\('select-candidate', candidate\)"/,
  'Candidate rows should preserve disabled unsafe styling while still routing selection through the parent'
)

assert.match(
  candidateCard,
  /Math\.round\(Number\(candidate\.confidence \|\| 0\) \* 100\)/,
  'Candidate card should keep confidence display as a compact percentage'
)

assert.doesNotMatch(
  page,
  /class="candidate-row"[\s\S]*formatCandidateSummary\(candidate\)[\s\S]*candidateSafetyLabel\(candidate\)/,
  'Scan result page should not keep the full candidate list template inline after extraction'
)

assert.ok(page.split(/\r?\n/).length < 2020, 'Scan result page should shrink after candidate card extraction')
assert.ok(candidateCard.split(/\r?\n/).length < 220, 'Candidate card should remain compact for APP packaging')

assert.doesNotMatch(
  shell,
  /\/app-api\/xunjing|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Candidate card extraction should not introduce backend calls or client-side secrets'
)
