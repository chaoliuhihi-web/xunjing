import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')

const template = scanResult.match(/<template>[\s\S]*?<\/template>/)?.[0] || ''

assert.ok(template, 'Recognition result page should have a template')

const resultCardIndex = template.indexOf('class="result-card xicheng-paper-card xicheng-reference-result-card"')
const primaryActionsIndex = template.indexOf('class="result-reference-actions"')
const candidateCardIndex = template.indexOf('class="candidate-card xicheng-paper-card"')
const routeCardIndex = template.indexOf('class="route-card xicheng-paper-card"')
const questionCardIndex = template.indexOf('<xicheng-scan-result-questions-card')
const sourceCardIndex = template.indexOf('<xicheng-scan-result-sources-card')
const feedbackCardIndex = template.indexOf('class="feedback-card xicheng-paper-card"')
const memoryPanelIndex = template.indexOf('<xicheng-scan-result-memory-panel')
const agentPanelIndex = template.indexOf('class="vision-agent-panel xicheng-paper-card"')
const knowledgePanelIndex = template.indexOf('class="vision-agent-knowledge-panel xicheng-paper-card"')
const poiDetailEntryIndex = template.indexOf('class="poi-detail-entry xicheng-paper-card"')

assert.ok(resultCardIndex >= 0, 'Recognition result should render the result summary card')
assert.ok(primaryActionsIndex >= 0, 'Recognition result should render primary Xiaojing and recording actions')

for (const [label, index] of [
  ['candidate confirmation', candidateCardIndex],
  ['recommended route', routeCardIndex],
  ['suggested questions', questionCardIndex],
  ['reviewed sources', sourceCardIndex],
  ['recognition feedback', feedbackCardIndex]
]) {
  assert.ok(index >= 0, `Recognition result should render ${label} section`)
  assert.ok(
    resultCardIndex < primaryActionsIndex && primaryActionsIndex < index,
    `Primary actions should stay immediately after the result card before ${label} so the P0 path is visible before operations content`
  )
}

assert.ok(
  routeCardIndex < questionCardIndex && questionCardIndex < sourceCardIndex,
  'P0 recognition result flow should show route, Xiaojing questions, then reviewed sources before enrichment content'
)

for (const [label, index] of [
  ['Memory continuity panel', memoryPanelIndex],
  ['AI scene vision panel', agentPanelIndex],
  ['city knowledge graph', knowledgePanelIndex],
  ['POI detail entry', poiDetailEntryIndex]
]) {
  assert.ok(index >= 0, `Recognition result should keep the ${label} section available`)
  assert.ok(
    sourceCardIndex < index,
    `Reviewed sources should stay before the ${label} section so the P0 evidence path is visible before AI识境 enrichment`
  )
}

assert.match(
  template,
  /<view class="result-reference-actions">[\s\S]*@click="askXiaojing\(\)">开始 AI 讲解[\s\S]*@click="askXiaojing\(suggestedQuestions\[1\]\)">问问小京/,
  'Primary actions should match the approved reference with AI explanation and Xiaojing Q&A CTAs'
)
