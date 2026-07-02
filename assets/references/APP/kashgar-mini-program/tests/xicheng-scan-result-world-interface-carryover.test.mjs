import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')
const scanResultVisionAgentPanel = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengScanResultVisionAgentPanel.vue'), 'utf8')
const worldInterfaceStrip = fs.readFileSync(path.join(root, 'components', 'xicheng', 'vision-agent-world-interface-strip.vue'), 'utf8')
const combinedSource = `${scanResult}\n${scanResultVisionAgentPanel}\n${worldInterfaceStrip}`

for (const required of [
  'XichengVisionAgentWorldInterfaceStrip',
  'xicheng-vision-agent-world-interface-strip',
  'vision-agent-world-interface-strip',
  '世界交互承接',
  'World Interface',
  'worldInterfaceSnapshot',
  'worldInterfaceSummary',
  'worldInterfaceSignalBadges',
  'worldInterfaceSignals'
]) {
  assert.ok(combinedSource.includes(required), `Scan result should carry over AI识境 world-interface context: ${required}`)
}

assert.match(
  scanResultVisionAgentPanel,
  /<xicheng-vision-agent-world-interface-strip[\s\S]*:summary="worldInterfaceSummary"[\s\S]*:signal-badges="worldInterfaceSignalBadges"/,
  'Split result panel should delegate the visible World Interface strip to a focused component'
)

assert.match(
  worldInterfaceStrip,
  /<view v-if="signalBadges\.length > 0 \|\| reasonCards\.length > 0 \|\| summary" class="vision-agent-world-interface-strip">[\s\S]*summary[\s\S]*v-for="signal in signalBadges"/,
  'Result page should make the scan-page world-interface snapshot visible near Agent decisions'
)

assert.match(
  scanResult,
  /worldInterfaceSnapshot\(\)[\s\S]*visionContext\.worldInterfaceSnapshot[\s\S]*worldInterfaceSummary[\s\S]*worldInterfaceSignals/,
  'Result page should normalize world-interface summary and signal list from visionAgentContext'
)

assert.match(
  scanResult,
  /worldInterfaceSignalBadges\(\)[\s\S]*this\.worldInterfaceSnapshot[\s\S]*signals[\s\S]*filter\(signal => signal && signal\.active\)[\s\S]*slice\(0, 6\)/,
  'Result page should render active world-interface signal badges without overwhelming the action panel'
)

assert.match(
  scanResult,
  /visionAgentDecisionSummary\(\)[\s\S]*worldInterfaceSummary[\s\S]*sceneFusionSummary/,
  'Agent decision summary should consider the World Interface summary before falling back to generic scene fusion'
)

assert.match(
  scanResult,
  /createVisionAgentMemorySnapshot\(stage = 'current'\)[\s\S]*worldInterfaceSummary:[\s\S]*worldInterfaceSignals:/,
  'Continuous memory snapshots should retain the World Interface context for later conversation'
)
