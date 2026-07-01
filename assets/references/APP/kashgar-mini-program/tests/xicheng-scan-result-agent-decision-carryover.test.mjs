import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')

for (const required of [
  'cameraAgentDecisionSnapshot',
  'cameraAgentDecisionTitle',
  'cameraAgentDecisionSummary',
  'vision-agent-decision-preview',
  '拍前预判',
  'agentDecisionActionKey',
  'agentDecisionActionTitle',
  'agentDecisionPreviewSummary',
  'sceneAgentActionPreviews'
]) {
  assert.ok(scanResult.includes(required), `Scan result should carry over camera Agent decision context: ${required}`)
}

assert.match(
  scanResult,
  /cameraAgentDecisionSnapshot\(\)[\s\S]*agentDecisionActionKey[\s\S]*agentDecisionActionTitle[\s\S]*agentDecisionPreviewSummary[\s\S]*sceneAgentActionPreviews/,
  'Result page should normalize the scan-page Agent decision snapshot from visionAgentContext'
)

assert.match(
  scanResult,
  /visionAgentDecisionSummary\(\)[\s\S]*cameraAgentDecisionSummary[\s\S]*拍前预判[\s\S]*sceneFusionSummary/,
  'Result page decision summary should lead with the scan-page Agent pre-decision before the generic scene summary'
)

assert.match(
  scanResult,
  /prioritizeVisionAgentActions\(actions = \[\]\)[\s\S]*agentDecisionActionKey[\s\S]*photo-spot[\s\S]*deep-history[\s\S]*continue-memory[\s\S]*weather-route/,
  'Vision Agent card ranking should boost actions that match the scan-page Agent pre-decision'
)

assert.match(
  scanResult,
  /prioritizeSceneServiceActions\(actions = \[\]\)[\s\S]*agentDecisionActionKey[\s\S]*next-service[\s\S]*next-stop[\s\S]*nearby-food[\s\S]*travelogue/,
  'Scene service ranking should boost service actions when the scan-page Agent pre-decision asks for service follow-up'
)
