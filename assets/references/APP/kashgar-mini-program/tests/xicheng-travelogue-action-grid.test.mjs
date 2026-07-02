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
  /<xicheng-travelogue-record-shell[\s\S]*:has-reviewable-evidence="hasReviewableJourneyEvidence\(\)"[\s\S]*@export-pdf="exportMemorialPdf"[\s\S]*@open-share="openSharePage"[\s\S]*@open-works="openWorksPage"/,
  'Travelogue page should pass user-facing publish/export handlers into the default record shell'
)

assert.match(
  recordShell,
  /<xicheng-travelogue-action-grid[\s\S]*:has-reviewable-evidence="hasReviewableEvidence"[\s\S]*@export-pdf="\$emit\('export-pdf'\)"[\s\S]*@open-share="\$emit\('open-share', \$event\)"[\s\S]*@open-works="\$emit\('open-works'\)"/,
  'Default travelogue record shell should render the user-facing publish/PDF/library action grid'
)

for (const required of [
  '发朋友圈',
  '发布小红书',
  'PDF 打印',
  '我的游记'
]) {
  assert.ok(actionGrid.includes(required), `Travelogue action grid should keep visible action ${required}`)
}

assert.doesNotMatch(
  actionGrid,
  /分享海报|作品审核|运营报告|PDF纪念册|分享纪念/,
  'Default travelogue action grid should not expose older poster, review, ops-report, or vague share labels'
)

assert.match(
  actionGrid,
  /class="\['ghost-button xicheng-secondary-action', action\.requiresEvidence && !hasReviewableEvidence \? 'work-action-needs-evidence' : ''\]"/,
  'Travelogue action grid should keep the approved dashed evidence-needed state for reviewable work actions'
)

assert.match(
  actionGrid,
  /emitAction\(action\) \{[\s\S]*this\.\$emit\(action\.event,\s*action\.channel \|\| action\.key\)/,
  'Travelogue action grid should emit semantic actions with the selected publish channel instead of calling page methods directly'
)

assert.doesNotMatch(
  travelogue,
  /<view class="action-grid xicheng-travelogue-actions">[\s\S]*发朋友圈[\s\S]*发布小红书[\s\S]*PDF 打印[\s\S]*<\/view>/,
  'Travelogue page should not keep the inline publish/export action grid after the component split'
)

assert.match(
  travelogue,
  /openSharePage\(channel = 'xinghe'\)[\s\S]*const publishChannel = encodeRouteValue\(channel \|\| 'xinghe'\)[\s\S]*\/pages\/xicheng\/share\/share\?channel=\$\{publishChannel\}/,
  'Travelogue page should pass the selected publish channel into the share page'
)
