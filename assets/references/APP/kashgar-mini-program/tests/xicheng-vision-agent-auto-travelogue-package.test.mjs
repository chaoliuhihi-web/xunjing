import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')

for (const required of [
  'createVisionAgentAutoTraveloguePackage',
  'visionAgentAutoTraveloguePackage',
  'sceneDomainLabels',
  'serviceIntentLabels',
  'storyCueText',
  'mapCueText',
  'shareCueText',
  'AI识境自动素材包',
  '真实任务包',
  '地图路线',
  '分享文案'
]) {
  assert.ok(
    travelogue.includes(required),
    `AI识境 automatic travelogue package should expose ${required}`
  )
}

assert.match(
  travelogue,
  /createVisionAgentAutoTraveloguePackage\s*=\s*\(visionAgentServiceTasks = \[\]\)[\s\S]*filter\(task => hasReviewableVisionAgentServiceTaskEvidence\(task\)\)[\s\S]*sceneDomainLabels[\s\S]*serviceIntentLabels[\s\S]*agentPromptCount[\s\S]*serviceActionCount[\s\S]*storyCueText[\s\S]*mapCueText[\s\S]*shareCueText/,
  'AI识境 automatic travelogue package should be derived only from reviewable task-package entries and expose story, map, and share cues'
)

assert.match(
  travelogue,
  /createVisionAgentAutoTraveloguePackage\s*=\s*\(visionAgentServiceTasks = \[\]\)[\s\S]*if \(reviewableTasks\.length === 0\) return null/,
  'AI识境 automatic travelogue package should not fabricate travelogue material when no reviewable task exists'
)

assert.match(
  travelogue,
  /createXichengTravelogueDraft\s*=\s*\(\{[\s\S]*visionAgentServiceTasks = \[\][\s\S]*const visionAgentAutoTraveloguePackage = createVisionAgentAutoTraveloguePackage\(visionAgentServiceTasks\)[\s\S]*visionAgentAutoTraveloguePackage\.storyCueText[\s\S]*visionAgentAutoTraveloguePackage\.mapCueText[\s\S]*visionAgentAutoTraveloguePackage\.shareCueText/,
  'Generated travelogue copy should fold the automatic AI识境 story, map, and share cues into the draft'
)

assert.match(
  travelogue,
  /traveloguePreviewText\(\)[\s\S]*this\.visionAgentAutoTraveloguePackage[\s\S]*storyCueText[\s\S]*mapCueText/,
  'Travelogue preview should summarize the automatic AI识境 story and route package'
)

assert.match(
  travelogue,
  /saveDraft\(\{ silent = false \} = \{\}\)[\s\S]*visionAgentAutoTraveloguePackage:\s*this\.visionAgentAutoTraveloguePackage/,
  'Saved travelogue drafts should persist the automatic AI识境 package for later share generation'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*visionAgentAutoTraveloguePackage:\s*this\.visionAgentAutoTraveloguePackage/,
  'Review handoff should include the automatic AI识境 package as audit evidence'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*visionAgentAutoTraveloguePackage:\s*this\.visionAgentAutoTraveloguePackage[\s\S]*visionAgentSceneDomainLabels:\s*this\.visionAgentAutoTraveloguePackage\?\.sceneDomainLabels/,
  'Local ops report should expose AI识境 automatic package dimensions for city operation feedback'
)
