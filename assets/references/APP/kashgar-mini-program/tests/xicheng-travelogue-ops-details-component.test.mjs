import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const opsDetailsPath = path.join(root, 'components', 'xicheng', 'XichengTravelogueOpsDetails.vue')

assert.ok(
  exists('components', 'xicheng', 'XichengTravelogueOpsDetails.vue'),
  'Travelogue operations/detail sections should live in XichengTravelogueOpsDetails.vue instead of growing travelogue.vue'
)

const opsDetails = fs.readFileSync(opsDetailsPath, 'utf8')
const combinedSource = `${travelogue}\n${opsDetails}`

assert.match(
  travelogue,
  /import XichengTravelogueOpsDetails from '@\/components\/xicheng\/XichengTravelogueOpsDetails\.vue'[\s\S]*components:[\s\S]*XichengTravelogueOpsDetails/,
  'Travelogue page should import and register the split operations detail component'
)

assert.match(
  travelogue,
  /<xicheng-travelogue-ops-details[\s\S]*v-if="!isTravelogueEditMode && showTravelogueOpsDetails"[\s\S]*:material-count="materialCount"[\s\S]*:passport-progress="passportProgress"[\s\S]*:ops-report="opsReport"[\s\S]*@save-draft="saveDraft"/,
  'Travelogue page should delegate the hidden operations/detail stack through data props and semantic events'
)

for (const required of [
  'stats-grid',
  '记录会话',
  '灵感导入路线',
  '灵感导入记录',
  '识别推荐路线',
  '路线护照',
  '路线打卡',
  '旅行素材盒',
  '现场备注',
  '亲子研学任务',
  '游记草稿',
  '隐私与本地数据',
  '分享产物包',
  '审核提交记录',
  '城市运营报告'
]) {
  assert.ok(opsDetails.includes(required), `Split operations detail component should keep section ${required}`)
}

assert.doesNotMatch(
  travelogue,
  /<template v-if="!isTravelogueEditMode && showTravelogueOpsDetails">[\s\S]*class="stats-grid"[\s\S]*城市运营报告[\s\S]*<\/template>/,
  'Travelogue page should not keep the large inline operations/detail template after extraction'
)

for (const emitted of [
  "'start-recording'",
  "'resume-recording'",
  "'capture-track-point'",
  "'mark-stay-point'",
  "'pause-recording'",
  "'finish-recording'",
  "'delete-recording'",
  "'delete-inspiration-import'",
  "'claim-route-badge'",
  "'delete-route-checkin'",
  "'correct-material-poi'",
  "'hide-material-location'",
  "'delete-journey-material'",
  "'update:remarkInput'",
  "'add-remark-material'",
  "'add-photo-material'",
  "'delete-study-task-evidence'",
  "'submit-study-task-evidence'",
  "'add-study-task-photo'",
  "'save-draft'",
  "'update:editableTravelogueTitle'",
  "'generate-share'",
  "'publish'",
  "'privacy-policy'",
  "'user-protocol'",
  "'ai-content-notice'",
  "'feedback'",
  "'clear-local-data'",
  "'delete-share-artifact'",
  "'withdraw-review'"
]) {
  assert.ok(opsDetails.includes(emitted), `Operations detail component should emit semantic action ${emitted}`)
}

assert.doesNotMatch(
  opsDetails,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Operations detail component should remain a local UI component without backend calls or client secrets'
)

const lineCount = travelogue.split('\n').length
assert.ok(
  lineCount < 2700,
  `travelogue.vue should shrink after extracting the operations detail stack; current lines: ${lineCount}`
)
