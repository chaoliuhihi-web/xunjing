import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const scan = read('pages', 'xicheng', 'scan', 'scan.vue')
const advancedPanel = read('components', 'xicheng', 'XichengScanAdvancedContextPanel.vue')
const scanFusionSurface = `${scan}\n${advancedPanel}`

for (const required of [
  'scan-fusion-panel',
  '场景融合',
  'GPS',
  '时间天气',
  '方向',
  'Memory',
  '知识图谱',
  'sceneFusionSignals',
  'sceneFusionSummary',
  'refreshSceneFusionPanel',
  'buildSceneFusionContext',
  'buildSceneFusionSignals',
  'buildSceneFusionSummary',
  'readVisionAgentMemoryTrail',
  'parseVisionAgentSourceContext'
]) {
  assert.ok(scanFusionSurface.includes(required), `AI识境 scan page should expose live scene fusion signal: ${required}`)
}

assert.match(
  scan,
  /onLoad\(options = \{\}\)[\s\S]*this\.applyVisionAgentQueryContext\(options\)[\s\S]*this\.refreshSceneFusionPanel\(\)/,
  'Scan page should refresh the scene fusion panel after hydrating route context'
)

assert.match(
  scan,
  /buildSceneFusionSignals\(context = this\.buildSceneFusionContext\(\)\)[\s\S]*camera[\s\S]*gps[\s\S]*environment[\s\S]*heading[\s\S]*memory[\s\S]*knowledge/,
  'Scene fusion signals should cover camera, GPS, time/weather, direction, memory, and knowledge graph'
)

assert.match(
  scan,
  /buildVisionAgentSceneContext\(source = '', trigger = \{\}\)[\s\S]*sceneFusionSummary:\s*this\.sceneFusionSummary[\s\S]*sceneFusionSignals:\s*this\.sceneFusionSignals/,
  'Scan result Vision Agent context should carry the live fusion summary and signal list'
)

assert.match(
  scan,
  /resolveNearbyLocation\(\)[\s\S]*this\.currentLocation = location[\s\S]*this\.refreshSceneFusionPanel\(\)/,
  'GPS recognition should refresh the live fusion panel after location is available'
)

assert.match(
  scan,
  /readVisionAgentMemoryTrail\(\)[\s\S]*XICHENG_REGION_CONFIG\.visionAgentMemoryStorageKey/,
  'Scan page should read the same Vision Agent memory trail used by scan result continuity'
)
