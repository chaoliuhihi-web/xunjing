import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')
const componentPath = path.join(root, 'components', 'xicheng', 'XichengScanResultSummaryHero.vue')

assert.ok(
  fs.existsSync(componentPath),
  'Recognition result summary hero should be isolated in a reusable component instead of growing scan-result.vue'
)

const component = fs.readFileSync(componentPath, 'utf8')

assert.match(
  scanResult,
  /import XichengScanResultSummaryHero from '@\/components\/xicheng\/XichengScanResultSummaryHero\.vue'[\s\S]*components:[\s\S]*XichengScanResultSummaryHero/,
  'Recognition result page should import and register the split summary hero component'
)

assert.match(
  scanResult,
  /<xicheng-scan-result-summary-hero[\s\S]*:result="result"[\s\S]*:recognition-action-blocked="recognitionActionBlocked"[\s\S]*@start-guide="askXiaojing\(\)"[\s\S]*@ask-xiaojing="askXiaojing\(suggestedQuestions\[1\]\)"/,
  'Recognition result page should pass P0 result state and Xiaojing actions through the summary hero component'
)

assert.doesNotMatch(
  scanResult,
  /<view class="result-card xicheng-paper-card xicheng-reference-result-card">/,
  'Recognition result page should not keep the result summary card inline'
)

assert.doesNotMatch(
  scanResult,
  /<view class="result-reference-actions">/,
  'Recognition result page should not keep primary Xiaojing actions inline'
)

for (const required of [
  'class="result-card xicheng-paper-card xicheng-reference-result-card"',
  'class="result-source-summary"',
  'class="result-companion-card"',
  'class="result-reference-actions"',
  '开始 AI 讲解',
  '问问小京'
]) {
  assert.ok(component.includes(required), `Summary hero component should keep ${required}`)
}

assert.match(
  component,
  /\$emit\('start-guide'\)[\s\S]*\$emit\('ask-xiaojing'\)/,
  'Summary hero component should emit the two Xiaojing primary actions without owning route logic'
)
