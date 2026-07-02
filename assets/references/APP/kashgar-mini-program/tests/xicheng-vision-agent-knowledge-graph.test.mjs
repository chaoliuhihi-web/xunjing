import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')
const scanResultVisionAgentPanel = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengScanResultVisionAgentPanel.vue'), 'utf8')
const scanResultKnowledgeSurface = `${scanResult}\n${scanResultVisionAgentPanel}`

for (const required of [
  'vision-agent-knowledge-panel',
  '城市知识图谱',
  'cityKnowledgeGraphNodes',
  'createCityKnowledgeGraphNodes',
  'createKnowledgeGraphNodePrompt',
  'openKnowledgeGraphNode',
  'knowledgeGraphNodeTypeLabel',
  'knowledge-graph-node-route',
  'knowledge-graph-node-service'
]) {
  assert.ok(scanResultKnowledgeSurface.includes(required), `Scan result should expose a city knowledge graph behavior: ${required}`)
}

assert.match(
  scanResult,
  /cityKnowledgeGraphNodes\(\)[\s\S]*return this\.createCityKnowledgeGraphNodes\(\)/,
  'Knowledge graph nodes should be exposed as a computed result for rendering'
)

assert.match(
  scanResult,
  /createCityKnowledgeGraphNodes\(\)[\s\S]*officialPoi[\s\S]*knowledgeGraphText[\s\S]*recommendedRoute[\s\S]*serviceText[\s\S]*slice\(0, 6\)/,
  'Knowledge graph should fuse official POI, knowledge graph text, recommended route, and service context into bounded nodes'
)

assert.match(
  scanResult,
  /openKnowledgeGraphNode\(node = \{\}\)[\s\S]*if \(this\.recognitionActionBlocked\)[\s\S]*createKnowledgeGraphNodePrompt\(node\)[\s\S]*this\.askXiaojing\(prompt\)/,
  'Tapping a graph node should keep official-source gating and continue into Xiaojing with a contextual prompt'
)

assert.match(
  scanResult,
  /createKnowledgeGraphNodePrompt\(node = \{\}\)[\s\S]*城市知识图谱[\s\S]*this\.result\.poiName[\s\S]*node\.title/,
  'Knowledge graph prompts should ask Xiaojing to continue from the recognized scene and selected node'
)
