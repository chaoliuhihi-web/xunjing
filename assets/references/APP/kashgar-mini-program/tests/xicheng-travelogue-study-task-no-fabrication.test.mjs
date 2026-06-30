import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')
const draftBlock = travelogue.match(/export const createXichengTravelogueDraft\s*=\s*\(\{[\s\S]*?\n\}\n\nconst createEmptyRecordingSession/)?.[0] || ''

assert.ok(draftBlock, 'Travelogue should expose createXichengTravelogueDraft')

assert.ok(
  draftBlock.includes('const completedStudyEvidence = Array.isArray(studyTaskEvidence)'),
  'Travelogue draft should derive completed study-task claims from reviewable evidence'
)

assert.match(
  draftBlock,
  /const studyEvidenceText = completedStudyEvidence\.length > 0[\s\S]*研学任务证据包括[\s\S]*const plannedStudyTaskText = !studyEvidenceText[\s\S]*亲子研学任务可继续围绕[\s\S]*const studyTaskText = studyEvidenceText \|\| plannedStudyTaskText/,
  'Travelogue draft should only claim study-task evidence when it exists, otherwise ask the user to continue adding real observations'
)

assert.doesNotMatch(
  draftBlock,
  /我们沿途完成了\$\{taskText\}|const taskText = parentChildTasks\.length > 0 \? parentChildTasks\.slice\(0,\s*2\)\.join\('；'\)/,
  'Travelogue draft should not claim default parent-child study tasks were completed without submitted evidence'
)
