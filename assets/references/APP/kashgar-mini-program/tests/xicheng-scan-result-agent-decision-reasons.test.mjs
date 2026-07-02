import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scan = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan', 'scan.vue'), 'utf8')
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')
const scanResultVisionAgentPanel = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengScanResultVisionAgentPanel.vue'), 'utf8')
const worldInterfaceStrip = fs.readFileSync(path.join(root, 'components', 'xicheng', 'vision-agent-world-interface-strip.vue'), 'utf8')
const combinedResultSource = `${scanResult}\n${scanResultVisionAgentPanel}\n${worldInterfaceStrip}`

for (const required of [
  'createAgentDecisionReasonCards',
  'agentDecisionReasonCards',
  'agentDecisionReasonSummary',
  'agentDecisionReasonCardItems',
  '决策依据',
  '为什么先做这个',
  'vision-agent-world-interface-reason-grid'
]) {
  assert.ok(
    `${scan}\n${combinedResultSource}`.includes(required),
    `AI识境 should expose Agent decision reasons across scan and result pages: ${required}`
  )
}

assert.match(
  scan,
  /buildAgentDecisionSnapshot\(\)[\s\S]*const agentDecisionReasonCards = this\.createAgentDecisionReasonCards\(context, selectedAction\)[\s\S]*agentDecisionReasonCards[\s\S]*agentDecisionReasonSummary/,
  'Scan page should derive reusable decision-reason cards from the same context and selected Agent action'
)

assert.match(
  scan,
  /buildVisionAgentSceneContext\(source = '', trigger = \{\}\)[\s\S]*agentDecisionReasonCards: agentDecisionSnapshot\.agentDecisionReasonCards[\s\S]*agentDecisionReasonSummary: agentDecisionSnapshot\.agentDecisionReasonSummary/,
  'Scan result context should carry Agent decision reasons alongside the selected action'
)

assert.match(
  scanResultVisionAgentPanel,
  /<xicheng-vision-agent-world-interface-strip[\s\S]*:reason-cards="agentDecisionReasonCardItems"/,
  'Split result panel should render decision reasons in the focused World Interface strip instead of hiding them in text'
)

assert.match(
  scanResult,
  /agentDecisionReasonCardItems\(\)[\s\S]*visionContext\.agentDecisionReasonCards[\s\S]*agentDecisionReasonSummary[\s\S]*slice\(0, 3\)/,
  'Result page should normalize at most three Agent reason cards from visionAgentContext'
)

assert.match(
  scanResult,
  /createVisionAgentMemorySnapshot\(stage = 'current'\)[\s\S]*agentDecisionReasonSummary:[\s\S]*agentDecisionReasonCards:/,
  'Continuous memory snapshots should retain the Agent decision reasons for later dialogue and travelogue generation'
)

assert.match(
  worldInterfaceStrip,
  /reasonCards:[\s\S]*type: Array/,
  'World Interface strip should accept decision-reason cards as data'
)

assert.match(
  worldInterfaceStrip,
  /vision-agent-world-interface-reason-grid[\s\S]*v-for="reason in reasonCards"/,
  'World Interface strip should support compact decision-reason cards without growing scan-result.vue'
)

assert.match(
  worldInterfaceStrip,
  /<view v-if="signalBadges\.length > 0 \|\| reasonCards\.length > 0 \|\| summary" class="vision-agent-world-interface-strip">/,
  'Decision reasons should still render when badge signals are unavailable but Agent reasoning exists'
)
