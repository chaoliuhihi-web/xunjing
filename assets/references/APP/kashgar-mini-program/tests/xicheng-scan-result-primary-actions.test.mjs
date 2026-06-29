import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')

const template = scanResult.match(/<template>[\s\S]*?<\/template>/)?.[0] || ''

assert.ok(template, 'Recognition result page should have a template')

const resultCardIndex = template.indexOf('class="result-card xicheng-paper-card"')
const primaryActionsIndex = template.indexOf('class="bottom-actions"')
const candidateCardIndex = template.indexOf('class="candidate-card xicheng-paper-card"')
const routeCardIndex = template.indexOf('class="route-card xicheng-paper-card"')
const questionCardIndex = template.indexOf('class="question-card xicheng-paper-card"')
const sourceCardIndex = template.indexOf('class="source-card xicheng-paper-card"')
const feedbackCardIndex = template.indexOf('class="feedback-card xicheng-paper-card"')

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

assert.match(
  template,
  /<view class="bottom-actions">[\s\S]*@click="askXiaojing\(\)">小京讲解[\s\S]*@click="startRecording">开始记录/,
  'Primary actions should keep the Xiaojing explanation and recording CTAs together'
)
