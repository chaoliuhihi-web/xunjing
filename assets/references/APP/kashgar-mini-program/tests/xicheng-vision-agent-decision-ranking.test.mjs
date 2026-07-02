import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')
const scanResultVisionAgentPanel = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengScanResultVisionAgentPanel.vue'), 'utf8')
const scanResultDecisionSurface = `${scanResult}\n${scanResultVisionAgentPanel}`

for (const required of [
  'vision-agent-decision-strip',
  'Agent 决策',
  'visionAgentDecisionSummary',
  'sceneFusionSignalBadges',
  'prioritizedVisionAgentActionCards',
  'prioritizedSceneServiceActions',
  'prioritizeVisionAgentActions',
  'prioritizeSceneServiceActions',
  'photo-spot',
  '拍照建议'
]) {
  assert.ok(scanResultDecisionSurface.includes(required), `Scan result should expose scene-aware Vision Agent decision behavior: ${required}`)
}

assert.match(
  scanResult,
  /visionAgentDecisionSummary\(\)[\s\S]*sceneFusionSummary[\s\S]*sceneFusionSignalBadges[\s\S]*recommendedRoute/,
  'Agent decision summary should combine scene fusion summary, live signals, and route recommendation context'
)

assert.match(
  scanResult,
  /sceneFusionSignalBadges\(\)[\s\S]*sceneFusionSignals[\s\S]*filter\(signal => signal && signal\.active\)[\s\S]*slice\(0, 4\)/,
  'Result page should surface the active scene-fusion signals that shaped the Agent decision'
)

assert.match(
  scanResult,
  /prioritizeVisionAgentActions\(actions = \[\]\)[\s\S]*photo-spot[\s\S]*localTimeText[\s\S]*weatherText[\s\S]*knowledgeGraphText[\s\S]*userInterestTags/,
  'Vision Agent action ranking should prioritize photo, history, and kids actions from time/weather/knowledge/user-interest context'
)

assert.match(
  scanResult,
  /prioritizeSceneServiceActions\(actions = \[\]\)[\s\S]*recommendedRoute[\s\S]*travelogue[\s\S]*merchant/,
  'Scene service ranking should prioritize route, travelogue, and merchant actions from the recognized scene'
)

assert.match(
  scanResult,
  /openVisionAgentAction\(action = \{\}\)[\s\S]*photo-spot[\s\S]*拍照建议/,
  'Tapping the photo suggestion action should continue into Xiaojing with a photo-advice prompt'
)
