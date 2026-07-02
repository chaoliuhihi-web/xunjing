import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const pagePath = path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue')
const componentPath = path.join(root, 'components', 'xicheng', 'XichengScanResultVisionAgentPanel.vue')

assert.ok(
  fs.existsSync(componentPath),
  'AI识境 recommendation, service handoff, and knowledge graph UI should live in XichengScanResultVisionAgentPanel instead of growing scan-result.vue'
)

const scanResult = fs.readFileSync(pagePath, 'utf8')
const panel = fs.readFileSync(componentPath, 'utf8')
const scanResultTemplate = scanResult.split('<script>')[0] || scanResult

assert.match(
  scanResult,
  /import XichengScanResultVisionAgentPanel from '@\/components\/xicheng\/XichengScanResultVisionAgentPanel\.vue'[\s\S]*XichengScanResultVisionAgentPanel/,
  'scan-result.vue should import and register the split AI识境 panel'
)

assert.match(
  scanResult,
  /<xicheng-scan-result-vision-agent-panel[\s\S]*:vision-agent-decision-summary="visionAgentDecisionSummary"[\s\S]*:prioritized-vision-agent-action-cards="prioritizedVisionAgentActionCards"[\s\S]*:active-service-handoff-task="activeServiceHandoffTask"[\s\S]*:city-knowledge-graph-nodes="cityKnowledgeGraphNodes"/,
  'scan-result.vue should pass AI识境 decision, action, service handoff, and knowledge graph data into the split panel'
)

for (const [eventName, handlerName] of [
  ['open-scene-understanding-card', 'openSceneUnderstandingCard'],
  ['open-vision-agent-action', 'openVisionAgentAction'],
  ['open-scene-service-action', 'openSceneServiceAction'],
  ['close-service-handoff-panel', 'closeServiceHandoffPanel'],
  ['open-service-handoff-primary-action', 'openServiceHandoffPrimaryAction'],
  ['open-knowledge-graph-node', 'openKnowledgeGraphNode']
]) {
  assert.match(
    scanResult,
    new RegExp(`@${eventName}="${handlerName}"`),
    `scan-result.vue should bind ${eventName} back to ${handlerName}`
  )
}

for (const required of [
  'AI识境推荐动作',
  'Agent 决策',
  '看见什么，就能问什么',
  'AI识境服务承接',
  '城市知识图谱',
  'xicheng-vision-agent-world-interface-strip'
]) {
  assert.ok(panel.includes(required), `Split AI识境 panel should render ${required}`)
  assert.ok(!scanResultTemplate.includes(required), `scan-result.vue template should not keep split AI识境 panel markup ${required}`)
}

assert.match(
  panel,
  /@click="\$emit\('open-vision-agent-action', action\)"[\s\S]*@click="\$emit\('open-scene-service-action', action\)"[\s\S]*@click="\$emit\('open-knowledge-graph-node', node\)"/,
  'Split AI识境 panel should emit semantic action and knowledge graph events'
)

assert.doesNotMatch(
  panel,
  /\/app-api\/xunjing|tenant-id|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Split AI识境 panel should remain a presentational component without API calls or client-side secrets'
)

const pageLineCount = read('pages', 'xicheng', 'scan-result', 'scan-result.vue').split(/\r?\n/).length
const componentLineCount = panel.split(/\r?\n/).length

assert.ok(pageLineCount < 2550, `scan-result.vue should stay below 2550 lines after splitting AI识境 panel; got ${pageLineCount}`)
assert.ok(componentLineCount < 640, `XichengScanResultVisionAgentPanel.vue should stay focused; got ${componentLineCount}`)
