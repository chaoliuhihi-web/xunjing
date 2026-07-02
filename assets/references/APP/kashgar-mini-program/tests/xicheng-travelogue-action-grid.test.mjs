import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')
const recordShellPath = path.join(root, 'components', 'xicheng', 'XichengTravelogueRecordShell.vue')
const actionGridPath = path.join(root, 'components', 'xicheng', 'XichengTravelogueActionGrid.vue')

assert.ok(
  fs.existsSync(actionGridPath),
  'Travelogue publish/export actions should live in XichengTravelogueActionGrid instead of growing travelogue.vue'
)

const actionGrid = fs.readFileSync(actionGridPath, 'utf8')
const recordShell = fs.readFileSync(recordShellPath, 'utf8')

assert.match(
  recordShell,
  /import XichengTravelogueActionGrid from '@\/components\/xicheng\/XichengTravelogueActionGrid\.vue'[\s\S]*components:[\s\S]*XichengTravelogueActionGrid/,
  'Travelogue record shell should import and register the split publish/export action grid'
)

assert.match(
  travelogue,
  /<xicheng-travelogue-record-shell[\s\S]*:has-reviewable-evidence="hasReviewableJourneyEvidence\(\)"[\s\S]*@generate-poster="generatePoster"[\s\S]*@export-pdf="exportMemorialPdf"[\s\S]*@submit-review="submitReview"[\s\S]*@open-share="openSharePage"[\s\S]*@open-works="openWorksPage"[\s\S]*@open-ops-report="openOpsReportPage"/,
  'Travelogue page should pass existing publish/export handlers into the default record shell'
)

assert.match(
  recordShell,
  /<xicheng-travelogue-action-grid[\s\S]*:has-reviewable-evidence="hasReviewableEvidence"[\s\S]*@generate-poster="\$emit\('generate-poster'\)"[\s\S]*@export-pdf="\$emit\('export-pdf'\)"[\s\S]*@submit-review="\$emit\('submit-review'\)"[\s\S]*@open-share="\$emit\('open-share'\)"[\s\S]*@open-works="\$emit\('open-works'\)"[\s\S]*@open-ops-report="\$emit\('open-ops-report'\)"/,
  'Default travelogue record shell should render the action grid instead of hiding it in folded ops details'
)

for (const required of [
  '分享海报',
  'PDF纪念册',
  '作品审核',
  '分享纪念',
  '我的游记',
  '运营报告'
]) {
  assert.ok(actionGrid.includes(required), `Travelogue action grid should keep visible action ${required}`)
}

assert.match(
  actionGrid,
  /class="\['ghost-button xicheng-secondary-action', action\.requiresEvidence && !hasReviewableEvidence \? 'work-action-needs-evidence' : ''\]"/,
  'Travelogue action grid should keep the approved dashed evidence-needed state for reviewable work actions'
)

assert.match(
  actionGrid,
  /emitAction\(action\) \{[\s\S]*this\.\$emit\(action\.event\)/,
  'Travelogue action grid should emit semantic actions back to the page instead of calling page methods directly'
)

assert.doesNotMatch(
  travelogue,
  /<view class="action-grid xicheng-travelogue-actions">[\s\S]*分享海报[\s\S]*PDF纪念册[\s\S]*作品审核[\s\S]*<\/view>/,
  'Travelogue page should not keep the inline publish/export action grid after the component split'
)
