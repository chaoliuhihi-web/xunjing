import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scan = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan', 'scan.vue'), 'utf8')
const advancedPanel = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengScanAdvancedContextPanel.vue'), 'utf8')
const scanDecisionSurface = `${scan}\n${advancedPanel}`

for (const required of [
  'scan-agent-preview-panel',
  'AI识境预判动作',
  'sceneAgentActionPreviews',
  'createSceneAgentActionPreviews',
  'agentDecisionPreviewSummary',
  'selectedSceneAgentActionKey',
  'sceneAgentActionUserSelected',
  'selectSceneAgentAction',
  'buildAgentDecisionSnapshot',
  'scan-agent-action-active'
]) {
  assert.ok(scanDecisionSurface.includes(required), `Scan page should expose Scene Vision Agent decision preview: ${required}`)
}

assert.match(
  scan,
  /sceneAgentActionPreviews\(\)[\s\S]*return this\.createSceneAgentActionPreviews\(\)/,
  'Agent decision previews should be exposed as a computed list for rendering'
)

assert.match(
  scan,
  /createSceneAgentActionPreviews\(\)[\s\S]*localTimeText[\s\S]*weatherText[\s\S]*knowledgeGraphText[\s\S]*serviceText[\s\S]*memoryTrail[\s\S]*sort\([\s\S]*slice\(0, 3\)/,
  'Agent decision previews should rank actions from time, weather, knowledge graph, service, and memory signals'
)

assert.match(
  advancedPanel,
  /<view[^>]*class="scan-agent-action"[\s\S]*v-for="action in sceneAgentActionPreviews"[\s\S]*:class="\{ 'scan-agent-action-active': selectedSceneAgentActionKey === action\.key \}"[\s\S]*@click="\$emit\('select-scene-agent-action', action\)"/,
  'Decision preview actions should be selectable without adding separate recognition mode buttons'
)

assert.match(
  scan,
  /buildAgentDecisionSnapshot\(\)[\s\S]*selectedSceneAgentActionKey[\s\S]*agentDecisionPreviewSummary[\s\S]*sceneAgentActionPreviews/,
  'Selected Agent decision should be normalized into a reusable snapshot'
)

assert.match(
  scan,
  /refreshSceneFusionPanel\(\)[\s\S]*const previews = this\.createSceneAgentActionPreviews\(\)[\s\S]*if \(!this\.sceneAgentActionUserSelected && previews\[0\]\)[\s\S]*this\.selectedSceneAgentActionKey = previews\[0\]\.key/,
  'Refreshing scene fusion should auto-select the highest ranked Agent action until the user manually chooses one'
)

assert.match(
  scan,
  /selectSceneAgentAction\(action = \{\}\)[\s\S]*this\.selectedSceneAgentActionKey = action\.key[\s\S]*this\.sceneAgentActionUserSelected = true/,
  'Selecting a preview action should freeze that user intent across later scene-signal refreshes'
)

assert.match(
  scan,
  /buildVisionAgentSceneContext\(source = '', trigger = \{\}\)[\s\S]*const agentDecisionSnapshot = this\.buildAgentDecisionSnapshot\(\)[\s\S]*agentDecisionActionKey:[\s\S]*agentDecisionActionTitle:[\s\S]*agentDecisionPreviewSummary:/,
  'Scan result context should include the selected Agent decision preview for downstream cards and Xiaojing continuity'
)

assert.doesNotMatch(
  scan,
  /@click="startPhotoRecognition"|@click="startGpsRecognition"|@click="startOcrRecognition"|@click="startTextRecognition"/,
  'Agent decision preview should not reintroduce separate scan-page recognition mode buttons'
)
