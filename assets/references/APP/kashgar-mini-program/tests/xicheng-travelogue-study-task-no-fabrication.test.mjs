import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')
const draftBlock = travelogue.match(/export const createXichengTravelogueDraft\s*=\s*\(\{[\s\S]*?\n\}\n+const createEmptyRecordingSession/)?.[0] || ''
const loadJourneyBlock = travelogue.match(/async loadJourney\(options = \{\}\) \{[\s\S]*?\n\t\t\},\n\t\tshouldAutoStartRecording/)?.[0] || ''

assert.ok(draftBlock, 'Travelogue should expose createXichengTravelogueDraft')
assert.ok(loadJourneyBlock, 'Travelogue should expose loadJourney')

assert.ok(
  draftBlock.includes('const completedStudyEvidence = Array.isArray(studyTaskEvidence)'),
  'Travelogue draft should only derive child/family observation copy from reviewable user evidence'
)

assert.match(
  draftBlock,
  /const observationEvidenceText = completedStudyEvidence\.length > 0[\s\S]*现场观察提到[\s\S]*const studyTaskText = observationEvidenceText/,
  'Travelogue draft should turn real user observations into natural travelogue copy without exposing task wording'
)

assert.doesNotMatch(
  draftBlock,
  /亲子研学任务可继续围绕|研学任务证据包括|const plannedStudyTaskText|const plannedStudyTasks/,
  'Travelogue draft should not generate planned study-task copy from default task templates'
)

assert.doesNotMatch(
  draftBlock,
  /我们沿途完成了\$\{taskText\}|const taskText = parentChildTasks\.length > 0 \? parentChildTasks\.slice\(0,\s*2\)\.join\('；'\)/,
  'Travelogue draft should not claim default parent-child study tasks were completed without submitted evidence'
)

assert.match(
  travelogue,
  /const sanitizeXichengTravelogueDraftText = \(draftText = ''\) =>[\s\S]*亲子研学任务可继续围绕[\s\S]*街区观察可以继续围绕[\s\S]*研学任务证据包括[\s\S]*现场观察提到/,
  'Travelogue should sanitize old cached draft copy so removed study-task wording does not stay visible'
)

assert.match(
  loadJourneyBlock,
  /this\.draft = cachedDraft && cachedDraft\.draft[\s\S]*sanitizeXichengTravelogueDraftText\(cachedDraft\.draft\)[\s\S]*sanitizeXichengTravelogueDraftText\(createXichengTravelogueDraft/,
  'Travelogue loadJourney should sanitize both cached and newly generated drafts before rendering or saving'
)
