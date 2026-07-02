import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scan = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan', 'scan.vue'), 'utf8')
const advancedPanel = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengScanAdvancedContextPanel.vue'), 'utf8')
const scanWorldSurface = `${scan}\n${advancedPanel}`

for (const required of [
  'scan-world-interface-hud',
  '世界交互入口',
  'World Interface',
  '现实世界成为AI的交互界面',
  'worldInterfaceSignals',
  'worldInterfaceSummary',
  'buildWorldInterfaceSnapshot',
  'createWorldInterfaceSignals',
  'createWorldInterfaceSummary',
  '镜头入口',
  '位置方向',
  '用户画像',
  '历史记录',
  '城市知识库',
  '实时环境'
]) {
  assert.ok(scanWorldSurface.includes(required), `AI识境 scan page should expose world-interface HUD capability: ${required}`)
}

assert.match(
  advancedPanel,
  /<view class="scan-world-interface-hud xicheng-paper-card">[\s\S]*v-for="signal in worldInterfaceSignals"[\s\S]*worldInterfaceSummary/,
  'World interface HUD should render a compact live signal list and summary on the scan page'
)

assert.match(
  scan,
  /createWorldInterfaceSignals\(context = this\.buildSceneFusionContext\(\)\)[\s\S]*userInterestTags[\s\S]*memoryTrail[\s\S]*knowledgeGraphText[\s\S]*localTimeText[\s\S]*weatherText[\s\S]*headingText[\s\S]*headingDegrees[\s\S]*locationText/,
  'World interface signals should fuse camera, location direction, user profile, history, city knowledge, and live environment context'
)

assert.match(
  scan,
  /buildWorldInterfaceSnapshot\(context = this\.buildSceneFusionContext\(\)\)[\s\S]*const signals = this\.createWorldInterfaceSignals\(context\)[\s\S]*signals,[\s\S]*summary:\s*this\.createWorldInterfaceSummary\(context, signals\)/,
  'World interface snapshot should normalize signals and summary for downstream Vision Agent context'
)

assert.match(
  scan,
  /refreshSceneFusionPanel\(\)[\s\S]*const worldInterfaceSnapshot = this\.buildWorldInterfaceSnapshot\(context\)[\s\S]*this\.worldInterfaceSignals = worldInterfaceSnapshot\.signals[\s\S]*this\.worldInterfaceSummary = worldInterfaceSnapshot\.summary/,
  'Refreshing the scan page should update the world-interface HUD from the same scene context'
)

assert.match(
  scan,
  /buildVisionAgentSceneContext\(source = '', trigger = \{\}\)[\s\S]*const worldInterfaceSnapshot = this\.buildWorldInterfaceSnapshot\(\)[\s\S]*worldInterfaceSnapshot,[\s\S]*worldInterfaceSummary:\s*worldInterfaceSnapshot\.summary[\s\S]*worldInterfaceSignals:\s*worldInterfaceSnapshot\.signals/,
  'Scan result Vision Agent context should carry the world-interface snapshot for continued conversation and services'
)
