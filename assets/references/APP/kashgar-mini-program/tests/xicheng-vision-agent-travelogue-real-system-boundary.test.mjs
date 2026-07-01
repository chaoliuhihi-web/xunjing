import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')
const visionAgentTravelogue = fs.readFileSync(path.join(root, 'request', 'xunjing', 'visionAgentTravelogue.js'), 'utf8')
const combinedSource = `${travelogue}\n${visionAgentTravelogue}`

for (const required of [
  'createVisionAgentRealSystemBoundary',
  'visionAgentRealSystemBoundary',
  'realSystemRequiredTaskCount',
  'realSystemRequiredActionTitles',
  'realSystemBoundaryText',
  '真实系统待确认',
  '不生成可用券或订单结果'
]) {
  assert.ok(combinedSource.includes(required), `AI识境游记包 should expose real-system boundary field ${required}`)
}

assert.match(
  visionAgentTravelogue,
  /createVisionAgentRealSystemBoundary\s*=\s*\(reviewableTasks = \[\]\) => \{[\s\S]*realSystemRequiredTasks[\s\S]*serviceHandoffRequiresRealSystem[\s\S]*serviceIntent[\s\S]*taskType[\s\S]*realSystemRequiredTaskCount[\s\S]*realSystemBoundaryText/,
  'AI识境游记包 should infer real-system confirmation boundaries from service handoff tasks without fabricating merchant, coupon, ticket, or reservation state'
)

assert.match(
  visionAgentTravelogue,
  /createVisionAgentAutoTraveloguePackage\s*=\s*\(visionAgentServiceTasks = \[\]\)[\s\S]*const realSystemBoundary = createVisionAgentRealSystemBoundary\(reviewableTasks\)[\s\S]*\.\.\.realSystemBoundary/,
  'Automatic AI识境 travelogue package should include the shared real-system boundary summary'
)

assert.match(
  travelogue,
  /createXichengTravelogueDraft\s*=\s*\(\{[\s\S]*visionAgentAutoTraveloguePackage\.realSystemBoundaryText[\s\S]*const visionAgentRealSystemBoundaryText[\s\S]*visionAgentTaskText[\s\S]*visionAgentRealSystemBoundaryText/,
  'Generated travelogue copy should include real-system boundaries when AI识境 service actions need merchant, ticketing, or reservation confirmation'
)

assert.match(
  travelogue,
  /visionAgentRealSystemBoundary\(\)[\s\S]*this\.visionAgentAutoTraveloguePackage[\s\S]*realSystemBoundaryText/,
  'Travelogue page should expose a computed real-system boundary for saved drafts, review packages, and ops reporting'
)

assert.match(
  travelogue,
  /saveDraft\(\{ silent = false \} = \{\}\)[\s\S]*visionAgentRealSystemBoundary:\s*this\.visionAgentRealSystemBoundary/,
  'Saved travelogue drafts should persist the AI识境 real-system boundary as evidence'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*visionAgentRealSystemBoundary:\s*this\.visionAgentRealSystemBoundary/,
  'Review packages should carry the AI识境 real-system boundary for operators'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*visionAgentRealSystemBoundary:\s*this\.visionAgentRealSystemBoundary[\s\S]*visionAgentRealSystemRequiredTaskCount:\s*this\.visionAgentAutoTraveloguePackage\?\.realSystemRequiredTaskCount/,
  'Local ops reports should expose how many AI识境 actions still require real merchant, ticketing, or reservation systems'
)
